/**
 * Bonus gathering and slot counting.
 *
 * Both of these shipped broken in v0.3.0 and both failed quietly — a character
 * whose Max Vitality climbed a little on every re-render, and mastery boards
 * that read 0 used no matter what was slotted. Neither throws, so only a test
 * that asserts the numbers catches them.
 *
 * Run with: npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  gatherBonuses,
  countSlotUsage,
  deriveCharacter,
  deriveVigorRefresh,
  BONUS_KEYS
} from "../module/data/derive.mjs";
import { MANTLE } from "../module/config.mjs";

/** A Human R3 / Warrior R2 spread, as the archetype catalog grants it. */
const ARCHETYPES = [
  {
    rank: 3,
    features: [
      { rank: 1, bonuses: { vitality: 1, strain: 1, masteryWildcard: 1 } },
      { rank: 2, bonuses: { vitality: 1, strain: 1 } },
      { rank: 3, bonuses: { vitality: 1, strain: 1 } }
    ]
  },
  {
    rank: 2,
    features: [
      { rank: 1, bonuses: { vitality: 1, guard: 1 } },
      { rank: 2, bonuses: { vitality: 1, guard: 1 } },
      { rank: 3, bonuses: { vitality: 1, guard: 1 } }
    ]
  }
];

describe("gatherBonuses", () => {
  test("counts only ranks the character has actually reached", () => {
    const totals = gatherBonuses({ archetypes: ARCHETYPES });

    // Three Human ranks and two Warrior ranks: 3 + 2 Vitality, not 3 + 3.
    assert.equal(totals.vitality, 5);
    assert.equal(totals.strain, 3);
    assert.equal(totals.guard, 2);
    assert.equal(totals.masteryWildcard, 1);
  });

  test("adds equipped armor to Max Guard", () => {
    const totals = gatherBonuses({ armor: [{ guard: 3 }] });
    assert.equal(totals.guard, 3);

    // Armor and archetype Guard stack rather than one replacing the other.
    const both = gatherBonuses({ archetypes: ARCHETYPES, armor: [{ guard: 3 }] });
    assert.equal(both.guard, 5);
  });

  test("adds the flat bonuses equipped masteries grant", () => {
    // Vigorous is +1 Vigor refresh and Iron Will +2 Max Strain, and both now
    // reach the derivation as data rather than as rules text a player applies.
    const totals = gatherBonuses({ masteries: [{ vigorRefresh: 1 }, { strain: 2 }] });
    assert.equal(totals.vigorRefresh, 1);
    assert.equal(totals.strain, 2);
  });

  test("adds the flat riders a condition carries", () => {
    const totals = gatherBonuses({ conditions: [MANTLE.conditionBonuses.frenzy] });
    assert.equal(totals.spd, 1);
  });

  test("Frenzy no longer pays part of its own Vigor", () => {
    // Through v0.21 it granted +1 Vigor refresh as well as +1 SPD. v0.31 left
    // only the SPD, so the rage stopped partly funding itself.
    //
    // The cast is deliberate: the typechecker already proves the property is
    // gone from the table, and reading it without one is an error. Asserting it
    // at runtime too pins the *behaviour* — that nothing downstream resurrects
    // a refresh bonus from somewhere else.
    const frenzy = /** @type {Record<string, number|undefined>} */ (MANTLE.conditionBonuses.frenzy);
    assert.equal(frenzy.vigorRefresh, undefined);
    assert.equal(gatherBonuses({ conditions: [MANTLE.conditionBonuses.frenzy] }).vigorRefresh, 0);
  });

  test("every source stacks rather than one winning", () => {
    // Every source is summed rather than the largest winning, which is what
    // lets a mastery, an archetype feature and a condition all contribute to
    // the same stat at once.
    const totals = gatherBonuses({
      masteries: [{ vigorRefresh: 1 }],
      conditions: [{ vigorRefresh: 1 }]
    });
    assert.equal(totals.vigorRefresh, 2);
  });

  test("carries what Active Effects have already written", () => {
    const totals = gatherBonuses({ effects: { vitality: 4, sen: 2 } });
    assert.equal(totals.vitality, 4);
    assert.equal(totals.sen, 2);
  });

  test("fills in every accumulator, so no caller has to guard for undefined", () => {
    const totals = gatherBonuses({});
    for (const key of BONUS_KEYS) {
      assert.equal(/** @type {Record<string, number>} */ (totals)[key], 0, key);
    }
  });

  test("never mutates what it was handed", () => {
    const effects = { vitality: 1 };
    const archetypes = structuredClone(ARCHETYPES);

    gatherBonuses({ effects, archetypes, armor: [{ guard: 2 }] });

    assert.deepEqual(effects, { vitality: 1 });
    assert.deepEqual(archetypes, ARCHETYPES);
  });

  /**
   * The regression that made Max Vitality creep upward. The old code summed
   * archetype ranks *into* the stored accumulator, so any derivation that ran
   * without a preceding reset added them a second time — and after taking a
   * Wound, which forces a re-render, a player watched their maximum move.
   */
  test("is idempotent: repeating it does not compound", () => {
    const attributes = { pow: 3, agi: 3, rea: 2, ins: 2, pre: 2, luck: 2 };
    const effects = { vitality: 0 };

    const derive = () =>
      deriveCharacter({
        attributes,
        characterRank: 5,
        bonuses: gatherBonuses({ effects, archetypes: ARCHETYPES, armor: [{ guard: 3 }] })
      });

    const first = derive();
    const tenth = Array.from({ length: 10 }, derive)[9];

    assert.equal(first.maxVitality, tenth.maxVitality);
    assert.equal(first.maxGuard, tenth.maxGuard);
    assert.equal(first.maxStrain, tenth.maxStrain);
  });
});

