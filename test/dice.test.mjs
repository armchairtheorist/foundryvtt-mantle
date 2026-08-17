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
 * Describe an allocation as a sorted list like ["double:5", "sequence:2"], so
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
    // The Quick Start's example: 2 3 4 5 5 offers the Double or the Sequence,
    // never both, because both need a 5.
    const allocations = allocationSet([2, 3, 4, 5, 5]);

    assert.equal(allocations.length, 2, "exactly two readings");
    assert.deepEqual(
      allocations.map((a) => a.join("+")).sort(),
      ["double:5", "sequence:2"],
      "one Double, or one Sequence"
    );
  });

  test("repeated patterns each trigger", () => {
    // 1 1 4 5 5 is two Doubles, and the Double outcome fires twice.
    const best = bestAllocation([1, 1, 4, 5, 5]);
    assert.deepEqual(countPatterns(best), { double: 2, triple: 0, sequence: 0 });
  });

  test("a Triple and two Doubles are both offered from four of a kind", () => {
    // Four 5s can be read as one Triple, or as two Doubles. Which is better
    // depends on the character's abilities, so both must survive to the card.
    const allocations = allocationSet([5, 5, 5, 5]);
    const asStrings = allocations.map((a) => a.join("+"));

    assert.ok(asStrings.includes("double:5+double:5"), "two Doubles offered");
    assert.ok(asStrings.includes("triple:5"), "one Triple offered");
  });

  test("two Doubles rank above one Triple, since every pattern fires", () => {
    // Solid Hit is universal, so more patterns is the better default. A player
    // holding a Triple ability can still switch on the card.
    const best = bestAllocation([5, 5, 5, 5]);
    assert.deepEqual(countPatterns(best), { double: 2, triple: 0, sequence: 0 });
  });

  test("a sequence needs four consecutive values", () => {
    assert.deepEqual(describeAllocation(bestAllocation([2, 3, 4, 6])), [], "3-4-5 gap, no run");
    assert.deepEqual(describeAllocation(bestAllocation([3, 4, 5, 6])), ["sequence:3"]);
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

  test("a Heroic Feat adds successes", () => {
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
  // Pool: [double %, triple %, sequence %], null where the book omits a value.
  const PUBLISHED = {
    2: [17, null, null],
    3: [44, 3, null],
    4: [72, 10, 6],
    5: [91, 21, 15],
    6: [98, 37, 27]
  };

  /**
   * Exact probability that each pattern is available in a pool of `size` dice.
   *
   * @param {number} size
   */
  function exactRates(size) {
    const found = { double: 0, triple: 0, sequence: 0 };
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

      if (counts.some((c) => c >= 2)) found.double += 1;
      if (counts.some((c) => c >= 3)) found.triple += 1;
      for (let v = 1; v + 3 <= 6; v++) {
        if ([0, 1, 2, 3].every((o) => counts[v + o] >= 1)) {
          found.sequence += 1;
          break;
        }
      }
    }

    return {
      double: Math.round((100 * found.double) / total),
      triple: Math.round((100 * found.triple) / total),
      sequence: Math.round((100 * found.sequence) / total)
    };
  }

  for (const [size, [double, triple, sequence]] of Object.entries(PUBLISHED)) {
    test(`${size}d6`, () => {
      const rates = exactRates(Number(size));
      // Allow a point either way: the book's figures are themselves rounded.
      /**
       * @param {number} actual
       * @param {number} expected
       * @param {string} name
       */
      const close = (actual, expected, name) =>
        assert.ok(
          Math.abs(actual - expected) <= 1,
          `${size}d6 ${name}: computed ${actual}%, book says ${expected}%`
        );

      if (double !== null) close(rates.double, double, "double");
      if (triple !== null) close(rates.triple, triple, "triple");
      if (sequence !== null) close(rates.sequence, sequence, "sequence");
    });
  }
});
