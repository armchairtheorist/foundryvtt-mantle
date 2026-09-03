/**
 * Condition stacking and the end-of-turn pass.
 *
 * The clear rules are where a fight actually resolves — a Faltering check that
 * reads the comparison backwards turns a survivable first Wound into a death
 * sentence, and nothing about it would look wrong on screen. Every figure below
 * is from the Quick Start's Conditions section (v0.21).
 *
 * Run with: npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  actionAllowed,
  applyStacks,
  conditionModifiers,
  conditionSideEffects,
  endOfTurnPlan,
  escalate,
  stackCap,
  DEFAULT_CAP,
  WRACKED_DAMAGE_PER_STACK
} from "../module/rules/conditions.mjs";
import { MANTLE } from "../module/config.mjs";

describe("stacking", () => {
  test("stacked conditions cap at 3", () => {
    assert.equal(stackCap("impaired"), 3);
    assert.equal(stackCap("grabbed"), 3);
    assert.equal(stackCap("wracked"), 3);
    assert.equal(DEFAULT_CAP, 3);
  });

  test("Hindered stopped stacking in v0.31", () => {
    // It was "yes (max 3)" through v0.21 and is now flatly non-stackable, with
    // its effect text unchanged. Grab moved to the new Grabbed condition to
    // carry the stacks it used to inflict here.
    assert.equal(stackCap("hindered"), 1);
    assert.equal(applyStacks("hindered", 0, 3), 1);
  });

  test("Faltering and Unraveling are uncapped", () => {
    assert.equal(stackCap("faltering"), Infinity);
    assert.equal(stackCap("unraveling"), Infinity);
  });

  test("a non-stackable condition counts as exactly one stack", () => {
    // Which is what makes "remove stacks equal to your successes" work the same
    // for Frightened as it does for Grabbed.
    assert.equal(stackCap("frightened"), 1);
    assert.equal(applyStacks("frightened", 0, 3), 1);
  });

  test("applying stacks is cumulative up to the cap", () => {
    // Impaired 1 plus an incoming Impaired 2 is Impaired 3.
    assert.equal(applyStacks("impaired", 1, 2), 3);
    assert.equal(applyStacks("impaired", 2, 2), 3, "clamped, not 4");
  });

  test("clearing never goes below zero", () => {
    assert.equal(applyStacks("impaired", 2, -5), 0);
  });

  test("every condition in the catalog has a cap the rules recognise", () => {
    for (const id of Object.keys(MANTLE.conditions)) {
      const cap = stackCap(id);
      assert.ok(cap === 1 || cap === 3 || cap === Infinity, `${id}: cap ${cap}`);
    }
  });
});

/* -------------------------------------------- */

describe("the end-of-turn pass", () => {
  test("sorts each condition into its clear type", () => {
    const plan = endOfTurnPlan({ impaired: 2, hindered: 1, cursed: 1, faltering: 1 });

    assert.deepEqual(plan.auto, ["impaired"]);
    assert.deepEqual(plan.roll.map((entry) => entry.id), ["hindered"]);
    assert.deepEqual(plan.persistent, ["cursed"]);
    assert.deepEqual(plan.escalating, ["faltering"]);
  });

  test("a roll-to-clear condition carries the attributes it may use", () => {
    const plan = endOfTurnPlan({ hindered: 1, exhausted: 1 });

    const hindered = plan.roll.find((entry) => entry.id === "hindered");
    assert.deepEqual(hindered?.attributes, ["pow", "agi"], "POW or AGI");

    const exhausted = plan.roll.find((entry) => entry.id === "exhausted");
    assert.deepEqual(exhausted?.attributes, ["pow"]);
  });

  test("Wracked deals 2 penetrating damage per stack, and still auto-clears", () => {
    const plan = endOfTurnPlan({ wracked: 3 });

    assert.deepEqual(plan.wracked, [{ id: "wracked", stacks: 3, damage: 6 }]);
    assert.equal(WRACKED_DAMAGE_PER_STACK, 2);

    // The damage is taken *before* the stack drops, so the same condition
    // appears in both lists — that ordering is the rule, not a duplicate.
    assert.deepEqual(plan.auto, ["wracked"]);
  });

  test("conditions at zero stacks are not in the plan at all", () => {
    const plan = endOfTurnPlan({ impaired: 0, hindered: 0 });
    assert.deepEqual(plan.auto, []);
    assert.deepEqual(plan.roll, []);
  });

  test("every condition in the catalog lands somewhere in the plan", () => {
    // A condition whose clear type the plan does not recognise would silently
    // never resolve, which is the kind of gap nobody notices for months.
    const stacks = Object.fromEntries(Object.keys(MANTLE.conditions).map((id) => [id, 1]));
    const plan = endOfTurnPlan(stacks);

    const sorted = new Set([
      ...plan.auto,
      ...plan.roll.map((entry) => entry.id),
      ...plan.persistent,
      ...plan.escalating
    ]);

    for (const id of Object.keys(MANTLE.conditions)) assert.ok(sorted.has(id), id);
  });
});

