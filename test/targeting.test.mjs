// @ts-check

/**
 * Reach, range and visibility.
 *
 * The bands come straight from the ranged-attack penalty table in section 4
 * and the visibility table in section 8, so the numbers below are quoted from
 * the rules rather than chosen.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  attackModifiers,
  massAvailable,
  meleeReach,
  reachFromTags,
  rangedReach,
  visibilityReach
} from "../module/rules/targeting.mjs";
import { MANTLE } from "../module/config.mjs";

describe("ranged reach", () => {
  test("adjacent is awkward, however keen the attacker's senses", () => {
    assert.deepEqual(rangedReach({ distance: 1, sen: 12, maxRange: 20 }), {
      canTarget: true,
      penalty: -1,
      reason: "MANTLE.Targeting.adjacent"
    });
  });

  test("within SEN is clean", () => {
    assert.equal(rangedReach({ distance: 8, sen: 12, maxRange: 20 }).penalty, 0);
    assert.equal(rangedReach({ distance: 12, sen: 12, maxRange: 20 }).penalty, 0);
  });

  test("past SEN but inside maximum range costs a die", () => {
    assert.equal(rangedReach({ distance: 13, sen: 12, maxRange: 20 }).penalty, -1);
    assert.equal(rangedReach({ distance: 20, sen: 12, maxRange: 20 }).penalty, -1);
  });

  test("beyond maximum range cannot be targeted at all", () => {
    const result = rangedReach({ distance: 21, sen: 12, maxRange: 20 });
    assert.equal(result.canTarget, false);
  });

  test("SEN at or above maximum range leaves only the adjacent penalty", () => {
    // The rules note this explicitly: "if the attacker's SEN is greater or
    // equal to the maximum range, then any attack within maximum range will
    // have no penalty" — the adjacent row being the one exception.
    for (let distance = 2; distance <= 5; distance++) {
      assert.equal(rangedReach({ distance, sen: 10, maxRange: 5 }).penalty, 0, `${distance} squares`);
    }
    assert.equal(rangedReach({ distance: 1, sen: 10, maxRange: 5 }).penalty, -1);
  });
});

describe("melee reach", () => {
  test("a weapon either reaches or it does not, at no penalty either way", () => {
    assert.deepEqual(meleeReach({ distance: 1, reach: 1 }), {
      canTarget: true,
      penalty: 0,
      reason: "MANTLE.Targeting.inReach"
    });
    assert.equal(meleeReach({ distance: 2, reach: 2 }).canTarget, true);
    assert.equal(meleeReach({ distance: 3, reach: 2 }).canTarget, false);
    assert.equal(meleeReach({ distance: 3, reach: 2 }).penalty, 0);
  });
});

describe("visibility", () => {
  test("obscured costs two dice, hidden cannot be targeted", () => {
    assert.equal(visibilityReach("visible").penalty, 0);
    assert.equal(visibilityReach("obscured").penalty, -2);
    assert.equal(visibilityReach("hidden").canTarget, false);
  });
});

describe("cover", () => {
  test("takes Mass off the table for ranged attacks only", () => {
    assert.equal(massAvailable({ cover: true, ranged: true }), false);
    assert.equal(massAvailable({ cover: true, ranged: false }), true);
    assert.equal(massAvailable({ cover: false, ranged: true }), true);
  });
});

describe("the whole attack", () => {
  /** A clean melee swing at an adjacent, plainly visible target. */
  const base = {
    distance: 1,
    sen: 12,
    ranged: false,
    reach: 1,
    maxRange: null
  };

  test("nothing positional means no modifiers", () => {
    assert.deepEqual(attackModifiers(base), {
      canTarget: true,
      blockedBy: null,
      modifiers: []
    });
  });

  test("penalties stack: obscured, at the Mark, past SEN", () => {
    const result = attackModifiers({
      distance: 15,
      sen: 12,
      ranged: true,
      reach: null,
      maxRange: 20,
      visibility: "obscured",
      hitLocation: "mark"
    });

    assert.equal(result.canTarget, true);
    assert.deepEqual(result.modifiers, [
      { label: "MANTLE.Targeting.longRange", value: -1 },
      { label: "MANTLE.Visibility.obscured", value: -2 },
      { label: "MANTLE.HitLocation.mark", value: -3 }
    ]);
  });

  test("striking from hiding is worth two dice", () => {
    const result = attackModifiers({ ...base, hiddenAttacker: true });
    assert.deepEqual(result.modifiers, [{ label: "MANTLE.Modifier.hidden", value: 2 }]);
  });

  test("Frenzy sharpens melee only", () => {
    assert.deepEqual(attackModifiers({ ...base, frenzy: 3 }).modifiers, [
      { label: "MANTLE.Condition.frenzy", value: 3 }
    ]);

    const shot = attackModifiers({
      ...base,
      distance: 5,
      ranged: true,
      reach: null,
      maxRange: 10,
      frenzy: 3
    });
    assert.deepEqual(shot.modifiers, []);
  });

  test("an unmeasured distance contributes nothing rather than refusing", () => {
    // Plenty of tables run theatre-of-the-mind. No distance is not an error.
    const result = attackModifiers({ ...base, distance: null, reach: null });
    assert.equal(result.canTarget, true);
    assert.deepEqual(result.modifiers, []);
  });

  test("out of reach is reported as blocked, and names what blocked it", () => {
    const result = attackModifiers({ ...base, distance: 4 });
    assert.equal(result.canTarget, false);
    assert.equal(result.blockedBy, "MANTLE.Targeting.outOfReach");
  });

  test("the first refusal is the one reported", () => {
    // Both out of range and unseen. One reason is a message; two is a lecture.
    const result = attackModifiers({
      ...base,
      distance: 99,
      ranged: true,
      reach: null,
      maxRange: 10,
      visibility: "hidden"
    });
    assert.equal(result.blockedBy, "MANTLE.Targeting.beyondRange");
  });
});

