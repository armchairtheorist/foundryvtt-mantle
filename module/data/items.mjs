// @ts-nocheck — fvtt-types requires explicit generic arguments on
// TypeDataModel and Document subclasses, which plain JSDoc cannot supply
// without heavy ceremony. The rules maths these models delegate to lives in
// module/data/derive.mjs, which IS fully typechecked and unit-tested.

/**
 * Data models for every Item subtype.
 *
 * These are mostly containers — the rules text lives in compendium content, and
 * the mechanical bite lives in the Active Effects attached to each item. What
 * matters here is that the fields a sheet or a roll needs are typed and present.
 */

import { MANTLE } from "../config.mjs";
import { fields, count, modifier, text, choice, options, ladder } from "./_fields.mjs";

const TypeDataModel = foundry.abstract.TypeDataModel;

/**
 * Small shared vocabularies. Each is a value-to-localization-key map, never an
 * array — an array makes Foundry's select emit the option *index* as its value,
 * which then fails schema validation.
 */
const ATTRIBUTE_CHOICES = {
  pow: "MANTLE.Attribute.powAbbr",
  agi: "MANTLE.Attribute.agiAbbr",
  either: "MANTLE.Field.either"
};
const BOARD_CHOICES = {
  "": "MANTLE.Field.none",
  body: "MANTLE.Slot.body",
  mind: "MANTLE.Slot.mind",
  soul: "MANTLE.Slot.soul",
  wildcard: "MANTLE.Slot.wildcard"
};
const CORE_CHOICES = {
  "": "MANTLE.Field.none",
  body: "MANTLE.Core.body",
  mind: "MANTLE.Core.mind",
  soul: "MANTLE.Core.soul"
};
const CONSUMABLE_CATEGORIES = { common: "MANTLE.Category.common", exotic: "MANTLE.Category.exotic" };
const LADDER_CHOICES = {
  vitality: "MANTLE.Ladder.vitality",
  strain: "MANTLE.Ladder.strain",
  both: "MANTLE.Ladder.both"
};
const ACTIVATION_CHOICES = {
  passive: "MANTLE.Activation.passive",
  maneuver: "MANTLE.Activation.maneuver",
  reaction: "MANTLE.Activation.reaction",
  fullTurn: "MANTLE.Activation.fullTurn",
  free: "MANTLE.Activation.free"
};
const LIMIT_BREAK_CATEGORIES = {
  general: "MANTLE.LimitBreak.general",
  archetype: "MANTLE.LimitBreak.archetype"
};

/** Fields shared by every item: a description, and where it came from. */
function common() {
  return {
    description: new fields.HTMLField({ required: true, blank: true }),
    source: text()
  };
}

/** Fields for items that occupy a slot and can be equipped or set aside. */
function equippable() {
  return { equipped: new fields.BooleanField({ initial: false }) };
}

/* -------------------------------------------- */
/*  Archetypes                                   */
/* -------------------------------------------- */

export class ArchetypeData extends TypeDataModel {
  static defineSchema() {
    return {
      ...common(),
      kind: choice(MANTLE.archetypeKinds, "basic"),
      rank: count(1, { min: 0 }),
      maxRank: count(3, { min: 1 }),

      /** Mastery domains this archetype unlocks access to. */
      domains: new fields.SetField(new fields.StringField({ blank: false })),

      prerequisites: text(),

      /**
       * Spellcasting granted by this archetype, if any. Scholars cast on REA,
       * Channelers on INS, and an Elf gains innate casting on PRE — but only at
       * rank 3, so the grant carries the rank it unlocks at.
       */
      casting: new fields.SchemaField({
        attribute: new fields.StringField({ required: true, blank: true, initial: "" }),
        rank: count(1, { min: 1 })
      }),

      // Ancestry archetypes alone set these; they are ignored on path archetypes.
      spd: count(5),
      sen: count(10),
      size: choice(MANTLE.sizes, "1M"),

      /**
       * What each rank grants, kept per rank so the sheet can show only what a
       * character has actually earned. Bonuses are applied through Active
       * Effects; these entries are the human-readable record.
       */
      rankFeatures: new fields.ArrayField(
        new fields.SchemaField({
          rank: count(1, { min: 1 }),
          name: text(),
          description: text(),

          /**
           * Numeric bonuses this rank grants, summed into the character's
           * accumulators for every rank actually reached.
           *
           * Deliberately data rather than Active Effects. An archetype's bonuses
           * are per rank, and a rank-1 Warrior must not receive rank-2's Guard;
           * expressing that with effects would mean one effect per rank, each
           * enabled and disabled as the rank changes. Summing the ranks a
           * character has actually reached is simpler, deterministic, and
           * testable without a running Foundry.
           */
          bonuses: new fields.SchemaField({
            vitality: modifier(),
            strain: modifier(),
            resolve: modifier(),
            guard: modifier(),
            masteryWildcard: modifier()
          })
        })
      )
    };
  }

