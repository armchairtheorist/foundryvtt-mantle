/**
 * Spell shaping: what a cast costs, and what it does to the roll.
 *
 * A spell is one Art plus one Resonance. The Art sets a basic shape — a
 * starting step on each of the range, duration, and area ladders — and the
 * caster may pay to climb any ladder the Art marks shapeable. Every step is
 * +1 Vigor. Area additionally penalizes the roll, which is the whole tension of
 * the system: a bigger spell is a worse spell to land.
 *
 * Pure logic — no Foundry dependency, so it is unit-tested directly.
 */

import { MANTLE } from "../config.mjs";

/**
 * @typedef {object} ShapeChoice
 * @property {number} [range] - Chosen step on the range ladder
 * @property {number} [duration]
 * @property {number} [area]
 * @property {"salvo"|"cone"|"wall"|"line"|null} [special] - A special area shape instead of area
 * @property {number} [specialSize] - The N in Salvo N, Cone N, Wall N
 */

/**
 * The range a step reaches, in squares.
 *
 * Steps 1 and 2 are Self and Touch. From step 3 the ladder is SEN-relative, and
 * past the printed rungs each further step doubles the one before.
 *
 * @param {number} step
 * @param {number} sen
 * @returns {{label: string, squares: number}}
 */
export function rangeAtStep(step, sen) {
  const steps = MANTLE.shaping.range.steps;

  if (step <= 1) return { label: steps[0].label, squares: 0 };
  if (step === 2) return { label: steps[1].label, squares: 1 };

  const rung = steps[step - 1];
  if (rung) return { label: rung.label, squares: sen * (rung.senMultiplier ?? 1) };

  // Past the printed ladder, each step doubles the previous range.
  const beyond = step - steps.length;
  const last = steps[steps.length - 1];
  return {
    label: `${sen * (last.senMultiplier ?? 1) * 2 ** beyond}`,
    squares: sen * (last.senMultiplier ?? 1) * 2 ** beyond
  };
}

/**
 * The duration a step lasts, in rounds.
 *
 * @param {number} step
 * @returns {number}
 */
export function durationAtStep(step) {
  return Math.max(1, step);
}

/**
 * The roll penalty a given area step imposes.
 *
 * @param {number} step
 * @returns {number}
 */
export function areaPenalty(step) {
  return MANTLE.shaping.area.steps[step - 1]?.penalty ?? 0;
}

/**
 * Work out the total Vigor cost and roll penalty for a cast.
 *
 * @typedef {object} ArtShape
 * @property {number} step
 * @property {boolean} [shapeable]
 *
 * @typedef {object} ArtData
 * @property {number} [baseCost]
 * @property {{range?: ArtShape, duration?: ArtShape, area?: ArtShape}} [basicShape]
 *
 * @param {object} options
 * @param {ArtData} options.art - The Art's system data
 * @param {ShapeChoice} [options.shape] - Chosen steps; defaults to the basic shape
 * @param {boolean} [options.hasFocus] - Whether a spell focus is equipped
 * @param {boolean} [options.innerFocus] - The Inner Focus mastery removes the no-focus penalty
 * @returns {{
 *   vigorCost: number,
 *   penalty: number,
 *   shaped: boolean,
 *   grazeStrain: number,
 *   steps: {range: number, duration: number, area: number},
 *   breakdown: {label: string, value: number}[]
 * }}
 */
export function computeCast({ art, shape = {}, hasFocus = true, innerFocus = false }) {
  const basic = art.basicShape ?? {};
  const base = {
    range: basic.range?.step ?? 1,
    duration: basic.duration?.step ?? 1,
    area: basic.area?.step ?? 1
  };

  // A dimension the Art marks fixed cannot be climbed at all — Rend's duration
  // is always instantaneous, however much Vigor you have.
  const chosen = {
    range: basic.range?.shapeable === false ? base.range : Math.max(base.range, shape.range ?? base.range),
    duration:
      basic.duration?.shapeable === false ? base.duration : Math.max(base.duration, shape.duration ?? base.duration),
    area: basic.area?.shapeable === false ? base.area : Math.max(base.area, shape.area ?? base.area)
  };

  const breakdown = [{ label: "MANTLE.Cast.baseCost", value: art.baseCost ?? 2 }];
  let vigorCost = art.baseCost ?? 2;
  let penalty = 0;

  const rangeSteps = chosen.range - base.range;
  if (rangeSteps > 0) {
    vigorCost += rangeSteps;
    breakdown.push({ label: "MANTLE.Shaping.range", value: rangeSteps });
  }

  const durationSteps = chosen.duration - base.duration;
  if (durationSteps > 0) {
    vigorCost += durationSteps;
    breakdown.push({ label: "MANTLE.Shaping.duration", value: durationSteps });
  }

  // A special shape replaces area shaping rather than stacking with it.
  const special = shape.special
    ? /** @type {{label: string, penalty: number, vigorCost?: number}} */ (MANTLE.specialShapes[shape.special])
    : null;

  if (special) {
    const size = Math.max(1, shape.specialSize ?? 1);
    const cost = special.vigorCost ?? size;
    vigorCost += cost;
    penalty += special.penalty;
    breakdown.push({ label: special.label, value: cost });
  } else {
    const areaSteps = chosen.area - base.area;
    if (areaSteps > 0) {
      vigorCost += areaSteps;
      breakdown.push({ label: "MANTLE.Shaping.area", value: areaSteps });
    }
    penalty += areaPenalty(chosen.area);
  }

  // Casting without a focus costs a die, unless Inner Focus covers it.
  if (!hasFocus && !innerFocus) penalty += MANTLE.noFocusPenalty;

  const shaped =
    chosen.range > base.range ||
    chosen.duration > base.duration ||
    chosen.area > base.area ||
    Boolean(special);

  return {
    vigorCost,
    penalty,
    shaped,
    // Grazing costs the caster more when they reached beyond the basic shape.
    grazeStrain: shaped ? MANTLE.grazeStrain.shaped : MANTLE.grazeStrain.basic,
    steps: chosen,
    breakdown
  };
}

/**
 * Which Arts a set of known Resonances can actually cast.
 *
 * An Art a Resonance does not list is not merely expensive — the combination is
 * refused by fiction — so the Cast dialog offers only real pairings.
 *
 * @param {Array<{name: string, system: {arts: {art: string}[]}}>} resonances
 * @param {Array<{name: string}>} arts
 * @returns {{resonance: string, art: string}[]}
 */
export function validCombinations(resonances, arts) {
  const combinations = [];

  for (const resonance of resonances) {
    for (const entry of resonance.system.arts ?? []) {
      if (arts.some((art) => art.name === entry.art)) {
        combinations.push({ resonance: resonance.name, art: entry.art });
      }
    }
  }

  return combinations;
}
