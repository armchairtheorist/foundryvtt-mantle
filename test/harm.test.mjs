/**
 * Damage, Strain, Wound, and Burden tests.
 *
 * The resistance cases come straight from the Quick Start's worked table — Mira
 * hitting a 5-Guard creature for 20 with a holy flaming sword — which pins down
 * both the ordering (Guard first, then affinity) and the cancellation rule.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  damageAffinity,
  applyAffinity,
  applyDamage,
  applyStrain,
  harmSeverity,
  woundEffect,
  burdenEffect
} from "../module/rules/harm.mjs";

describe("resistance and weakness", () => {
  const sword = ["slashing", "radiant", "fire"];

  test("one matching resistance makes the whole attack resisted", () => {
    assert.equal(damageAffinity(sword, ["fire"], []), "resistant");
  });

  test("resistances do not stack", () => {
    assert.equal(damageAffinity(sword, ["slashing", "fire"], []), "resistant");
  });

  test("one matching weakness makes the whole attack a weakness", () => {
    assert.equal(damageAffinity(sword, [], ["fire"]), "weak");
  });

  test("holding both a resistance and a weakness cancels out", () => {
    // A deliberate speed-of-play choice in the rules, not an oversight.
    assert.equal(damageAffinity(sword, ["slashing"], ["fire"]), "normal");
  });

  test("resistance halves and rounds down, weakness doubles", () => {
    assert.equal(applyAffinity(15, "resistant"), 7);
    assert.equal(applyAffinity(15, "weak"), 30);
    assert.equal(applyAffinity(15, "normal"), 15);
  });
});

describe("the Quick Start's worked damage table", () => {
  // 20 damage from a holy flaming sword against a creature with 5 Guard.
  /** @param {"resistant"|"weak"|"normal"} affinity */
  const hit = (affinity) =>
    applyDamage({
      amount: 20,
      guard: 5,
      vitality: 100,
      maxVitality: 100,
      woundSlots: 3,
      affinity
    }).toVitality;

  test("no resistances or weaknesses: 20 - 5 Guard = 15", () => {
    assert.equal(hit("normal"), 15);
  });

  test("resistance: (20 - 5) / 2 = 7", () => {
    // Affinity applies to what got past Guard, not to the whole attack. Halving
    // first would give 10 - 5 = 5, which is not what the book prints.
    assert.equal(hit("resistant"), 7);
  });

  test("weakness: (20 - 5) x 2 = 30", () => {
    assert.equal(hit("weak"), 30);
  });
});

describe("Guard", () => {
  test("absorbs damage before Vitality", () => {
    const result = applyDamage({ amount: 4, guard: 10, vitality: 20, maxVitality: 20, woundSlots: 3 });

    assert.equal(result.guardAbsorbed, 4);
    assert.equal(result.guardAfter, 6);
    assert.equal(result.toVitality, 0);
    assert.equal(result.vitalityAfter, 20);
  });

  test("Penetrating attacks bypass it entirely", () => {
    const result = applyDamage({
      amount: 6, guard: 10, vitality: 20, maxVitality: 20, woundSlots: 3, penetrating: true
    });

    assert.equal(result.guardAbsorbed, 0);
    assert.equal(result.guardAfter, 10, "Guard is untouched, not spent");
    assert.equal(result.vitalityAfter, 14);
  });

  test("untyped damage ignores Guard and affinity alike", () => {
    // Falling and drowning are not attacks, so nothing mitigates them.
    const result = applyDamage({
      amount: 10, guard: 10, vitality: 20, maxVitality: 20, woundSlots: 3,
      untyped: true, affinity: "resistant"
    });

    assert.equal(result.guardAfter, 10);
    assert.equal(result.toVitality, 10, "resistance does not apply");
  });
});

describe("Wounds", () => {
  test("reaching zero Vitality takes a Wound and refills the bar", () => {
    const result = applyDamage({ amount: 10, guard: 0, vitality: 10, maxVitality: 10, woundSlots: 3 });

    assert.equal(result.woundsInflicted, 1);
    assert.equal(result.vitalityAfter, 10, "refilled to maximum");
  });

  test("excess damage carries onto the refilled bar", () => {
    // The book's example: 15 damage against 10 Max Vitality leaves 1 Wound and
    // 5 Vitality remaining.
    const result = applyDamage({ amount: 15, guard: 0, vitality: 10, maxVitality: 10, woundSlots: 3 });

    assert.equal(result.woundsInflicted, 1);
    assert.equal(result.vitalityAfter, 5);
  });

  test("one huge hit can inflict several Wounds at once", () => {
    const result = applyDamage({ amount: 25, guard: 0, vitality: 10, maxVitality: 10, woundSlots: 3 });

    assert.equal(result.woundsInflicted, 2);
    assert.equal(result.vitalityAfter, 5);
  });

  test("running out of Wound slots means Defeated", () => {
    const result = applyDamage({
      amount: 10, guard: 0, vitality: 10, maxVitality: 10, woundSlots: 3, woundsTaken: 3
    });

    assert.equal(result.defeated, true);
    assert.equal(result.vitalityAfter, 0);
    assert.equal(result.woundsInflicted, 0);
  });

  test("Defeat cuts off further Wounds from the same hit", () => {
    const result = applyDamage({
      amount: 100, guard: 0, vitality: 10, maxVitality: 10, woundSlots: 3, woundsTaken: 2
    });

    assert.equal(result.woundsInflicted, 1, "the last slot fills, then Defeated");
    assert.equal(result.defeated, true);
  });
});

