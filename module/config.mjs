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
  quad: { label: "MANTLE.Pattern.quad", size: 4 }
};

/** Result bands, keyed by effective successes. 3+ is the top band; beyond it is overflow. */
MANTLE.bands = ["0", "1", "2", "3"];

/** Hit locations and their targeting penalties, with the Wound severity floor each imposes. */
/**
 * The three hit locations, and what a called shot buys.
 *
 * v0.31 replaced the severity floors these used to impose — there is no
 * severity any more — with effects: Edge lands Hindered on any hit, and Mark
 * makes the defender weak to the attack and Broken if it Wounds them.
 */
MANTLE.hitLocations = {
  mass: { label: "MANTLE.HitLocation.mass", penalty: 0 },
  edge: { label: "MANTLE.HitLocation.edge", penalty: -2, onHit: "hindered" },
  mark: { label: "MANTLE.HitLocation.mark", penalty: -3, weakness: true, onWound: "broken" }
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
  wildcardMasterySlots: 1,

  /**
   * Vigor refresh is a flat 3 plus half BODY. The flat part is the floor for
   * everyone — BODY contributes nothing below 2, and its half has no minimum of
   * its own.
   */
  vigorRefresh: 3
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

/**
 * The mastery boards a mastery can be slotted into. Three mirror the cores; the
 * wildcard board takes a mastery of any type, which is what makes it worth
 * spending deliberately rather than leaving idle.
 */
MANTLE.slotBoards = {
  body: "MANTLE.Slot.body",
  mind: "MANTLE.Slot.mind",
  soul: "MANTLE.Slot.soul",
  wildcard: "MANTLE.Slot.wildcard",
  repertoire: "MANTLE.Slot.repertoire"
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

/** The bonus an attack gains when the attacker is Hidden from the target. */
MANTLE.hiddenAttackBonus = 2;

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
 * Shorthands that stand for several damage types at once.
 *
 * "Resistance (Physical)" is one trait covering Slashing, Piercing, and
 * Crushing together. Expanding it here rather than writing the three out on
 * every stat block keeps the shorthand the catalog uses and the thing the
 * affinity engine compares against as the same idea.
 */
/**
 * Wracked (Bleeding) is a Wracked variant that counts as Piercing *and*
 * Slashing at once: a resistance or weakness to either answers its damage.
 */
MANTLE.bleedingDamageTypes = ["piercing", "slashing"];

MANTLE.damageTypeGroups = {
  physical: ["slashing", "piercing", "crushing"]
};

/**
 * What a resistance or weakness may name: any single damage type, or one of the
 * group shorthands.
 */
MANTLE.affinityChoices = {
  physical: "MANTLE.Damage.physical",
  ...MANTLE.damageTypes
};

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

/**
 * The Unarmed Attack, which every character always has equipped and which
 * never costs a gear slot.
 *
 * Kept here as a weapon profile rather than as an item the sheet has to be
 * given, so a freshly created character can already punch. The compendium
 * carries a matching item for anyone who wants to modify their own copy; that
 * one is flagged intrinsic, so it too costs no slot.
 */
MANTLE.unarmedAttack = {
  name: "MANTLE.Sheet.unarmedAttack",
  intrinsic: true,
  equipped: true,
  weightClass: "light",
  attribute: "either",
  damageTypes: ["crushing"],
  tags: [],
  melee: 1,
  range: null,
  gearSlots: 0,
  attackCost: 2,
  damage: { 0: "1 damage", 1: "3 damage", 2: "6 damage", 3: "9 damage", overflow: "" },
  special: ""
};

/* -------------------------------------------- */
/*  Reactions                                    */
/* -------------------------------------------- */

/**
 * The reactive defenses the sheet offers as buttons. Both are opposed rolls:
 * the successes rolled here are subtracted from the attacker's, which is what
 * the roll card's net-success stepper is for.
 */
MANTLE.reactions = {
  dodge: { label: "MANTLE.Reaction.dodge", attribute: "agi", vigorCost: 2, defensive: true },
  deflect: { label: "MANTLE.Reaction.deflect", vigorCost: 1, defensive: true },

  /**
   * Forestall is a reactive *attack* rather than a defense: it makes a Basic
   * Attack with an equipped Reflexive melee weapon when a combatant already in
   * reach tries to move away. It is available to anyone holding such a weapon,
   * which is what the Combat Reflexes mastery is for.
   */
  forestall: { label: "MANTLE.Reaction.forestall", vigorCost: 2, weapon: "reflexive" },

  /** A reactive attack with any equipped melee weapon. */
  intercept: { label: "MANTLE.Reaction.intercept", vigorCost: 2, weapon: "melee" },

  /** As Intercept, but granted by the Warrior archetype rather than universal. */
  counterattack: { label: "MANTLE.Reaction.counterattack", vigorCost: 2, weapon: "melee" },

  /**
   * Brace costs nothing but ends your turn's options: you gain resistance to
   * the incoming attack and become Broken, which locks out every further
   * maneuver and reaction until it clears. A last resort, priced as one.
   */
  brace: { label: "MANTLE.Reaction.brace", vigorCost: 0, appliesSelf: "broken", defensive: true }
};

/* -------------------------------------------- */
/*  Maneuvers                                    */
/* -------------------------------------------- */

/**
 * The basic maneuvers every combatant can take, from the Quick Start's table.
 *
 * Universal, so they live here rather than as items a character has to be
 * given — the same reasoning as the Unarmed Attack. The compendium ships a
 * readable copy of this table built from it, so the two cannot disagree.
 *
 * `kind` says what pressing the button actually does. Anything the system
 * cannot resolve on its own — where you moved, whether the fiction allows
 * hiding — is posted as a card for the table to adjudicate, which is the same
 * assisted model the rest of the system uses.
 */
// `enemy` marks the ones an adversary may take. Enemies run a leaner action
// economy — one Move plus one extra maneuver, chosen from Move, Shift, Basic
// Attack, Shove, and whatever the stat block defines — and Feint is universal
// by design ruling, so it joins them.
MANTLE.maneuvers = {
  // v0.31 doubled the price of movement: a Move after the first costs 2, as
  // does a Shift. Against a Max Vigor of 7 and a Basic Attack at 2, that is
  // roughly three actions a turn instead of five.
  move: { label: "MANTLE.Maneuver.move", vigor: 2, kind: "simple", firstFree: true, enemy: true },
  shift: { label: "MANTLE.Maneuver.shift", vigor: 2, kind: "simple", enemy: true },

  // Each rolls an attack that deals no damage and lands an effect scaled to net
  // successes, capped at 3. Shove and Grab use the Unarmed Attack specifically;
  // Feint uses any equipped melee weapon, and the Unarmed Attack qualifies.
  shove: {
    label: "MANTLE.Maneuver.shove",
    vigor: 2,
    kind: "attack",
    weapon: "unarmed",
    effect: "MANTLE.Maneuver.shoveEffect",
    max: 3,
    enemy: true
  },
  grab: {
    label: "MANTLE.Maneuver.grab",
    vigor: 2,
    kind: "attack",
    weapon: "unarmed",
    applies: "grabbed",
    max: 3,
    enemy: true
  },
  feint: {
    label: "MANTLE.Maneuver.feint",
    vigor: 2,
    kind: "attack",
    weapon: "melee",
    applies: "vulnerable",
    max: 3,
    enemy: true
  },

  useConsumable: { label: "MANTLE.Maneuver.useConsumable", vigor: 1, kind: "consumable" },
  hide: { label: "MANTLE.Maneuver.hide", vigor: 1, kind: "simple" },
  shakeItOff: {
    label: "MANTLE.Maneuver.shakeItOff",
    vigor: 2,
    kind: "clearCondition",
    clears: ["exhausted", "grabbed", "hindered", "vulnerable"]
  },

  // The three full-turn maneuvers. Taking one costs no Vigor but locks out
  // everything else until your next turn, which the card says rather than the
  // system enforcing.
  catchYourBreath: {
    label: "MANTLE.Maneuver.catchYourBreath",
    vigor: 0,
    resolve: 1,
    kind: "heal",
    fullTurn: true
  },
  steadyYourself: {
    label: "MANTLE.Maneuver.steadyYourself",
    vigor: 0,
    kind: "clearStrain",
    fullTurn: true
  },
  limitBreak: { label: "MANTLE.Maneuver.limitBreak", vigor: 0, kind: "limitBreak", fullTurn: true },

  /** Once per turn, and impossible at MIND 0: 2 Strain buys 1 Vigor. */
  surge: { label: "MANTLE.Maneuver.surge", vigor: 0, kind: "surge", oncePerTurn: true }
};

/** Surge trades Strain for Vigor at this rate. */
MANTLE.surgeStrainPerVigor = 2;

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

/**
 * The two ladders an Art carries, for sheets that print both.
 *
 * Which one a cast resolves on is the Resonance's choice, so a caster reading
 * their own Arts needs to see both rather than guess.
 */
MANTLE.spellLadders = [
  { key: "vitalityLadder", label: "MANTLE.Sheet.vitalityLadder" },
  { key: "strainLadder", label: "MANTLE.Sheet.strainLadder" }
];

/** Border colour for a spell area, so it reads as a spell rather than a ruler. */
MANTLE.templateBorderColor = "#7a4fa8";

/** Degrees the mouse wheel turns an aimed template, and with Shift held. */
MANTLE.templateRotation = 15;
MANTLE.templateFineRotation = 5;

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
  // Given by every Burden, and named from the 1d6 affliction table. Typed
  // like Wracked, but it deals no damage — only Burdens clear it.
  affliction: { label: "MANTLE.Condition.affliction", stackable: false, clear: "persistent", typed: true },
  broken: { label: "MANTLE.Condition.broken", stackable: false, clear: "auto" },
  cursed: { label: "MANTLE.Condition.cursed", stackable: false, clear: "persistent" },
  defeated: { label: "MANTLE.Condition.defeated", stackable: false, clear: "persistent" },
  exhausted: { label: "MANTLE.Condition.exhausted", stackable: false, clear: "roll", rollAttributes: ["pow"] },
  faltering: { label: "MANTLE.Condition.faltering", stackable: true, cap: Infinity, clear: "persistent" },
  // Frenzy burns the character who carries it: Strain equal to its stacks at
  // the end of every turn, until Steady Yourself puts the rage down.
  frenzy: {
    label: "MANTLE.Condition.frenzy",
    stackable: true,
    clear: "persistent",
    strainPerStack: 1
  },
  frightened: { label: "MANTLE.Condition.frightened", stackable: false, clear: "roll", rollAttributes: ["pre"] },
  grabbed: { label: "MANTLE.Condition.grabbed", stackable: true, clear: "roll", rollAttributes: ["pow", "agi"] },
  hindered: { label: "MANTLE.Condition.hindered", stackable: false, clear: "roll", rollAttributes: ["pow", "agi"] },
  impaired: { label: "MANTLE.Condition.impaired", stackable: true, clear: "auto" },
  invisible: { label: "MANTLE.Condition.invisible", stackable: false, clear: "persistent" },
  lost: { label: "MANTLE.Condition.lost", stackable: false, clear: "persistent" },
  provoked: { label: "MANTLE.Condition.provoked", stackable: false, clear: "auto" },
  shrouded: { label: "MANTLE.Condition.shrouded", stackable: false, clear: "roll", rollAttributes: ["ins"] },
  slowed: { label: "MANTLE.Condition.slowed", stackable: false, clear: "roll", rollAttributes: ["agi"] },
  surprised: { label: "MANTLE.Condition.surprised", stackable: false, clear: "auto" },
  unraveling: { label: "MANTLE.Condition.unraveling", stackable: true, cap: Infinity, clear: "persistent" },
  vulnerable: { label: "MANTLE.Condition.vulnerable", stackable: true, clear: "persistent" },
  wracked: { label: "MANTLE.Condition.wracked", stackable: true, clear: "auto", typed: true, damagePerStack: 2 }
};

/**
 * Visibility states, as token markers.
 *
 * Hidden and Obscured are *states* rather than conditions: section 8 lists them
 * under Visibility as a relationship between one creature and another, with no
 * stacks and nothing to clear at end of turn. They are registered as status
 * effects all the same, because a GM still needs to mark which token is which —
 * but they are deliberately not in the condition table, and so never appear in
 * the condition bar with stack controls that would mean nothing.
 *
 * Invisible is the opposite case and belongs in the table above: section 8
 * writes it as a real [CONDITION] block, persistent and non-stacking, granted
 * by an ability rather than by where you are standing.
 */
MANTLE.visibilityMarkers = {
  hidden: "MANTLE.Visibility.hidden",
  obscured: "MANTLE.Visibility.obscured"
};

/**
 * Conditions that move a derived stat rather than only imposing dice modifiers.
 *
 * Kept separate from the condition table because these feed the derivation
 * pipeline, and the pipeline takes flat bonuses — not stack counts. Frenzy is
 * the only one so far: its riders are flat regardless of how many stacks are
 * held, while its per-stack +1d on melee attacks is applied on the roll.
 *
 * v0.31 took Frenzy's Vigor refresh away and left only the SPD, so the rage no
 * longer partly pays for itself.
 */
MANTLE.conditionBonuses = {
  frenzy: { spd: 1 }
};

/* -------------------------------------------- */
/*  Wounds and Burdens                           */
/* -------------------------------------------- */

/**
 * The 1d6 table a Wound rolls for its consequence.
 *
 * v0.31 dropped Wound severities entirely. A Wound is a Wound; what it *does*
 * comes off this table, and filling the last slot is what brings Faltering
 * rather than any one severity.
 *
 * `scalesWithWounds` marks the Impaired row, whose stack count is the number
 * of Wounds held — and which sets the stacks rather than adding to them.
 */
MANTLE.woundConsequences = {
  1: { condition: "impaired", scalesWithWounds: true },
  2: { condition: "hindered" },
  3: { condition: "exhausted" },
  4: { condition: "slowed" },
  5: { condition: "shrouded" },
  6: { condition: "broken" }
};

/** The 1d6 affliction table. Every Burden rolls on it in v0.31. */
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

/** Heroic Feat adds at most this many successes to any single roll. */
MANTLE.heroicFeatMaxSuccesses = 3;

/* -------------------------------------------- */
/*  Rest                                         */
/* -------------------------------------------- */

/**
 * Consumable points an interlude restocks. The rules say "at least 1", with the
 * GM free to grant more, so this is the floor rather than the rule.
 */
MANTLE.interludeConsumableRestock = 1;

/** Resolve to heal one Wound or Burden at an interlude. Flat since v0.31. */
MANTLE.healResolveCost = 1;

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
