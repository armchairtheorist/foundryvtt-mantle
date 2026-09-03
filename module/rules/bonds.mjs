// @ts-check

/**
 * Bonds: relationships strong enough to change what a character can do.
 *
 * A Bond is one-directional. Yours toward someone is yours alone and may not be
 * returned — and where both sides hold one at a high enough intensity, that
 * *mutual* Bond is what unlocks the shared maneuvers. Intensity is not stored;
 * it is read off accumulated Strands, so the only number a Bond carries is its
 * Strand count.
 *
 * Pure logic — no Foundry dependency, so it is unit-tested directly.
 */

import { MANTLE } from "../config.mjs";

/**
 * The intensity a Bond has reached for a given number of Strands.
 *
 * Thresholds are totals rather than costs: 1, 3, 6, 10, 15. Intensity 0 means
 * no Bond at all, which is what an emptied Bond decays to.
 *
 * @param {number} strands
 * @returns {number} 0 to 5
 */
export function bondIntensity(strands) {
  let intensity = 0;
  for (const [level, needed] of Object.entries(MANTLE.bondIntensities)) {
    if (strands >= needed) intensity = Math.max(intensity, Number(level));
  }
  return intensity;
}

/**
 * The Strands a given intensity sits on.
 *
 * The inverse of the above, and the reason it exists: a strained Bond drops an
 * intensity and its Strands are "adjusted to the minimum value of the new
 * intensity level" rather than merely decremented.
 *
 * @param {number} intensity - 0 to 5
 * @returns {number}
 */
export function strandsForIntensity(intensity) {
  if (intensity <= 0) return 0;
  return /** @type {Record<number, number>} */ (MANTLE.bondIntensities)[intensity] ?? 0;
}

/**
 * What straining a Bond leaves behind.
 *
 * Down one intensity, with Strands reset to that level's floor — so a Bond 4
 * on 12 Strands becomes a Bond 3 on 6, losing more than the 2 that separated
 * it from the next rung.
 *
 * @param {number} strands
 * @returns {{intensity: number, strands: number}}
 */
export function strainBond(strands) {
  const intensity = Math.max(0, bondIntensity(strands) - 1);
  return { intensity, strands: strandsForIntensity(intensity) };
}

/**
 * How many Bonds a character may hold, and how many of theirs count.
 *
 * Unbreakable Bonds stop counting against the cap, so a character at their
 * limit can still deepen what they have — which is the mechanical shape of
 * "the name is a dare, not a rule".
 *
 * @param {{strands: number}[]} bonds
 * @param {number} cap - Max Bonds, from SOUL + 3
 * @returns {{held: number, counted: number, cap: number, room: boolean}}
 */
export function bondCapacity(bonds, cap) {
  const counted = bonds.filter((bond) => bondIntensity(bond.strands) < 5).length;

  return { held: bonds.length, counted, cap, room: counted < cap };
}

/**
 * Whether two characters are tandem partners, and what that unlocks.
 *
 * Every shared benefit needs the Bond in *both* directions at the stated
 * intensity, so this takes two Strand counts rather than one Bond.
 *
 * @param {number} mine - Strands on my Bond toward them
 * @param {number} theirs - Strands on their Bond toward me
 * @returns {{mutual: number, tandem: boolean, comboLimitBreaks: boolean}}
 */
export function mutualBond(mine, theirs) {
  const mutual = Math.min(bondIntensity(mine), bondIntensity(theirs));

  return {
    mutual,
    tandem: mutual >= MANTLE.bondUnlocks.tandem,
    comboLimitBreaks: mutual >= MANTLE.bondUnlocks.comboLimitBreak
  };
}

/**
 * Which Bond maneuvers a character may take toward a given target.
 *
 * Invoking costs Resolve rather than Vigor, and a Defeated or Lost character
 * cannot invoke at all — though they can still be *reached* by someone else's
 * Bond, which is what makes Come Back to Me! work.
 *
 * @param {object} input
 * @param {number} input.strands - My Bond toward them
 * @param {number} [input.theirStrands] - Their Bond toward me, if any
 * @param {number} [input.resolve] - Resolve I can spend
 * @param {boolean} [input.incapacitated] - Am I Defeated or Lost
 * @returns {{id: string, available: boolean, reason: string}[]}
 */
export function bondManeuvers({ strands, theirStrands = 0, resolve = 0, incapacitated = false }) {
  const mine = bondIntensity(strands);
  const { mutual } = mutualBond(strands, theirStrands);

  // The three maneuvers carry different keys, so an untyped read infers a union
  // where `mutual` exists on only one member. Name the shared shape instead.
  /** @type {Record<string, {intensity: number, resolve?: number, mutual?: boolean}>} */
  const table = MANTLE.bondManeuvers;

  return Object.entries(table).map(([id, maneuver]) => {
    const held = maneuver.mutual ? mutual : mine;

    let reason = "";
    if (incapacitated) reason = "MANTLE.Bond.incapacitated";
    else if (held < maneuver.intensity) {
      reason = maneuver.mutual ? "MANTLE.Bond.needsMutual" : "MANTLE.Bond.needsIntensity";
    } else if (resolve < (maneuver.resolve ?? 0)) reason = "MANTLE.Bond.needsResolve";

    return { id, available: reason === "", reason };
  });
}
