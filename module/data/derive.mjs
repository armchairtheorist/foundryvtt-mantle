/**
 * Derived stat calculations.
 *
 * Every formula in Mantle's character maths lives here as a pure function: no
 * Foundry globals, no documents, no side effects. That keeps the rules testable
 * without a running Foundry (see test/pregens.test.mjs, which checks these
 * against the four pre-generated characters) and keeps the data models thin.
 *
 * Bonuses arrive pre-summed. Archetypes, masteries, and equipment contribute to
 * them through Active Effects, which Foundry applies after `prepareBaseData` and
 * before `prepareDerivedData` — so by the time anything here runs, the totals
 * are settled.
 */

import { MANTLE } from "../config.mjs";

/**
 * @typedef {object} Attributes
 * @property {number} pow
 * @property {number} agi
 * @property {number} rea
 * @property {number} ins
 * @property {number} pre
 * @property {number} luck
 */

/**
 * @typedef {object} Cores
 * @property {number} body
 * @property {number} mind
 * @property {number} soul
 */

/**
 * Flat additions gathered from archetypes, masteries, and equipment.
 * Every field is optional; missing means zero.
 *
 * @typedef {object} Bonuses
 * @property {number} [vitality]
 * @property {number} [strain]
 * @property {number} [resolve]
 * @property {number} [guard]
 * @property {number} [vigorRefresh]
 * @property {number} [vigorCap]
 * @property {number} [spd]
 * @property {number} [sen]
 * @property {number} [woundSlots]
 * @property {number} [burdenSlots]
 * @property {number} [gearSlots]
 * @property {number} [wondrousSlots]
 * @property {number} [consumablePoints]
 * @property {number} [languages]
 * @property {number} [masteryBody]
 * @property {number} [masteryMind]
 * @property {number} [masterySoul]
 * @property {number} [masteryWildcard]
 * @property {number} [masteryRepertoire]
 */

/** Mantle rounds down everywhere unless a rule says otherwise. */
export const floor = Math.floor;

/**
 * Every bonus accumulator, in the order the schema declares them. Kept here so
 * both the data model and the tests can enumerate them without reaching into
 * Foundry.
 *
 * @type {readonly string[]}
 */
export const BONUS_KEYS = Object.freeze([
  "vitality", "strain", "resolve", "guard", "vigorRefresh", "vigorCap",
  "spd", "sen", "woundSlots", "burdenSlots", "gearSlots", "wondrousSlots",
  "consumablePoints", "languages",
  "masteryBody", "masteryMind", "masterySoul", "masteryWildcard", "masteryRepertoire"
]);

/**
 * Total every flat bonus a character has into a fresh object.
 *
 * Deliberately returns a new object and never touches its inputs. The previous
 * version summed archetype ranks *into* the stored accumulator, which is only
 * correct as long as something zeroes that accumulator between every pair of
 * derivations — and Foundry will happily call `prepareDerivedData` more often
 * than that. When it did, Max Vitality crept upward on every re-render.
 *
 * @param {object} input
 * @param {Record<string, number>} [input.effects]
 *   What Active Effects have already written into `system.bonuses`.
 * @param {{rank: number, features: {rank: number, bonuses: Bonuses}[]}[]} [input.archetypes]
 *   Archetypes with all their rank features; only ranks reached are counted.
 * @param {Bonuses[]} [input.masteries] - Bonuses from equipped masteries
 * @param {{guard: number}[]} [input.armor] - Equipped armor
 * @param {Bonuses[]} [input.conditions] - Bonuses from conditions currently held
 * @returns {Bonuses}
 */
export function gatherBonuses({
  effects = {},
  archetypes = [],
  masteries = [],
  armor = [],
  conditions = []
} = {}) {
  /** @type {Record<string, number>} */
  const totals = {};
  for (const key of BONUS_KEYS) totals[key] = Number(effects[key]) || 0;

  /** @param {string} key @param {unknown} value */
  const add = (key, value) => {
    const amount = Number(value) || 0;
    if (amount && key in totals) totals[key] += amount;
  };

  // An archetype's bonuses are per rank, and a rank-1 Warrior must not receive
  // rank-2's Guard, so only features at or below the rank held are counted.
  for (const archetype of archetypes) {
    for (const feature of archetype.features ?? []) {
      if (feature.rank > archetype.rank) continue;
      for (const [key, value] of Object.entries(feature.bonuses ?? {})) add(key, value);
    }
  }

  // Masteries with a flat numeric effect — Vigorous grants +1 Vigor refresh,
  // Iron Will +2 Max Strain — contribute the same way, but only while equipped.
  // A mastery sitting unslotted in the inventory does nothing.
  for (const mastery of masteries) {
    for (const [key, value] of Object.entries(mastery ?? {})) add(key, value);
  }

  // Armor raises Max Guard while it is worn. Summed rather than maxed: the
  // rules allow only one armor at a time, but the sheet reports rather than
  // refuses, so an illegal loadout should read as obviously wrong.
  for (const piece of armor) add("guard", piece.guard);

  // A few conditions move derived stats rather than only imposing dice
  // modifiers — Frenzy carries a flat +1 Vigor refresh and +1 SPD for as long
  // as it lasts, whatever it is stacked to.
  for (const condition of conditions) {
    for (const [key, value] of Object.entries(condition ?? {})) add(key, value);
  }

  return totals;
}