describe("locations printed on a stat block", () => {
  const base = { distance: 1, sen: 12, ranged: false, reach: 1, maxRange: null };

  test("a named location carries the penalty the caller supplies", () => {
    // A Razorwing has Wings and no Mark. Those are its own locations, not keys
    // of the config table, so the penalty cannot be looked up — and before it
    // was passed in, aiming at a wing quietly cost nothing.
    const result = attackModifiers({ ...base, hitLocation: "wings", hitLocationPenalty: -2 });

    assert.deepEqual(result.modifiers, [{ label: "wings", value: -2 }]);
  });

  test("a config location still localizes through its key", () => {
    const result = attackModifiers({ ...base, hitLocation: "mark", hitLocationPenalty: -3 });

    assert.deepEqual(result.modifiers, [{ label: "MANTLE.HitLocation.mark", value: -3 }]);
  });

  test("without a supplied penalty the config table still answers", () => {
    const result = attackModifiers({ ...base, hitLocation: "edge" });

    assert.deepEqual(result.modifiers, [
      { label: "MANTLE.HitLocation.edge", value: MANTLE.hitLocations.edge.penalty }
    ]);
  });

  test("a location worth nothing adds nothing", () => {
    assert.deepEqual(attackModifiers({ ...base, hitLocation: "mass" }).modifiers, []);
    assert.deepEqual(
      attackModifiers({ ...base, hitLocation: "head", hitLocationPenalty: 0 }).modifiers,
      []
    );
  });
});

describe("reach and range read off a tag list", () => {
  test("a melee tag gives reach and no range", () => {
    assert.deepEqual(reachFromTags(["slashing", "melee 2"]), { melee: 2, range: null });
  });

  test("a range tag gives range and no reach", () => {
    assert.deepEqual(reachFromTags(["piercing", "range 6", "seeking"]), {
      melee: null,
      range: 6
    });
  });

  test("both is a weapon that does both", () => {
    assert.deepEqual(reachFromTags(["melee 1", "range 5"]), { melee: 1, range: 5 });
  });

  test("neither means melee at reach 1", () => {
    // What every unarmed stat block means by saying nothing at all.
    assert.deepEqual(reachFromTags(["crushing"]), { melee: 1, range: null });
    assert.deepEqual(reachFromTags([]), { melee: 1, range: null });
  });

  test("a tag that only looks like one is ignored", () => {
    // "Melee" with nothing after it, and "meleerange" — neither declares a
    // number, and reading NaN as a reach would refuse every attack.
    assert.deepEqual(reachFromTags(["melee", "ranged"]), { melee: 1, range: null });
  });

  test("case is not the stat block's problem", () => {
    assert.deepEqual(reachFromTags(["Melee 3"]), { melee: 3, range: null });
  });
});
