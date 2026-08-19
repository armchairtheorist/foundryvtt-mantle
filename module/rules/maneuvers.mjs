/**
 * The basic maneuvers, as arithmetic.
 *
 * Everything here answers "how much" — how much Vitality Catching Your Breath
 * restores, how much Vigor a Surge can buy and what it costs, how many dice a
 * Vulnerable target hands the attacker. What a maneuver *means* stays in the
 * config table and on the chat card; this is only the part with a right answer.
 *
 * Pure logic — no Foundry dependency, so it is unit-tested directly.
 */

import { MANTLE } from "../config.mjs";

/** Mantle rounds down everywhere unless a rule says otherwise. */
const floor = Math.floor;

/**
 * Catch Your Breath restores half your Max Vitality for 1 Resolve.
 *
 * @param {number} maxVitality
 * @returns {number}
 */
export function catchYourBreathHeal(maxVitality) {
  return floor(maxVitality / 2);
}

/**
 * Steady Yourself clears half your Max Strain.
 *
 * @param {number} maxStrain
 * @returns {number}
 */
export function steadyYourselfClear(maxStrain) {
  return floor(maxStrain / 2);
}

/**
 * What a Surge can buy: Vigor up to MIND, two Strain apiece, and never past the
 * Vigor cap.
 *
 * A character with MIND 0 cannot Surge at all — the rule is explicit, and it is
 * the difference between "gains nothing" and "may not take the maneuver".
 *
 * @param {object} state
 * @param {number} state.mind
 * @param {number} state.vigor - Current Vigor
 * @param {number} state.maxVigor
 * @returns {{available: boolean, maxGain: number, strainPerVigor: number}}
 */
export function surgeLimit({ mind, vigor, maxVigor }) {
  const headroom = Math.max(0, maxVigor - vigor);
  return {
    available: mind > 0,
    maxGain: Math.min(mind, headroom),
    strainPerVigor: MANTLE.surgeStrainPerVigor
  };
}

/**
 * The Strain a Surge of a given size costs.
 *
 * @param {number} vigorGained
 * @returns {number}
 */
export function surgeStrainCost(vigorGained) {
  return vigorGained * MANTLE.surgeStrainPerVigor;
}

/* -------------------------------------------- */

/**
 * How much of an effect an attack-shaped maneuver lands.
 *
 * Shove, Grab, and Feint all read the same way: net successes, capped at 3, and
 * nothing at all on zero. The cap is why this is a function rather than the
 * number itself — a Feint that rolled five successes still only applies
 * Vulnerable 3.
 *
 * @param {number} netSuccesses - After any opposition has been subtracted
 * @param {number} [max]
 * @returns {number}
 */
export function maneuverEffectSize(netSuccesses, max = 3) {
  return Math.max(0, Math.min(netSuccesses, max));
}

/**
 * The dice a Vulnerable target hands its attacker.
 *
 * One per stack, and every stack is consumed by the attack that used them —
 * whatever the attack rolled, and whether or not it rolled at all. A Grunt's
 * automatic single success gains nothing from the dice and spends them anyway,
 * which is the ruling rather than an oversight.
 *
 * @param {number} stacks
 * @returns {number}
 */
export function vulnerableBonus(stacks) {
  return Math.max(0, stacks);
}