/**
 * Tally how much of each slot budget a loadout spends.
 *
 * Deliberately advisory: Mantle expects the GM to adjudicate unusual builds, so
 * nothing here refuses an illegal loadout — it only reports what is spent so the
 * sheet can flag an overspent board.
 *
 * @param {{type: string, equipped?: boolean, gearSlots?: number,
 *          masteryType?: string, slotBoard?: string, slotCost?: number}[]} items
 * @returns {{gear: number, wondrous: number, mastery: Record<string, number>}}
 */
export function countSlotUsage(items) {
  let gear = 0;
  let wondrous = 0;
  /** @type {Record<string, number>} */
  const mastery = { body: 0, mind: 0, soul: 0, wildcard: 0, repertoire: 0 };

  for (const entry of items) {
    if (entry.equipped !== true) continue;

    // Superheavy weapons cost two gear slots, an intrinsic weapon costs none,
    // and everything else costs one.
    if (["weapon", "armor", "focus"].includes(entry.type)) gear += entry.gearSlots ?? 1;
    else if (entry.type === "wondrous") wondrous += 1;
    else if (entry.type === "mastery") {
      // `||`, not `??`. An unset slotBoard is the empty string rather than
      // null, so `??` never falls through to the mastery's own type — and every
      // equipped mastery was counted against a board named "", which is no
      // board at all. Every board read 0 used no matter what was slotted.
      const board = entry.slotBoard || entry.masteryType || "";
      if (board in mastery) mastery[board] += entry.slotCost ?? 1;
    }
  }

  return { gear, wondrous, mastery };
}

/**
 * Sum each core from its two attributes.
 *
 * @param {Attributes} attributes
 * @returns {Cores}
 */
export function deriveCores(attributes) {
  return {
    body: attributes.pow + attributes.agi,
    mind: attributes.rea + attributes.ins,
    soul: attributes.pre + attributes.luck
  };
}

/**
 * The equilibrium rule: body, mind, and soul are bound to one another, and the
 * spread between the highest and lowest core may not exceed 4.
 *
 * @param {Cores} cores
 * @returns {{spread: number, legal: boolean}}
 */
export function checkEquilibrium(cores) {
  const values = [cores.body, cores.mind, cores.soul];
  const spread = Math.max(...values) - Math.min(...values);
  return { spread, legal: spread <= MANTLE.advancement.equilibriumSpread };
}

/**
 * The tier of play a character rank falls into, and how many Limit Break slots
 * it grants.
 *
 * @param {number} characterRank
 * @returns {{key: string, label: string, limitBreakSlots: number}}
 */
export function deriveTier(characterRank) {
  for (const [key, tier] of Object.entries(MANTLE.tiers)) {
    if (characterRank >= tier.min && characterRank <= tier.max) {
      return { key, label: tier.label, limitBreakSlots: tier.limitBreakSlots };
    }
  }
  // Below the Novice floor — treat as Novice rather than leaving it undefined.
  const novice = MANTLE.tiers.novice;
  return { key: "novice", label: novice.label, limitBreakSlots: novice.limitBreakSlots };
}

/**
 * Max Vitality = (BODY + 3) × 3, plus bonuses.
 *
 * @param {Cores} cores
 * @param {Bonuses} [bonuses]
 */
export function deriveMaxVitality(cores, bonuses = {}) {
  return (cores.body + 3) * 3 + (bonuses.vitality ?? 0);
}

/**
 * Max Strain = MIND + SOUL + 3, plus bonuses.
 *
 * @param {Cores} cores
 * @param {Bonuses} [bonuses]
 */
export function deriveMaxStrain(cores, bonuses = {}) {
  return cores.mind + cores.soul + 3 + (bonuses.strain ?? 0);
}

/**
 * Resolve = SOUL + 6, plus bonuses.
 *
 * @param {Cores} cores
 * @param {Bonuses} [bonuses]
 */
export function deriveResolve(cores, bonuses = {}) {
  return cores.soul + 6 + (bonuses.resolve ?? 0);
}

/**
 * Vigor regained at the start of each turn: a flat 3, plus half BODY.
 *
 * BODY contributes nothing below 2 and there is no floor on its half — the
 * floor is the flat 3 that every character gets. That is the whole point of the
 * revision: the old BODY-with-a-minimum-of-1 gave a BODY 0 caster the same
 * refresh as a BODY 1 fighter and scaled too steeply after that.
 *
 * @param {Cores} cores
 * @param {Bonuses} [bonuses]
 */
export function deriveVigorRefresh(cores, bonuses = {}) {
  return MANTLE.baseline.vigorRefresh + floor(cores.body / 2) + (bonuses.vigorRefresh ?? 0);
}

/**
 * Max Vigor starts at 7 and gains 1 per full 7 character ranks.
 *
 * @param {number} characterRank
 * @param {Bonuses} [bonuses]
 */
