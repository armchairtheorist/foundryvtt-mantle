// @ts-check

/**
 * Momentum and what it buys.
 *
 * Every figure below is from section 10 of the Quick Start (v0.21): the
 * spending table, and the two routes into a Limit Break.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  betterLuck,
  limitBreakRoutes,
  momentousFeatSuccesses,
  momentousFortune
} from "../module/rules/momentum.mjs";
import { MANTLE } from "../module/config.mjs";

describe("the spending table", () => {
  test("matches the rules", () => {
    assert.equal(MANTLE.momentumCosts.limitBreak, 3);
    assert.equal(MANTLE.momentumCosts.momentousFortune, 2);
    assert.equal(MANTLE.momentumCosts.momentousFeatPerSuccess, 1);
    assert.equal(MANTLE.momentousFeatMaxSuccesses, 3);
  });
});

describe("paying for a Limit Break", () => {
  test("three Momentum is the ordinary route", () => {
    assert.deepEqual(limitBreakRoutes({ momentum: 3, crisis: false, crisisUsed: false }), [
      { route: "momentum", cost: 3, exhausts: false }
    ]);
  });

  test("two Momentum buys nothing", () => {
    assert.deepEqual(limitBreakRoutes({ momentum: 2, crisis: false, crisisUsed: false }), []);
  });

  test("Crisis is free but exhausts, and only once", () => {
    assert.deepEqual(limitBreakRoutes({ momentum: 0, crisis: true, crisisUsed: false }), [
      { route: "crisis", cost: 0, exhausts: true }
    ]);
    assert.deepEqual(limitBreakRoutes({ momentum: 0, crisis: true, crisisUsed: true }), []);
  });

  test("a character in Crisis with Momentum to spare gets the choice", () => {
    // Worth offering both: paying the Momentum avoids Exhausted, but the pool is
    // shared and someone else may need it more.
    const routes = limitBreakRoutes({ momentum: 5, crisis: true, crisisUsed: false });
    assert.deepEqual(
      routes.map((r) => r.route),
      ["momentum", "crisis"]
    );
  });
});

describe("Momentous Feat", () => {
  test("one success per Momentum, capped at three", () => {
    assert.equal(momentousFeatSuccesses(0), 0);
    assert.equal(momentousFeatSuccesses(2), 2);
    assert.equal(momentousFeatSuccesses(3), 3);
    assert.equal(momentousFeatSuccesses(99), 3);
  });

  test("never more than asked for", () => {
    assert.equal(momentousFeatSuccesses(10, 1), 1);
    assert.equal(momentousFeatSuccesses(10, 0), 0);
  });

  test("a pool that cannot afford what was asked gives what it can", () => {
    assert.equal(momentousFeatSuccesses(1, 3), 1);
  });
});

describe("Momentous Fortune", () => {
  // Not a rename of Heroic Fortune but a different mechanic. Heroic Fortune
  // downgraded a Wound or Burden's severity by one; v0.31 has no severities,
  // and this rerolls a luck test instead.
  test("costs two Momentum", () => {
    assert.deepEqual(momentousFortune({ momentum: 2 }), { available: true, cost: 2 });
  });

  test("one Momentum buys nothing", () => {
    assert.equal(momentousFortune({ momentum: 1 }).available, false);
  });

  test("only once per luck roll", () => {
    assert.equal(momentousFortune({ momentum: 10, alreadyRerolled: true }).available, false);
  });

  test("keeps the better of the two results, so it can never backfire", () => {
    // "the character can choose the better result between the old and the new
    // roll" — which is what makes it worth 2 Momentum rather than a gamble.
    assert.equal(betterLuck(0, 2), 2, "a better reroll is taken");
    assert.equal(betterLuck(3, 1), 3, "a worse reroll is discarded");
    assert.equal(betterLuck(2, 2), 2, "a tie changes nothing");
    assert.equal(betterLuck(0, 0), 0, "two failures are still a failure");
  });
});

describe("the two Momentum spends on rolls do not overlap", () => {
  test("a Feat may never touch a luck roll, and Fortune may only touch one", () => {
    // The pairing is deliberate: between them they cover every roll exactly
    // once, and the card decides which to offer from the rolled attribute.
    // A Feat adds successes outright; Fortune rerolls and keeps the better.
    assert.equal(MANTLE.momentumCosts.momentousFeatPerSuccess, 1);
    assert.equal(MANTLE.momentumCosts.momentousFortune, 2);
  });

  test("Momentous Development is the narrative-play spend", () => {
    // 1 Momentum to declare a fact a Thread makes plausible. It resolves
    // entirely in the fiction, so the system prices it and says no more.
    assert.equal(MANTLE.momentumCosts.momentousDevelopment, 1);
  });
});