  prepareDerivedData() {
    /** An archetype at its maximum rank is realized, unlocking capstones. */
    this.realized = this.rank >= this.maxRank;
    /** Features from ranks the character has actually reached. */
    this.activeFeatures = this.rankFeatures.filter((f) => f.rank <= this.rank);
  }
}

/* -------------------------------------------- */
/*  Masteries                                    */
/* -------------------------------------------- */

export class MasteryData extends TypeDataModel {
  static defineSchema() {
    return {
      ...common(),
      ...equippable(),
      domain: choice(MANTLE.masteryDomains, "general"),
      masteryType: choice(MANTLE.masteryTypes, "body"),

      /**
       * Multi-slot masteries must be paid for entirely within one board — a
       * 2-slot body mastery cannot take 1 body plus 1 wildcard.
       */
      slotCost: count(1, { min: 1 }),

      /** Which board actually paid for it: its own type, or wildcard. */
      slotBoard: options(BOARD_CHOICES, "", { blank: true }),

      prerequisite: text(),

      /**
       * Mastery sets this belongs to. A set, not a single name: the catalog puts
       * Aggression in both Peak Human Condition and Human Excellence, and
       * equipping every member of any one set grants that set's bonus.
       */
      sets: new fields.SetField(new fields.StringField({ blank: false }))
    };
  }

  prepareDerivedData() {
    // Which board is actually paying for this mastery. A mastery may sit on its
    // own core's board or on a wildcard slot, and nowhere else — a BODY mastery
    // cannot be slotted into MIND — so the choice is genuinely binary and the
    // sheet cycles between the two.
    this.board = this.slotBoard || this.masteryType;
    this.onWildcard = this.board === "wildcard";
  }
}

/* -------------------------------------------- */
/*  Gear                                         */
/* -------------------------------------------- */

export class WeaponData extends TypeDataModel {
  static defineSchema() {
    return {
      ...common(),
      ...equippable(),

      /**
       * An intrinsic weapon is part of the body rather than part of the
       * loadout: always available, never unequipped, and free of gear slots.
       * Unarmed Attack is the only one in the catalog.
       */
      intrinsic: new fields.BooleanField({ initial: false }),

      weightClass: choice(MANTLE.weightClasses, "light"),

      /**
       * Which attribute builds the pool. "either" means the wielder picks, as
       * with POW/AGI weapons.
       */
      attribute: options(ATTRIBUTE_CHOICES, "pow"),

      damageTypes: new fields.SetField(new fields.StringField({ blank: false })),
      tags: new fields.SetField(new fields.StringField({ blank: false })),

      /** Reach in squares for melee; null if the weapon cannot melee. */
      melee: new fields.NumberField({ required: false, nullable: true, integer: true, min: 0, initial: 1 }),
      /** Maximum range in squares; null if the weapon cannot be thrown or fired. */
      range: new fields.NumberField({ required: false, nullable: true, integer: true, min: 0, initial: null }),

      damage: ladder(),
      special: text()
    };
  }

  prepareDerivedData() {
    this.gearSlots = this.intrinsic
      ? 0
      : MANTLE.weightClasses[this.weightClass]?.gearSlots ?? 1;

    // An intrinsic weapon cannot be put down, so it reads as equipped whatever
    // the stored flag says.
    if (this.intrinsic) this.equipped = true;

    this.isMelee = this.melee !== null;
    this.isRanged = this.range !== null;

    /** Cumbersome weapons cost 3 Vigor to attack with rather than 2. */
    this.attackCost = this.tags.has("cumbersome") ? 3 : 2;

    /** Both Deflect and Shield permit the Deflect reaction; Shield ignores weight class. */
    this.canDeflect = this.tags.has("deflect") || this.tags.has("shield");
  }
}

export class ArmorData extends TypeDataModel {
  static defineSchema() {
    return {
      ...common(),
      ...equippable(),
      armorClass: choice(MANTLE.armorClasses, "standard"),
      guard: count(1),
      /** Dice penalty the armor imposes, e.g. -1 on all AGI action rolls. */
      penalty: modifier(0),
      penaltyApplies: text()
    };
  }

  prepareDerivedData() {
    this.gearSlots = 1;
  }
}

export class FocusData extends TypeDataModel {
  static defineSchema() {
    return {
      ...common(),
      ...equippable(),
      /** Basic foci simply enable casting at full effectiveness. */
      exotic: new fields.BooleanField({ initial: false }),
      effect: text()
    };
  }

  prepareDerivedData() {
    this.gearSlots = 1;
  }
}

