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
  burdenAffliction,
  fillsLastSlot,
  woundConsequence
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

describe("what a Wound does", () => {
  // v0.31 replaced severities and the luck roll with one 1d6 table.
  test("the table is the six conditions the rules print", () => {
    const rolled = [1, 2, 3, 4, 5, 6].map(
      (die) => woundConsequence(die, { woundsHeld: 1 })?.condition
    );
    assert.deepEqual(rolled, [
      "impaired",
      "hindered",
      "exhausted",
      "slowed",
      "shrouded",
      "broken"
    ]);
  });

  test("Impaired scales with the Wounds held", () => {
    assert.equal(woundConsequence(1, { woundsHeld: 1 })?.stacks, 1);
    assert.equal(woundConsequence(1, { woundsHeld: 3 })?.stacks, 3);
  });

  test("Impaired sets its stacks rather than adding to them", () => {
    // "if N is greater than the current Impaired stacks, then the number of
    // stacks gets reset to N" — so it is a set, and rolling it while already
    // more Impaired changes nothing.
    const outcome = woundConsequence(1, { woundsHeld: 2, stacks: { impaired: 3 } });
    assert.equal(outcome?.sets, true);
    assert.equal(outcome?.stacks, 2, "the caller compares against what is held");
  });

  test("Impaired never rerolls, even when already held", () => {
    assert.equal(woundConsequence(1, { woundsHeld: 2, stacks: { impaired: 3 } })?.reroll, false);
  });

  test("every other row rerolls if the character already carries it", () => {
    for (const [die, condition] of [
      [2, "hindered"],
      [3, "exhausted"],
      [4, "slowed"],
      [5, "shrouded"],
      [6, "broken"]
    ]) {
      const fresh = woundConsequence(Number(die), { woundsHeld: 1 });
      assert.equal(fresh?.reroll, false, `${condition} fresh`);

      const held = woundConsequence(Number(die), {
        woundsHeld: 1,
        stacks: { [String(condition)]: 1 }
      });
      assert.equal(held?.reroll, true, `${condition} already held`);
    }
  });

  test("a die outside the table is not an outcome", () => {
    assert.equal(woundConsequence(0, { woundsHeld: 1 }), null);
    assert.equal(woundConsequence(7, { woundsHeld: 1 }), null);
  });
});

describe("what a Burden does", () => {
  test("every Burden brings an affliction from the 1d6 table", () => {
    // In v0.21 only severity 2 and 3 rolled one; now they all do.
    const rolled = [1, 2, 3, 4, 5, 6].map((die) => burdenAffliction(die)?.affliction);
    assert.deepEqual(rolled, [
      "MANTLE.Affliction.paranoid",
      "MANTLE.Affliction.reckless",
      "MANTLE.Affliction.obsessed",
      "MANTLE.Affliction.terrified",
      "MANTLE.Affliction.withdrawn",
      "MANTLE.Affliction.bloodthirsty"
    ]);
  });

  test("an affliction already held is rerolled", () => {
    // "You may not have more than one Affliction of the same type."
    assert.equal(burdenAffliction(2, ["MANTLE.Affliction.reckless"])?.reroll, true);
    assert.equal(burdenAffliction(2, ["MANTLE.Affliction.paranoid"])?.reroll, false);
    assert.equal(burdenAffliction(2)?.reroll, false);
  });

  test("a die outside the table is not an outcome", () => {
    assert.equal(burdenAffliction(7), null);
  });
});

describe("the escalating conditions", () => {
  test("arrive with the last slot, not with a severity", () => {
    // Faltering came from a Critical Wound and Unraveling from a Breakdown.
    // v0.31 has neither: filling the final slot is the trigger.
    assert.equal(fillsLastSlot(3, 3), true);
    assert.equal(fillsLastSlot(2, 3), false);
    assert.equal(fillsLastSlot(1, 1), true);
  });

  test("a creature with no slots at all never reaches the trigger", () => {
    // Grunts and Regulars have no Wound slots; they are removed outright.
    assert.equal(fillsLastSlot(0, 0), false);
    assert.equal(fillsLastSlot(1, 0), false);
  });
});

describe("Wracked (Bleeding)", () => {
  test("answers to resistance against either Piercing or Slashing", () => {
    assert.equal(damageAffinity(["bleeding"], ["piercing"]), "resistant");
    assert.equal(damageAffinity(["bleeding"], ["slashing"]), "resistant");
    assert.equal(damageAffinity(["bleeding"], ["physical"]), "resistant", "via the group");
  });

  test("and to weakness against either", () => {
    assert.equal(damageAffinity(["bleeding"], [], ["slashing"]), "weak");
    assert.equal(damageAffinity(["bleeding"], [], ["piercing"]), "weak");
  });

  test("holding both still cancels", () => {
    assert.equal(damageAffinity(["bleeding"], ["piercing"], ["slashing"]), "normal");
  });

  test("an unrelated affinity does not answer it", () => {
    assert.equal(damageAffinity(["bleeding"], ["fire"]), "normal");
  });
});
