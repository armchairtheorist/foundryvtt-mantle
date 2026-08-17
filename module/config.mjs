/**
 * Static reference data for the Mantle system.
 *
 * Everything here is rules text turned into lookup tables: the six attributes,
 * the three cores they roll up into, the narrative skill list, the condition
 * catalog, and the tag vocabularies. Nothing in this file depends on Foundry
 * being initialized, so it can be imported from anywhere.
 *
 * Localization keys follow the pattern `MANTLE.<Category>.<key>`; see lang/en.json.
 */

/** @typedef {"pow"|"agi"|"rea"|"ins"|"pre"|"luck"} AttributeKey */
/** @typedef {"body"|"mind"|"soul"} CoreKey */

export const MANTLE = {};

/**
 * The six attributes. `core` names which core each one feeds.
 * Attributes range 0-6 typically, 7-8+ for legendary characters, never below 0.
 */
MANTLE.attributes = {
  pow: { label: "MANTLE.Attribute.pow", abbr: "MANTLE.Attribute.powAbbr", core: "body" },
  agi: { label: "MANTLE.Attribute.agi", abbr: "MANTLE.Attribute.agiAbbr", core: "body" },
  rea: { label: "MANTLE.Attribute.rea", abbr: "MANTLE.Attribute.reaAbbr", core: "mind" },
  ins: { label: "MANTLE.Attribute.ins", abbr: "MANTLE.Attribute.insAbbr", core: "mind" },
  pre: { label: "MANTLE.Attribute.pre", abbr: "MANTLE.Attribute.preAbbr", core: "soul" },
  luck: { label: "MANTLE.Attribute.luck", abbr: "MANTLE.Attribute.luckAbbr", core: "soul" }
};

/** The three cores, each the sum of its two attributes. */
MANTLE.cores = {
  body: { label: "MANTLE.Core.body", attributes: ["pow", "agi"] },
  mind: { label: "MANTLE.Core.mind", attributes: ["rea", "ins"] },
  soul: { label: "MANTLE.Core.soul", attributes: ["pre", "luck"] }
};

/* -------------------------------------------- */
/*  Core resolution                              */
/* -------------------------------------------- */

/** A die face of 5 or 6 counts as one success. */
MANTLE.successThreshold = 5;

/** Dice patterns. `size` is how many dice the pattern consumes. */
MANTLE.patterns = {
  double: { label: "MANTLE.Pattern.double", size: 2 },
  triple: { label: "MANTLE.Pattern.triple", size: 3 },
  sequence: { label: "MANTLE.Pattern.sequence", size: 4 }
};

/** Result bands, keyed by effective successes. 3+ is the top band; beyond it is overflow. */
MANTLE.bands = ["0", "1", "2", "3"];

/** Hit locations and their targeting penalties, with the Wound severity floor each imposes. */
MANTLE.hitLocations = {
  mass: { label: "MANTLE.HitLocation.mass", penalty: 0, severityFloor: 0 },
  edge: { label: "MANTLE.HitLocation.edge", penalty: -2, severityFloor: 2 },
  mark: { label: "MANTLE.HitLocation.mark", penalty: -3, severityFloor: 3 }
};

/** Visibility states and the attack roll penalty for targeting something in each. */
MANTLE.visibility = {
  visible: { label: "MANTLE.Visibility.visible", penalty: 0 },
  obscured: { label: "MANTLE.Visibility.obscured", penalty: -2 },
  hidden: { label: "MANTLE.Visibility.hidden", penalty: null } // null = cannot target
};

/* -------------------------------------------- */
/*  Derived stat formulas                        */
/* -------------------------------------------- */

/**
 * Baseline values that every character starts from before archetypes, masteries,
 * and equipment modify them.
 */
MANTLE.baseline = {
  woundSlots: 3,
  burdenSlots: 3,
  gearSlots: 3,
  consumablePoints: 2,
  maxGuard: 0,
  maxVigor: 7,
  wildcardMasterySlots: 1
};