/* -------------------------------------------- */

describe("Faltering and Unraveling", () => {
  test("the first stack can never collapse you", () => {
    // Roll below your stacks and you go down. At 1 stack, no d6 result is
    // below 1 — which is exactly what makes the first Critical Wound survivable.
    for (let die = 1; die <= 6; die += 1) {
      assert.equal(escalate(1, die).collapses, false, `die ${die}`);
    }
  });

  test("the stack grows on every turn you survive", () => {
    assert.deepEqual(escalate(1, 3), { collapses: false, stacksAfter: 2 });
    assert.deepEqual(escalate(2, 5), { collapses: false, stacksAfter: 3 });
  });

  test("rolling below your stacks collapses you", () => {
    assert.equal(escalate(3, 2).collapses, true);
    assert.equal(escalate(3, 3).collapses, false, "equal is a pass, not a fail");
  });

  test("collapse odds match the stack count", () => {
    // At N stacks, N-1 of the six faces fail — 2 stacks is 1-in-6, 6 stacks is
    // certain death. Worth asserting, because reading the comparison the wrong
    // way round produces a plausible table that is off by one everywhere.
    for (let stacks = 1; stacks <= 6; stacks += 1) {
      const failures = [1, 2, 3, 4, 5, 6].filter((die) => escalate(stacks, die).collapses).length;
      assert.equal(failures, stacks - 1, `${stacks} stacks`);
    }
  });
});

/* -------------------------------------------- */

describe("side effects and modifiers", () => {
  test("Defeated clears Faltering and Lost clears Unraveling", () => {
    assert.deepEqual(conditionSideEffects("defeated").clears, ["faltering"]);
    assert.deepEqual(conditionSideEffects("lost").clears, ["unraveling"]);
  });

  test("Surprised carries Slowed with it", () => {
    assert.deepEqual(conditionSideEffects("surprised").carries, ["slowed"]);
  });

  test("a condition with no side effects reports none rather than undefined", () => {
    assert.deepEqual(conditionSideEffects("impaired"), { clears: [], carries: [] });
  });

  test("Impaired costs a die per stack", () => {
    assert.deepEqual(conditionModifiers({ impaired: 2 }), { impaired: 2, hindered: false });
  });

  test("a creature with no conditions has no modifiers", () => {
    assert.deepEqual(conditionModifiers({}), { impaired: 0, hindered: false });
  });
});

