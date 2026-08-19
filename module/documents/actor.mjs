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
import { promptCast } from "../apps/cast-dialog.mjs";
import { promptAction } from "../apps/action-dialog.mjs";
import {
  allConditionStacks,
  changeCondition,
  clearConditionsForTurn,
  conditionStacks,
  setCondition
} from "./conditions.mjs";
import {
  applyDamage,
  applyStrain,
  damageAffinity,
  harmSeverity,
  woundEffect,
  burdenEffect
} from "../rules/harm.mjs";

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

  /** Equipped weapons that can be used for the Deflect reaction. */
  get deflectWeapons() {
    return this.weapons.filter((weapon) => weapon.system.canDeflect);
  }

  /**
   * Equipped Reflexive melee weapons, which are what enable Forestall.
   *
   * The Combat Reflexes mastery gives every equipped melee weapon the tag, so
   * this is usually all of them or none of them.
   */
  get reflexiveWeapons() {
    return this.weapons.filter(
      (weapon) => weapon.system.isMelee && toArray(weapon.system.tags).includes("reflexive")
    );
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
    penetrating = false
  }) {
    const base = this.system.attributes?.[attribute] ?? 0;
    const pool = buildPool(base, modifiers);

    const roll = MantleRoll.fromPool(pool, {
      ladder, ladderKind, bonusDamage, damageTypes, penetrating
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

    const modifiers = standardModifiers({ ...options, trained: false });

    return this.rollAction({
      attribute,
      title: weapon.name,
      subtitle: game.i18n.localize(MANTLE.attributes[attribute].abbr),
      modifiers,
      ladder: weapon.system.damage,
      ladderKind: "vitality",
      damageTypes: toArray(weapon.system.damageTypes),
      penetrating: tags.includes("penetrating")
    });
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

    if (!(await this.#spendVigor(MANTLE.reactions.forestall.vigorCost))) return null;
    return this.attackWith(weapon);
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
  async #spendVigor(cost) {
    if (!cost) return true;

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

    const { art, resonance, cast } = choice;
    const entry = (resonance.system.arts ?? []).find((e) => e.art === art.name);
    if (!entry) return null;

    if (cast.vigorCost > this.system.vigor.value) {
      ui.notifications.warn(
        game.i18n.format("MANTLE.Cast.notEnoughVigor", { cost: cast.vigorCost })
      );
      return null;
    }

    await this.update({ "system.vigor.value": this.system.vigor.value - cast.vigorCost });

    // The Resonance decides which of the Art's two ladders this pairing uses.
    // "both" means the caster chooses; default to Vitality, which the card's
    // ladder display makes obvious enough to correct by hand.
    const ladderKind = entry.ladder === "strain" ? "strain" : "vitality";
    const ladder = ladderKind === "strain" ? art.system.strainLadder : art.system.vitalityLadder;

    const modifiers = [];
    if (cast.penalty) modifiers.push({ label: "MANTLE.Cast.shapingPenalty", value: cast.penalty });

    const message = await this.rollAction({
      attribute: this.system.castingAttribute,
      title: `${resonance.name} ${art.name}`,
      subtitle: game.i18n.format("MANTLE.Cast.subtitle", { cost: cast.vigorCost }),
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

  /** Damage types this actor resists, from its own data. */
  get resistances() {
    return this.system.resistances ?? [];
  }

  /** Damage types this actor is vulnerable to. */
  get weaknesses() {
    return this.system.weaknesses ?? [];
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

    if (strain) {
      const result = applyStrain({
        amount,
        strain: system.strain.value,
        maxStrain: system.strain.max,
        burdenSlots: system.slots?.burden ?? system.burdenSlots ?? 0,
        burdensTaken: system.burdens.length,
        affinity
      });

      await this.update({ "system.strain.value": result.strainAfter });
      return { ...result, strain: true, affinity };
    }

    const result = applyDamage({
      amount,
      guard: system.guard.value,
      vitality: system.vitality.value,
      maxVitality: system.vitality.max,
      woundSlots: system.slots?.wound ?? system.woundSlots ?? 0,
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
