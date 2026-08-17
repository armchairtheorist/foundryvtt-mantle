/**
 * Dice pool construction and success counting.
 *
 * A pool is an attribute plus modifiers, and modifiers all sum together —
 * bonuses net against penalties — before anything is rolled. There is no
 * ordering subtlety to get wrong, which is deliberate on Mantle's part.
 *
 * Pure logic — no Foundry dependency, so it is unit-tested directly.
 */

import { MANTLE } from "../config.mjs";

/**
 * @typedef {object} Modifier
 * @property {string} label - Shown on the chat card so a pool can be audited
 * @property {number} value - Dice added (positive) or removed (negative)
 */

/**
 * @typedef {object} Pool
 * @property {number} dice - Dice actually rolled
 * @property {number} requested - What the modifiers added up to, before the floor
 * @property {boolean} desperate - True when the pool fell to zero or below
 * @property {Modifier[]} modifiers
 * @property {string} formula - The Foundry roll formula
 */

/**
 * Build a pool from a base attribute and a list of modifiers.
 *
 * When modifiers reduce a pool to zero or fewer dice, Mantle does not simply
 * fail: you roll 2d6 and take the *lowest*, which still succeeds on a 5 or 6.
 * That is roughly an 11% chance of one success, and patterns do not apply.
 *
 * @param {number} base - The attribute value
 * @param {Modifier[]} [modifiers]
 * @returns {Pool}
 */
export function buildPool(base, modifiers = []) {
  const total = modifiers.reduce((sum, modifier) => sum + modifier.value, 0);
  const requested = base + total;
  const desperate = requested <= 0;

  return {
    dice: desperate ? 2 : requested,
    requested,
    desperate,
    modifiers: [...modifiers],
    formula: desperate ? "2d6kl1" : `${requested}d6`
  };
}

/**
 * Count successes. A die showing 5 or 6 is one success, whether the pool was
 * normal or desperate — the desperate pool just keeps a single die.
 *
 * @param {number[]} faces
 * @returns {number}
 */
export function countSuccesses(faces) {
  return faces.filter((face) => face >= MANTLE.successThreshold).length;
}

/**
 * Reduce raw successes to effective successes, which is what result bands are
 * always read from.
 *
 * An opposition roll subtracts its successes; a Heroic Feat adds up to three,
 * bought with Valor. The floor is zero — an attack reduced to nothing is a
 * graze, not a miss.
 *
 * @param {number} successes
 * @param {number} [adjustment] - Negative for opposition, positive for Valor
 * @returns {number}
 */
export function effectiveSuccesses(successes, adjustment = 0) {
  return Math.max(0, successes + adjustment);
}

/**
 * The result band effective successes fall into. Bands are 0, 1, 2, and 3+,
 * with anything past 3 also producing overflow.
 *
 * @param {number} effective
 * @returns {{band: "0"|"1"|"2"|"3", overflow: number, isGraze: boolean}}
 */
export function resolveBand(effective) {
  const band = /** @type {"0"|"1"|"2"|"3"} */ (String(Math.min(effective, 3)));
  return {
    band,
    overflow: Math.max(0, effective - 3),
    isGraze: effective === 0
  };
}

/**
 * Whether patterns may trigger at all.
 *
 * A graze triggers nothing, and a desperate pool never reads patterns. Both
 * rules matter: they stop a hopeless roll from producing a Solid Hit.
 *
 * @param {object} result
 * @param {number} result.effective
 * @param {boolean} result.desperate
 * @returns {boolean}
 */
export function patternsApply({ effective, desperate }) {
  return effective >= 1 && !desperate;
}

/**
 * Assemble the standard modifiers for an action roll, skipping any that do not
 * apply so the chat card lists only what actually moved the pool.
 *
 * @param {object} options
 * @param {boolean} [options.trained] - A trained skill, worth +2d, never on attacks
 * @param {"mass"|"edge"|"mark"} [options.hitLocation]
 * @param {number} [options.impaired] - Stacks of Impaired, -1d each
 * @param {boolean} [options.hindered] - Hindered imposes -1d on attacks
 * @param {boolean} [options.hidden] - Attacking from hiding is +2d
 * @param {number} [options.rangePenalty] - -1d when adjacent or at extreme range
 * @param {number} [options.situational] - Free-form GM adjustment
 * @returns {Modifier[]}
 */
export function standardModifiers({
  trained = false,
  hitLocation = "mass",
  impaired = 0,
  hindered = false,
  hidden = false,
  rangePenalty = 0,
  situational = 0
} = {}) {
  /** @type {Modifier[]} */
  const modifiers = [];

  if (trained) modifiers.push({ label: "MANTLE.Modifier.trained", value: MANTLE.skillBonus });

  const location = MANTLE.hitLocations[hitLocation];
  if (location?.penalty) {
    modifiers.push({ label: `MANTLE.HitLocation.${hitLocation}`, value: location.penalty });
  }

  if (impaired > 0) modifiers.push({ label: "MANTLE.Condition.impaired", value: -impaired });
  if (hindered) modifiers.push({ label: "MANTLE.Condition.hindered", value: -1 });
  if (hidden) modifiers.push({ label: "MANTLE.Modifier.hidden", value: 2 });
  if (rangePenalty) modifiers.push({ label: "MANTLE.Modifier.range", value: rangePenalty });
  if (situational) modifiers.push({ label: "MANTLE.Modifier.situational", value: situational });

  return modifiers;
}
