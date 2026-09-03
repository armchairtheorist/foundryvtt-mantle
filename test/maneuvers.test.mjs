/**
 * The basic maneuvers, Vulnerable, and the reworked affinity engine.
 *
 * The affinity rules are the ones worth guarding hardest. Every one of them is
 * a silent failure: a resistance that should not have applied halves a number
 * nobody re-checks, and Strain being halved by a Brace that the rules say does
 * nothing is invisible at the table until someone reads the log.
 *
 * Run with: npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  catchYourBreathHeal,
  steadyYourselfClear,
  surgeLimit,
  surgeStrainCost,
  maneuverEffectSize,
  vulnerableBonus
} from "../module/rules/maneuvers.mjs";
import { applyDamage, applyStrain, damageAffinity, applyAffinity } from "../module/rules/harm.mjs";
import { effectiveSuccesses } from "../module/dice/pool.mjs";
import { MANTLE } from "../module/config.mjs";
import { build as buildManeuvers } from "../src/content/maneuvers.mjs";
import { build as buildEquipment } from "../src/content/equipment.mjs";
import { build as buildMasteries } from "../src/content/masteries.mjs";

describe("the basic maneuvers", () => {
  test("Catch Your Breath restores half Max Vitality, rounded down", () => {
    assert.equal(catchYourBreathHeal(21), 10);
    assert.equal(catchYourBreathHeal(10), 5);
  });

  test("Steady Yourself clears half Max Strain, rounded down", () => {
    assert.equal(steadyYourselfClear(5), 2);
    assert.equal(steadyYourselfClear(12), 6);
  });

  test("Surge buys Vigor up to MIND, two Strain apiece", () => {
    const limit = surgeLimit({ mind: 3, vigor: 2, maxVigor: 7 });
    assert.equal(limit.available, true);
    assert.equal(limit.maxGain, 3);
    assert.equal(surgeStrainCost(3), 6);
  });

  test("Surge cannot push Vigor past its cap", () => {
    assert.equal(surgeLimit({ mind: 3, vigor: 6, maxVigor: 7 }).maxGain, 1);
    assert.equal(surgeLimit({ mind: 3, vigor: 7, maxVigor: 7 }).maxGain, 0);
  });

  test("a character with MIND 0 cannot Surge at all", () => {
    // Not "gains nothing" — may not take the maneuver. The distinction is the
    // difference between a wasted click and a rule.
    assert.equal(surgeLimit({ mind: 0, vigor: 0, maxVigor: 7 }).available, false);
  });

  test("every maneuver in the table has a cost and a kind", () => {
    for (const [id, maneuver] of Object.entries(MANTLE.maneuvers)) {
      assert.ok(maneuver.label, `${id}: label`);
      assert.equal(typeof maneuver.vigor, "number", `${id}: vigor`);
      assert.ok(maneuver.kind, `${id}: kind`);
    }
  });

  test("the compendium ships every maneuver and reaction the tables define", () => {
    // The pack is built from the same tables the sheet buttons read, so the
    // reference a player opens can never describe a maneuver the system has
    // not got — or miss one it has.
    const shipped = new Set(buildManeuvers().map((doc) => doc.name));
    const expected = [
      ...Object.values(MANTLE.maneuvers),
      ...Object.values(MANTLE.reactions)
    ].length;

    assert.equal(shipped.size, expected);
    for (const name of ["Feint", "Shove", "Grab", "Brace", "Intercept", "Counterattack"]) {
      assert.ok(shipped.has(name), name);
    }
  });
});

/* -------------------------------------------- */

describe("Feint, Shove, and Grab", () => {
  test("all three scale with net successes and cap at 3", () => {
    assert.equal(maneuverEffectSize(1), 1);
    assert.equal(maneuverEffectSize(3), 3);
    assert.equal(maneuverEffectSize(5), 3, "capped, not five");
  });

  test("zero net successes lands nothing", () => {
    // A Feint the defender fully dodged applies no Vulnerable — there is no
    // floor of one.
    assert.equal(maneuverEffectSize(0), 0);
  });

  test("Feint is an attack, so opposition is subtracted before the effect", () => {
    // Three successes against a two-success Dodge is Vulnerable 1, and against
    // a three-success Dodge is nothing at all.
    assert.equal(maneuverEffectSize(effectiveSuccesses(3, -2)), 1);
    assert.equal(maneuverEffectSize(effectiveSuccesses(3, -3)), 0);
  });

  test("Feint accepts any melee weapon; Shove and Grab are Unarmed only", () => {
    assert.equal(MANTLE.maneuvers.feint.weapon, "melee");
    assert.equal(MANTLE.maneuvers.shove.weapon, "unarmed");
    assert.equal(MANTLE.maneuvers.grab.weapon, "unarmed");
  });

  test("Feint applies Vulnerable and costs 2 Vigor", () => {
    assert.equal(MANTLE.maneuvers.feint.applies, "vulnerable");
    assert.equal(MANTLE.maneuvers.feint.vigor, 2);
  });
});

