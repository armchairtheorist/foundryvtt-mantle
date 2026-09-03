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
  combatReentry,
  downtimeRestore,
  earnsMerit,
  healCost,
  interludeConditions,
  interludeRestore,
  NARRATIVE_CONDITIONS,
  PAUSED_CONDITIONS
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

  test("Faltering and Unraveling are paused, neither cleared nor ticked", () => {
    const plan = interludeConditions({ faltering: 3, unraveling: 2 });
    assert.deepEqual(plan.pauses.sort(), ["faltering", "unraveling"]);
    assert.deepEqual(plan.clears, []);
    assert.deepEqual(plan.persists, []);
  });

  test("a condition at zero stacks is not reported at all", () => {
    assert.deepEqual(interludeConditions({ hindered: 0 }), {
      clears: [],
      persists: [],
      pauses: []
    });
  });

  test("every id named is a real condition", () => {
    for (const id of [...NARRATIVE_CONDITIONS, ...PAUSED_CONDITIONS]) {
      assert.ok(id in MANTLE.conditions, id);
    }
  });
});

describe("re-entering combat", () => {
  test("an unhealed Critical Wound restarts Faltering at one", () => {
    assert.deepEqual(combatReentry({ criticalWound: true, breakdown: false }), { faltering: 1 });
  });

  test("an unhealed Breakdown restarts Unraveling at one", () => {
    assert.deepEqual(combatReentry({ criticalWound: false, breakdown: true }), { unraveling: 1 });
  });

  test("heal the harm and neither comes back", () => {
    assert.deepEqual(combatReentry({ criticalWound: false, breakdown: false }), {});
  });

  test("one stack, not the stack you had — the escalation restarts", () => {
    // A character who reached Faltering 4 and survived does not resume at 4.
    const stacks = combatReentry({ criticalWound: true, breakdown: true });
    assert.equal(stacks.faltering, 1);
    assert.equal(stacks.unraveling, 1);
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
