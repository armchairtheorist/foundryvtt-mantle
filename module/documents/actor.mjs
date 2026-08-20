// @ts-nocheck — fvtt-types requires explicit generic arguments on
// TypeDataModel and Document subclasses, which plain JSDoc cannot supply
// without heavy ceremony. The rules maths these models delegate to lives in
// module/data/derive.mjs, which IS fully typechecked and unit-tested.

/**
 * The Mantle Actor document.
 *
 * Most preparation lives in the data models; this class carries the behaviour
 * that spans an actor as a whole — turn-start refreshes, applying damage, and
 * taking Wounds and Burdens.
 */

import MantleRoll from "../dice/roll.mjs";
import { MANTLE } from "../config.mjs";
import { buildPool, standardModifiers } from "../dice/pool.mjs";
import { postRollCard } from "../chat/cards.mjs";
import {
  affordableHeals,
  combatReentry,
  downtimeRestore,
  healCost,
  interludeConditions,
  interludeRestore
} from "../rules/rest.mjs";
import { limitBreakRoutes } from "../rules/valor.mjs";
import { castTemplate, isMultiTarget } from "../rules/templates.mjs";
import { rangeAtStep } from "../rules/shaping.mjs";
import { placeSpellTemplate } from "../canvas/spell-template.mjs";
import { promptAttack } from "../apps/attack-dialog.mjs";
import { promptCast } from "../apps/cast-dialog.mjs";
import { promptAction } from "../apps/action-dialog.mjs";
import {
  allConditionStacks,
  changeCondition,
  clearConditionsForTurn,
  conditionStacks,
  setCondition
} from "./conditions.mjs";
import { actionAllowed } from "../rules/conditions.mjs";
import {
  catchYourBreathHeal,
  steadyYourselfClear,
  surgeLimit,
  surgeStrainCost,
  vulnerableBonus
} from "../rules/maneuvers.mjs";
import {
  applyDamage,
  applyStrain,
  damageAffinity,
  harmSeverity,
  woundEffect,
  burdenEffect
} from "../rules/harm.mjs";

/**
 * A thrown consumable, shaped as a weapon profile.
 *
 * Some consumables are attacks — a flask that resolves on a damage ladder — and
 * the attack path only knows how to read weapons. Rather than teaching it a
 * second shape, the consumable is translated into the one it already reads.
 *
 * @param {any} item - A consumable Item with `isAttack` set
 * @returns {{name: string, system: object}}
 */
function consumableAsWeapon(item) {
  return {
    name: item.name,
    system: {
      attribute: item.system.attribute,
      damageTypes: item.system.damageTypes,
      tags: item.system.tags,
      // Thrown, so ranged only: a consumable has a Range but never a reach.
      melee: null,
      range: item.system.range,
      damage: item.system.damage,
      // The consumable point is the price; there is no second Vigor cost.
      attackCost: 0,
      special: item.system.effect
    }
  };
}

export default class MantleActor extends Actor {
  /**
   * v14 splits Active Effect application into phases and tracks which have run.
   * Skipping the super call leaves that tracking set unreset, which throws on
   * the next data preparation.
   */
  prepareBaseData() {
    super.prepareBaseData();
  }

  /* -------------------------------------------- */

  /**
   * Guard the derived-only token bars against edits.
   *
   * Foundry lets a GM type into either bar on the token HUD, which writes
   * straight through to the actor. That is right for Vitality and Guard, but the
   * Wound and Burden tracks are computed from their arrays — a number typed
   * there would be overwritten by the next data preparation and simply vanish.
   * Refusing with a message beats accepting an edit that does nothing.
   *
   * @override
   * @param {string} attribute
   * @param {number} value
   * @param {boolean} isDelta
   * @param {boolean} isBar
   */
  async modifyTokenAttribute(attribute, value, isDelta, isBar) {
    if (["woundSlots", "burdenSlots"].includes(attribute)) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Harm.trackIsDerived"));
      return this;
    }

