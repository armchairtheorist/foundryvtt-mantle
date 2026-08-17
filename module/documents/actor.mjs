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
   * @returns {Promise<ChatMessage>}
   */
  async rollAction({
    attribute,
    title = "",
    subtitle = "",
    modifiers = [],
    ladder = null,
    ladderKind = "vitality",
    bonusDamage = 0
  }) {
    const base = this.system.attributes?.[attribute] ?? 0;
    const pool = buildPool(base, modifiers);

    const roll = MantleRoll.fromPool(pool, { ladder, ladderKind, bonusDamage });
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
      ladderKind: "vitality"
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