/** Advancement cadence, from the Character Advancement table. */
MANTLE.advancement = {
  /** +1 wildcard mastery slot per this many character ranks. */
  wildcardSlotPerRanks: 5,
  /** +1 Vigor cap per this many character ranks. */
  vigorCapPerRanks: 7,
  /** The largest permitted spread between the highest and lowest core. */
  equilibriumSpread: 4
};

/** Tiers of play, by character rank. */
MANTLE.tiers = {
  novice: { label: "MANTLE.Tier.novice", min: 3, max: 8, limitBreakSlots: 1 },
  seasoned: { label: "MANTLE.Tier.seasoned", min: 9, max: 14, limitBreakSlots: 2 },
  veteran: { label: "MANTLE.Tier.veteran", min: 15, max: 20, limitBreakSlots: 3 },
  paragon: { label: "MANTLE.Tier.paragon", min: 21, max: Infinity, limitBreakSlots: 4 }
};

/* -------------------------------------------- */
/*  Character building                           */
/* -------------------------------------------- */

MANTLE.archetypeKinds = {
  ancestry: { label: "MANTLE.ArchetypeKind.ancestry", defaultMaxRank: 3 },
  basic: { label: "MANTLE.ArchetypeKind.basic", defaultMaxRank: 3 },
  specialist: { label: "MANTLE.ArchetypeKind.specialist", defaultMaxRank: 3 }
};

/** Mastery types map one-to-one onto the cores; wildcard slots accept any type. */
MANTLE.masteryTypes = {
  body: "MANTLE.Core.body",
  mind: "MANTLE.Core.mind",
  soul: "MANTLE.Core.soul"
};

/**
 * Mastery domains. Access is granted by archetypes rather than chosen freely.
 * This list covers the published catalog; new domains are additive.
 */
MANTLE.masteryDomains = {
  general: "MANTLE.Domain.general",
  martial: "MANTLE.Domain.martial",
  magic: "MANTLE.Domain.magic",
  warrior: "MANTLE.Domain.warrior",
  barbarian: "MANTLE.Domain.barbarian",
  scholar: "MANTLE.Domain.scholar",
  channeler: "MANTLE.Domain.channeler",
  human: "MANTLE.Domain.human",
  elf: "MANTLE.Domain.elf",
  dwarf: "MANTLE.Domain.dwarf"
};

/** Creature sizes, ordered smallest to largest for comparison. */
MANTLE.sizes = {
  "1T": { label: "MANTLE.Size.tiny", order: 0, footprint: 1 },
  "1S": { label: "MANTLE.Size.small", order: 1, footprint: 1 },
  "1M": { label: "MANTLE.Size.medium", order: 2, footprint: 1 },
  "1L": { label: "MANTLE.Size.large", order: 3, footprint: 1 },
  "2": { label: "MANTLE.Size.huge", order: 4, footprint: 2 },
  "3": { label: "MANTLE.Size.giant", order: 5, footprint: 3 },
  "4": { label: "MANTLE.Size.gargantuan", order: 6, footprint: 4 }
};

/* -------------------------------------------- */
/*  Narrative skills                             */
/* -------------------------------------------- */

/** Skill groups, in book order. */
MANTLE.skillGroups = {
  knowledge: "MANTLE.SkillGroup.knowledge",
  fieldcraft: "MANTLE.SkillGroup.fieldcraft",
  athletics: "MANTLE.SkillGroup.athletics",
  artisanry: "MANTLE.SkillGroup.artisanry",
  subterfuge: "MANTLE.SkillGroup.subterfuge",
  influence: "MANTLE.SkillGroup.influence"
};

/**
 * Every narrative skill, keyed by id, with the group it belongs to. Skills are
 * binary — trained or not — and a trained skill grants +2d, at most once per roll.
 */
