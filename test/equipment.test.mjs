// @ts-check

/**
 * Disabled equipment.
 *
 * Section 17 of the Quick Start (v0.31) lists five consequences, one per kind
 * of gear, plus one exception: a disabled suit of armor stops protecting but
 * keeps penalizing.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  DISABLEABLE,
  countsAsFocus,
  isUsable,
  penalizes,
  protects
} from "../module/rules/equipment.mjs";

describe("what disabling stops", () => {
  test("equipped and enabled gear is usable", () => {
    assert.equal(isUsable({ equipped: true, disabled: false }), true);
  });

  test("disabled gear is not, however firmly it is equipped", () => {
    assert.equal(isUsable({ equipped: true, disabled: true }), false);
  });

  test("stowed gear is not usable either", () => {
    assert.equal(isUsable({ equipped: false, disabled: false }), false);
  });

  test("a consumable needs no equipping, only enabling", () => {
    // Consumables are bought with a point rather than worn, so being stowed is
    // not a state they have.
    const options = { needsEquipping: false };
    assert.equal(isUsable({ disabled: false }, options), true);
    assert.equal(isUsable({ disabled: true }, options), false);
  });
});

describe("armor is the exception", () => {
  const worn = { equipped: true, disabled: false };
  const broken = { equipped: true, disabled: true };
  const stowed = { equipped: false, disabled: false };

  test("worn armor both protects and penalizes", () => {
    assert.equal(protects(worn), true);
    assert.equal(penalizes(worn), true);
  });

  test("disabled armor stops protecting", () => {
    assert.equal(protects(broken), false);
  });

  test("but keeps penalizing — you are still wearing the weight", () => {
    // The one place a caller could reasonably get it backwards, which is why
    // it is a named function rather than a condition written out at each site.
    assert.equal(penalizes(broken), true);
  });

  test("taking it off is the only way out of the penalty", () => {
    assert.equal(penalizes(stowed), false);
    assert.equal(protects(stowed), false);
  });
});

describe("spell foci", () => {
  test("a disabled focus stops counting as one", () => {
    // Which costs the caster a die: no focus is a -1d on spellcasting rolls.
    assert.equal(countsAsFocus({ equipped: true, disabled: false }), true);
    assert.equal(countsAsFocus({ equipped: true, disabled: true }), false);
  });
});

describe("what can be disabled", () => {
  test("the five kinds of gear the rules name", () => {
    assert.deepEqual(DISABLEABLE, ["weapon", "armor", "focus", "wondrous", "consumable"]);
  });

  test("nothing that is not equipment", () => {
    // Masteries, Arts, Resonances and Limit Breaks are things you know, not
    // things you carry, and the rules do not disable them.
    for (const type of ["mastery", "art", "resonance", "limitbreak", "archetype", "feature"]) {
      assert.ok(!DISABLEABLE.includes(type), type);
    }
  });
});