    return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
  }

  /* -------------------------------------------- */

  /** Convenience: the ancestry archetype, which sets SPD, SEN, and SIZE. */
  get ancestry() {
    return this.items.find((i) => i.type === "archetype" && i.system.kind === "ancestry") ?? null;
  }

  /** Equipped weapons, in sheet order. */
  get weapons() {
    return this.items.filter((i) => i.type === "weapon" && i.system.equipped);
  }

  /**
   * The Unarmed Attack, as a weapon profile.
   *
   * Every character always has it, so it comes from CONFIG rather than from an
   * item — a character created a moment ago can already punch. If the player
   * has dragged the compendium copy onto their sheet, that one wins, so a house
   * rule or an archetype that improves unarmed damage takes effect.
   *
   * @returns {{name: string, system: object}}
   */
  get unarmedAttack() {
    const owned = this.items.find((i) => i.type === "weapon" && i.system.intrinsic);
    if (owned) return owned;

    const profile = MANTLE.unarmedAttack;
    return { name: game.i18n.localize(profile.name), system: profile };
  }

  /**
   * The Party actor this character belongs to, if any.
   *
   * Membership is stored on the party rather than on the character, so this
   * searches. A character in no party simply has no Valor to spend — which is
   * a perfectly ordinary state for an NPC ally or a one-shot pregen.
   *
   * @returns {Actor|null}
   */
  get party() {
    if (this.type !== "character") return null;

    return (
      game.actors?.find(
        (actor) => actor.type === "party" && actor.system.members?.has(this.uuid)
      ) ?? null
    );
  }

  /** Equipped Limit Breaks — what this character may actually activate. */
  get limitBreaks() {
    return this.items.filter((item) => item.type === "limitbreak" && item.system.equipped);
  }

  /** Equipped weapons that can be used for the Deflect reaction. */
  get deflectWeapons() {
    return this.weapons.filter((weapon) => weapon.system.canDeflect);
  }

  /**
   * Equipped melee weapons that can be used for a reactive attack — Forestall,
   * Intercept, or Counterattack.
   *
   * @returns {any[]}
   */
  get meleeWeapons() {
    return [...this.weapons, this.unarmedAttack].filter((weapon) => isMelee(weapon.system));
  }

  /**
   * Equipped Reflexive melee weapons, which are what enable Forestall.
   *
   * Combat Reflexes gives *every* equipped melee weapon the tag, the intrinsic
   * Unarmed Attack included — so with the mastery this is all of them, and
   * without it only the weapons that carry the tag themselves.
   */
  get reflexiveWeapons() {
    if (this.system.combatReflexes === true) return this.meleeWeapons;
    return this.meleeWeapons.filter((weapon) => toArray(weapon.system.tags).includes("reflexive"));
  }

  /* -------------------------------------------- */

  /** Every condition this actor carries, as id to stacks. */
  get conditions() {
    return allConditionStacks(this);
  }

  /**
   * How many stacks of one condition this actor carries.
   *
   * @param {string} id
   * @returns {number}
   */
  conditionStacks(id) {
    return conditionStacks(this, id);
  }

  /**
   * Inflict or clear stacks of a condition.
   *
   * @param {string} id
   * @param {number} [delta]
   * @returns {Promise<number>} Stacks after the change
   */
  async changeCondition(id, delta = 1) {
    return changeCondition(this, id, delta);
  }

  /**
   * Remove a condition outright, whatever it was stacked to.
   *
   * @param {string} id
   * @returns {Promise<void>}
   */
  async clearCondition(id) {
    return setCondition(this, id, 0);
  }

  /**
   * Run the end-of-turn condition pass: Wracked damage, auto-clears,
   * roll-to-clears, and the Faltering and Unraveling checks.
   *
   * @returns {Promise<object>}
   */
  async endTurn() {
    return clearConditionsForTurn(this);
  }

  /* -------------------------------------------- */

  /**
   * Roll an action: build the pool from an attribute, roll it, and post the card.
   *
   * @param {object} options
   * @param {string} options.attribute - Which attribute builds the pool
   * @param {string} [options.title]
   * @param {string} [options.subtitle]
   * @param {import("../dice/pool.mjs").Modifier[]} [options.modifiers]
   * @param {Record<string, string>} [options.ladder] - Effect ladder to resolve against
   * @param {"vitality"|"strain"} [options.ladderKind]
   * @param {number} [options.bonusDamage]
   * @param {string[]} [options.damageTypes] - Carried to the card so Apply can resolve affinity
   * @param {boolean} [options.penetrating]
   * @param {object} [options.maneuver] - Set when the roll lands an effect
   *   rather than damage, so the card offers the right Apply button
   * @returns {Promise<ChatMessage>}
   */
  async rollAction({
    attribute,
    title = "",
    subtitle = "",
    modifiers = [],
    ladder = null,
    ladderKind = "vitality",
    bonusDamage = 0,
    damageTypes = [],
    penetrating = false,
    hitLocation = "mass",
    maneuver = null
  }) {
    const base = this.system.attributes?.[attribute] ?? 0;
    const pool = buildPool(base, modifiers);

    const roll = MantleRoll.fromPool(pool, {
      attribute, ladder, ladderKind, bonusDamage, damageTypes, penetrating, hitLocation, maneuver
    });
    await roll.evaluate();

    return postRollCard(roll, { actor: this, title, subtitle });
  }

  /* -------------------------------------------- */

  /**
   * Attack with an equipped weapon.
   *
   * A weapon marked POW/AGI lets the wielder choose; the higher attribute is
   * used, which is what a player would pick anyway. Skills are never applied to
   * attacks, so no trained bonus is offered here.
   *
   * @param {Item} weapon
   * @param {object} [options] - Passed through to `standardModifiers`
   * @returns {Promise<ChatMessage|void>}
   */
  async rollWeapon(weapon, options = {}) {
    if (weapon?.type !== "weapon") return;
    return this.attackWith(weapon, options);
  }

  /**
   * Attack with the Unarmed Attack, which needs no item and no gear slot.
   *
   * @param {object} [options] - Passed through to `standardModifiers`
   * @returns {Promise<ChatMessage|void>}
   */
  async rollUnarmed(options = {}) {
    return this.attackWith(this.unarmedAttack, options);
  }

  /**
   * Roll an attack from a weapon profile — either an owned Item or the
   * intrinsic Unarmed Attack from CONFIG. Both carry the same `system` shape,
   * so nothing below needs to know which it got.
   *
   * @param {{name: string, system: object}} weapon
   * @param {object} [options] - Passed through to `standardModifiers`
   * @returns {Promise<ChatMessage|void>}
   */
  async attackWith(weapon, options = {}) {
    const attribute = this.#chooseAttribute(weapon.system.attribute);
    const tags = toArray(weapon.system.tags);

    // A dual-type weapon is Slashing *or* Piercing on any given swing, and
    // which one it was decides what the target's resistances answer to.
    const damageTypes = await this.#resolveDamageTypes(weapon);
    if (!damageTypes) return;

    // Where the target is standing, what the attacker can see, and which part
    // of the target they are aiming at. Skipped only by callers that already
    // know the shape of the attack and pass `silent`.
    let hitLocation = options.hitLocation ?? "mass";
    let modifiers;

    if (options.silent) {
      modifiers = standardModifiers({ ...options, trained: false });
    } else {
      const declared = await promptAttack(this, weapon, { attribute });
      if (!declared) return;

      modifiers = declared.modifiers;
      hitLocation = declared.hitLocation;
    }

    // Nothing is spent until the attack is actually declared. Everything above
    // this line can still be backed out of — cancelling the dialog, or being
    // out of reach — and a cancelled attack must cost nothing.
    const cost = options.vigorCost ?? weapon.system.attackCost ?? 0;
    if (!(await this.#spendVigor(cost))) return;

    // Vulnerable hands the attacker a die per stack, and is spent by the
    // attack that used it whatever the attack goes on to roll.
    const vulnerable = await this.#consumeVulnerable();
    if (vulnerable) {
      modifiers.push({ label: "MANTLE.Condition.vulnerable", value: vulnerable });
    }

    return this.rollAction({
      attribute,
      title: options.title ?? weapon.name,
      subtitle: options.subtitle ?? game.i18n.localize(MANTLE.attributes[attribute].abbr),
      modifiers,
      ladder: options.maneuver ? null : weapon.system.damage,
      ladderKind: "vitality",
      hitLocation,
      damageTypes,
      penetrating: tags.includes("penetrating"),
      maneuver: options.maneuver ?? null
    });
  }

  /* -------------------------------------------- */

  /**
   * Which damage types this swing actually deals.
   *
   * A dual-type weapon carries Slashing and Piercing as a *choice* rather than
   * as both at once, so the wielder is asked. Anything else the weapon deals —
   * Fire on an enchanted blade — rides along with whichever was picked. The
   * answer is remembered on the weapon, because a player who fights a
   * Slashing-resistant enemy tends to keep making the same choice.
   *
   * @param {{name: string, system: object}} weapon
   * @returns {Promise<string[]|null>} Null if the prompt was dismissed
   */
  async #resolveDamageTypes(weapon) {
    const declared = toArray(weapon.system.damageTypes);
    if (!weapon.system.dualType) return declared;

    const choices = declared.filter((type) => ["slashing", "piercing"].includes(type));
    const fixed = declared.filter((type) => !choices.includes(type));
    if (choices.length < 2) return declared;

    const last = weapon.getFlag?.("mantle", "lastDamageType");
    const options = choices
      .map((type) => {
        const label = game.i18n.localize(MANTLE.damageTypes[type]);
        const selected = type === last ? " selected" : "";
        return `<option value="${type}"${selected}>${label}</option>`;
      })
      .join("");

    const chosen = await foundry.applications.api.DialogV2.prompt({
      window: { title: weapon.name },
      classes: ["mantle"],
      content: `<form><label class="row">${game.i18n.localize("MANTLE.Attack.damageType")}
          <select name="type">${options}</select></label></form>`,
      ok: {
        label: game.i18n.localize("MANTLE.Action.roll"),
        callback: (_event, button) => new FormData(button.form).get("type")
      },
      rejectClose: false
    });

    if (!chosen) return null;
    await weapon.setFlag?.("mantle", "lastDamageType", chosen);
    return [String(chosen), ...fixed];
  }

  /**
   * Spend the target's Vulnerable stacks and report the dice they are worth.
   *
   * Only with exactly one target. A single roll shared across several targets
   * cannot be +1d against one of them and not the others, and the effects that
   * hit many creatures at once — Wild Swing, Crescent Onslaught — are written
   * as separate rolls anyway. Saying so beats quietly picking a target.
   *
   * @returns {Promise<number>}
   */
  async #consumeVulnerable() {
    const targets = Array.from(game.user?.targets ?? [])
      .map((token) => token.actor)
      .filter(Boolean);

    const carrying = targets.filter((actor) => (actor.conditionStacks?.("vulnerable") ?? 0) > 0);
    if (carrying.length === 0) return 0;

    if (targets.length > 1) {
      ui.notifications.info(game.i18n.localize("MANTLE.Condition.vulnerableMultiTarget"));
      return 0;
    }

    const target = carrying[0];
    const stacks = target.conditionStacks("vulnerable");
    await target.clearCondition("vulnerable");
    return vulnerableBonus(stacks);
  }

  /* -------------------------------------------- */

  /**
   * Roll one of an adversary's maneuvers.
   *
   * The pool is authored on the stat block rather than built from attributes,
   * and the tier of play adds to it — that is the whole of enemy scaling on the
   * roll side. A Grunt does not roll at all: every action roll it makes counts
   * as exactly one success, so the card is posted with that result rather than
   * with dice nobody needed to throw.
   *
   * @param {number} index - Which maneuver, by position on the stat block
   * @param {object} [options]
   * @param {number} [options.situational]
   * @returns {Promise<ChatMessage|null>}
   */
  async rollManeuver(index, { situational = 0 } = {}) {
    const maneuver = this.system.maneuvers?.[index];
    if (!maneuver) return null;

    const tags = toArray(maneuver.tags);
    const strain = tags.includes("strain") || /strain/i.test(maneuver.ladder?.[1] ?? "");

    const modifiers = [];
    if (this.system.diceBonus) {
      modifiers.push({ label: "MANTLE.Adversary.tierBonus", value: this.system.diceBonus });
    }
    if (situational) modifiers.push({ label: "MANTLE.Modifier.situational", value: situational });

    const subtitle = [
      maneuver.opposedBy
        ? game.i18n.format("MANTLE.Adversary.opposedBy", { by: maneuver.opposedBy })
        : "",
      maneuver.telegraphed ? game.i18n.localize("MANTLE.Adversary.telegraphed") : ""
    ]
      .filter(Boolean)
      .join(" · ");

    // The authored pool already includes the creature's attribute, so the roll
    // is built from a zero base plus the pool as a modifier rather than being
    // routed through `system.attributes` like a character's.
    const pool = buildPool(maneuver.pool, modifiers);
    const roll = MantleRoll.fromPool(pool, {
      ladder: maneuver.ladder,
      ladderKind: strain ? "strain" : "vitality",
      damageTypes: tags.filter((tag) => tag in MANTLE.damageTypes),
      penetrating: tags.includes("penetrating"),
      fixedSuccesses: this.system.rollsDice ? null : 1,
      noPatterns: !this.system.readsPatterns
    });
    await roll.evaluate();

    return postRollCard(roll, { actor: this, title: maneuver.name, subtitle });
  }

  /* -------------------------------------------- */

  /**
   * Open the action roll dialog for an attribute, then roll what it returns.
   *
   * @param {string} attribute
   * @returns {Promise<ChatMessage|null>}
   */
  async rollAttributeAction(attribute) {
    const choice = await promptAction(this, { attribute });
    if (!choice) return null;

    return this.rollAction({
      attribute: choice.attribute,
      title: game.i18n.localize(MANTLE.attributes[choice.attribute].label),
      subtitle: choice.subtitle,
      modifiers: choice.modifiers
    });
  }

  /* -------------------------------------------- */

  /**
   * Dodge: oppose an attack with AGI for 2 Vigor.
   *
   * The successes rolled here are what the attacker's card is stepped down by,
   * which is why nothing is applied automatically — the defender rolls, and
   * someone clicks minus on the attack.
   *
   * @returns {Promise<ChatMessage|null>}
   */
  async rollDodge() {
    const reaction = MANTLE.reactions.dodge;
    if (!(await this.#allowedToAct(reaction))) return null;
    if (!(await this.#spendVigor(reaction.vigorCost))) return null;

    return this.rollAction({
      attribute: reaction.attribute,
      title: game.i18n.localize(reaction.label),
      subtitle: game.i18n.format("MANTLE.Reaction.cost", { cost: reaction.vigorCost })
    });
  }

  /**
   * Deflect: oppose a melee attack with a Deflect or Shield weapon for 1 Vigor.
   *
   * The attribute follows the deflecting weapon rather than the defender's
   * choice — you parry with what you are holding.
   *
   * @param {Item} weapon - A weapon with the Deflect or Shield tag
   * @returns {Promise<ChatMessage|null>}
   */
  async rollDeflect(weapon) {
    if (!weapon?.system?.canDeflect) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Reaction.noDeflectWeapon"));
      return null;
    }

    const reaction = MANTLE.reactions.deflect;
    if (!(await this.#allowedToAct(reaction))) return null;
    if (!(await this.#spendVigor(reaction.vigorCost))) return null;

    return this.rollAction({
      attribute: this.#chooseAttribute(weapon.system.attribute),
      title: game.i18n.localize(reaction.label),
      subtitle: weapon.name
    });
  }

  /**
   * Forestall: a Basic Attack against someone already in reach who tries to
   * move away, for 2 Vigor.
   *
   * A reactive *attack* rather than a defense, so it resolves as a normal
   * weapon attack — the card that comes out is an attack card, with a ladder
   * and an Apply button.
   *
   * @param {Item} weapon - An equipped Reflexive melee weapon
   * @returns {Promise<ChatMessage|null|void>}
   */
  async rollForestall(weapon) {
    if (!weapon || !this.reflexiveWeapons.includes(weapon)) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Reaction.noReflexiveWeapon"));
      return null;
    }

    return this.attackWith(weapon, {
      title: game.i18n.localize(MANTLE.reactions.forestall.label),
      subtitle: weapon.name,
      vigorCost: MANTLE.reactions.forestall.vigorCost
    });
  }

  /* -------------------------------------------- */
  /*  Basic maneuvers                              */
  /* -------------------------------------------- */

  /**
   * Take one of the basic maneuvers.
   *
   * Every combatant has all of these, so they come from CONFIG rather than from
   * items — the same reasoning as the Unarmed Attack. What each one does when
   * pressed depends on its kind: some roll an attack, some move a resource, and
   * the rest post a card for the table to adjudicate, because where you moved
   * and whether the fiction allows hiding are not the system's to decide.
   *
   * @param {string} id - A key of `CONFIG.MANTLE.maneuvers`
   * @param {object} [options]
   * @returns {Promise<ChatMessage|null|void>}
   */
  async useManeuver(id, options = {}) {
    const maneuver = MANTLE.maneuvers[id];
    if (!maneuver) return null;

    if (!(await this.#allowedToAct())) return null;

    switch (maneuver.kind) {
      case "attack":
        return this.#maneuverAttack(id, maneuver);
      case "heal":
        return this.#catchYourBreath(maneuver);
      case "clearStrain":
        return this.#steadyYourself(maneuver);
      case "surge":
        return this.#surge(maneuver);
      case "clearCondition":
        return this.#shakeItOff(maneuver);
      case "consumable":
        return this.#useConsumable(maneuver);
      case "limitBreak":
        return this.#limitBreak(maneuver);
      default:
        return this.#announceManeuver(id, maneuver, options);
    }
  }

  /**
   * Shove, Grab, and Feint: an attack that deals no damage and lands an effect
   * scaled to net successes instead.
   *
   * The card carries the effect rather than a damage ladder, so its Apply
   * button reads the net successes *after* any opposition the defender rolled
   * — which is the whole point of Feint being an attack rather than a check.
   *
   * @param {string} id
   * @param {object} maneuver
   * @returns {Promise<ChatMessage|null|void>}
   */
  async #maneuverAttack(id, maneuver) {
    const weapon =
      maneuver.weapon === "unarmed" ? this.unarmedAttack : await this.#pickMeleeWeapon(maneuver);
    if (!weapon) return null;

    return this.attackWith(weapon, {
      title: game.i18n.localize(maneuver.label),
      subtitle: weapon.name,
      // The maneuver's own price, not the weapon's: Shove and Grab cost 2
      // whatever you are holding, and Feint costs 2 even with a Cumbersome
      // weapon that would make a Basic Attack cost 3.
      vigorCost: maneuver.vigor,
      maneuver: {
        id,
        applies: maneuver.applies ?? null,
        effect: maneuver.effect ?? null,
        max: maneuver.max ?? 3
      }
    });
  }

  /**
   * Catch Your Breath: 1 Resolve restores half your Max Vitality, and costs
   * you every other maneuver this turn.
   *
   * @param {object} maneuver
   */
  async #catchYourBreath(maneuver) {
    const system = this.system;
    if ((system.resolve?.value ?? 0) < maneuver.resolve) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Maneuver.notEnoughResolve"));
      return null;
    }

    const healed = catchYourBreathHeal(system.vitality.max);
    await this.update({
      "system.resolve.value": system.resolve.value - maneuver.resolve,
      "system.vitality.value": Math.min(system.vitality.value + healed, system.vitality.max)
    });

    return this.#report(maneuver, game.i18n.format("MANTLE.Maneuver.caughtBreath", { healed }));
  }

  /**
   * Steady Yourself: clear half your Max Strain, at the cost of the turn.
   *
   * @param {object} maneuver
   */
  async #steadyYourself(maneuver) {
    const system = this.system;
    const cleared = Math.min(steadyYourselfClear(system.strain.max), system.strain.value);

    await this.update({ "system.strain.value": system.strain.value - cleared });

    // Steady Yourself is the only thing that puts a Frenzy down, and it clears
    // the whole rage rather than a stack of it.
    const frenzy = this.conditionStacks("frenzy");
    if (frenzy > 0) await this.clearCondition("frenzy");

    const notes = [
      game.i18n.format("MANTLE.Maneuver.steadied", { cleared }),
      frenzy > 0 ? game.i18n.localize("MANTLE.Maneuver.frenzyEnded") : ""
    ]
      .filter(Boolean)
      .join(" · ");

    return this.#report(maneuver, notes);
  }

  /**
   * Surge: buy Vigor with Strain, two for one, up to MIND.
   *
   * A character with MIND 0 cannot Surge at all — refused rather than offered
   * as a maneuver that would gain nothing.
   *
   * @param {object} maneuver
   */
  async #surge(maneuver) {
    const system = this.system;
    const limit = surgeLimit({
      mind: system.cores?.mind ?? 0,
      vigor: system.vigor.value,
      maxVigor: system.vigor.max
    });

    if (!limit.available) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Maneuver.cannotSurge"));
      return null;
    }
    if (limit.maxGain === 0) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Maneuver.vigorFull"));
      return null;
    }

    const gained = await this.#promptAmount(
      game.i18n.localize(maneuver.label),
      game.i18n.format("MANTLE.Maneuver.surgePrompt", { max: limit.maxGain }),
      limit.maxGain
    );
    if (!gained) return null;

    const strain = surgeStrainCost(gained);
    await this.update({
      "system.vigor.value": system.vigor.value + gained,
      "system.strain.value": system.strain.value + strain
    });

    return this.#report(maneuver, game.i18n.format("MANTLE.Maneuver.surged", { gained, strain }));
  }

  /**
   * Shake It Off: clear one stack of Hindered or Exhausted.
   *
   * @param {object} maneuver
   */
  async #shakeItOff(maneuver) {
    const held = maneuver.clears.filter((id) => this.conditionStacks(id) > 0);
    if (held.length === 0) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Maneuver.nothingToShake"));
      return null;
    }

    if (!(await this.#spendVigor(maneuver.vigor))) return null;

    // With both present the player picks; with one, there is nothing to ask.
    const chosen =
      held.length === 1
        ? held[0]
        : await this.#pickOption(
            game.i18n.localize(maneuver.label),
            held.map((id) => ({ value: id, label: game.i18n.localize(MANTLE.conditions[id].label) }))
          );
    if (!chosen) return null;

    await this.changeCondition(chosen, -1);
    return this.#report(
      maneuver,
      game.i18n.format("MANTLE.Maneuver.shookOff", {
        condition: game.i18n.localize(MANTLE.conditions[chosen].label)
      })
    );
  }

  /**
   * Use Consumable: pick one from the known list and spend a point on it.
   *
   * A consumable point buys any entry from the catalog rather than a specific
   * stocked item, so the list is what the character knows about — and if they
   * know none, the point is still spendable on something the table names.
   *
   * @param {object} maneuver
   */
  async #useConsumable(maneuver) {
    const known = this.items.filter((item) => item.type === "consumable");

    const chosen = known.length > 0
      ? await this.#pickItem(game.i18n.localize("MANTLE.Item.whichConsumable"), known, {
          allowNone: game.i18n.localize("MANTLE.Item.somethingElse")
        })
      : null;

    if (chosen === undefined) return null;

    // useManeuver already asked whether a locked-out character may act; asking
    // again on the way through would be two prompts for one press.
    return this.useItem(chosen, { maneuver, gated: true });
  }

  /* -------------------------------------------- */

  /**
   * Use an owned item: a consumable, a granted feature, or a wondrous item.
   *
   * All three come down to the same two steps — pay whatever it costs, then
   * say what it does — so they share one path. What the effect actually *does*
   * stays with the table, except where a consumable is a thrown weapon, which
   * resolves on its ladder like any other attack.
   *
   * @param {Item|null} item - Null spends a consumable point on something
   *   the table names rather than an owned entry
   * @param {object} [options]
   * @param {object} [options.maneuver] - The maneuver that triggered this
   * @param {boolean} [options.gated] - The caller already checked the lockout
   * @returns {Promise<ChatMessage|null|void>}
   */
  async useItem(item, { maneuver = null, gated = false } = {}) {
    if (!gated && !(await this.#allowedToAct())) return null;

    if (item?.type === "limitbreak") {
      return this.#limitBreak(MANTLE.maneuvers.limitBreak, item);
    }

    const isConsumable = item === null || item.type === "consumable";

    if (isConsumable) {
      const points = this.system.consumables?.value ?? 0;
      if (points < 1) {
        ui.notifications.warn(game.i18n.localize("MANTLE.Maneuver.noConsumablePoints"));
        return null;
      }
    }

    // A thrown consumable is an attack, and attackWith owns the Vigor for one —
    // so the point comes off here and the rest is left to the attack.
    if (item?.system?.isAttack) {
      await this.update({ "system.consumables.value": this.system.consumables.value - 1 });
      return this.attackWith(consumableAsWeapon(item), { title: item.name });
    }

    const cost = maneuver?.vigor ?? item?.system?.activation?.vigorCost ?? 0;
    if (!(await this.#spendVigor(cost))) return null;

    if (isConsumable) {
      await this.update({ "system.consumables.value": this.system.consumables.value - 1 });
    }

    const notes = [
      isConsumable ? game.i18n.localize("MANTLE.Maneuver.spentConsumable") : "",
      cost > 0 ? game.i18n.format("MANTLE.Reaction.cost", { cost }) : "",
      item?.system?.activation?.uses ?? ""
    ]
      .filter(Boolean)
      .join(" · ");

    const effect =
      item?.system?.effect || item?.system?.description || item?.system?.trigger || "";

    return ChatMessage.create({
      content: `<div class="mantle mantle-harm-card">
          <p><strong>${this.name}</strong> — ${
            item?.name ?? game.i18n.localize("MANTLE.Maneuver.useConsumable")
          }</p>
          ${notes ? `<p class="notes">${notes}</p>` : ""}
          ${effect ? `<div class="effect">${effect}</div>` : ""}
        </div>`,
      speaker: ChatMessage.getSpeaker({ actor: this })
    });
  }

  /**
   * Limit Break: pick one of the equipped Limit Breaks, pay for it, and post
   * what it does.
   *
   * Two routes, and the character may have both. Three Valor from the party
   * pool is the ordinary price. A character in Crisis may instead spend
   * nothing and take Exhausted once it resolves — once per combat, refreshing
   * at the next Interlude, which is why the flag is cleared by the Interlude
   * rather than by the start of a turn.
   *
   * The effect itself is narrated, not resolved: Limit Breaks rewrite the turn
   * in ways no system could apply on its own.
   *
   * @param {object} maneuver
   * @returns {Promise<ChatMessage|null>}
   */
  async #limitBreak(maneuver, preChosen = null) {
    const equipped = this.limitBreaks;
    if (!preChosen && equipped.length === 0) {
      ui.notifications.warn(game.i18n.localize("MANTLE.LimitBreak.noneEquipped"));
      return null;
    }

    const party = this.party;
    const routes = limitBreakRoutes({
      valor: party?.system.valor.value ?? 0,
      crisis: this.system.states?.crisis ?? false,
      crisisUsed: this.getFlag("mantle", "crisisLimitBreakUsed") === true
    });

    if (routes.length === 0) {
      ui.notifications.warn(
        game.i18n.format("MANTLE.LimitBreak.cannotAfford", {
          cost: MANTLE.valorCosts.limitBreak,
          valor: party?.system.valor.value ?? 0
        })
      );
      return null;
    }

    const chosen =
      preChosen ??
      (equipped.length === 1
        ? equipped[0]
        : await this.#pickItem(game.i18n.localize("MANTLE.LimitBreak.which"), equipped));
    if (!chosen) return null;

    const route =
      routes.length === 1
        ? routes[0]
        : await this.#pickRoute(routes);
    if (!route) return null;

    if (route.cost > 0) {
      await party.update({ "system.valor.value": party.system.valor.value - route.cost });
    }

    if (route.exhausts) {
      await this.setFlag("mantle", "crisisLimitBreakUsed", true);
      await this.changeCondition("exhausted", 1);
    }

    const paid =
      route.route === "valor"
        ? game.i18n.format("MANTLE.LimitBreak.paidValor", { cost: route.cost })
        : game.i18n.localize("MANTLE.LimitBreak.paidCrisis");

    return ChatMessage.create({
      content: `<div class="mantle mantle-harm-card">
          <p><strong>${this.name}</strong> — ${game.i18n.localize(maneuver.label)}</p>
          <p class="what">${chosen.name}</p>
          <p class="notes">${paid} · ${game.i18n.localize("MANTLE.Maneuver.fullTurn")}</p>
          <div class="effect">${chosen.system.description || ""}</div>
        </div>`,
      speaker: ChatMessage.getSpeaker({ actor: this })
    });
  }

  /**
   * Pick one of several owned items by name.
   *
   * Three outcomes, deliberately distinct: an item, `null` for the offered
   * none-of-these row, and `undefined` for a cancelled dialog. Callers that
   * treat "none" as a real answer — spending a consumable point on something
   * the table names — need to tell those two apart.
   *
   * @param {string} title
   * @param {any[]} items
   * @param {object} [options]
   * @param {string} [options.allowNone] - Label for a none-of-these row
   * @returns {Promise<any|null|undefined>}
   */
  async #pickItem(title, items, { allowNone = "" } = {}) {
    const NONE = "__none__";
    const choices = items.map((item) => ({ value: item.id, label: item.name }));
    if (allowNone) choices.push({ value: NONE, label: allowNone });

    const id = await this.#pickOption(title, choices);

    if (!id) return undefined;
    if (id === NONE) return null;

    return items.find((item) => item.id === id) ?? undefined;
  }

  /**
   * Ask which route pays for a Limit Break, when both are open.
   *
   * @param {{route: string, cost: number, exhausts: boolean}[]} routes
   * @returns {Promise<{route: string, cost: number, exhausts: boolean}|null>}
   */
  async #pickRoute(routes) {
    const chosen = await this.#pickOption(
      game.i18n.localize("MANTLE.LimitBreak.how"),
      routes.map((route) => ({
        value: route.route,
        label:
          route.route === "valor"
            ? game.i18n.format("MANTLE.LimitBreak.routeValor", { cost: route.cost })
            : game.i18n.localize("MANTLE.LimitBreak.routeCrisis")
      }))
    );

    return routes.find((route) => route.route === chosen) ?? null;
  }

  /**
   * A maneuver the system prices but does not resolve — Move, Shift, and Hide.
   * The Vigor comes off and the table takes it from there.
   *
   * @param {string} id
   * @param {object} maneuver
   * @param {object} [options]
   */
  async #announceManeuver(id, maneuver, options = {}) {
    // The first Move each turn is free, and only the player knows whether they
    // have taken it — so it is asked rather than tracked.
    const free = maneuver.firstFree && options.free === true;
    if (!free && !(await this.#spendVigor(maneuver.vigor))) return null;

    return this.#report(maneuver, free ? game.i18n.localize("MANTLE.Maneuver.freeMove") : "");
  }

  /* -------------------------------------------- */

  /**
   * Post what a maneuver did.
   *
   * @param {object} maneuver
   * @param {string} [detail]
   */
  async #report(maneuver, detail = "") {
    const notes = [detail, maneuver.fullTurn ? game.i18n.localize("MANTLE.Maneuver.fullTurn") : ""]
      .filter(Boolean)
      .join(" · ");

    return ChatMessage.create({
      content: `<div class="mantle mantle-harm-card">
          <p><strong>${this.name}</strong> — ${game.i18n.localize(maneuver.label)}</p>
          ${notes ? `<p class="notes">${notes}</p>` : ""}
        </div>`,
      speaker: ChatMessage.getSpeaker({ actor: this })
    });
  }

  /**
   * Ask for a whole number between 1 and a maximum.
   *
   * @param {string} title
   * @param {string} prompt
   * @param {number} max
   * @returns {Promise<number>}
   */
  async #promptAmount(title, prompt, max) {
    const value = await foundry.applications.api.DialogV2.prompt({
      window: { title },
      classes: ["mantle"],
      content: `<form><label class="row">${prompt}
          <input type="number" name="amount" value="${max}" min="1" max="${max}"></label></form>`,
      ok: {
        label: game.i18n.localize("MANTLE.Action.roll"),
        callback: (_event, button) => new FormData(button.form).get("amount")
      },
      rejectClose: false
    });

    return Math.min(Math.max(0, Number(value) || 0), max);
  }

  /**
   * Ask the player to pick one of several options.
   *
   * @param {string} title
   * @param {{value: string, label: string}[]} choices
   * @returns {Promise<string|null>}
   */
  async #pickOption(title, choices) {
    const options = choices
      .map((choice) => `<option value="${choice.value}">${choice.label}</option>`)
      .join("");

    const chosen = await foundry.applications.api.DialogV2.prompt({
      window: { title },
      classes: ["mantle"],
      content: `<form><label class="row"><select name="choice">${options}</select></label></form>`,
      ok: {
        label: game.i18n.localize("MANTLE.Action.roll"),
        callback: (_event, button) => new FormData(button.form).get("choice")
      },
      rejectClose: false
    });

    return chosen ? String(chosen) : null;
  }

  /**
   * Pick the melee weapon a maneuver or reaction uses.
   *
   * @param {object} maneuver
   * @returns {Promise<any|null>}
   */
  async #pickMeleeWeapon(maneuver) {
    const available = maneuver.weapon === "reflexive" ? this.reflexiveWeapons : this.meleeWeapons;

    if (available.length === 0) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Reaction.noMeleeWeapon"));
      return null;
    }
    if (available.length === 1) return available[0];

    const chosen = await this.#pickOption(
      game.i18n.localize(maneuver.label),
      available.map((weapon, index) => ({ value: String(index), label: weapon.name }))
    );

    return chosen === null ? null : available[Number(chosen)];
  }

  /* -------------------------------------------- */

  /**
   * Intercept or Counterattack: a reactive Basic Attack with a melee weapon.
   *
   * @param {"intercept"|"counterattack"} id
   * @returns {Promise<ChatMessage|null|void>}
   */
  async rollReactiveAttack(id) {
    const reaction = MANTLE.reactions[id];
    if (!reaction) return null;

    const weapon = await this.#pickMeleeWeapon(reaction);
    if (!weapon) return null;

    return this.attackWith(weapon, {
      title: game.i18n.localize(reaction.label),
      subtitle: weapon.name,
      vigorCost: reaction.vigorCost
    });
  }

  /**
   * Brace: free, but it makes you Broken.
   *
   * The resistance it grants is against one incoming attack and is applied by
   * hand — it is not a standing affinity, and Strain attacks are unaffected by
   * resistance at all, which the card says so nobody spends a turn on it for
   * nothing.
   *
   * @returns {Promise<ChatMessage|null>}
   */
  async rollBrace() {
    const reaction = MANTLE.reactions.brace;
    if (!(await this.#allowedToAct(reaction))) return null;

    await this.changeCondition(reaction.appliesSelf, 1);

    return this.#report(
      { label: reaction.label },
      game.i18n.localize("MANTLE.Reaction.braceEffect")
    );
  }

  /* -------------------------------------------- */
  /*  Rest                                         */
  /* -------------------------------------------- */

  /**
   * Take an interlude: the pause between encounters.
   *
   * Restores what the rest restores, drops the conditions the fight put on,
   * and then *offers* the two things that cost Resolve — restoring Vitality
   * for 1, and healing Wounds and Burdens for their severity. Those are
   * choices, so they are asked rather than taken.
   *
   * Faltering and Unraveling are left exactly as they are. They neither clear
   * nor tick here; whether they come back next fight depends on whether the
   * harm underneath was healed, which is what `beginCombat` reads.
   *
   * @returns {Promise<string[]>} What happened, for the report
   */
  async interlude() {
    if (this.type !== "character") return [];

    const lines = [];
    await this.update(interludeRestore(this.system));
    lines.push(game.i18n.localize("MANTLE.Rest.restored"));

    const plan = interludeConditions(this.conditions);
    for (const id of plan.clears) await this.clearCondition(id);

    if (plan.clears.length > 0) {
      lines.push(
        game.i18n.format("MANTLE.Rest.conditionsCleared", { count: plan.clears.length })
      );
    }
    if (plan.persists.length > 0) {
      lines.push(
        game.i18n.format("MANTLE.Rest.conditionsPersist", {
          conditions: plan.persists
            .map((id) => game.i18n.localize(MANTLE.conditions[id].label))
            .join(", ")
        })
      );
    }
    if (plan.pauses.length > 0) {
      lines.push(
        game.i18n.format("MANTLE.Rest.conditionsPaused", {
          conditions: plan.pauses
            .map((id) => game.i18n.localize(MANTLE.conditions[id].label))
            .join(", ")
        })
      );
    }

    // The Crisis route into a Limit Break refreshes here rather than at the
    // start of a turn — it is once per combat.
    await this.unsetFlag("mantle", "crisisLimitBreakUsed");

    lines.push(...(await this.#spendResolveOnRecovery()));
    return lines;
  }

  /**
   * Take downtime: the mission-level rest.
   *
   * Everything comes back, and the Wounds themselves heal — except any the GM
   * has anchored to the story, which is why the harm is confirmed rather than
   * silently wiped.
   *
   * @returns {Promise<string[]>}
   */
  async downtime() {
    if (this.type !== "character") return [];

    const lines = [];
    await this.update(downtimeRestore(this.system));
    lines.push(game.i18n.localize("MANTLE.Rest.fullyRestored"));

    // Narrative conditions survive downtime too: the relic is still out there.
    const plan = interludeConditions(this.conditions);
    for (const id of [...plan.clears, ...plan.pauses]) await this.clearCondition(id);

    const harms = this.system.wounds.length + this.system.burdens.length;
    if (harms > 0) {
      const clear = await foundry.applications.api.DialogV2.confirm({
        window: { title: game.i18n.localize("MANTLE.Rest.downtime") },
        classes: ["mantle"],
        content: `<p>${game.i18n.format("MANTLE.Rest.healAllHint", { count: harms })}</p>`,
        rejectClose: false,
        modal: true
      });

      if (clear) {
        await this.update({ "system.wounds": [], "system.burdens": [] });
        lines.push(game.i18n.format("MANTLE.Rest.healedAll", { count: harms }));
      } else {
        lines.push(game.i18n.localize("MANTLE.Rest.harmKept"));
      }
    }

    await this.unsetFlag("mantle", "crisisLimitBreakUsed");
    return lines;
  }

  /**
   * What a character re-enters combat carrying.
   *
   * Faltering and Unraveling were paused by the interlude rather than cleared.
   * An unhealed Critical Wound restarts Faltering at 1 and an unhealed
   * Breakdown restarts Unraveling at 1 — at one stack, not at the stack the
   * character reached, so the escalation begins again.
   *
   * @returns {Promise<string[]>}
   */
  async beginCombat() {
    if (this.type !== "character") return [];

    const stacks = combatReentry({
      criticalWound: this.system.wounds.some((wound) => wound.severity >= 3),
      breakdown: this.system.burdens.some((burden) => burden.severity >= 3)
    });

    const lines = [];
    for (const [id, held] of Object.entries(stacks)) {
      // Never below what they already carry: a character who somehow kept a
      // higher stack keeps it.
      if (this.conditionStacks(id) >= held) continue;

      await this.changeCondition(id, held - this.conditionStacks(id));
      lines.push(`${game.i18n.localize(MANTLE.conditions[id].label)} ${held}`);
    }

    return lines;
  }

  /**
   * Offer the two Resolve spends an interlude allows.
   *
   * @returns {Promise<string[]>}
   */
  async #spendResolveOnRecovery() {
    const lines = [];
    const system = this.system;

    if (system.vitality.value < system.vitality.max && system.resolve.value >= 1) {
      const restore = await foundry.applications.api.DialogV2.confirm({
        window: { title: this.name },
        classes: ["mantle"],
        content: `<p>${game.i18n.format("MANTLE.Rest.vitalityHint", {
          vitality: system.vitality.value,
          max: system.vitality.max,
          resolve: system.resolve.value
        })}</p>`,
        rejectClose: false,
        modal: true
      });

      if (restore) {
        await this.update({
          "system.vitality.value": system.vitality.max,
          "system.resolve.value": system.resolve.value - 1
        });
        lines.push(game.i18n.localize("MANTLE.Rest.vitalityRestored"));
      }
    }

    lines.push(...(await this.#healHarmWithResolve("wounds")));
    lines.push(...(await this.#healHarmWithResolve("burdens")));
    return lines;
  }

  /**
   * Heal Wounds or Burdens by spending Resolve equal to their severity.
   *
   * One at a time, cheapest offered first, and only while the character can
   * still afford something — a Critical Wound at 3 Resolve is a real decision
   * against three Flesh Wounds, and the player makes it.
   *
   * @param {"wounds"|"burdens"} track
   * @returns {Promise<string[]>}
   */
  async #healHarmWithResolve(track) {
    const lines = [];

    while (true) {
      const harms = this.system[track];
      const resolve = this.system.resolve.value;
      const affordable = affordableHeals(harms, resolve);
      if (affordable.indices.length === 0) break;

      const chosen = await this.#pickOption(
        game.i18n.format(`MANTLE.Rest.heal${track === "wounds" ? "Wound" : "Burden"}`, {
          resolve
        }),
        [
          { value: "", label: game.i18n.localize("MANTLE.Rest.healNothing") },
          ...affordable.indices.map((index) => ({
            value: String(index),
            label: `${harms[index].effect} — ${healCost(harms[index])} ${game.i18n.localize(
              "MANTLE.Resource.resolve"
            )}`
          }))
        ]
      );

      if (!chosen) break;

      const index = Number(chosen);
      const cost = healCost(harms[index]);
      const remaining = harms.filter((_, at) => at !== index);

      await this.update({
        [`system.${track}`]: remaining,
        "system.resolve.value": resolve - cost
      });

      lines.push(game.i18n.format("MANTLE.Rest.healed", { effect: harms[index].effect, cost }));
    }

    return lines;
  }

  /* -------------------------------------------- */

  /**
   * Resolve a weapon's attribute. "either" means the wielder picks, and the
   * higher of POW and AGI is what a player would pick anyway.
   *
   * @param {string} choice
   * @returns {string}
   */
  #chooseAttribute(choice) {
    if (choice !== "either") return choice;
    return this.system.attributes.pow >= this.system.attributes.agi ? "pow" : "agi";
  }

  /**
   * Pay a Vigor cost, refusing rather than going negative.
   *
   * @param {number} cost
   * @returns {Promise<boolean>} Whether the cost was paid
   */
  /**
   * Whether a locked-out action goes ahead anyway.
   *
   * Broken forbids everything and Frenzy forbids defenses, but the answer is a
   * confirmation rather than a refusal: the GM may have granted an exception,
   * and a button that silently does nothing reads as broken software. Nothing
   * has been spent by the time this is asked.
   *
   * @param {object} [action]
   * @param {boolean} [action.defensive]
   * @returns {Promise<boolean>}
   */
  async #allowedToAct(action = {}) {
    const { allowed, blockedBy } = actionAllowed(this.conditions, action);
    if (allowed) return true;

    return foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("MANTLE.Reaction.lockedOut") },
      classes: ["mantle"],
      content: `<p>${game.i18n.format("MANTLE.Reaction.lockedOutHint", {
        condition: game.i18n.localize(MANTLE.conditions[blockedBy].label)
      })}</p>`,
      rejectClose: false,
      modal: true
    });
  }

  /* -------------------------------------------- */

  async #spendVigor(cost) {
    if (!cost) return true;

    // Enemies do not track Vigor at all, so nothing is deducted and nothing is
    // refused. Charging them against a resource they have none of would make
    // every maneuver on an adversary sheet fail.
    if (this.type === "adversary") return true;

    const available = this.system.vigor?.value ?? 0;
    if (cost > available) {
      ui.notifications.warn(game.i18n.format("MANTLE.Cast.notEnoughVigor", { cost }));
      return false;
    }

    await this.update({ "system.vigor.value": available - cost });
    return true;
  }

  /* -------------------------------------------- */

  /**
   * Test your luck: a LUCK roll that takes no modifiers of any kind — no
   * skills, no Impaired, no Heroic Feats. The Cursed condition forces it to
   * zero successes regardless of what the dice show.
   *
   * @param {string} [reason]
   * @returns {Promise<ChatMessage>}
   */
  async testLuck(reason = "") {
    return this.rollAction({
      attribute: "luck",
      title: game.i18n.localize("MANTLE.Card.luckRoll"),
      subtitle: reason
    });
  }

  /* -------------------------------------------- */

  /**
   * Cast a spell: shape it, pay for it, and resolve it on the Resonance's ladder.
   *
   * The Vigor cost is spent whether or not the roll lands — the effort is made
   * either way — and a graze additionally costs Strain, more if the caster
   * reached beyond the Art's basic shape.
   *
   * @returns {Promise<ChatMessage|null>}
   */
  async castSpell() {
    if (!this.system.isCaster) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Cast.notACaster"));
      return null;
    }

    const choice = await promptCast(this);
    if (!choice) return null;

    const { art, resonance, shape, cast } = choice;
    const entry = (resonance.system.arts ?? []).find((e) => e.art === art.name);
    if (!entry) return null;

    if (cast.vigorCost > this.system.vigor.value) {
      ui.notifications.warn(
        game.i18n.format("MANTLE.Cast.notEnoughVigor", { cost: cast.vigorCost })
      );
      return null;
    }

    await this.update({ "system.vigor.value": this.system.vigor.value - cast.vigorCost });

    // The area goes on the map before the roll, not after: an area spell is
    // rolled separately against each target, so the table needs to see who is
    // caught before anyone rolls anything.
    const descriptor = castTemplate({
      areaStep: cast.steps.area,
      special: shape.special,
      specialSize: shape.specialSize,
      rangeSquares: rangeAtStep(cast.steps.range, this.system.sen ?? 0).squares
    });

    if (descriptor) await placeSpellTemplate(this, descriptor);

    // The Resonance decides which of the Art's two ladders this pairing uses.
    // "both" means the caster chooses; default to Vitality, which the card's
    // ladder display makes obvious enough to correct by hand.
    const ladderKind = entry.ladder === "strain" ? "strain" : "vitality";
    const ladder = ladderKind === "strain" ? art.system.strainLadder : art.system.vitalityLadder;

    const modifiers = [];
    if (cast.penalty) modifiers.push({ label: "MANTLE.Cast.shapingPenalty", value: cast.penalty });

    // An area spell rolls once per target against each target's own defenses,
    // so the card says as much rather than letting one roll look like the
    // whole spell.
    const multiTarget = isMultiTarget({ areaStep: cast.steps.area, special: shape.special });
    const subtitle = [
      game.i18n.format("MANTLE.Cast.subtitle", { cost: cast.vigorCost }),
      multiTarget ? game.i18n.localize("MANTLE.Cast.perTarget") : ""
    ]
      .filter(Boolean)
      .join(" · ");

    const message = await this.rollAction({
      attribute: this.system.castingAttribute,
      title: `${resonance.name} ${art.name}`,
      subtitle,
      modifiers,
      ladder,
      ladderKind,
      bonusDamage: entry.bonusDamage ?? 0,
      damageTypes: Array.from(entry.tags ?? []).filter((tag) => tag in CONFIG.MANTLE.damageTypes),
      penetrating: (entry.tags ?? []).includes("penetrating")
    });

    // Grazing costs the caster Strain, and more if the spell was shaped.
    const resolved = message?.rolls?.[0]?.resolve();
    if (resolved?.isGraze) {
      await this.applyHarm({ amount: cast.grazeStrain, strain: true });
    }

    return message;
  }

  /* -------------------------------------------- */

  /**
   * Damage types this actor resists.
   *
   * Read from the derived pair rather than the stored set: a character's
   * resistances are their own plus whatever their equipped masteries grant, and
   * unequipping Fireman has to take Resistance (Fire) back with it.
   */
  get resistances() {
    return this.system.affinities?.resistances ?? [];
  }

  /** Damage types this actor is vulnerable to. */
  get weaknesses() {
    return this.system.affinities?.weaknesses ?? [];
  }

  /* -------------------------------------------- */

  /**
   * Apply an incoming hit, updating Guard and Vitality — or Strain — and
   * reporting what happened so the caller can narrate it.
   *
   * Wounds and Burdens are counted here but not *created*: their severity needs
   * a luck roll, which is a decision point rather than something to resolve
   * silently. `takeWound` and `takeBurden` finish the job.
   *
   * @param {object} options
   * @param {number} options.amount
   * @param {string[]} [options.damageTypes]
   * @param {boolean} [options.penetrating]
   * @param {boolean} [options.strain] - Resolve on the Strain track instead
   * @returns {Promise<object>}
   */
  async applyHarm({ amount, damageTypes = [], penetrating = false, strain = false }) {
    const system = this.system;
    const untyped = damageTypes.includes("untyped");
    const affinity = untyped
      ? "normal"
      : damageAffinity(damageTypes, this.resistances, this.weaknesses);

    // Strain is never halved or doubled by an affinity, so the one computed
    // above is deliberately not passed on — and is reported as "normal" so the
    // chat card does not announce a resistance that did nothing.
    if (strain) {
      const result = applyStrain({
        amount,
        strain: system.strain.value,
        maxStrain: system.strain.max,
        burdenSlots: system.slots.burden,
        burdensTaken: system.burdens.length
      });

      await this.update({ "system.strain.value": result.strainAfter });
      return { ...result, strain: true, affinity: "normal" };
    }

    const result = applyDamage({
      amount,
      guard: system.guard.value,
      vitality: system.vitality.value,
      maxVitality: system.vitality.max,
      woundSlots: system.slots.wound,
      woundsTaken: system.wounds.length,
      penetrating,
      untyped,
      affinity
    });

    await this.update({
      "system.guard.value": result.guardAfter,
      "system.vitality.value": result.vitalityAfter
    });

    return { ...result, strain: false, affinity };
  }

  /* -------------------------------------------- */

  /**
   * Take a Wound: test your luck, work out the severity, and record it.
   *
   * @param {object} [options]
   * @param {"mass"|"edge"|"mark"} [options.hitLocation] - A called shot floors the severity
   * @returns {Promise<object|null>}
   */
  async takeWound({ hitLocation = "mass" } = {}) {
    if (this.type === "adversary") return this.#takeAdversaryHarm("wounds", hitLocation);

    const system = this.system;
    const slotsFilled = system.wounds.length + 1;

    // No slot left is not a no-op: the rules say the character is Defeated.
    // Saying so is the point — silently doing nothing reads as a broken button.
    if (slotsFilled > (system.slots?.wound ?? 0)) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Harm.noWoundSlots"));
      return null;
    }

    const luck = await this.rollAction({
      attribute: "luck",
      title: game.i18n.localize("MANTLE.Card.woundSeverity"),
      subtitle: this.name
    });

    const successes = luck?.rolls?.[0]?.resolve()?.successes ?? 0;
    const severity = harmSeverity({ slotsFilled, luckSuccesses: successes, hitLocation });

    // A Trauma Wound reads a 1d6 sub-table for what it actually does.
    const sub = await new Roll("1d6").evaluate();
    const effect = woundEffect(severity, slotsFilled, sub.total);

    const wounds = [...system.wounds.map((w) => ({ ...w })), {
      severity: effect.severity,
      effect: effect.effect,
      disabledGear: ""
    }];

    await this.update({ "system.wounds": wounds });
    return { ...effect, luckSuccesses: successes, subRoll: sub.total };
  }

  /* -------------------------------------------- */

  /**
   * Take a Burden: as Wounds, but on the Strain track, and severity 2 or 3 also
   * rolls an affliction that persists until the Burden is healed.
   *
   * @returns {Promise<object|null>}
   */
  async takeBurden() {
    if (this.type === "adversary") return this.#takeAdversaryHarm("burdens");

    const system = this.system;
    const slotsFilled = system.burdens.length + 1;

    if (slotsFilled > (system.slots?.burden ?? 0)) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Harm.noBurdenSlots"));
      return null;
    }

    const luck = await this.rollAction({
      attribute: "luck",
      title: game.i18n.localize("MANTLE.Card.burdenSeverity"),
      subtitle: this.name
    });

    const successes = luck?.rolls?.[0]?.resolve()?.successes ?? 0;
    const severity = harmSeverity({ slotsFilled, luckSuccesses: successes });

    const sub = await new Roll("1d6").evaluate();
    const effect = burdenEffect(severity, slotsFilled, sub.total);

    const burdens = [...system.burdens.map((b) => ({ ...b })), {
      severity: effect.severity,
      effect: effect.effect,
      affliction: effect.affliction ? game.i18n.localize(effect.affliction) : ""
    }];

    await this.update({ "system.burdens": burdens });
    return { ...effect, luckSuccesses: successes, subRoll: sub.total };
  }

  /* -------------------------------------------- */

  /**
   * Wounds and Burdens for adversaries, which work quite differently.
   *
   * No luck roll and no severity: a creature that takes one gains Impaired N,
   * where N is the number of slots now filled — unless its stat block names a
   * Wound Effect for the location that was struck, in which case that effect
   * replaces the condition entirely. Afflictions do not apply at all, since an
   * adversary's behaviour is the GM's to play either way.
   *
   * @param {"wounds"|"burdens"} track
   * @param {string} [hitLocation] - Which location was struck, by name
   * @returns {Promise<object|null>}
   */
  async #takeAdversaryHarm(track, hitLocation = "") {
    const system = this.system;
    const slots = track === "wounds" ? system.slots.wound : system.slots.burden;
    const filled = system[track].length + 1;

    if (filled > slots) {
      ui.notifications.warn(
        game.i18n.localize(
          track === "wounds" ? "MANTLE.Harm.noWoundSlots" : "MANTLE.Harm.noBurdenSlots"
        )
      );
      return null;
    }

    const location = (system.hitLocations ?? []).find(
      (entry) => entry.name.toLowerCase() === hitLocation.toLowerCase()
    );
    const effect =
      track === "wounds" && location?.woundEffect
        ? location.woundEffect
        : game.i18n.format("MANTLE.Condition.impairedN", { count: filled });

    const entries = [...system[track].map((e) => ({ ...e })), { effect }];
    await this.update({ [`system.${track}`]: entries });

    return { effect, label: `MANTLE.Sheet.${track}` };
  }

  /* -------------------------------------------- */

  /**
   * Remove one Wound or Burden by index.
   *
   * Healing in Mantle costs Resolve equal to the severity, and happens during
   * an interlude rather than mid-fight — but downtime, story events, and plain
   * GM fiat all clear harm too, so this takes no payment. What it costs is a
   * table decision, not a rule the sheet can enforce.
   *
   * @param {"wounds"|"burdens"} track
   * @param {number} index
   * @returns {Promise<this|null>}
   */
  async clearHarm(track, index) {
    const entries = this.system[track] ?? [];
    if (index < 0 || index >= entries.length) return null;

    const kept = entries.filter((_entry, position) => position !== index).map((e) => ({ ...e }));
    return this.update({ [`system.${track}`]: kept });
  }

  /* -------------------------------------------- */

  /**
   * Start-of-turn refresh: regain Vigor equal to the refresh rate, and restore
   * Guard to its maximum.
   *
   * Over-Guard is deliberately left alone. A character carrying more Guard than
   * their maximum keeps it rather than having it pulled back down, so the
   * refresh is skipped entirely in that case.
   *
   * @returns {Promise<this>}
   */
  async refreshForTurn() {
    if (this.type !== "character") return this;
    const system = this.system;

    const vigor = Math.min(system.vigor.value + system.vigor.refresh, system.vigor.max);
    const updates = { "system.vigor.value": vigor };

    if (!system.overGuard) updates["system.guard.value"] = system.guard.max;

    return this.update(updates);
  }
}

/* -------------------------------------------- */

/**
 * Normalize a tag or damage-type collection to a plain array.
 *
 * Owned items carry these as Foundry Sets; the intrinsic profiles in CONFIG
 * carry them as arrays. Callers should not have to care which they were handed.
 *
 * @param {Set<string>|string[]|undefined} value
 * @returns {string[]}
 */
function toArray(value) {
  if (!value) return [];
  return Array.from(value);
}

/**
 * Whether a weapon profile can reach into melee.
 *
 * Owned weapons carry a derived `isMelee`; the intrinsic Unarmed Attack from
 * CONFIG carries only its reach, so both are read the same way here.
 *
 * @param {object} system
 * @returns {boolean}
 */
function isMelee(system) {
  return system.melee !== null && system.melee !== undefined;
}
