// @ts-nocheck — subclassing Roll with custom options overwhelms fvtt-types'
// generics in plain JS. The resolution logic this delegates to lives in
// pool.mjs, patterns.mjs, and ladder.mjs, all of which are checked and tested.

/**
 * The Mantle roll.
 *
 * A thin Foundry wrapper: it rolls the dice and hands the faces to the pure
 * resolution modules, then carries the result plus everything the chat card
 * needs to render and re-render itself.
 *
 * The card is re-rendered whenever the player adjusts net successes or picks a
 * different pattern allocation, so all of that state lives in the message flags
 * rather than in the DOM.
 */

import { countSuccesses, effectiveSuccesses, resolveBand, patternsApply } from "./pool.mjs";
import { findAllocations, countPatterns } from "./patterns.mjs";
import { resolveLadderBand, bandText } from "./ladder.mjs";

export default class MantleRoll extends Roll {
  /**
   * Build a roll from a pool.
   *
   * @param {import("./pool.mjs").Pool} pool
   * @param {object} [context] - Carried through to the chat card
   */
  static fromPool(pool, context = {}) {
    return new this(pool.formula, {}, { mantle: { pool, ...context } });
  }

  /** The context handed in at construction. */
  get mantle() {
    return this.options?.mantle ?? {};
  }

  /**
   * Every die, including ones a desperate pool discarded — the card shows the
   * dropped die greyed out, so a player can see the roll actually happened.
   *
   * @returns {{result: number, active: boolean, success: boolean}[]}
   */
  get diceResults() {
    return this.dice.flatMap((die) =>
      die.results.map((result) => ({
        result: result.result,
        active: result.active !== false,
        success: result.active !== false && result.result >= 5
      }))
    );
  }

  /** Only the dice that count — a desperate pool keeps just the lowest. */
  get faces() {
    return this.diceResults.filter((die) => die.active).map((die) => die.result);
  }

  /**
   * Resolve the roll into everything the chat card needs.
   *
   * @param {object} [options]
   * @param {number} [options.adjustment] - Net success adjustment, from opposition or Valor
   * @param {number} [options.allocationIndex] - Which pattern reading the player picked
   */
  resolve({ adjustment = 0, allocationIndex = 0 } = {}) {
    const context = this.mantle;
    const pool = context.pool ?? {};
    const faces = this.faces;

    const successes = countSuccesses(faces);
    const effective = effectiveSuccesses(successes, adjustment);
    const { band, overflow, isGraze } = resolveBand(effective);

    // A graze triggers nothing, and a desperate pool never reads patterns.
    const readsPatterns = patternsApply({ effective, desperate: pool.desperate ?? false });
    const allocations = readsPatterns ? findAllocations(faces) : [];
    const index = Math.min(allocationIndex, Math.max(0, allocations.length - 1));
    const allocation = allocations[index] ?? { patterns: [], unused: faces };
    const patterns = countPatterns(allocation);

    const ladder = context.ladder ?? null;
    const result = ladder
      ? resolveLadderBand({
          text: bandText(ladder, band),
          doubles: patterns.double,
          kind: context.ladderKind ?? "vitality",
          bonusDamage: context.bonusDamage ?? 0,
          overflow,
          overflowText: ladder.overflow ?? ""
        })
      : null;

    return {
      successes,
      adjustment,
      effective,
      band,
      overflow,
      isGraze,
      readsPatterns,
      allocations,
      allocationIndex: index,
      allocation,
      patterns,
      result
    };
  }
}