MANTLE.skills = {
  history: "knowledge",
  religion: "knowledge",
  magicTheory: "knowledge",
  esoterica: "knowledge",
  bestiary: "knowledge",
  nature: "knowledge",
  engineering: "knowledge",
  politics: "knowledge",

  tracking: "fieldcraft",
  foraging: "fieldcraft",
  bushcraft: "fieldcraft",
  firstAid: "fieldcraft",
  herbalism: "fieldcraft",
  animalHandling: "fieldcraft",
  animalMimicry: "fieldcraft",
  navigation: "fieldcraft",

  climbing: "athletics",
  swimming: "athletics",
  endurance: "athletics",
  acrobatics: "athletics",
  jumping: "athletics",
  lifting: "athletics",
  riding: "athletics",
  vehicles: "athletics",

  smithing: "artisanry",
  alchemy: "artisanry",
  cooking: "artisanry",
  tanning: "artisanry",
  stonemasonry: "artisanry",
  carpentry: "artisanry",
  lapidary: "artisanry",
  tinkering: "artisanry",
  tailoring: "artisanry",

  stealth: "subterfuge",
  sleightOfHand: "subterfuge",
  disguise: "subterfuge",
  lockpicking: "subterfuge",
  traps: "subterfuge",
  forgery: "subterfuge",
  surveillance: "subterfuge",
  poisons: "subterfuge",
  streetwise: "subterfuge",
  escapeArtist: "subterfuge",

  charm: "influence",
  coercion: "influence",
  guile: "influence",
  readPeople: "influence",
  seduction: "influence",
  performance: "influence",
  etiquette: "influence"
};

/** The bonus a trained skill contributes to an action roll. */
MANTLE.skillBonus = 2;

/* -------------------------------------------- */
/*  Equipment                                    */
/* -------------------------------------------- */

/** Weapon weight classes, ordered for Deflect comparisons. */
MANTLE.weightClasses = {
  light: { label: "MANTLE.Weight.light", order: 0, gearSlots: 1 },
  medium: { label: "MANTLE.Weight.medium", order: 1, gearSlots: 1 },
  heavy: { label: "MANTLE.Weight.heavy", order: 2, gearSlots: 1 },
  superheavy: { label: "MANTLE.Weight.superheavy", order: 3, gearSlots: 2 }
};

/** Attacks with no declared weight class are treated as Medium. */
MANTLE.defaultWeightClass = "medium";

/** Damage types. Untyped bypasses Guard, resistance, and weakness alike. */
MANTLE.damageTypes = {
  slashing: "MANTLE.Damage.slashing",
  piercing: "MANTLE.Damage.piercing",
  crushing: "MANTLE.Damage.crushing",
  fire: "MANTLE.Damage.fire",
  earth: "MANTLE.Damage.earth",
  water: "MANTLE.Damage.water",
  air: "MANTLE.Damage.air",
  mental: "MANTLE.Damage.mental",
  cosmic: "MANTLE.Damage.cosmic",
  radiant: "MANTLE.Damage.radiant",
  necrotic: "MANTLE.Damage.necrotic",
  corrosive: "MANTLE.Damage.corrosive",
  shock: "MANTLE.Damage.shock",
  sonic: "MANTLE.Damage.sonic",
  untyped: "MANTLE.Damage.untyped"
};

/** Attacks with no damage type tag are Crushing. */
MANTLE.defaultDamageType = "crushing";

/**
 * Weapon and attack tags that carry mechanical weight. Melee N and Range N are
 * stored as numbers on the item rather than as tags, since they take a value.
 */
MANTLE.weaponTags = {
  deflect: "MANTLE.Tag.deflect",
  shield: "MANTLE.Tag.shield",
  reflexive: "MANTLE.Tag.reflexive",
  penetrating: "MANTLE.Tag.penetrating",
  indefensible: "MANTLE.Tag.indefensible",
  imprecise: "MANTLE.Tag.imprecise",
  seeking: "MANTLE.Tag.seeking",
  cumbersome: "MANTLE.Tag.cumbersome",
  combo: "MANTLE.Tag.combo"
};

MANTLE.armorClasses = {
  standard: "MANTLE.ArmorClass.standard",
  martial: "MANTLE.ArmorClass.martial"
};

/* -------------------------------------------- */
/*  Spellcasting                                 */
/* -------------------------------------------- */