export function deriveMaxVigor(characterRank, bonuses = {}) {
  const fromRank = floor(characterRank / MANTLE.advancement.vigorCapPerRanks);
  return MANTLE.baseline.maxVigor + fromRank + (bonuses.vigorCap ?? 0);
}

/**
 * Mastery slots. Body, mind, and soul slots equal their cores; wildcard slots
 * start at 1 and gain 1 per full 5 character ranks.
 *
 * @param {Cores} cores
 * @param {number} characterRank
 * @param {Bonuses} [bonuses]
 */
export function deriveMasterySlots(cores, characterRank, bonuses = {}) {
  const fromRank = floor(characterRank / MANTLE.advancement.wildcardSlotPerRanks);
  return {
    body: cores.body + (bonuses.masteryBody ?? 0),
    mind: cores.mind + (bonuses.masteryMind ?? 0),
    soul: cores.soul + (bonuses.masterySoul ?? 0),
    wildcard: MANTLE.baseline.wildcardMasterySlots + fromRank + (bonuses.masteryWildcard ?? 0),

    // Repertoire slots exist only if something granted them — the Scholar's and
    // Channeler's Starting Repertoire, which hands over three that must hold
    // Arts and Resonances. A non-caster has none, and the board is hidden.
    repertoire: bonuses.masteryRepertoire ?? 0
  };
}

/**
 * Additional languages beyond Common = REA + 1.
 *
 * @param {Attributes} attributes
 * @param {Bonuses} [bonuses]
 */
export function deriveLanguages(attributes, bonuses = {}) {
  return attributes.rea + 1 + (bonuses.languages ?? 0);
}

/**
 * A creature is in Crisis if it has Faltering or Unraveling, or if either harm
 * track has run out of slots. Several abilities key off this state.
 *
 * The tracks are checked separately rather than summed. A character three
 * Wounds deep with an empty Burden track is one hit from Defeated, and that is
 * the situation Crisis is meant to name — summing the two would rate them the
 * same as someone carrying one of each and in no particular danger.
 *
 * @param {object} state
 * @param {number} state.wounds - Wounds currently taken
 * @param {number} state.burdens - Burdens currently taken
 * @param {number} [state.woundSlots]
 * @param {number} [state.burdenSlots]
 * @param {boolean} [state.faltering]
 * @param {boolean} [state.unraveling]
 */
export function isInCrisis({
  wounds,
  burdens,
  woundSlots = 0,
  burdenSlots = 0,
  faltering = false,
  unraveling = false
}) {
  return faltering || unraveling || wounds >= woundSlots || burdens >= burdenSlots;
}

/**
 * A creature is Stressed when its Strain is at least half its Max Strain.
 *
 * @param {number} strain
 * @param {number} maxStrain
 */
export function isStressed(strain, maxStrain) {
  return strain >= floor(maxStrain / 2);
}

/**
 * Compute every derived stat for a character.
 *
 * @param {object} input
 * @param {Attributes} input.attributes
 * @param {number} input.characterRank - Sum of all archetype ranks
 * @param {Bonuses} [input.bonuses]
 * @param {{spd?: number, sen?: number, size?: string}} [input.ancestry]
 *   SPD, SEN, and SIZE come from the ancestry archetype rather than a formula.
 */
export function deriveCharacter({ attributes, characterRank, bonuses = {}, ancestry = {} }) {
  const cores = deriveCores(attributes);
  const baseline = MANTLE.baseline;

  // Every key here is deliberately named so it cannot collide with a stored
  // schema field. `resolve`, `vigor`, and `languages` are all resources or sets
  // on the character, and returning those names invites a caller to overwrite
  // real data with a derived number. See the collision guard in the tests.
  return {
    cores,
    equilibrium: checkEquilibrium(cores),
    tier: deriveTier(characterRank),

    maxVitality: deriveMaxVitality(cores, bonuses),
    maxStrain: deriveMaxStrain(cores, bonuses),
    maxResolve: deriveResolve(cores, bonuses),
    maxGuard: baseline.maxGuard + (bonuses.guard ?? 0),
    maxVigor: deriveMaxVigor(characterRank, bonuses),
    vigorRefresh: deriveVigorRefresh(cores, bonuses),

    slots: {
      wound: baseline.woundSlots + (bonuses.woundSlots ?? 0),
      burden: baseline.burdenSlots + (bonuses.burdenSlots ?? 0),
      gear: baseline.gearSlots + (bonuses.gearSlots ?? 0),
      wondrous: cores.soul + (bonuses.wondrousSlots ?? 0),
      consumable: baseline.consumablePoints + (bonuses.consumablePoints ?? 0),
      mastery: deriveMasterySlots(cores, characterRank, bonuses)
    },

    spd: (ancestry.spd ?? 0) + (bonuses.spd ?? 0),
    sen: (ancestry.sen ?? 0) + (bonuses.sen ?? 0),
    size: ancestry.size ?? "1M",

    languagesKnown: deriveLanguages(attributes, bonuses)
  };
}