describe("Frenzy", () => {
  test("costs its carrier Strain equal to its stacks, every turn", () => {
    // The Barbarian's rage burns the Barbarian. Strain, not damage — Guard
    // does not answer it.
    assert.deepEqual(endOfTurnPlan({ frenzy: 3 }).selfStrain, [
      { id: "frenzy", stacks: 3, strain: 3 }
    ]);
    assert.deepEqual(endOfTurnPlan({ frenzy: 1 }).selfStrain, [
      { id: "frenzy", stacks: 1, strain: 1 }
    ]);
  });

  test("does not clear on its own", () => {
    // Persistent: only Steady Yourself puts it down.
    const plan = endOfTurnPlan({ frenzy: 2 });
    assert.deepEqual(plan.auto, []);
    assert.deepEqual(plan.roll, []);
    assert.ok(plan.persistent.includes("frenzy"));
  });

  test("nothing else in the catalog costs its carrier Strain", () => {
    for (const id of Object.keys(MANTLE.conditions)) {
      if (id === "frenzy") continue;
      assert.deepEqual(endOfTurnPlan({ [id]: 2 }).selfStrain, [], id);
    }
  });
});

describe("lockouts", () => {
  test("Broken stops everything", () => {
    assert.deepEqual(actionAllowed({ broken: 1 }, {}), {
      allowed: false,
      blockedBy: "broken"
    });
    assert.equal(actionAllowed({ broken: 1 }, { defensive: true }).allowed, false);
  });

  test("Frenzy stops defenses but sharpens attacks", () => {
    // Brace and reactive defenses are out; reactive attacks are the whole
    // point of being Frenzied, and gain +1d per stack.
    assert.deepEqual(actionAllowed({ frenzy: 2 }, { defensive: true }), {
      allowed: false,
      blockedBy: "frenzy"
    });
    assert.equal(actionAllowed({ frenzy: 2 }, {}).allowed, true);
  });

  test("an unafflicted character is stopped by nothing", () => {
    assert.deepEqual(actionAllowed({}, { defensive: true }), {
      allowed: true,
      blockedBy: null
    });
  });

  test("Broken is reported ahead of Frenzy when both hold", () => {
    // One reason is a message; two is a lecture. Broken is the wider ban.
    assert.equal(actionAllowed({ broken: 1, frenzy: 3 }, { defensive: true }).blockedBy, "broken");
  });
});

describe("the reaction table", () => {
  test("marks exactly the defenses as defensive", () => {
    const defensive = Object.entries(
      /** @type {Record<string, any>} */ (MANTLE.reactions)
    )
      .filter(([, reaction]) => reaction.defensive)
      .map(([id]) => id)
      .sort();

    // Brace and the two reactive defenses. Intercept, Forestall and
    // Counterattack are attacks and stay available to a Frenzied character.
    assert.deepEqual(defensive, ["brace", "deflect", "dodge"]);
  });
});

describe("the v0.31 condition additions", () => {
  test("Grabbed stacks and clears on POW or AGI", () => {
    assert.equal(stackCap("grabbed"), 3);
    const plan = endOfTurnPlan({ grabbed: 2 });
    assert.deepEqual(plan.roll, [{ id: "grabbed", attributes: ["pow", "agi"] }]);
  });

  test("Affliction is typed like Wracked but deals no damage", () => {
    // Both carry a subtype — a damage type for Wracked, one of the six
    // affliction names for Affliction — so `typed` cannot be what decides
    // whether a condition ticks damage at end of turn.
    const table = /** @type {Record<string, any>} */ (MANTLE.conditions);
    assert.equal(table.affliction.typed, true);
    assert.equal(table.wracked.typed, true);

    assert.deepEqual(endOfTurnPlan({ affliction: 1 }).wracked, []);
    assert.deepEqual(endOfTurnPlan({ wracked: 2 }).wracked, [
      { id: "wracked", stacks: 2, damage: 2 * WRACKED_DAMAGE_PER_STACK }
    ]);
  });

  test("Affliction never clears on its own", () => {
    // Only healing a Burden removes one.
    const plan = endOfTurnPlan({ affliction: 1 });
    assert.deepEqual(plan.auto, []);
    assert.deepEqual(plan.roll, []);
    assert.ok(plan.persistent.includes("affliction"));
  });

  test("the six afflictions are the ones the rules roll", () => {
    assert.deepEqual(
      Object.values(MANTLE.afflictions).map((k) => String(k).split(".").pop()),
      ["paranoid", "reckless", "obsessed", "terrified", "withdrawn", "bloodthirsty"]
    );
  });
});
