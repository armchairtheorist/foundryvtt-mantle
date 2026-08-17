/**
 * Ladder resolution tests.
 *
 * Fixtures are real entries from the Equipment and Spellcasting catalogs, so
 * the parser is exercised against the shapes actually authored rather than
 * invented ones.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseLadderEntry, resolveLadderBand, SOLID_HIT_DAMAGE } from "../module/dice/ladder.mjs";

describe("parsing ladder entries", () => {
  test("a plain damage entry splits into amount and words", () => {
    // Mace, 2 successes.
    assert.deepEqual(parseLadderEntry("13 damage"), {
      amount: 13,
      remainder: "damage",
      text: "13 damage"
    });
  });

  test("riders after the number survive intact", () => {
    // Ignis Rend, 2 successes.
    const entry = parseLadderEntry("12 damage + Wracked 1 (Fire)");
    assert.equal(entry.amount, 12);
    assert.equal(entry.remainder, "damage + Wracked 1 (Fire)");
  });

  test("an entry with no leading number keeps its full text", () => {
    // Lux Mend, 2 successes.
    const entry = parseLadderEntry("Target recovers Vitality to full");
    assert.equal(entry.amount, null);
    assert.equal(entry.remainder, "Target recovers Vitality to full");
  });

  test("Strain entries parse the same way", () => {
    assert.equal(parseLadderEntry("5 Strain").amount, 5);
  });

  test("empty and missing entries are handled", () => {
    assert.equal(parseLadderEntry("").amount, null);
    assert.equal(parseLadderEntry(/** @type {string|undefined} */ (undefined)).amount, null);
  });
});

describe("Solid Hit", () => {
  test("adds 3 damage per allocated Double", () => {
    const result = resolveLadderBand({ text: "13 damage", doubles: 1 });

    assert.equal(result.base, 13);
    assert.equal(result.solidHitDamage, SOLID_HIT_DAMAGE);
    assert.equal(result.total, 16);
    assert.equal(result.applied, true);
  });

  test("two Doubles fire it twice", () => {
    // 1 1 4 5 5 allocates two Doubles, and each triggers.
    assert.equal(resolveLadderBand({ text: "9 damage", doubles: 2 }).total, 15);
  });

  test("does not apply to a Strain ladder", () => {
    // Solid Hit reads "attacks that deal damage", and the rules treat Strain as
    // a separate track from damage — Guard stops one and not the other.
    const result = resolveLadderBand({ text: "3 Strain", doubles: 2, kind: "strain" });

    assert.equal(result.total, 3, "Strain is untouched by Solid Hit");
    assert.equal(result.solidHits, 0);
    assert.equal(result.applied, false);
  });

  test("leaves a non-numeric band alone", () => {
    const result = resolveLadderBand({ text: "Target recovers Vitality to full", doubles: 2 });

    assert.equal(result.total, null);
    assert.equal(result.applied, false);
    assert.equal(result.remainder, "Target recovers Vitality to full");
  });
});

describe("other riders", () => {
  test("a Resonance's bonus damage stacks with Solid Hit", () => {
    // Ignis Rend carries +2 bonus damage.
    const result = resolveLadderBand({ text: "10 damage", doubles: 1, bonusDamage: 2 });
    assert.equal(result.total, 15, "10 base + 2 Ignis + 3 Solid Hit");
  });

  test("overflow pays per success past three", () => {
    // Rend's Vitality ladder: +6 damage per success beyond 3.
    const result = resolveLadderBand({
      text: "16 damage",
      overflow: 2,
      overflowText: "+6 damage / success"
    });

    assert.equal(result.total, 28, "16 base + 12 overflow");
  });

  test("overflow, bonus damage, and Solid Hit combine", () => {
    const result = resolveLadderBand({
      text: "16 damage",
      doubles: 1,
      bonusDamage: 2,
      overflow: 1,
      overflowText: "+6 damage / success"
    });

    assert.equal(result.total, 27, "16 + 3 Solid Hit + 2 bonus + 6 overflow");
  });

  test("no riders means no arithmetic to show", () => {
    const result = resolveLadderBand({ text: "7 damage" });

    assert.equal(result.total, 7);
    assert.equal(result.applied, false, "the card shows the value, not a sum");
  });
});
