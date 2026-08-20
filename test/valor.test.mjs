// @ts-check

/**
 * Valor and what it buys.
 *
 * Every figure below is from section 10 of the Quick Start (v0.21): the
 * spending table, and the two routes into a Limit Break.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { heroicFeatSuccesses, heroicFortune, limitBreakRoutes } from "../module/rules/valor.mjs";
import { MANTLE } from "../module/config.mjs";

describe("the spending table", () => {
  test("matches the rules", () => {
    assert.equal(MANTLE.valorCosts.limitBreak, 3);
    assert.equal(MANTLE.valorCosts.heroicFortune, 2);
    assert.equal(MANTLE.valorCosts.heroicFeatPerSuccess, 1);
    assert.equal(MANTLE.heroicFeatMaxSuccesses, 3);
  });
});

describe("paying for a Limit Break", () => {
  test("three Valor is the ordinary route", () => {
    assert.deepEqual(limitBreakRoutes({ valor: 3, crisis: false, crisisUsed: false }), [
      { route: "valor", cost: 3, exhausts: false }
    ]);
  });

  test("two Valor buys nothing", () => {
    assert.deepEqual(limitBreakRoutes({ valor: 2, crisis: false, crisisUsed: false }), []);
  });

  test("Crisis is free but exhausts, and only once", () => {
    assert.deepEqual(limitBreakRoutes({ valor: 0, crisis: true, crisisUsed: false }), [
      { route: "crisis", cost: 0, exhausts: true }
    ]);
    assert.deepEqual(limitBreakRoutes({ valor: 0, crisis: true, crisisUsed: true }), []);
  });

  test("a character in Crisis with Valor to spare gets the choice", () => {
    // Worth offering both: paying the Valor avoids Exhausted, but the pool is
    // shared and someone else may need it more.
    const routes = limitBreakRoutes({ valor: 5, crisis: true, crisisUsed: false });
    assert.deepEqual(
      routes.map((r) => r.route),
      ["valor", "crisis"]
    );
  });
});

describe("Heroic Feat", () => {
  test("one success per Valor, capped at three", () => {
    assert.equal(heroicFeatSuccesses(0), 0);
    assert.equal(heroicFeatSuccesses(2), 2);
    assert.equal(heroicFeatSuccesses(3), 3);
    assert.equal(heroicFeatSuccesses(99), 3);
  });

  test("never more than asked for", () => {
    assert.equal(heroicFeatSuccesses(10, 1), 1);
    assert.equal(heroicFeatSuccesses(10, 0), 0);
  });

  test("a pool that cannot afford what was asked gives what it can", () => {
    assert.equal(heroicFeatSuccesses(1, 3), 1);
  });
});

describe("Heroic Fortune", () => {
  test("downgrades severity by one for two Valor", () => {
    assert.deepEqual(heroicFortune({ valor: 2, severity: 3 }), {
      available: true,
      cost: 2,
      severityAfter: 2
    });
  });

  test("cannot buy off a severity 1 — there is no severity 0", () => {
    const result = heroicFortune({ valor: 10, severity: 1 });
    assert.equal(result.available, false);
    assert.equal(result.severityAfter, 1);
  });

  test("only once per Wound or Burden", () => {
    assert.equal(heroicFortune({ valor: 10, severity: 3, alreadyApplied: true }).available, false);
  });

  test("an empty pool buys nothing", () => {
    assert.equal(heroicFortune({ valor: 1, severity: 3 }).available, false);
  });
});
