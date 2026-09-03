/**
 * Dice engine tests.
 *
 * The pattern cases are the Quick Start's own worked examples, which state both
 * the rule and the expected reading — the best kind of fixture, since a failure
 * points at a specific sentence in the rules rather than at a guess.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { findAllocations, bestAllocation, countPatterns } from "../module/dice/patterns.mjs";
import {
  buildPool,
  countSuccesses,
  effectiveSuccesses,
  resolveBand,
  patternsApply,
  standardModifiers
} from "../module/dice/pool.mjs";

/**
 * Describe an allocation as a sorted list like ["double:5", "quad:2"], so
 * assertions read as the patterns a player would actually see.
 *
 * @param {{patterns: {type: string, value: number}[]}} allocation
 */
function describeAllocation(allocation) {
  return allocation.patterns.map((p) => `${p.type}:${p.value}`).sort();
}

/** @param {number[]} faces */
function allocationSet(faces) {
  return findAllocations(faces).map(describeAllocation);
}

describe("pattern allocation", () => {
  test("a die may not serve two patterns at once", () => {
    // Four 5s want the same dice three different ways: one Quad, two Doubles,
    // or one Triple with a 5 spare. Never a Quad and a Double together.
    const allocations = allocationSet([5, 5, 5, 5]);

    assert.deepEqual(
      allocations.map((a) => a.join("+")).sort(),
      ["double:5+double:5", "quad:5", "triple:5"],
      "three readings, no combination of them"
    );
  });

  test("repeated patterns each trigger", () => {
    // 1 1 4 5 5 is two Doubles, and the Double outcome fires twice.
    const best = bestAllocation([1, 1, 4, 5, 5]);
    assert.deepEqual(countPatterns(best), { double: 2, triple: 0, quad: 0 });
  });

  test("a Quad, a Triple and two Doubles are all offered from four of a kind", () => {
    // Which reading is better depends on the abilities the character holds, so
    // every one of them must survive to the card for the player to choose.
    const asStrings = allocationSet([5, 5, 5, 5]).map((a) => a.join("+"));

    assert.ok(asStrings.includes("quad:5"), "one Quad offered");
    assert.ok(asStrings.includes("double:5+double:5"), "two Doubles offered");
    assert.ok(asStrings.includes("triple:5"), "one Triple offered");
  });

  test("two Doubles rank above one Quad, since every pattern fires", () => {
    // Solid Hit is universal, so more patterns is the better default. A player
    // holding a Quad ability can still switch on the card.
    const best = bestAllocation([5, 5, 5, 5]);
    assert.deepEqual(countPatterns(best), { double: 2, triple: 0, quad: 0 });
  });

  test("a Quad needs four of the same value", () => {
    assert.deepEqual(describeAllocation(bestAllocation([6, 6, 6, 6])), [
      "double:6",
      "double:6"
    ]);
    assert.ok(allocationSet([6, 6, 6, 6]).map((a) => a.join("+")).includes("quad:6"));
    assert.equal(countPatterns(bestAllocation([6, 6, 6, 1])).quad, 0, "three of a kind is no Quad");
  });

  test("consecutive values are no longer a pattern", () => {
    // v0.21 read 3-4-5-6 as a Sequence. v0.31 has three patterns and none of
    // them is a run, so a straight is worth nothing.
    assert.deepEqual(describeAllocation(bestAllocation([3, 4, 5, 6])), []);
    assert.deepEqual(bestAllocation([3, 4, 5, 6]).unused, [3, 4, 5, 6]);
  });

  test("no patterns at all is a valid reading", () => {
    assert.deepEqual(describeAllocation(bestAllocation([1, 3, 5])), []);
    assert.deepEqual(bestAllocation([1, 3, 5]).unused, [1, 3, 5]);
  });

  test("every allocation returned is maximal", () => {
    // Leaving a pattern on the table is never right, so no allocation should
    // have a further pattern extractable from its leftovers.
    for (const allocation of findAllocations([1, 1, 2, 3, 4, 5, 5, 6])) {
      const leftovers = findAllocations(allocation.unused);
      assert.deepEqual(
        leftovers[0]?.patterns ?? [],
        [],
        `leftovers ${allocation.unused} still contain a pattern`
      );
    }
  });

  test("a large pool still resolves promptly", () => {
    const started = process.hrtime.bigint();
    const allocations = findAllocations([1, 2, 3, 4, 5, 6, 5, 5, 2, 2]);
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;

    assert.ok(allocations.length > 0);
    assert.ok(elapsedMs < 250, `took ${elapsedMs.toFixed(1)}ms`);
  });
});

describe("pool construction", () => {
  test("modifiers sum, bonuses netting against penalties", () => {
    const pool = buildPool(3, [
      { label: "trained", value: 2 },
      { label: "impaired", value: -1 }
    ]);

    assert.equal(pool.dice, 4);
    assert.equal(pool.formula, "4d6");
    assert.equal(pool.desperate, false);
  });

  test("a pool reduced to zero rolls 2d6 and keeps the lowest", () => {
    const pool = buildPool(1, [{ label: "mark", value: -3 }]);

    assert.equal(pool.desperate, true);
    assert.equal(pool.dice, 2);
    assert.equal(pool.formula, "2d6kl1", "keep lowest, not a flat failure");
    assert.equal(pool.requested, -2, "the real total is kept for the chat card");
  });

  test("exactly zero dice is already desperate", () => {
    assert.equal(buildPool(2, [{ label: "edge", value: -2 }]).desperate, true);
  });

  test("standard modifiers list only what applied", () => {
    const modifiers = standardModifiers({ trained: true, hitLocation: "mark", impaired: 2 });

    assert.deepEqual(
      modifiers.map((m) => m.value),
      [2, -3, -2],
      "trained +2d, Mark -3d, Impaired 2 -2d"
    );
  });

  test("Mass carries no targeting penalty", () => {
    assert.deepEqual(standardModifiers({ hitLocation: "mass" }), []);
  });
});

