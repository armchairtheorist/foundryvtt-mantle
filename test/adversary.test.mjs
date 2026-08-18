/**
 * Adversary scaling, checked against the catalog's own tables.
 *
 * The challenge class and tier tables are the two dials a GM turns most often,
 * and getting either wrong silently changes how deadly a night is — a Grunt
 * with 22 Vitality is not a Grunt. Every figure below is transcribed from the
 * Pre-Generated Enemies catalog (v0.21).
 *
 * Run with: npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  scaleAdversary,
  authoredHarmSlots,
  CHALLENGE_TEMPLATES,
  TIER_ADJUSTMENTS
} from "../module/rules/adversary.mjs";
import { build as buildAdversaries } from "../src/content/adversaries.mjs";
import { MANTLE } from "../module/config.mjs";

/** The Bandit Thug, the catalog's plainest Regular. */
const THUG = { challengeClass: "regular", vitality: 22, strain: 6 };

describe("challenge class templates", () => {
  test("Regular runs the stat block exactly as authored", () => {
    const scaled = scaleAdversary({ ...THUG });

    assert.equal(scaled.maxVitality, 22);
    assert.equal(scaled.maxStrain, 6);
    assert.equal(scaled.woundSlots, 0);
    assert.equal(scaled.turnsPerRound, 1);
    assert.equal(scaled.rollsDice, true);
    assert.equal(scaled.readsPatterns, false);
  });

  test("Grunt caps Vitality and Strain rather than replacing them", () => {
    const scaled = scaleAdversary({ ...THUG, template: "grunt" });

    // 10 (capped) and 4 (capped) — a Thug is trimmed down to them, and a
    // creature already below the cap keeps its own smaller number.
    assert.equal(scaled.maxVitality, 10);
    assert.equal(scaled.maxStrain, 4);

    const razorwing = scaleAdversary({ challengeClass: "regular", vitality: 8, strain: 3, template: "grunt" });
    assert.equal(razorwing.maxVitality, 8, "a cap is a ceiling, not a floor");
    assert.equal(razorwing.maxStrain, 3);
  });

  test("a Grunt never rolls — every action roll is exactly one success", () => {
    assert.equal(scaleAdversary({ ...THUG, template: "grunt" }).rollsDice, false);
  });

  test("Elite and Champion grant Wound and Burden slots", () => {
    assert.equal(scaleAdversary({ ...THUG, template: "elite" }).woundSlots, 1);
    assert.equal(scaleAdversary({ ...THUG, template: "elite" }).burdenSlots, 1);
    assert.equal(scaleAdversary({ ...THUG, template: "champion" }).woundSlots, 2);
    assert.equal(scaleAdversary({ ...THUG, template: "nemesis" }).burdenSlots, 3);
  });

  test("Champions take two turns a round and Nemeses three", () => {
    assert.equal(scaleAdversary({ ...THUG, template: "champion" }).turnsPerRound, 2);
    assert.equal(scaleAdversary({ ...THUG, template: "nemesis" }).turnsPerRound, 3);
  });

  test("only Champions and Nemeses read patterns", () => {
    for (const [key, entry] of Object.entries(CHALLENGE_TEMPLATES)) {
      assert.equal(entry.readsPatterns, ["champion", "nemesis"].includes(key), key);
    }
  });

  test("Nemesis adds to Vitality and Strain rather than capping them", () => {
    const scaled = scaleAdversary({ ...THUG, template: "nemesis" });
    assert.equal(scaled.maxVitality, 27);
    assert.equal(scaled.maxStrain, 11);
  });

  /**
   * The catalog is explicit: templates apply to Regular baselines only. A
   * Bandit Captain is authored at Elite and already carries Elite's slots, so
   * layering Elite on top would be double-counting.
   */
  test("a template on a non-Regular baseline is refused, not applied", () => {
    const captain = { challengeClass: "elite", vitality: 24, strain: 9 };
    const scaled = scaleAdversary({ ...captain, template: "nemesis" });

    assert.equal(scaled.templateIgnored, true);
    assert.equal(scaled.effectiveClass, "elite");
    assert.equal(scaled.maxVitality, 24, "the printed stat block is untouched");
    assert.equal(scaled.woundSlots, 1, "Elite's own slots, not Nemesis's");
  });
});

/* -------------------------------------------- */

describe("tiers of play", () => {
  test("Novice changes nothing", () => {
    const scaled = scaleAdversary({ ...THUG, tier: "novice" });
    assert.equal(scaled.maxVitality, 22);
    assert.equal(scaled.diceBonus, 0);
    assert.equal(scaled.extraManeuvers, 1);
  });

  test("each tier adds its printed dice, Vitality, and Strain", () => {
    const expected = {
      seasoned: { dice: 1, vitality: 27, strain: 8, maneuvers: 1 },
      veteran: { dice: 2, vitality: 32, strain: 10, maneuvers: 2 },
      paragon: { dice: 3, vitality: 37, strain: 12, maneuvers: 3 }
    };

    for (const [tier, want] of Object.entries(expected)) {
      const scaled = scaleAdversary({ ...THUG, tier });
      assert.equal(scaled.diceBonus, want.dice, `${tier}: dice`);
      assert.equal(scaled.maxVitality, want.vitality, `${tier}: vitality`);
      assert.equal(scaled.maxStrain, want.strain, `${tier}: strain`);
      assert.equal(scaled.extraManeuvers, want.maneuvers, `${tier}: maneuvers`);
    }
  });

  /**
   * Ordering matters and the catalog does not spell it out. Capping first
   * means a Seasoned Grunt is tougher than a Novice one, which is the reading
   * that keeps a Grunt scaling with the table it is fielded against.
   */
  test("a Grunt is capped first, then raised by its tier", () => {
    const scaled = scaleAdversary({ ...THUG, template: "grunt", tier: "seasoned" });
    assert.equal(scaled.maxVitality, 15, "10 capped, then +5 for Seasoned");
    assert.equal(scaled.maxStrain, 6, "4 capped, then +2");
  });

  test("every tier of play the system knows about has an adjustment", () => {
    for (const tier of Object.keys(MANTLE.tiers)) {
      assert.ok(TIER_ADJUSTMENTS[tier], `no adjustment for ${tier}`);
    }
  });
});

