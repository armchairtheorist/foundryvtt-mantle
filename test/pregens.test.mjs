/**
 * The four pre-generated characters, used as the acceptance test for the
 * derived stat pipeline.
 *
 * Every expected number below is transcribed from the Pre-Generated Characters
 * catalog (v0.21), which prints each build fully computed. The bonuses are the
 * ones their archetypes, masteries, and equipment actually grant — so if a
 * formula in derive.mjs is wrong, or a bonus is misattributed, one of these
 * fails with the exact stat named.
 *
 * Run with: npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { deriveCharacter, isInCrisis, isStressed, checkEquilibrium } from "../module/data/derive.mjs";

/**
 * Assert every key of `expected` against the derived result, naming the stat in
 * the failure message so a red test says "maxVitality" rather than "deep equal".
 *
 * @param {Record<string, unknown>} actual
 * @param {Record<string, unknown>} expected
 * @param {string} who
 */
function expectStats(actual, expected, who) {
  for (const [key, want] of Object.entries(expected)) {
    assert.deepEqual(actual[key], want, `${who}: ${key}`);
  }
}

describe("Mira — Half-Elf R1 / Warrior R2", () => {
  // Half-Elf R1: +1 Max Vitality, +1 Max Strain
  // Warrior R1:  +1 Max Vitality, +1 Max Guard
  // Warrior R2:  +1 Max Vitality, +1 Max Guard
  // Chain Shirt: +2 Max Guard
  // Vigorous:    +1 Vigor refresh
  const mira = deriveCharacter({
    attributes: { pow: 0, agi: 3, rea: 0, ins: 1, pre: 0, luck: 0 },
    characterRank: 3,
    ancestry: { spd: 5, sen: 10, size: "1M" },
    bonuses: { vitality: 3, strain: 1, guard: 4, vigorRefresh: 1 }
  });

  test("cores", () => {
    expectStats(mira.cores, { body: 3, mind: 1, soul: 0 }, "Mira");
  });

  test("derived stats match the printed stat block", () => {
    expectStats(
      mira,
      { maxVitality: 21, maxStrain: 5, resolve: 6, maxGuard: 4, spd: 5, sen: 10, languages: 1 },
      "Mira"
    );
    expectStats(mira.vigor, { max: 7, refresh: 4 }, "Mira vigor");
  });

  test("slots", () => {
    expectStats(mira.slots, { wound: 3, burden: 3, gear: 3, wondrous: 0, consumable: 2 }, "Mira slots");
    expectStats(mira.slots.mastery, { body: 3, mind: 1, soul: 0, wildcard: 1 }, "Mira mastery slots");
  });
});

describe("Kira — Dwarf R1 / Barbarian R2", () => {
  // Dwarf R1:     +2 Max Vitality
  // Barbarian R1: +2 Max Vitality
  // Barbarian R2: +2 Max Vitality
  // Plate Armor:  +3 Max Guard
  // Vigorous:     +1 Vigor refresh
  const kira = deriveCharacter({
    attributes: { pow: 2, agi: 0, rea: 0, ins: 1, pre: 0, luck: 1 },
    characterRank: 3,
    ancestry: { spd: 4, sen: 12, size: "1M" },
    bonuses: { vitality: 6, guard: 3, vigorRefresh: 1 }
  });

  test("cores", () => {
    expectStats(kira.cores, { body: 2, mind: 1, soul: 1 }, "Kira");
  });

  test("derived stats match the printed stat block", () => {
    expectStats(
      kira,
      { maxVitality: 21, maxStrain: 5, resolve: 7, maxGuard: 3, spd: 4, sen: 12, languages: 1 },
      "Kira"
    );
    expectStats(kira.vigor, { max: 7, refresh: 3 }, "Kira vigor");
  });

  test("slots — SOUL 1 grants one wondrous item slot", () => {
    expectStats(kira.slots, { wondrous: 1, consumable: 2 }, "Kira slots");
    expectStats(kira.slots.mastery, { body: 2, mind: 1, soul: 1, wildcard: 1 }, "Kira mastery slots");
  });
});

describe("Maya — Human R1 / Scholar R2", () => {
  // Human R1:   +1 Max Vitality, +1 Max Strain, +1 wildcard slot (Versatile)
  // Scholar R1: +1 Max Strain
  // Scholar R2: +1 Max Strain
  // Armored Cloak: +2 Max Guard
  // Vigorous:      +1 Vigor refresh
  const maya = deriveCharacter({
    attributes: { pow: 0, agi: 0, rea: 3, ins: 0, pre: 0, luck: 1 },
    characterRank: 3,
    ancestry: { spd: 5, sen: 10, size: "1M" },
    bonuses: { vitality: 1, strain: 3, guard: 2, vigorRefresh: 1, masteryWildcard: 1 }
  });

  test("cores", () => {
    expectStats(maya.cores, { body: 0, mind: 3, soul: 1 }, "Maya");
  });

  test("derived stats match the printed stat block", () => {
    expectStats(
      maya,
      { maxVitality: 10, maxStrain: 10, resolve: 7, maxGuard: 2, languages: 4 },
      "Maya"
    );
  });

  test("BODY 0 still refreshes at least 1 Vigor before bonuses", () => {
    // max(BODY 0, 1) = 1, then Vigorous adds 1. Applying the floor after the
    // bonus would give 1 and quietly rob her of a Vigor every turn.
    expectStats(maya.vigor, { max: 7, refresh: 2 }, "Maya vigor");
  });

  test("Versatile grants a second wildcard mastery slot", () => {
    expectStats(maya.slots.mastery, { body: 0, mind: 3, soul: 1, wildcard: 2 }, "Maya mastery slots");
  });
});