describe("Strain and Burdens", () => {
  test("Strain ignores Guard", () => {
    const result = applyStrain({ amount: 3, strain: 0, maxStrain: 10, burdenSlots: 3 });
    assert.equal(result.strainAfter, 3);
  });

  test("a Burden lands when Strain reaches Max Strain, not when it exceeds it", () => {
    // "Reaches or exceeds" — landing exactly on the maximum still Burdens.
    const result = applyStrain({ amount: 5, strain: 0, maxStrain: 5, burdenSlots: 3 });

    assert.equal(result.burdensInflicted, 1);
    assert.equal(result.strainAfter, 0);
  });

  test("excess Strain carries over", () => {
    const result = applyStrain({ amount: 8, strain: 0, maxStrain: 5, burdenSlots: 3 });

    assert.equal(result.burdensInflicted, 1);
    assert.equal(result.strainAfter, 3);
  });

  test("running out of Burden slots means Lost", () => {
    const result = applyStrain({
      amount: 5, strain: 0, maxStrain: 5, burdenSlots: 3, burdensTaken: 3
    });

    assert.equal(result.lost, true);
    assert.equal(result.strainAfter, 0);
  });
});

describe("severity", () => {
  test("without luck, the first Wound is Flesh and the third is Critical", () => {
    assert.equal(harmSeverity({ slotsFilled: 1 }), 1);
    assert.equal(harmSeverity({ slotsFilled: 2 }), 2);
    assert.equal(harmSeverity({ slotsFilled: 3 }), 3);
  });

  test("luck successes reduce severity, to a floor of 1", () => {
    assert.equal(harmSeverity({ slotsFilled: 3, luckSuccesses: 1 }), 2);
    assert.equal(harmSeverity({ slotsFilled: 3, luckSuccesses: 5 }), 1);
  });

  test("an Edge called shot floors severity at 2 regardless of luck", () => {
    assert.equal(harmSeverity({ slotsFilled: 1, luckSuccesses: 3, hitLocation: "edge" }), 2);
  });

  test("a Mark called shot floors severity at 3", () => {
    assert.equal(harmSeverity({ slotsFilled: 1, luckSuccesses: 3, hitLocation: "mark" }), 3);
  });

  test("a called shot floor never lowers a naturally higher severity", () => {
    assert.equal(harmSeverity({ slotsFilled: 3, hitLocation: "edge" }), 3);
  });
});

describe("what a Wound does", () => {
  test("a Flesh Wound's Impaired scales with slots filled", () => {
    assert.equal(woundEffect(1, 1).effect, "Impaired 1");
    assert.equal(woundEffect(1, 3).effect, "Impaired 3");
  });

  test("a Trauma Wound reads its 1d6 sub-table", () => {
    assert.equal(woundEffect(2, 2, 3).effect, "Hindered 1");
    assert.equal(woundEffect(2, 2, 4).effect, "Exhausted");
    assert.equal(woundEffect(2, 2, 5).effect, "Slowed");
    assert.equal(woundEffect(2, 2, 6).effect, "Shrouded");
  });

  test("a Critical Wound is Faltering and Broken", () => {
    assert.equal(woundEffect(3, 3).effect, "Faltering 1 and Broken");
  });

  test("severity above 3 is still Critical", () => {
    assert.equal(woundEffect(5, 3).severity, 3);
  });
});

describe("what a Burden does", () => {
  test("Confusion applies Impaired scaling with slots", () => {
    assert.equal(burdenEffect(1, 2).effect, "Impaired 2");
    assert.equal(burdenEffect(1, 2).affliction, "", "no affliction at severity 1");
  });

  test("an Affliction rolls the affliction table", () => {
    assert.equal(burdenEffect(2, 2, 2).affliction, "MANTLE.Affliction.reckless");
  });

  test("a Breakdown is Unraveling plus an affliction", () => {
    const result = burdenEffect(3, 3, 6);
    assert.equal(result.effect, "Unraveling 1");
    assert.equal(result.affliction, "MANTLE.Affliction.bloodthirsty");
  });
});
