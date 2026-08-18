/**
 * Compendium content tests.
 *
 * The valuable check here is a cross-reference rather than a self-consistency
 * one: the archetype bonuses transcribed from the Archetypes Catalog are summed
 * for each pre-generated character's build and compared against what the
 * Pre-Generated Characters catalog independently prints. Two documents written
 * separately have to agree, so a transcription slip in either shows up here.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { build as buildArchetypes } from "../src/content/archetypes.mjs";
import { build as buildMasteries } from "../src/content/masteries.mjs";
import { build as buildEquipment } from "../src/content/equipment.mjs";
import { build as buildLimitBreaks } from "../src/content/limitbreaks.mjs";
import { MANTLE } from "../module/config.mjs";
import { deriveCharacter, gatherBonuses } from "../module/data/derive.mjs";

const archetypes = buildArchetypes();

/** The bonuses these tests assert on. gatherBonuses returns every accumulator;
 *  the rest are zero for every archetype in the catalog and would only make the
 *  expected objects below harder to read. */
const TRACKED = ["vitality", "strain", "resolve", "guard", "masteryWildcard", "masteryRepertoire"];

/**
 * Total the bonuses a build grants, through the same `gatherBonuses` the
 * character model runs.
 *
 * Calling the real function rather than re-summing here is the point: a test
 * with its own copy of the arithmetic passes happily while the code it is
 * meant to guard drifts away from it.
 *
 * @param {Array<[string, number]>} build - Archetype name and rank held
 * @returns {Record<string, number>}
 */
function combined(build) {
  const totals = gatherBonuses({
    archetypes: build.map(([name, rank]) => {
      const archetype = archetypes.find((a) => a.name === name);
      assert.ok(archetype, `archetype ${name} exists`);
      return { rank, features: archetype.system.rankFeatures };
    })
  });

  const all = /** @type {Record<string, number>} */ (totals);
  return Object.fromEntries(TRACKED.map((key) => [key, all[key]]));
}

describe("archetype bonuses match the pre-generated characters", () => {
  test("Mira — Half-Elf R1 / Warrior R2", () => {
    assert.deepEqual(combined([["Half-Elf", 1], ["Warrior", 2]]), {
      vitality: 3,
      strain: 1,
      resolve: 0,
      guard: 2, // the other 2 Guard come from her Chain Shirt
      masteryWildcard: 0,
      masteryRepertoire: 0
    });
  });

  test("Kira — Dwarf R1 / Barbarian R2", () => {
    assert.deepEqual(combined([["Dwarf", 1], ["Barbarian", 2]]), {
      vitality: 6,
      strain: 0,
      resolve: 0,
      guard: 0, // all 3 Guard come from Plate Armor
      masteryWildcard: 0,
      masteryRepertoire: 0
    });
  });

  test("Maya — Human R1 / Scholar R2, including Versatile's wildcard slot", () => {
    assert.deepEqual(combined([["Human", 1], ["Scholar", 2]]), {
      vitality: 1,
      strain: 3,
      resolve: 0,
      guard: 0,
      masteryWildcard: 1,
      masteryRepertoire: 3 // Starting Repertoire, for the Arts and Resonances
    });
  });

  test("Vera — Elf R1 / Channeler R2", () => {
    assert.deepEqual(combined([["Elf", 1], ["Channeler", 2]]), {
      vitality: 0,
      strain: 2,
      resolve: 2,
      guard: 0,
      masteryWildcard: 0,
      masteryRepertoire: 3 // Starting Repertoire, for the Arts and Resonances
    });
  });

  test("a rank 1 Warrior does not receive rank 2's bonuses", () => {
    // The reason archetype bonuses are data summed per rank rather than Active
    // Effects: effects are not rank-aware without one effect per rank.
    assert.equal(combined([["Warrior", 1]]).guard, 1);
    assert.equal(combined([["Warrior", 3]]).guard, 3);
  });
});

describe("end to end, content through to derived stats", () => {
  test("Mira's printed stat block reproduces from catalog content", () => {
    const archetypeBonuses = combined([["Half-Elf", 1], ["Warrior", 2]]);
    const chainShirt = buildEquipment().find((i) => i.name === "Chain Shirt");
    const vigorous = buildMasteries().find((i) => i.name === "Vigorous");

    assert.ok(chainShirt, "Chain Shirt is in the equipment pack");
    assert.ok(vigorous, "Vigorous is in the masteries pack");

    const derived = deriveCharacter({
      attributes: { pow: 0, agi: 3, rea: 0, ins: 1, pre: 0, luck: 0 },
      characterRank: 3,
      ancestry: { spd: 5, sen: 10, size: "1M" },
      bonuses: {
        ...archetypeBonuses,
        guard: archetypeBonuses.guard + chainShirt.system.guard,
        vigorRefresh: 1 // Vigorous
      }
    });

    assert.equal(derived.maxVitality, 21);
    assert.equal(derived.maxStrain, 5);
    assert.equal(derived.maxResolve, 6);
    assert.equal(derived.maxGuard, 4);
    assert.equal(derived.vigorRefresh, 4);
  });
});