describe("successes and bands", () => {
  test("only 5s and 6s are successes", () => {
    assert.equal(countSuccesses([1, 2, 3, 4]), 0);
    assert.equal(countSuccesses([4, 5, 6]), 2);
    assert.equal(countSuccesses([5, 5, 6, 6]), 4);
  });

  test("opposition subtracts, and never below zero", () => {
    assert.equal(effectiveSuccesses(3, -1), 2);
    assert.equal(effectiveSuccesses(1, -3), 0, "an overwhelmed attack grazes, it does not miss");
  });

  test("a Momentous Feat adds successes", () => {
    assert.equal(effectiveSuccesses(1, 3), 4);
  });

  test("bands cap at 3, with the remainder as overflow", () => {
    assert.deepEqual(resolveBand(0), { band: "0", overflow: 0, isGraze: true });
    assert.deepEqual(resolveBand(2), { band: "2", overflow: 0, isGraze: false });
    assert.deepEqual(resolveBand(3), { band: "3", overflow: 0, isGraze: false });
    assert.deepEqual(resolveBand(5), { band: "3", overflow: 2, isGraze: false });
  });
});

describe("when patterns may trigger", () => {
  test("a graze triggers nothing", () => {
    assert.equal(patternsApply({ effective: 0, desperate: false }), false);
  });

  test("a desperate pool never reads patterns", () => {
    assert.equal(patternsApply({ effective: 1, desperate: true }), false);
  });

  test("one effective success is enough", () => {
    assert.equal(patternsApply({ effective: 1, desperate: false }), true);
  });
});

describe("pattern rates match the published probability table", () => {
  // The Quick Start prints the chance that each pattern appears, by pool size.
  // Reproducing it exhaustively — every one of the 6^n outcomes, not a sample —
  // proves the detector reads "pattern" the same way the rules do, and does it
  // deterministically so the test cannot flake.
  //
  // Pool: [double %, triple %, quad %], null where the book omits a value.
  // v0.31 replaced Sequences with Quads and extended the table to 8d6.
  const PUBLISHED = {
    2: [17, null, null],
    3: [44, 3, null],
    4: [72, 10, 0.5],
    5: [91, 21, 2],
    6: [98, 37, 5],
    7: [100, 54, 11],
    8: [100, 71, 18]
  };

  /**
   * Exact probability that each pattern is available in a pool of `size` dice.
   *
   * @param {number} size
   * @returns {{double: number, triple: number, quad: number}}
   */
  function exactRates(size) {
    const found = { double: 0, triple: 0, quad: 0 };
    const total = 6 ** size;
    const faces = new Array(size).fill(1);

    for (let n = 0; n < total; n++) {
      let remainder = n;
      for (let i = 0; i < size; i++) {
        faces[i] = (remainder % 6) + 1;
        remainder = Math.floor(remainder / 6);
      }

      // Availability, not allocation: the book's table asks whether the pattern
      // is present at all, before any choice between competing readings.
      const counts = new Array(7).fill(0);
      for (const face of faces) counts[face] += 1;
      const most = Math.max(...counts);

      if (most >= 2) found.double += 1;
      if (most >= 3) found.triple += 1;
      if (most >= 4) found.quad += 1;
    }

    return {
      double: (100 * found.double) / total,
      triple: (100 * found.triple) / total,
      quad: (100 * found.quad) / total
    };
  }

  for (const [size, [double, triple, quad]] of Object.entries(PUBLISHED)) {
    test(`${size}d6`, () => {
      const rates = exactRates(Number(size));

      // Compared as fractions rather than rounded integers, because the 4d6
      // Quad figure is 0.5% — rounding it to a whole number would erase it.
      /**
       * @param {number} actual
       * @param {number} expected
       * @param {string} name
       */
      const close = (actual, expected, name) =>
        assert.ok(
          Math.abs(actual - expected) <= 0.6,
          `${size}d6 ${name}: computed ${actual.toFixed(3)}%, book says ${expected}%`
        );

      if (double !== null) close(rates.double, double, "double");
      if (triple !== null) close(rates.triple, triple, "triple");
      if (quad !== null) close(rates.quad, quad, "quad");
    });
  }

  test("the detector agrees with the availability count", () => {
    // The table above is computed from face tallies, independently of the
    // allocator — which means on its own it would keep passing even if the
    // allocator stopped finding a pattern type entirely. This ties the two
    // together: whatever the tally says is available, some allocation offers.
    for (let n = 0; n < 6 ** 4; n++) {
      const faces = [];
      let remainder = n;
      for (let i = 0; i < 4; i++) {
        faces.push((remainder % 6) + 1);
        remainder = Math.floor(remainder / 6);
      }

      const counts = new Array(7).fill(0);
      for (const face of faces) counts[face] += 1;
      const most = Math.max(...counts);
      const offered = new Set(
        findAllocations(faces).flatMap((a) => a.patterns.map((p) => p.type))
      );

      assert.equal(offered.has("quad"), most >= 4, `[${faces}] quad`);
      assert.equal(offered.has("triple"), most >= 3, `[${faces}] triple`);
      assert.equal(offered.has("double"), most >= 2, `[${faces}] double`);
    }
  });
});