MANTLE.artTypes = {
  attack: "MANTLE.ArtType.attack",
  utility: "MANTLE.ArtType.utility",
  restoration: "MANTLE.ArtType.restoration"
};

/** Which ladder a given Art/Resonance combination resolves on. */
MANTLE.effectLadders = {
  vitality: "MANTLE.Ladder.vitality",
  strain: "MANTLE.Ladder.strain"
};

/**
 * Spell-shaping. Each dimension is a ladder of steps; every step above the Art's
 * basic shape costs +1 Vigor. Area additionally penalizes the roll.
 */
MANTLE.shaping = {
  range: {
    label: "MANTLE.Shaping.range",
    steps: [
      { key: "self", label: "MANTLE.Range.self" },
      { key: "touch", label: "MANTLE.Range.touch" },
      { key: "sen", label: "MANTLE.Range.sen", senMultiplier: 1 },
      { key: "sen2", label: "MANTLE.Range.sen2", senMultiplier: 2 },
      { key: "sen4", label: "MANTLE.Range.sen4", senMultiplier: 4 }
    ],
    /** Beyond the listed steps, each further step doubles the previous range. */
    extendsByDoubling: true
  },
  duration: {
    label: "MANTLE.Shaping.duration",
    steps: [
      { key: "instant", label: "MANTLE.Duration.instant", rounds: 1 },
      { key: "2rounds", label: "MANTLE.Duration.rounds", rounds: 2 }
    ],
    /** Beyond the listed steps, each further step adds one round. */
    extendsByIncrement: true
  },
  area: {
    label: "MANTLE.Shaping.area",
    steps: [
      { key: "single", label: "MANTLE.Area.single", penalty: 0 },
      { key: "area1", label: "MANTLE.Area.area1", size: 3, penalty: -1 },
      { key: "area2", label: "MANTLE.Area.area2", size: 5, penalty: -2 },
      { key: "area3", label: "MANTLE.Area.area3", size: 7, penalty: -3 }
    ],
    /** Area shaping is capped; it does not extend past the last step. */
    capped: true
  }
};

/** Special area shapes, each unlocked by the matching shaping mastery. */
MANTLE.specialShapes = {
  salvo: { label: "MANTLE.Shape.salvo", penalty: 0, mastery: "salvo-shaping" },
  cone: { label: "MANTLE.Shape.cone", penalty: -1, mastery: "cone-shaping" },
  wall: { label: "MANTLE.Shape.wall", penalty: -1, mastery: "wall-shaping" },
  line: { label: "MANTLE.Shape.line", penalty: -1, mastery: "line-shaping", vigorCost: 2 }
};

/** Strain taken by a caster who grazes: more if the spell was shaped at all. */
MANTLE.grazeStrain = { basic: 1, shaped: 2 };

/** Penalty for casting without a spell focus equipped. */
MANTLE.noFocusPenalty = -1;

/* -------------------------------------------- */
/*  Conditions                                   */
/* -------------------------------------------- */

/**
 * Clear types:
 *  - auto: lose one stack at the end of the affected combatant's turn
 *  - roll: roll the named attribute, remove stacks equal to successes
 *  - persistent: only removed by specific means
 */
MANTLE.clearTypes = {
  auto: "MANTLE.ClearType.auto",
  roll: "MANTLE.ClearType.roll",
  persistent: "MANTLE.ClearType.persistent"
};

/** All stacking conditions cap at 3, except Faltering and Unraveling. */
MANTLE.defaultStackCap = 3;

/**
 * The general condition catalog. `rollAttributes` lists the attributes a
 * roll-to-clear condition may use; where two are listed the player picks.
 */
