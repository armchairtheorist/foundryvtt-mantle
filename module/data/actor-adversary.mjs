// @ts-nocheck — fvtt-types requires explicit generic arguments on
// TypeDataModel and Document subclasses, which plain JSDoc cannot supply
// without heavy ceremony. The rules maths these models delegate to lives in
// module/data/derive.mjs, which IS fully typechecked and unit-tested.

/**
 * Data model for adversaries — enemies and hostile NPCs.
 *
 * Adversaries are not simplified characters. They run a separate, faster action
 * economy: no Vigor, no reactions by default, one Move plus one extra maneuver.
 * Their numbers are authored rather than derived, because a stat block is
 * balanced as a whole rather than built from attributes upward.
 *
 * Stat blocks are written at the Regular challenge class; Grunt, Elite,
 * Champion, and Nemesis are overlays applied on top, as is the tier of play.
 * Both overlays are stored as choices here and applied through Active Effects,
 * so one authored creature scales across the whole campaign.
 */

import { MANTLE } from "../config.mjs";
import { fields, count, text, choice, resource, ladder } from "./_fields.mjs";

export default class AdversaryData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      challengeClass: choice(MANTLE.challengeClasses, "regular"),
      tier: choice(MANTLE.tiers, "novice"),
      tags: new fields.SetField(new fields.StringField({ blank: false })),

      attributes: new fields.SchemaField(
        Object.fromEntries(Object.keys(MANTLE.attributes).map((key) => [key, count(0)]))
      ),

      // Authored maxima, unlike characters where these are formulas.
      vitality: new fields.SchemaField({ value: count(), max: count(20) }),
      strain: new fields.SchemaField({ value: count(), max: count(5) }),
      guard: new fields.SchemaField({ value: count(), max: count(0) }),

      woundSlots: count(0),
      burdenSlots: count(0),
      wounds: new fields.ArrayField(new fields.SchemaField({ effect: text() })),
      burdens: new fields.ArrayField(new fields.SchemaField({ effect: text() })),

      spd: count(5),
      sen: count(10),
      size: choice(MANTLE.sizes, "1M"),

      /**
       * How many turns this creature takes per round, and what it may do in
       * each. Champions take two turns and Nemeses three, each as its own slot
       * in the turn order rather than back to back.
       */
      turnsPerRound: count(1, { min: 1 }),
      extraManeuvers: count(1),

      /**
       * Attacks and other maneuvers, each with its own pool and effect ladder.
       * Signature attacks are telegraphed: announced on one turn, resolved at
       * the start of the next.
       */
      maneuvers: new fields.ArrayField(
        new fields.SchemaField({
          name: text(),
          pool: count(2),
          tags: new fields.SetField(new fields.StringField({ blank: false })),
          opposedBy: text(),
          signature: new fields.BooleanField({ initial: false }),
          telegraphed: new fields.BooleanField({ initial: false }),
          ladder: ladder(),
          notes: text()
        })
      ),

      /**
       * Valid hit locations. Deliberately a list rather than the fixed
       * Mass/Edge/Mark trio, because creatures differ — Sorrowmaw has Wings and
       * The Hollow Heart; a Razorwing has no Mark at all. Every creature has a
       * Mass.
       */
      hitLocations: new fields.ArrayField(
        new fields.SchemaField({
          name: text("Mass"),
          penalty: new fields.NumberField({ required: true, integer: true, initial: 0, max: 0 }),
          hitEffect: text(),
          woundEffect: text()
        })
      ),

      abilities: new fields.ArrayField(
        new fields.SchemaField({ name: text(), description: text() })
      ),

      description: new fields.HTMLField({ required: true, blank: true }),
      tactics: new fields.HTMLField({ required: true, blank: true })
    };
  }

  /* -------------------------------------------- */

  prepareDerivedData() {
    const cc = MANTLE.challengeClasses[this.challengeClass];

    /**
     * Grunts never roll: any action roll they make is treated as exactly one
     * success. That single rule removes most of the dice-rolling from a squad
     * of four, which is the point of fielding them.
     */
    this.rollsDice = this.challengeClass !== "grunt";

    /** Only Champions and Nemeses read patterns on their rolls. */
    this.readsPatterns = ["champion", "nemesis"].includes(this.challengeClass);

    /** Defeating an adversary grants Valor only at Elite and above. */
    this.valorValue = cc?.valor ?? 0;

    this.overGuard = this.guard.value > this.guard.max;

    // A creature with no Wound slots is removed the moment its Vitality runs
    // out, which is the normal case for Regulars and Grunts.
    this.hasWoundSlots = this.woundSlots > 0;
    this.hasBurdenSlots = this.burdenSlots > 0;
  }
}
