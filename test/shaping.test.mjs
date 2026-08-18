/**
 * Spell shaping tests.
 *
 * Maya's and Vera's pregen sheets print their spells fully costed, including
 * the shaping ladders available to each — so those stat blocks are the fixtures
 * here, the same way the pregens serve the derived stats.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeCast, rangeAtStep, durationAtStep, areaPenalty, validCombinations } from "../module/rules/shaping.mjs";

/** Rend: 2 Vigor, range SEN (shapeable), duration instantaneous (fixed), single target. */
const REND = {
  baseCost: 2,
  basicShape: {
    range: { step: 3, shapeable: true },
    duration: { step: 1, shapeable: false },
    area: { step: 1, shapeable: true }
  }
};

/** Afflict: 2 Vigor, Touch, 1 round, single target — everything shapeable. */
const AFFLICT = {
  baseCost: 2,
  basicShape: {
    range: { step: 2, shapeable: true },
    duration: { step: 1, shapeable: true },
    area: { step: 1, shapeable: true }
  }
};

describe("the basic shape costs the base cost", () => {
  test("an unshaped Rend is 2 Vigor with no penalty", () => {
    const cast = computeCast({ art: REND });

    assert.equal(cast.vigorCost, 2);
    assert.equal(cast.penalty, 0);
    assert.equal(cast.shaped, false);
  });

  test("grazing an unshaped spell costs 1 Strain", () => {
    assert.equal(computeCast({ art: REND }).grazeStrain, 1);
  });

  test("grazing a shaped spell costs 2 Strain", () => {
    // Reaching beyond the basic shape makes failure hurt more.
    const cast = computeCast({ art: REND, shape: { area: 2 } });
    assert.equal(cast.shaped, true);
    assert.equal(cast.grazeStrain, 2);
  });
});

describe("climbing the ladders", () => {
  test("each range step is +1 Vigor", () => {
    // Maya's sheet: Touch -> 10 -> 20 -> 40, +1 Vigor per step.
    assert.equal(computeCast({ art: AFFLICT, shape: { range: 3 } }).vigorCost, 3);
    assert.equal(computeCast({ art: AFFLICT, shape: { range: 5 } }).vigorCost, 5);
  });

  test("each duration step is +1 Vigor", () => {
    assert.equal(computeCast({ art: AFFLICT, shape: { duration: 3 } }).vigorCost, 4);
  });

  test("area costs Vigor and penalizes the roll", () => {
    // 3x3 is +1 Vigor and -1d; 5x5 is +2 and -2d; 7x7 is +3 and -3d.
    const area1 = computeCast({ art: REND, shape: { area: 2 } });
    assert.equal(area1.vigorCost, 3);
    assert.equal(area1.penalty, -1);

    const area3 = computeCast({ art: REND, shape: { area: 4 } });
    assert.equal(area3.vigorCost, 5);
    assert.equal(area3.penalty, -3);
  });

  test("a fixed dimension cannot be climbed", () => {
    // Rend's duration is instantaneous, and no amount of Vigor changes that.
    const cast = computeCast({ art: REND, shape: { duration: 4 } });

    assert.equal(cast.steps.duration, 1);
    assert.equal(cast.vigorCost, 2, "the attempt costs nothing because it does nothing");
  });

  test("shaping stacks across dimensions", () => {
    const cast = computeCast({ art: AFFLICT, shape: { range: 3, duration: 2, area: 2 } });

    assert.equal(cast.vigorCost, 5, "2 base + 1 range + 1 duration + 1 area");
    assert.equal(cast.penalty, -1, "from the area alone");
  });
});

