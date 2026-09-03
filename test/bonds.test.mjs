// @ts-check

/**
 * Bonds: intensity, capacity, and what a mutual Bond unlocks.
 *
 * Every figure below is from section 19 of the Quick Start (v0.31) — the
 * intensity table, the strain rule, and the two combat tables.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  bondCapacity,
  bondIntensity,
  bondManeuvers,
  mutualBond,
  strainBond,
  strandsForIntensity
} from "../module/rules/bonds.mjs";
import { MANTLE } from "../module/config.mjs";

describe("the intensity table", () => {
  test("matches the rules", () => {
    assert.deepEqual(MANTLE.bondIntensities, { 1: 1, 2: 3, 3: 6, 4: 10, 5: 15 });
  });

  test("no Strands means no Bond", () => {
    assert.equal(bondIntensity(0), 0);
  });

  test("each threshold is a total, not a cost", () => {
    for (const [level, needed] of Object.entries(MANTLE.bondIntensities)) {
      assert.equal(bondIntensity(needed), Number(level), `${needed} Strands is Bond ${level}`);
      assert.equal(bondIntensity(needed - 1), Number(level) - 1, `one short of Bond ${level}`);
    }
  });

  test("Strands past Unbreakable stay Unbreakable", () => {
    assert.equal(bondIntensity(15), 5);
    assert.equal(bondIntensity(40), 5);
  });

  test("intensity maps back to its floor", () => {
    assert.equal(strandsForIntensity(0), 0);
    assert.equal(strandsForIntensity(3), 6);
    assert.equal(strandsForIntensity(5), 15);
  });
});

describe("straining a Bond", () => {
  test("Bond 4 on 12 Strands falls to Bond 3 on 6", () => {
    // The rules' own worked example: Strands reset to the new level's floor,
    // so a strain costs more than the 2 Strands that were above the rung.
    assert.deepEqual(strainBond(12), { intensity: 3, strands: 6 });
  });

  test("straining a Fleeting Bond ends it", () => {
    assert.deepEqual(strainBond(2), { intensity: 0, strands: 0 });
  });

  test("there is nothing below no Bond at all", () => {
    assert.deepEqual(strainBond(0), { intensity: 0, strands: 0 });
  });
});

describe("holding Bonds", () => {
  test("room while under the cap", () => {
    const bonds = [{ strands: 1 }, { strands: 6 }];
    assert.deepEqual(bondCapacity(bonds, 4), { held: 2, counted: 2, cap: 4, room: true });
  });

  test("full at the cap", () => {
    const bonds = [{ strands: 1 }, { strands: 3 }, { strands: 6 }];
    assert.equal(bondCapacity(bonds, 3).room, false);
  });

  test("Unbreakable Bonds stop counting against the cap", () => {
    const bonds = [{ strands: 15 }, { strands: 3 }, { strands: 6 }];
    const capacity = bondCapacity(bonds, 3);

    assert.equal(capacity.held, 3);
    assert.equal(capacity.counted, 2);
    assert.equal(capacity.room, true);
  });
});

describe("mutual Bonds", () => {
  test("the lower of the two intensities is what is shared", () => {
    assert.equal(mutualBond(15, 6).mutual, 3);
    assert.equal(mutualBond(6, 15).mutual, 3);
  });

  test("an unreturned Bond shares nothing", () => {
    assert.deepEqual(mutualBond(15, 0), { mutual: 0, tandem: false, comboLimitBreaks: false });
  });

  test("mutual Bond 3 makes tandem partners", () => {
    const shared = mutualBond(6, 6);
    assert.equal(shared.tandem, true);
    assert.equal(shared.comboLimitBreaks, false);
  });

  test("mutual Bond 4 adds Combo Limit Breaks", () => {
    assert.deepEqual(mutualBond(10, 10), { mutual: 4, tandem: true, comboLimitBreaks: true });
  });
});

describe("Bond maneuvers", () => {
  /**
   * @param {ReturnType<typeof bondManeuvers>} list
   * @param {string} id
   */
  const find = (list, id) => {
    const entry = list.find((maneuver) => maneuver.id === id);
    assert.ok(entry, `${id} is offered`);
    return entry;
  };

  test("the table matches the rules", () => {
    assert.equal(MANTLE.bondManeuvers.invoke.intensity, 1);
    assert.equal(MANTLE.bondManeuvers.invoke.bonus, 2);
    assert.equal(MANTLE.bondManeuvers.stayWithMe.intensity, 2);
    assert.equal(MANTLE.bondManeuvers.comeBackToMe.intensity, 4);
    assert.equal(MANTLE.bondManeuvers.comeBackToMe.mutual, true);
  });

  test("every Bond maneuver costs Resolve, not Vigor", () => {
    for (const [id, maneuver] of Object.entries(MANTLE.bondManeuvers)) {
      assert.equal(maneuver.resolve, 1, `${id} costs 1 Resolve`);
      assert.equal("vigor" in maneuver, false, `${id} costs no Vigor`);
    }
  });

  test("a Fleeting Bond only Invokes", () => {
    const list = bondManeuvers({ strands: 1, resolve: 5 });

    assert.equal(find(list, "invoke").available, true);
    assert.equal(find(list, "stayWithMe").available, false);
    assert.equal(find(list, "stayWithMe").reason, "MANTLE.Bond.needsIntensity");
  });

  test("Bond 2 unlocks Stay With Me!", () => {
    assert.equal(find(bondManeuvers({ strands: 3, resolve: 5 }), "stayWithMe").available, true);
  });

  test("Come Back to Me! needs the Bond in both directions", () => {
    const oneSided = bondManeuvers({ strands: 15, theirStrands: 6, resolve: 5 });

    assert.equal(find(oneSided, "comeBackToMe").available, false);
    assert.equal(find(oneSided, "comeBackToMe").reason, "MANTLE.Bond.needsMutual");

    const shared = bondManeuvers({ strands: 10, theirStrands: 10, resolve: 5 });
    assert.equal(find(shared, "comeBackToMe").available, true);
  });

  test("no Resolve, no invocation", () => {
    const broke = bondManeuvers({ strands: 15, theirStrands: 15, resolve: 0 });

    for (const maneuver of broke) {
      assert.equal(maneuver.available, false, `${maneuver.id} is out of reach`);
      assert.equal(maneuver.reason, "MANTLE.Bond.needsResolve");
    }
  });

  test("Defeated and Lost characters cannot invoke at all", () => {
    const down = bondManeuvers({
      strands: 15,
      theirStrands: 15,
      resolve: 5,
      incapacitated: true
    });

    for (const maneuver of down) {
      assert.equal(maneuver.available, false, `${maneuver.id} is out of reach`);
      assert.equal(maneuver.reason, "MANTLE.Bond.incapacitated");
    }
  });
});

describe("tandem reactions", () => {
  test("cost Vigor as normal", () => {
    assert.equal(MANTLE.tandemReactions.tandemStrike.vigor, 2);
    assert.equal(MANTLE.tandemReactions.tandemAdvance.vigor, 2);
  });

  test("Tandem Strike grants +1d", () => {
    assert.equal(MANTLE.tandemReactions.tandemStrike.bonus, 1);
  });

  test("Tandem Defense costs whatever the chosen defense costs", () => {
    // Dodge and Deflect price themselves, so the table carries no figure.
    assert.equal(MANTLE.tandemReactions.tandemDefense.vigor, null);
  });
});