describe("catalog coverage", () => {
  test("every mastery domain in the catalog is present", () => {
    const domains = new Set(buildMasteries().map((m) => m.system.domain));
    for (const expected of ["general", "martial", "warrior", "barbarian", "magic", "scholar", "channeler", "human", "elf", "dwarf"]) {
      assert.ok(domains.has(expected), `${expected} domain has masteries`);
    }
  });

  test("mastery set members are consistent with the set table", () => {
    const masteries = buildMasteries();
    /** @param {string} set */
    const membersOf = (set) => masteries.filter((m) => m.system.sets.includes(set)).map((m) => m.name).sort();

    assert.deepEqual(membersOf("Bloodbath"), ["Blood Scent", "Bloodfeast", "Bloodlust", "Bloody Armor"]);
    assert.deepEqual(membersOf("Shukuchi"), ["Alacrity", "Fleeting Spirit", "Lightning Reflexes", "Quick Mind"]);
    assert.deepEqual(membersOf("Benkei"), ["Abundance", "Quartermaster", "Shield Master", "Weapon Specialization"]);
    assert.deepEqual(membersOf("Overflowing Fortune"), ["Fortune's Blessing", "Fortune's Escape", "Shared Fortune"]);
  });

  test("a mastery can belong to more than one set", () => {
    // Aggression is in both Peak Human Condition and Human Excellence, which is
    // why sets is a list rather than a single name.
    const aggression = buildMasteries().find((m) => m.name === "Aggression");
    assert.ok(aggression);
    assert.deepEqual(aggression.system.sets.sort(), ["Human Excellence", "Peak Human Condition"]);
  });

  test("superheavy weapons cost two gear slots' worth of weight class", () => {
    const superheavy = buildEquipment().filter((i) => i.system.weightClass === "superheavy");
    assert.equal(superheavy.length, 4, "Great Maul, Zambato, War Scythe, Greatlance");
  });

  test("every weapon has a complete damage ladder", () => {
    for (const weapon of buildEquipment().filter((i) => i.type === "weapon")) {
      for (const band of ["0", "1", "2", "3"]) {
        assert.ok(weapon.system.damage[band], `${weapon.name} band ${band}`);
      }
    }
  });

  test("the Unarmed Attack is intrinsic, so it costs no gear slot", () => {
    const unarmed = buildEquipment().find((i) => i.name === "Unarmed Attack");
    assert.ok(unarmed);
    assert.equal(unarmed.system.intrinsic, true);
    assert.equal(unarmed.system.equipped, true, "an intrinsic weapon cannot be put down");
  });

  test("the intrinsic profile in CONFIG matches the catalog entry", () => {
    // Characters who do not own the item roll from CONFIG instead, so the two
    // have to agree or the same punch does different damage depending on
    // whether the player happened to drag the item across.
    const unarmed = buildEquipment().find((i) => i.name === "Unarmed Attack");
    assert.ok(unarmed);
    const profile = MANTLE.unarmedAttack;

    assert.equal(profile.weightClass, unarmed.system.weightClass);
    assert.equal(profile.attribute, unarmed.system.attribute);
    assert.deepEqual(profile.damageTypes, unarmed.system.damageTypes);
    assert.equal(profile.melee, unarmed.system.melee);
    const catalog = /** @type {Record<string, string>} */ (unarmed.system.damage);
    const intrinsic = /** @type {Record<string, string>} */ (profile.damage);
    for (const band of ["0", "1", "2", "3"]) {
      assert.equal(intrinsic[band], catalog[band], `band ${band}`);
    }
  });
});

/* -------------------------------------------- */

describe("limit breaks", () => {
  test("General Limit Breaks gate on a core, Archetype ones on realization", () => {
    for (const lb of buildLimitBreaks()) {
      if (lb.system.category === "general") {
        assert.ok(lb.system.requiredCore, `${lb.name}: needs a core gate`);
        assert.ok(lb.system.requiredCoreValue > 0, `${lb.name}: needs a core minimum`);
        assert.equal(lb.system.requiredArchetype, "", `${lb.name}: is not archetype-gated`);
      } else {
        assert.ok(lb.system.requiredArchetype, `${lb.name}: needs an archetype`);
        assert.equal(lb.system.requiredCore, "", `${lb.name}: carries no attribute gate`);
      }
    }
  });

  test("every gated core is one the system knows about", () => {
    for (const lb of buildLimitBreaks()) {
      if (!lb.system.requiredCore) continue;
      assert.ok(lb.system.requiredCore in MANTLE.cores, `${lb.name}: ${lb.system.requiredCore}`);
    }
  });

  test("the catalog's two Limit Break kinds are both represented", () => {
    const categories = new Set(buildLimitBreaks().map((lb) => lb.system.category));
    assert.deepEqual([...categories].sort(), ["archetype", "general"]);
  });
});
