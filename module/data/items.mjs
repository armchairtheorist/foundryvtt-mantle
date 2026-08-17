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
import { fields, count, modifier, text, choice, ladder } from "./_fields.mjs";

const TypeDataModel = foundry.abstract.TypeDataModel;

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
          description: text()
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
      slotBoard: new fields.StringField({
        required: true,
        blank: true,
        initial: "",
        choices: ["", "body", "mind", "soul", "wildcard"]
      }),

      prerequisite: text(),

      /** Mastery set this belongs to, if any. Completing a set grants a bonus. */
      setName: text()
    };
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
      weightClass: choice(MANTLE.weightClasses, "light"),

      /**
       * Which attribute builds the pool. "either" means the wielder picks, as
       * with POW/AGI weapons.
       */
      attribute: new fields.StringField({
        required: true,
        initial: "pow",
        choices: ["pow", "agi", "either"]
      }),

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
    this.gearSlots = MANTLE.weightClasses[this.weightClass]?.gearSlots ?? 1;
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
      category: new fields.StringField({
        required: true,
        initial: "common",
        choices: ["common", "exotic"]
      }),
      target: text(),
      effect: text(),

      // Some consumables are thrown weapons and resolve on a ladder.
      isAttack: new fields.BooleanField({ initial: false }),
      attribute: new fields.StringField({ required: true, initial: "agi", choices: ["pow", "agi", "either"] }),
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
          ladder: new fields.StringField({ required: true, initial: "vitality", choices: ["vitality", "strain", "both"] }),
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
        type: new fields.StringField({
          required: true,
          initial: "passive",
          choices: ["passive", "maneuver", "reaction", "fullTurn", "free"]
        }),
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
      category: new fields.StringField({
        required: true,
        initial: "general",
        choices: ["general", "archetype"]
      }),
      requiredCore: new fields.StringField({ required: true, blank: true, initial: "", choices: ["", "body", "mind", "soul"] }),
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
