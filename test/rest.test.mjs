// @ts-check

/**
 * Interlude and downtime.
 *
 * Section 11 of the Quick Start (v0.21). The subtle parts — what an interlude
 * refuses to clear, and what a paused condition does when the next fight starts
 * — are the whole reason this is tested rather than trusted.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  affordableHeals,
  CLEARED_PERSISTENT,
  downtimeRestore,
  earnsMerit,
  healCost,
  interludeConditions,
  interludeRestore,
  NARRATIVE_CONDITIONS
} from "../module/rules/rest.mjs";
import { MANTLE } from "../module/config.mjs";

/** A character mid-mission: hurt, strained, low on everything. */
const spent = {
  vitality: { value: 4, max: 21 },
  strain: { value: 9, max: 12 },
  guard: { value: 7, max: 3 }, // Over-Guard, which an interlude takes away
  vigor: { value: 1, max: 7 },
  resolve: { value: 2, max: 7 },
  consumables: { value: 0, max: 2 }
};

describe("what an interlude clears", () => {
  test("combat conditions go, including Defeated and Lost", () => {
    const plan = interludeConditions({ defeated: 1, lost: 1, hindered: 3, impaired: 2 });
    assert.deepEqual(plan.clears.sort(), ["defeated", "hindered", "impaired", "lost"]);
    assert.deepEqual(plan.persists, []);
  });

  test("Cursed stays: the relic is still out there", () => {
    const plan = interludeConditions({ cursed: 1, frightened: 1 });
    assert.deepEqual(plan.persists, ["cursed"]);
    assert.deepEqual(plan.clears, ["frightened"]);
  });

  test("Afflictions stay: only healing their Burden removes one", () => {
    assert.deepEqual(interludeConditions({ affliction: 1 }).persists, ["affliction"]);
  });

  test("Faltering and Unraveling now clear outright", () => {
    // Through v0.21 they were *paused* and returned at one stack if the harm
    // underneath was unhealed. v0.31 simply ends them, which is why there is
    // no combat re-entry step any more.
    const plan = interludeConditions({ faltering: 3, unraveling: 2 });
    assert.deepEqual(plan.clears.sort(), ["faltering", "unraveling"]);
    assert.deepEqual(plan.persists, []);
  });

  test("the five persistent conditions the rules name are the ones that clear", () => {
    assert.deepEqual(CLEARED_PERSISTENT.slice().sort(), [
      "defeated",
      "faltering",
      "lost",
      "unraveling",
      "vulnerable"
    ]);

    const plan = interludeConditions(
      Object.fromEntries(CLEARED_PERSISTENT.map((id) => [id, 1]))
    );
    assert.deepEqual(plan.clears.sort(), CLEARED_PERSISTENT.slice().sort());
  });

  test("a persistent condition the rules do not name survives", () => {
    // Invisible is ability-granted rather than combat-scoped, so nothing in
    // the interlude list reaches it.
    assert.deepEqual(interludeConditions({ invisible: 1 }).persists, ["invisible"]);
  });

  test("every auto-clear and roll-to-clear condition goes, whatever it is", () => {
    // Stated as a rule over the condition table rather than a list, so a new
    // condition is covered the day it is added.
    for (const [id, condition] of Object.entries(MANTLE.conditions)) {
      if (condition.clear === "persistent") continue;
      assert.deepEqual(interludeConditions({ [id]: 1 }).clears, [id], id);
    }
  });

  test("a condition at zero stacks is not reported at all", () => {
    assert.deepEqual(interludeConditions({ hindered: 0 }), { clears: [], persists: [] });
  });

  test("every id named is a real condition", () => {
    for (const id of [...NARRATIVE_CONDITIONS, ...CLEARED_PERSISTENT]) {
      assert.ok(id in MANTLE.conditions, id);
    }
  });
});

describe("healing with Resolve", () => {
  test("costs a flat 1 per Wound or Burden", () => {
    // Severities used to price this and a Critical Wound cost 3. v0.31: "spend
    // 1 Resolve to heal 1 Wound or 1 Burden", and there are no severities.
    assert.equal(MANTLE.healResolveCost, 1);
    assert.equal(healCost({}), 1);
    assert.equal(healCost({ consequence: "Broken" }), 1);
  });

  test("Resolve buys that many harms", () => {
    const harms = [{ consequence: "a" }, { consequence: "b" }, { consequence: "c" }];
    const { indices, cost } = affordableHeals(harms, 2);
    assert.equal(indices.length, 2);
    assert.equal(cost, 2);
  });

  test("enough Resolve clears the whole track", () => {
    const harms = [{ consequence: "a" }, { consequence: "b" }];
    assert.deepEqual(affordableHeals(harms, 10), { indices: [0, 1], cost: 2 });
  });

  test("no Resolve heals nothing", () => {
    assert.deepEqual(affordableHeals([{ consequence: "a" }], 0), { indices: [], cost: 0 });
  });

  test("indices come back in track order", () => {
    // The caller indexes into the wounds array with these.
    const harms = [{ consequence: "a" }, { consequence: "b" }, { consequence: "c" }];
    assert.deepEqual(affordableHeals(harms, 2).indices, [0, 1]);
  });
});

describe("what an interlude restores", () => {
  const restored = interludeRestore(spent);

  test("Guard returns to its maximum and Over-Guard is lost", () => {
    assert.equal(restored["system.guard.value"], 3);
  });

  test("Vigor to full, Strain to nothing", () => {
    assert.equal(restored["system.vigor.value"], 7);
    assert.equal(restored["system.strain.value"], 0);
  });

  test("one consumable point back, never past the maximum", () => {
    assert.equal(restored["system.consumables.value"], MANTLE.interludeConsumableRestock);
    assert.equal(
      interludeRestore({ ...spent, consumables: { value: 2, max: 2 } })["system.consumables.value"],
      2
    );
  });

  test("Vitality is left alone — restoring it costs 1 Resolve and is a choice", () => {
    assert.equal("system.vitality.value" in restored, false);
    assert.equal("system.resolve.value" in restored, false);
  });
});

describe("what downtime restores", () => {
  const restored = downtimeRestore(spent);

  test("Vitality and Resolve come back at no cost", () => {
    assert.equal(restored["system.vitality.value"], 21);
    assert.equal(restored["system.resolve.value"], 7);
  });

  test("consumables go to full rather than up by one", () => {
    assert.equal(restored["system.consumables.value"], 2);
  });

  test("everything an interlude does, downtime also does", () => {
    for (const [key, value] of Object.entries(interludeRestore(spent))) {
      if (key === "system.consumables.value") continue;
      assert.equal(restored[key], value, key);
    }
  });
});

describe("merits", () => {
  test("earned at the threshold, not above it", () => {
    assert.equal(earnsMerit(5, 5), true);
    assert.equal(earnsMerit(4, 5), false);
  });
});