export class WondrousData extends TypeDataModel {
  static defineSchema() {
    return { ...common(), ...equippable(), effect: text() };
  }
}

export class ConsumableData extends TypeDataModel {
  static defineSchema() {
    return {
      ...common(),
      /** Common consumables are always available; exotic ones must be found. */
      category: options(CONSUMABLE_CATEGORIES, "common"),
      target: text(),
      effect: text(),

      // Some consumables are thrown weapons and resolve on a ladder.
      isAttack: new fields.BooleanField({ initial: false }),
      attribute: options(ATTRIBUTE_CHOICES, "agi"),
      damageTypes: new fields.SetField(new fields.StringField({ blank: false })),
      tags: new fields.SetField(new fields.StringField({ blank: false })),
      range: new fields.NumberField({ required: false, nullable: true, integer: true, min: 0, initial: null }),
      damage: ladder()
    };
  }
}

/* -------------------------------------------- */
/*  Spellcasting                                 */
/* -------------------------------------------- */

export class ArtData extends TypeDataModel {
  static defineSchema() {
    return {
      ...common(),
      ...equippable(),
      artType: choice(MANTLE.artTypes, "attack"),
      slotCost: count(1, { min: 1 }),
      baseCost: count(2),

      /**
       * The Art's basic shape: which step of each ladder it starts at, and
       * whether the caster may pay to move up. A fixed dimension cannot be
       * shaped at all — Rend's duration is always instantaneous.
       */
      basicShape: new fields.SchemaField({
        range: new fields.SchemaField({ step: count(1, { min: 1 }), shapeable: new fields.BooleanField({ initial: true }) }),
        duration: new fields.SchemaField({ step: count(1, { min: 1 }), shapeable: new fields.BooleanField({ initial: true }) }),
        area: new fields.SchemaField({ step: count(1, { min: 1 }), shapeable: new fields.BooleanField({ initial: true }) })
      }),

      /**
       * Arts that can resolve on either track carry both ladders; the Resonance
       * decides which one a given combination uses.
       */
      vitalityLadder: ladder(),
      strainLadder: ladder(),

      universalRules: text()
    };
  }
}

export class ResonanceData extends TypeDataModel {
  static defineSchema() {
    return {
      ...common(),
      ...equippable(),
      slotCost: count(1, { min: 1 }),

      /**
       * One entry per supported Art. An Art with no entry cannot be cast with
       * this Resonance — the combination is refused by fiction, not by cost.
       */
      arts: new fields.ArrayField(
        new fields.SchemaField({
          art: text(),
          ladder: options(LADDER_CHOICES, "vitality"),
          tags: new fields.SetField(new fields.StringField({ blank: false })),
          condition: text(),
          opposedBy: text(),
          bonusDamage: modifier(0),
          bolsterEffect: text(),
          qualifyingRolls: text(),
          bonusEffect: text(),
          notes: text()
        })
      )
    };
  }

  prepareDerivedData() {
    /** Fast lookup for the Cast dialog, which offers only valid combinations. */
    this.supportedArts = new Set(this.arts.map((entry) => entry.art));
  }
}

/* -------------------------------------------- */
/*  Features and Limit Breaks                    */
/* -------------------------------------------- */

export class FeatureData extends TypeDataModel {
  static defineSchema() {
    return {
      ...common(),
      /** Granted maneuvers, reactions, and always-on passives. */
      activation: new fields.SchemaField({
        type: options(ACTIVATION_CHOICES, "passive"),
        vigorCost: count(0),
        /** Free text because limits vary: "1/turn", "once per combat", "1/Interlude". */
        uses: text()
      }),
      trigger: text(),
      /** Which archetype or mastery granted this, for grouping on the sheet. */
      grantedBy: text()
    };
  }
}

export class LimitBreakData extends TypeDataModel {
  static defineSchema() {
    return {
      ...common(),
      ...equippable(),
      /**
       * General Limit Breaks gate on a core minimum; Archetype Limit Breaks
       * unlock when their archetype is realized and carry no attribute gate.
       */
      category: options(LIMIT_BREAK_CATEGORIES, "general"),
      requiredCore: options(CORE_CHOICES, "", { blank: true }),
      requiredCoreValue: count(0),
      requiredArchetype: text()
    };
  }
}

/* -------------------------------------------- */

/** Every Item data model, keyed by the subtype declared in system.json. */
export const itemDataModels = {
  archetype: ArchetypeData,
  mastery: MasteryData,
  weapon: WeaponData,
  armor: ArmorData,
  focus: FocusData,
  wondrous: WondrousData,
  consumable: ConsumableData,
  art: ArtData,
  resonance: ResonanceData,
  feature: FeatureData,
  limitbreak: LimitBreakData
};