describe("special area shapes", () => {
  test("Cone N costs N Vigor and -1d regardless of size", () => {
    const cast = computeCast({ art: REND, shape: { special: "cone", specialSize: 5 } });

    assert.equal(cast.vigorCost, 7, "2 base + 5 for Cone 5");
    assert.equal(cast.penalty, -1, "a flat -1d, not scaled by size");
  });

  test("Salvo N costs N Vigor and no penalty", () => {
    const cast = computeCast({ art: REND, shape: { special: "salvo", specialSize: 2 } });

    assert.equal(cast.vigorCost, 4);
    assert.equal(cast.penalty, 0, "Salvo is the one special shape with no penalty");
  });

  test("Line is a flat +2 Vigor", () => {
    assert.equal(computeCast({ art: REND, shape: { special: "line" } }).vigorCost, 4);
  });

  test("a special shape replaces area shaping rather than stacking with it", () => {
    const cast = computeCast({ art: REND, shape: { area: 4, special: "cone", specialSize: 3 } });

    assert.equal(cast.vigorCost, 5, "2 base + 3 for Cone 3, with no area cost");
    assert.equal(cast.penalty, -1, "the cone's penalty, not the 7x7's -3d");
  });
});

describe("the spell focus penalty", () => {
  test("casting without a focus costs a die", () => {
    assert.equal(computeCast({ art: REND, hasFocus: false }).penalty, -1);
  });

  test("Inner Focus removes the penalty", () => {
    // The Elf mastery: your own soul serves as a focus.
    assert.equal(computeCast({ art: REND, hasFocus: false, innerFocus: true }).penalty, 0);
  });

  test("the focus penalty stacks with an area penalty", () => {
    const cast = computeCast({ art: REND, shape: { area: 3 }, hasFocus: false });
    assert.equal(cast.penalty, -3, "-2d from the 5x5 and -1d for no focus");
  });
});

describe("range and duration readouts", () => {
  test("the ladder is SEN-relative from step 3", () => {
    // Vera's SEN is 15, so her Lux Rend reaches 15 at the basic shape.
    assert.equal(rangeAtStep(3, 15).squares, 15);
    assert.equal(rangeAtStep(4, 15).squares, 30);
    assert.equal(rangeAtStep(5, 15).squares, 60);
  });

  test("Self and Touch sit below the SEN rungs", () => {
    assert.equal(rangeAtStep(1, 15).squares, 0, "Self");
    assert.equal(rangeAtStep(2, 15).squares, 1, "Touch");
  });

  test("past the printed ladder each step doubles", () => {
    assert.equal(rangeAtStep(6, 15).squares, 120);
  });

  test("duration is one round per step", () => {
    assert.equal(durationAtStep(1), 1);
    assert.equal(durationAtStep(3), 3);
  });

  test("area penalties match the shaping table", () => {
    assert.equal(areaPenalty(1), 0);
    assert.equal(areaPenalty(2), -1);
    assert.equal(areaPenalty(3), -2);
    assert.equal(areaPenalty(4), -3);
  });
});

describe("valid Art and Resonance pairings", () => {
  const resonances = [
    { name: "Ignis", system: { arts: [{ art: "Rend" }, { art: "Mend" }] } },
    { name: "Tempus", system: { arts: [{ art: "Rend" }] } }
  ];

  test("only combinations the Resonance lists are offered", () => {
    const combos = validCombinations(resonances, [{ name: "Rend" }, { name: "Mend" }]);

    assert.deepEqual(combos, [
      { resonance: "Ignis", art: "Rend" },
      { resonance: "Ignis", art: "Mend" },
      { resonance: "Tempus", art: "Rend" }
    ]);
  });

  test("Tempus cannot Mend, so the pairing never appears", () => {
    // The catalog marks Tempus/Mend as Not Supported: refused by fiction, not
    // priced out of reach.
    const combos = validCombinations(resonances, [{ name: "Mend" }]);
    assert.deepEqual(combos, [{ resonance: "Ignis", art: "Mend" }]);
  });

  test("an Art the caster has not learned is not offered", () => {
    const combos = validCombinations(resonances, [{ name: "Rend" }]);
    assert.equal(combos.every((c) => c.art === "Rend"), true);
  });
});