describe("Vera — Elf R1 / Channeler R2", () => {
  // Elf R1:       +2 Max Strain
  // Channeler R1: +1 Resolve
  // Channeler R2: +1 Resolve
  // Armored Cloak: +2 Max Guard
  // Vigorous:      +1 Vigor refresh
  const vera = deriveCharacter({
    attributes: { pow: 1, agi: 0, rea: 0, ins: 3, pre: 0, luck: 0 },
    characterRank: 3,
    ancestry: { spd: 6, sen: 15, size: "1M" },
    bonuses: { strain: 2, resolve: 2, guard: 2, vigorRefresh: 1 }
  });

  test("cores", () => {
    expectStats(vera.cores, { body: 1, mind: 3, soul: 0 }, "Vera");
  });

  test("derived stats match the printed stat block", () => {
    expectStats(
      vera,
      { maxVitality: 12, maxStrain: 8, resolve: 8, maxGuard: 2, spd: 6, sen: 15, languages: 1 },
      "Vera"
    );
    expectStats(vera.vigor, { max: 7, refresh: 2 }, "Vera vigor");
  });

  test("SOUL 0 means no wondrous item slots", () => {
    expectStats(vera.slots, { wondrous: 0 }, "Vera slots");
  });
});

describe("advancement cadence", () => {
  test("wildcard slots gain one per full 5 character ranks", () => {
    /** @param {number} rank */
    const at = (rank) =>
      deriveCharacter({
        attributes: { pow: 0, agi: 0, rea: 0, ins: 0, pre: 0, luck: 0 },
        characterRank: rank
      }).slots.mastery.wildcard;

    assert.equal(at(3), 1, "CR3");
    assert.equal(at(5), 2, "CR5");
    assert.equal(at(10), 3, "CR10");
    assert.equal(at(15), 4, "CR15");
    assert.equal(at(20), 5, "CR20");
  });

  test("Vigor cap gains one per full 7 character ranks", () => {
    /** @param {number} rank */
    const at = (rank) =>
      deriveCharacter({
        attributes: { pow: 0, agi: 0, rea: 0, ins: 0, pre: 0, luck: 0 },
        characterRank: rank
      }).vigor.max;

    assert.equal(at(3), 7, "CR3");
    assert.equal(at(7), 8, "CR7");
    assert.equal(at(14), 9, "CR14");
    assert.equal(at(21), 10, "CR21");
  });

  test("tiers of play map to the right rank bands", () => {
    /** @param {number} rank */
    const tierAt = (rank) =>
      deriveCharacter({
        attributes: { pow: 0, agi: 0, rea: 0, ins: 0, pre: 0, luck: 0 },
        characterRank: rank
      }).tier;

    assert.equal(tierAt(3).key, "novice");
    assert.equal(tierAt(8).key, "novice");
    assert.equal(tierAt(9).key, "seasoned");
    assert.equal(tierAt(15).key, "veteran");
    assert.equal(tierAt(21).key, "paragon");
    assert.equal(tierAt(99).key, "paragon");

    assert.equal(tierAt(3).limitBreakSlots, 1);
    assert.equal(tierAt(21).limitBreakSlots, 4);
  });
});

describe("equilibrium rule", () => {
  test("a spread of 4 is legal, 5 is not", () => {
    assert.equal(checkEquilibrium({ body: 6, mind: 2, soul: 3 }).legal, true);
    assert.equal(checkEquilibrium({ body: 7, mind: 2, soul: 3 }).legal, false);
    assert.equal(checkEquilibrium({ body: 7, mind: 3, soul: 3 }).legal, true);
  });
});

describe("states", () => {
  test("Crisis triggers on 3+ combined Wounds and Burdens", () => {
    assert.equal(isInCrisis({ wounds: 1, burdens: 1 }), false);
    assert.equal(isInCrisis({ wounds: 2, burdens: 1 }), true);
    assert.equal(isInCrisis({ wounds: 3, burdens: 0 }), true);
  });

  test("Crisis triggers on Faltering or Unraveling regardless of count", () => {
    assert.equal(isInCrisis({ wounds: 0, burdens: 0, faltering: true }), true);
    assert.equal(isInCrisis({ wounds: 0, burdens: 0, unraveling: true }), true);
  });

  test("Stressed is Strain at half Max Strain, rounded down", () => {
    // The book's example: Max Strain 7 means Stressed at 3 or more.
    assert.equal(isStressed(2, 7), false);
    assert.equal(isStressed(3, 7), true);
  });
});