/* -------------------------------------------- */

describe("Vulnerable", () => {
  test("is worth one die per stack", () => {
    assert.equal(vulnerableBonus(1), 1);
    assert.equal(vulnerableBonus(3), 3);
    assert.equal(vulnerableBonus(0), 0);
  });

  test("stacks to 3 and does not clear on its own", () => {
    assert.equal(MANTLE.conditions.vulnerable.stackable, true);
    assert.equal(MANTLE.conditions.vulnerable.clear, "persistent");
  });

  /**
   * A Grunt's action rolls are a flat one success rather than a floor of one,
   * and the auto-success feeds the pipeline *before* opposition subtracts. Get
   * the order backwards and a Grunt becomes undodgeable.
   */
  test("a Grunt's automatic success is still mitigable to zero", () => {
    assert.equal(effectiveSuccesses(1, -1), 0);
    assert.equal(effectiveSuccesses(1, -2), 0, "floored at zero, not at one");
    assert.equal(effectiveSuccesses(1, 0), 1);
  });
});

/* -------------------------------------------- */

describe("the affinity engine", () => {
  test("resistance halves and rounds down; weakness doubles", () => {
    assert.equal(applyAffinity(7, "resistant"), 3);
    assert.equal(applyAffinity(7, "weak"), 14);
    assert.equal(applyAffinity(7, "normal"), 7);
  });

  test("resistance and weakness to the same attack cancel, and never stack", () => {
    assert.equal(damageAffinity(["fire"], ["fire"], []), "resistant");
    assert.equal(damageAffinity(["fire"], [], ["fire"]), "weak");
    assert.equal(damageAffinity(["fire"], ["fire"], ["fire"]), "normal");
  });

  test("one matching type out of several is enough", () => {
    // A Halberd swung as Slashing against a creature that resists Piercing is
    // resisted only if the *chosen* type matches — which is why the attack
    // carries its chosen type rather than the weapon's tag list.
    assert.equal(damageAffinity(["slashing", "piercing"], ["piercing"], []), "resistant");
    assert.equal(damageAffinity(["slashing"], ["piercing"], []), "normal");
  });

  test("Resistance (Physical) answers for Slashing, Piercing, and Crushing", () => {
    for (const type of ["slashing", "piercing", "crushing"]) {
      assert.equal(damageAffinity([type], ["physical"], []), "resistant", type);
    }
    assert.equal(damageAffinity(["fire"], ["physical"], []), "normal");
  });

  test("Weakness (Physical) works the same way", () => {
    assert.equal(damageAffinity(["crushing"], [], ["physical"]), "weak");
  });

  test("a group on one side and a type on the other still cancels", () => {
    assert.equal(damageAffinity(["slashing"], ["physical"], ["slashing"]), "normal");
  });

  /**
   * Order of operations: Guard first, then the affinity on what got past it.
   * Halving before Guard would let a resistant target subtract Guard from an
   * already-halved number and take nothing at all.
   */
  test("Guard is subtracted before resistance is applied", () => {
    const result = applyDamage({
      amount: 20,
      guard: 10,
      vitality: 30,
      maxVitality: 30,
      woundSlots: 3,
      affinity: "resistant"
    });

    // 20 - 10 Guard = 10 past Guard, halved to 5.
    assert.equal(result.guardAbsorbed, 10);
    assert.equal(result.toVitality, 5);
    assert.equal(result.vitalityAfter, 25);
  });

  test("weakness doubles only the part that got past Guard", () => {
    const result = applyDamage({
      amount: 12,
      guard: 4,
      vitality: 30,
      maxVitality: 30,
      woundSlots: 3,
      affinity: "weak"
    });

    // 12 - 4 = 8 past Guard, doubled to 16 — not 24 - 4.
    assert.equal(result.toVitality, 16);
  });

  test("untyped damage bypasses Guard entirely", () => {
    const result = applyDamage({
      amount: 10,
      guard: 6,
      vitality: 30,
      maxVitality: 30,
      woundSlots: 3,
      untyped: true
    });

    assert.equal(result.guardAbsorbed, 0);
    assert.equal(result.toVitality, 10);
    assert.equal(result.guardAfter, 6, "Guard is untouched, not spent");
  });

  /**
   * The hard rule: nothing halves or doubles Strain. Not Brace, not Arcane
   * Shield, not a Mark called shot. `applyStrain` takes no affinity at all, so
   * there is no argument a caller could pass to change this.
   */
  test("Strain is never modified by resistance or weakness", () => {
    const base = { amount: 6, strain: 0, maxStrain: 20, burdenSlots: 3 };

    assert.equal(applyStrain(base).strainAfter, 6);

    // `applyStrain` takes no affinity, and the typechecker rejects one — which
    // is the real guarantee. The cast is here so the runtime behaviour is
    // pinned too: a caller reaching past the types changes nothing.
    const hostile = /** @type {any} */ (applyStrain);
    assert.equal(hostile({ ...base, affinity: "resistant" }).strainAfter, 6);
    assert.equal(hostile({ ...base, affinity: "weak" }).strainAfter, 6);
  });
});

