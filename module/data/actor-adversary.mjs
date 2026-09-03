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
 * Both overlays are applied in derived data from the authored numbers rather
 * than written into them, so one authored creature scales across the whole
 * campaign and can always be scaled back — see module/rules/adversary.mjs.
 */

import { MANTLE } from "../config.mjs";
import { scaleAdversary } from "../rules/adversary.mjs";
import { fields, count, text, choice, options, ladder, resource, track, affinities } from "./_fields.mjs";

/**
 * Templates a GM may layer onto a Regular baseline. Blank means "run the stat
 * block as authored", which is the usual case.
 */
const TEMPLATE_CHOICES = {
  "": "MANTLE.Adversary.asAuthored",
  grunt: "MANTLE.Class.grunt",
  elite: "MANTLE.Class.elite",
  champion: "MANTLE.Class.champion",
  nemesis: "MANTLE.Class.nemesis"
};

export default class AdversaryData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      /** What the stat block was authored at. Most of the catalog is Regular. */
      challengeClass: choice(MANTLE.challengeClasses, "regular"),

      /**
       * A challenge class template the GM wants layered on top.
       *
       * Kept separate from `challengeClass` because the two are different
       * things: the authored class is a property of the creature, the template
       * is a property of tonight's encounter. Sharing one field would mean
       * re-scaling a Bandit Captain up to Nemesis and having no way back to
       * what the catalog actually printed.
       */
      template: options(TEMPLATE_CHOICES, "", { blank: true }),

      tier: choice(MANTLE.tiers, "novice"),
      tags: new fields.SetField(new fields.StringField({ blank: false })),

      attributes: new fields.SchemaField(
        Object.fromEntries(Object.keys(MANTLE.attributes).map((key) => [key, count(0)]))
      ),

      // Authored maxima, unlike characters where these are formulas — though
      // the class template and tier of play still adjust them in derived data.
      vitality: resource(),
      strain: resource(),
      guard: resource(),

      /**
       * The Wound and Burden tracks. `max` is authored on the stat block and
       * recomputed from the effective challenge class; `value` is how many have
       * been taken, and comes from the arrays below. Shaped this way so both can
       * be shown as token bars, the same as on a character.
       */
      woundSlots: track(),
      burdenSlots: track(),
      wounds: new fields.ArrayField(new fields.SchemaField({ effect: text() })),
      burdens: new fields.ArrayField(new fields.SchemaField({ effect: text() })),

      /**
       * Damage affinities. Characters gain these from masteries and gear;
       * adversaries carry them on the stat block, like Sorrowmaw's Hardened.
       */
      resistances: affinities(),
      weaknesses: affinities(),

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
    // Both overlays are applied here rather than stored, so the printed stat
    // block stays intact and a GM can drop the template to get it back.
    const scaled = scaleAdversary({
      challengeClass: this.challengeClass,
      template: this.template,
      tier: this.tier,
      vitality: this._source.vitality.max,
      strain: this._source.strain.max,
      extraManeuvers: this._source.extraManeuvers
    });

    this.scaled = scaled;
    this.effectiveClass = scaled.effectiveClass;

    this.vitality.max = scaled.maxVitality;
    this.strain.max = scaled.maxStrain;

    // Slot counts follow the class rather than the printed figure. The catalog
    // prints them too, and they always agree — but a templated creature has to
    // pick up the slots its new class grants.
    this.woundSlots.max = scaled.woundSlots;
    this.woundSlots.value = this.wounds.length;
    this.burdenSlots.max = scaled.burdenSlots;
    this.burdenSlots.value = this.burdens.length;

    this.turnsPerRound = scaled.turnsPerRound;
    this.extraManeuvers = scaled.extraManeuvers;

    /** Every maneuver's pool grows with the tier of play. */
    this.diceBonus = scaled.diceBonus;

    this.rollsDice = scaled.rollsDice;
    this.readsPatterns = scaled.readsPatterns;

    /** Defeating an adversary grants Momentum only at Elite and above. */
    this.momentumValue = MANTLE.challengeClasses[scaled.effectiveClass]?.momentum ?? 0;

    this.overGuard = this.guard.value > this.guard.max;

    // A creature with no Wound slots is removed the moment its Vitality runs
    // out, which is the normal case for Regulars and Grunts.
    this.hasWoundSlots = scaled.woundSlots > 0;
    this.hasBurdenSlots = scaled.burdenSlots > 0;

    // The harm rules read `slots` on both actor types, so adversaries expose
    // the same shape rather than making every caller branch on actor type.
    this.slots = { wound: scaled.woundSlots, burden: scaled.burdenSlots };

    // Adversaries carry their affinities on the stat block rather than earning
    // them, but expose the same derived shape a character does.
    this.affinities = {
      resistances: Array.from(this.resistances),
      weaknesses: Array.from(this.weaknesses)
    };
  }
}
