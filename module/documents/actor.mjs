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
import { buildPool, standardModifiers } from "../dice/pool.mjs";
import { postRollCard } from "../chat/cards.mjs";
import { promptCast } from "../apps/cast-dialog.mjs";
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

    const choice = weapon.system.attribute;
    const attribute =
      choice === "either"
        ? this.system.attributes.pow >= this.system.attributes.agi
          ? "pow"
          : "agi"
        : choice;

    const modifiers = standardModifiers({ ...options, trained: false });

    return this.rollAction({
      attribute,
      title: weapon.name,
      subtitle: game.i18n.localize(CONFIG.MANTLE.attributes[attribute].abbr),
      modifiers,
      ladder: weapon.system.damage,
      ladderKind: "vitality",
      damageTypes: Array.from(weapon.system.damageTypes ?? []),
      penetrating: weapon.system.tags?.has?.("penetrating") ?? false
    });
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
    const system = this.system;
    const slotsFilled = system.wounds.length + 1;
    if (slotsFilled > (system.slots?.wound ?? 0)) return null;

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
    const system = this.system;
    const slotsFilled = system.burdens.length + 1;
    if (slotsFilled > (system.slots?.burden ?? 0)) return null;

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