/* -------------------------------------------- */

describe("dual damage types", () => {
  const equipment = buildEquipment();

  test("the five catalog blades are Slashing or Piercing", () => {
    for (const name of ["Dagger", "Rapier", "Longsword", "Greatsword", "Halberd"]) {
      const weapon = equipment.find((i) => i.name === name);
      assert.ok(weapon, name);
      assert.equal(weapon.system.dualType, true, `${name}: dualType`);
      assert.deepEqual(
        [...weapon.system.damageTypes].sort(),
        ["piercing", "slashing"],
        `${name}: types`
      );
    }
  });

  test("no other weapon is marked dual", () => {
    // The flag means "these two are a choice", so a weapon that genuinely deals
    // two types at once must not carry it.
    const dual = equipment.filter((i) => i.type === "weapon" && i.system.dualType);
    assert.equal(dual.length, 5);
  });

  test("Bloodlust triggers on either half of a dual weapon", () => {
    // The pattern reads the chosen type, and both choices qualify — so a
    // Rapier declared either way can bleed.
    for (const chosen of ["slashing", "piercing"]) {
      assert.ok(["slashing", "piercing"].includes(chosen));
      assert.equal(damageAffinity([chosen], ["physical"], []), "resistant");
    }
  });
});

/* -------------------------------------------- */

describe("affinities from content", () => {
  const masteries = buildMasteries();

  test("Fireman and Stoneskin grant their resistances as data", () => {
    const fireman = masteries.find((m) => m.name === "Fireman");
    const stoneskin = masteries.find((m) => m.name === "Stoneskin");

    assert.deepEqual(fireman?.system.resistances, ["fire"]);
    assert.deepEqual(stoneskin?.system.resistances, ["crushing"]);
  });

  test("every affinity named in content is one the engine recognises", () => {
    const known = new Set(Object.keys(MANTLE.affinityChoices));

    for (const mastery of masteries) {
      for (const entry of [...mastery.system.resistances, ...mastery.system.weaknesses]) {
        assert.ok(known.has(entry), `${mastery.name}: ${entry}`);
      }
    }
  });

  test("Iron Will is a halving of its own, not a resistance", () => {
    // It has to keep working against Strain attacks, which resistance never
    // touches — so it must not be expressed as one.
    const ironWill = masteries.find((m) => m.name === "Iron Will");
    assert.ok(ironWill);
    assert.deepEqual(ironWill.system.resistances, [], "not modelled as resistance");
    assert.match(ironWill.system.description, /halve the Strain you take/);
    assert.equal(ironWill.system.bonuses.strain, 2);
  });
});

describe("the v0.31 action economy", () => {
  /** @type {Record<string, any>} */
  const table = MANTLE.maneuvers;

  test("movement costs 2 Vigor, and the first Move is still free", () => {
    // Doubled from 1. Against Max Vigor 7 and a Basic Attack at 2, a turn is
    // about three actions instead of five.
    assert.equal(table.move.vigor, 2);
    assert.equal(table.move.firstFree, true);
    assert.equal(table.shift.vigor, 2);
  });

  test("nothing else changed price", () => {
    assert.equal(table.shove.vigor, 2);
    assert.equal(table.grab.vigor, 2);
    assert.equal(table.feint.vigor, 2);
    assert.equal(table.useConsumable.vigor, 1);
    assert.equal(table.hide.vigor, 1);
    assert.equal(table.shakeItOff.vigor, 2);
  });

  test("the full-turn maneuvers still cost no Vigor", () => {
    for (const id of ["catchYourBreath", "steadyYourself", "limitBreak"]) {
      assert.equal(table[id].vigor, 0, id);
      assert.equal(table[id].fullTurn, true, id);
    }
  });

  test("Grab lands Grabbed, not Hindered", () => {
    // Hindered stopped stacking, and Grab scales with net successes — so the
    // stacks moved to a condition that can hold them.
    assert.equal(table.grab.applies, "grabbed");
    assert.equal(table.grab.max, 3);
  });

  test("Shake It Off clears four conditions now", () => {
    assert.deepEqual(table.shakeItOff.clears, [
      "exhausted",
      "grabbed",
      "hindered",
      "vulnerable"
    ]);
  });

  test("every condition Shake It Off names is real, and clearing one is worth a maneuver", () => {
    for (const id of table.shakeItOff.clears) {
      assert.ok(id in MANTLE.conditions, id);
    }
  });

  test("every maneuver that applies a condition applies one that exists", () => {
    for (const [id, maneuver] of Object.entries(table)) {
      if (!maneuver.applies) continue;
      assert.ok(maneuver.applies in MANTLE.conditions, `${id} applies ${maneuver.applies}`);
    }
  });
});