/* -------------------------------------------- */

describe("countSlotUsage", () => {
  /**
   * A mastery as the compendium stores it: no explicit board chosen.
   *
   * @param {string} masteryType
   * @param {object} [extra]
   */
  const mastery = (masteryType, extra = {}) => ({
    type: "mastery",
    equipped: true,
    masteryType,
    slotBoard: "",
    slotCost: 1,
    ...extra
  });

  test("bills an unassigned mastery to its own board", () => {
    // slotBoard defaults to the empty string rather than null, which is what
    // defeated the old `??` fallback and left every board reading 0 used.
    const used = countSlotUsage([mastery("body"), mastery("body"), mastery("mind")]);

    assert.equal(used.mastery.body, 2);
    assert.equal(used.mastery.mind, 1);
    assert.equal(used.mastery.soul, 0);
    assert.equal(used.mastery.wildcard, 0);
  });

  test("bills a mastery slotted into wildcard against wildcard", () => {
    const used = countSlotUsage([mastery("body", { slotBoard: "wildcard" })]);

    assert.equal(used.mastery.wildcard, 1);
    assert.equal(used.mastery.body, 0);
  });

  test("charges a multi-slot mastery its full cost, all on one board", () => {
    const used = countSlotUsage([mastery("soul", { slotCost: 2 })]);
    assert.equal(used.mastery.soul, 2);
  });

  test("ignores masteries that are not equipped", () => {
    const used = countSlotUsage([mastery("body", { equipped: false })]);
    assert.equal(used.mastery.body, 0);
  });

  test("charges gear by its slot cost, and intrinsic weapons nothing", () => {
    const used = countSlotUsage([
      { type: "weapon", equipped: true, gearSlots: 2 },  // superheavy
      { type: "weapon", equipped: true, gearSlots: 1 },
      { type: "weapon", equipped: true, gearSlots: 0 },  // Unarmed Attack
      { type: "armor", equipped: true, gearSlots: 1 },
      { type: "focus", equipped: true, gearSlots: 1 },
      { type: "wondrous", equipped: true }
    ]);

    assert.equal(used.gear, 5);
    assert.equal(used.wondrous, 1);
  });
});

/* -------------------------------------------- */

describe("Vigor refresh", () => {
  /** @param {number} body @param {object} [bonuses] */
  const refresh = (body, bonuses = {}) =>
    deriveVigorRefresh({ body, mind: 0, soul: 0 }, bonuses);

  test("is a flat 3 plus half BODY, rounded down", () => {
    assert.equal(refresh(0), 3);
    assert.equal(refresh(1), 3);
    assert.equal(refresh(2), 4);
    assert.equal(refresh(3), 4);
    assert.equal(refresh(4), 5);
    assert.equal(refresh(6), 6);
  });

  test("BODY has no floor of its own — the flat 3 is the floor", () => {
    // The revision this replaced gave BODY a minimum of 1, which meant a BODY 0
    // caster and a BODY 1 fighter refreshed the same. Now they still do, but at
    // 3 rather than 1, and BODY only starts paying at 2.
    assert.equal(refresh(0), MANTLE.baseline.vigorRefresh);
    assert.equal(refresh(0), refresh(1));
  });

  test("bonuses land on top of the formula, not inside it", () => {
    assert.equal(refresh(1, { vigorRefresh: 1 }), 4);
    assert.equal(refresh(0, { vigorRefresh: 2 }), 5);
  });

  test("Kira refreshes 4 whether calm or Frenzied", () => {
    // BODY 2 is 3 + 1 = 4. Frenzy used to add one on top; v0.31 took that away,
    // so the rage now costs Vigor and Strain without returning any.
    const kira = { body: 2, mind: 1, soul: 1 };
    const calm = gatherBonuses({});
    const frenzied = gatherBonuses({ conditions: [MANTLE.conditionBonuses.frenzy] });

    assert.equal(deriveVigorRefresh(kira, calm), 4);
    assert.equal(deriveVigorRefresh(kira, frenzied), 4);
  });
});