/* -------------------------------------------- */

describe("the enemy catalog", () => {
  const enemies = buildAdversaries();

  test("every challenge class in the catalog is one the system knows", () => {
    for (const enemy of enemies) {
      assert.ok(
        enemy.system.challengeClass in MANTLE.challengeClasses,
        `${enemy.name}: ${enemy.system.challengeClass}`
      );
    }
  });

  test("printed Wound slots agree with the challenge class", () => {
    for (const enemy of enemies) {
      const expected = authoredHarmSlots(enemy.system.challengeClass);
      assert.equal(enemy.system.woundSlots, expected.wounds, `${enemy.name}: wounds`);
      assert.equal(enemy.system.burdenSlots, expected.burdens, `${enemy.name}: burdens`);
    }
  });

  test("every enemy has a Mass hit location", () => {
    // Mass is the one location the rules guarantee — Edge and Mark are not
    // universal, which is why the Razorwing has Wings and no Mark.
    for (const enemy of enemies) {
      const names = enemy.system.hitLocations.map((/** @type {any} */ l) => l.name);
      assert.ok(names.includes("Mass"), `${enemy.name}: ${names.join(", ")}`);
    }
  });

  test("every enemy tag is one the system knows", () => {
    for (const enemy of enemies) {
      for (const tag of enemy.system.tags) {
        assert.ok(tag in MANTLE.enemyTags, `${enemy.name}: ${tag}`);
      }
    }
  });

  test("every enemy carries an Unarmed Attack, as the rules require", () => {
    for (const enemy of enemies) {
      const names = enemy.system.maneuvers.map((/** @type {any} */ m) => m.name);
      assert.ok(names.includes("Unarmed Attack"), enemy.name);
    }
  });

  test("every maneuver has a complete ladder and a pool", () => {
    for (const enemy of enemies) {
      for (const maneuver of enemy.system.maneuvers) {
        assert.ok(maneuver.pool > 0, `${enemy.name} / ${maneuver.name}: pool`);
        for (const band of ["0", "1", "2", "3"]) {
          assert.ok(maneuver.ladder[band], `${enemy.name} / ${maneuver.name}: band ${band}`);
        }
      }
    }
  });

  test("every signature maneuver is telegraphed", () => {
    // The two travel together throughout the catalog: a Signature is announced
    // on one turn and lands on the next, which is what makes it answerable.
    for (const enemy of enemies) {
      for (const maneuver of enemy.system.maneuvers) {
        if (maneuver.signature) {
          assert.equal(maneuver.telegraphed, true, `${enemy.name} / ${maneuver.name}`);
        }
      }
    }
  });

  test("hit location penalties are penalties, never bonuses", () => {
    for (const enemy of enemies) {
      for (const location of enemy.system.hitLocations) {
        assert.ok(location.penalty <= 0, `${enemy.name} / ${location.name}`);
      }
    }
  });

  test("the catalog covers Regular through Nemesis", () => {
    const classes = new Set(enemies.map((e) => e.system.challengeClass));
    assert.deepEqual([...classes].sort(), ["champion", "elite", "nemesis", "regular"]);
  });

  test("Sorrowmaw scales the way the Nemesis row says", () => {
    const drake = enemies.find((e) => e.name.startsWith("Sorrowmaw"));
    assert.ok(drake);

    // Authored at Nemesis, so it already carries the +5s and the 3/3 slots —
    // scaling must not add them a second time.
    const scaled = scaleAdversary({
      challengeClass: "nemesis",
      vitality: drake.system.vitality.max,
      strain: drake.system.strain.max
    });

    assert.equal(scaled.turnsPerRound, 3);
    assert.equal(scaled.woundSlots, 3);
    assert.equal(scaled.readsPatterns, true);

    // The printed 30 already includes everything Nemesis grants. Applying the
    // template row's +5 on top would quietly hand the drake 35.
    assert.equal(scaled.maxVitality, 30, "an authored class is not re-templated");
    assert.equal(scaled.maxStrain, 10);
  });

  test("no authored stat block is re-scaled by its own class", () => {
    for (const enemy of enemies) {
      const scaled = scaleAdversary({
        challengeClass: enemy.system.challengeClass,
        vitality: enemy.system.vitality.max,
        strain: enemy.system.strain.max
      });

      assert.equal(scaled.maxVitality, enemy.system.vitality.max, `${enemy.name}: vitality`);
      assert.equal(scaled.maxStrain, enemy.system.strain.max, `${enemy.name}: strain`);
    }
  });
});