MANTLE.conditions = {
  broken: { label: "MANTLE.Condition.broken", stackable: false, clear: "auto" },
  cursed: { label: "MANTLE.Condition.cursed", stackable: false, clear: "persistent" },
  defeated: { label: "MANTLE.Condition.defeated", stackable: false, clear: "persistent" },
  exhausted: { label: "MANTLE.Condition.exhausted", stackable: false, clear: "roll", rollAttributes: ["pow"] },
  faltering: { label: "MANTLE.Condition.faltering", stackable: true, cap: Infinity, clear: "persistent" },
  frightened: { label: "MANTLE.Condition.frightened", stackable: false, clear: "roll", rollAttributes: ["pre"] },
  hindered: { label: "MANTLE.Condition.hindered", stackable: true, clear: "roll", rollAttributes: ["pow", "agi"] },
  impaired: { label: "MANTLE.Condition.impaired", stackable: true, clear: "auto" },
  invisible: { label: "MANTLE.Condition.invisible", stackable: false, clear: "persistent" },
  lost: { label: "MANTLE.Condition.lost", stackable: false, clear: "persistent" },
  provoked: { label: "MANTLE.Condition.provoked", stackable: false, clear: "auto" },
  shrouded: { label: "MANTLE.Condition.shrouded", stackable: false, clear: "roll", rollAttributes: ["ins"] },
  slowed: { label: "MANTLE.Condition.slowed", stackable: false, clear: "roll", rollAttributes: ["agi"] },
  surprised: { label: "MANTLE.Condition.surprised", stackable: false, clear: "auto" },
  unraveling: { label: "MANTLE.Condition.unraveling", stackable: true, cap: Infinity, clear: "persistent" },
  wracked: { label: "MANTLE.Condition.wracked", stackable: true, clear: "auto", typed: true }
};

/* -------------------------------------------- */
/*  Wounds and Burdens                           */
/* -------------------------------------------- */

MANTLE.woundSeverities = {
  1: { label: "MANTLE.Wound.flesh" },
  2: { label: "MANTLE.Wound.trauma" },
  3: { label: "MANTLE.Wound.critical" }
};

MANTLE.burdenSeverities = {
  1: { label: "MANTLE.Burden.confusion" },
  2: { label: "MANTLE.Burden.affliction" },
  3: { label: "MANTLE.Burden.breakdown" }
};

/** The 1d6 affliction table rolled for Affliction and Breakdown Burdens. */
MANTLE.afflictions = {
  1: "MANTLE.Affliction.paranoid",
  2: "MANTLE.Affliction.reckless",
  3: "MANTLE.Affliction.obsessed",
  4: "MANTLE.Affliction.terrified",
  5: "MANTLE.Affliction.withdrawn",
  6: "MANTLE.Affliction.bloodthirsty"
};

/* -------------------------------------------- */
/*  Valor                                        */
/* -------------------------------------------- */

MANTLE.valorCosts = {
  limitBreak: 3,
  heroicFortune: 2,
  heroicFeatPerSuccess: 1
};

/** A Heroic Feat can add at most this many successes to a single roll. */
MANTLE.heroicFeatMaxSuccesses = 3;

/* -------------------------------------------- */
/*  Adversaries                                  */
/* -------------------------------------------- */

/**
 * Challenge classes. Authored stat blocks are written at Regular; the others are
 * templates applied over that baseline.
 */
MANTLE.challengeClasses = {
  grunt: { label: "MANTLE.Class.grunt", turns: 1, valor: 0 },
  regular: { label: "MANTLE.Class.regular", turns: 1, valor: 0 },
  elite: { label: "MANTLE.Class.elite", turns: 1, valor: 1 },
  champion: { label: "MANTLE.Class.champion", turns: 2, valor: 2 },
  nemesis: { label: "MANTLE.Class.nemesis", turns: 3, valor: 3 }
};

/** Enemy type tags, which some player abilities key off. */
MANTLE.enemyTags = {
  humanoid: "MANTLE.EnemyTag.humanoid",
  beast: "MANTLE.EnemyTag.beast",
  avian: "MANTLE.EnemyTag.avian",
  aquatic: "MANTLE.EnemyTag.aquatic",
  undead: "MANTLE.EnemyTag.undead",
  fey: "MANTLE.EnemyTag.fey",
  mindless: "MANTLE.EnemyTag.mindless"
};
