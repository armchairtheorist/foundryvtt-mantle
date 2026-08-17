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
 */

/** Mantle rounds down everywhere unless a rule says otherwise. */
export const floor = Math.floor;

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
 * Vigor regained at the start of each turn: BODY, but never less than 1, then
 * bonuses on top. The minimum applies before bonuses — a BODY 0 caster with the
 * Vigorous mastery refreshes 2, not 1.
 *
 * @param {Cores} cores
 * @param {Bonuses} [bonuses]
 */
export function deriveVigorRefresh(cores, bonuses = {}) {
  return Math.max(cores.body, 1) + (bonuses.vigorRefresh ?? 0);
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
    wildcard: MANTLE.baseline.wildcardMasterySlots + fromRank + (bonuses.masteryWildcard ?? 0)
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
 * A creature is in Crisis if it has Faltering or Unraveling, or 3+ combined
 * Wounds and Burdens. Several abilities key off this state.
 *
 * @param {object} state
 * @param {number} state.wounds - Wounds currently taken
 * @param {number} state.burdens - Burdens currently taken
 * @param {boolean} [state.faltering]
 * @param {boolean} [state.unraveling]
 */
export function isInCrisis({ wounds, burdens, faltering = false, unraveling = false }) {
  return faltering || unraveling || wounds + burdens >= 3;
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

  return {
    cores,
    equilibrium: checkEquilibrium(cores),
    tier: deriveTier(characterRank),

    maxVitality: deriveMaxVitality(cores, bonuses),
    maxStrain: deriveMaxStrain(cores, bonuses),
    resolve: deriveResolve(cores, bonuses),
    maxGuard: baseline.maxGuard + (bonuses.guard ?? 0),

    vigor: {
      max: deriveMaxVigor(characterRank, bonuses),
      refresh: deriveVigorRefresh(cores, bonuses)
    },

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

    languages: deriveLanguages(attributes, bonuses)
  };
}
