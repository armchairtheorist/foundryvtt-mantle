/**
 * The four pre-generated characters, used as the acceptance test for the
 * derived stat pipeline.
 *
 * Every expected number below is transcribed from the Pre-Generated Characters
 * catalog (v0.21), which prints each build fully computed. The bonuses are the
 * ones their archetypes, masteries, and equipment actually grant — so if a
 * formula in derive.mjs is wrong, or a bonus is misattributed, one of these
 * fails with the exact stat named.
 *
 * Run with: npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  deriveCharacter,
  deriveMaxBonds,
  deriveMaxStrain,
  deriveMaxVitality,
  deriveResolve,
  gatherBonuses,
  countSlotUsage,
  isInCrisis,
  isStressed,
  checkEquilibrium
} from "../module/data/derive.mjs";
import { MANTLE } from "../module/config.mjs";
import { build as buildPregens } from "../src/content/pregens.mjs";
import { build as buildMasteries } from "../src/content/masteries.mjs";
import { build as buildEquipment } from "../src/content/equipment.mjs";

/**
 * Assert every key of `expected` against the derived result, naming the stat in
 * the failure message so a red test says "maxVitality" rather than "deep equal".
 *
 * @param {Record<string, unknown>} actual
 * @param {Record<string, unknown>} expected
 * @param {string} who
 */
function expectStats(actual, expected, who) {
  for (const [key, want] of Object.entries(expected)) {
    assert.deepEqual(actual[key], want, `${who}: ${key}`);
  }
}

describe("Mira — Half-Elf R1 / Warrior R2", () => {
  // Half-Elf R1: +1 Max Vitality, +1 Max Strain
  // Warrior R1:  +1 Max Vitality, +1 Max Guard
  // Warrior R2:  +1 Max Vitality, +1 Max Guard
  // Chain Shirt: +2 Max Guard
  const mira = deriveCharacter({
    attributes: { pow: 0, agi: 3, rea: 0, ins: 1, pre: 0, luck: 0 },
    characterRank: 3,
    ancestry: { spd: 5, sen: 10, size: "1M" },
    bonuses: { vitality: 3, strain: 1, guard: 4 }
  });

  test("cores", () => {
    expectStats(mira.cores, { body: 3, mind: 1, soul: 0 }, "Mira");
  });

  test("derived stats match the printed stat block", () => {
    expectStats(
      mira,
      { maxVitality: 21, maxStrain: 5, maxResolve: 8, maxGuard: 4, spd: 5, sen: 10, languagesKnown: 1 },
      "Mira"
    );
    // 3 + BODY 3 / 2 = 4, with nothing on top: Combat Reflexes replaced her
    // Vigorous, and the formula reaches the same number without it.
    expectStats(mira, { maxVigor: 7, vigorRefresh: 4 }, "Mira vigor");
  });

  test("slots", () => {
    expectStats(mira.slots, { wound: 3, burden: 3, gear: 3, wondrous: 1, consumable: 2 }, "Mira slots");
    expectStats(mira.slots.mastery, { body: 3, mind: 1, soul: 0, wildcard: 1 }, "Mira mastery slots");
  });
});

describe("Kira — Dwarf R1 / Barbarian R2", () => {
  // Dwarf R1:     +2 Max Vitality
  // Barbarian R1: +2 Max Vitality
  // Barbarian R2: +2 Max Vitality
  // Plate Armor:  +3 Max Guard
  // Vigorous:     +1 Vigor refresh
  const kira = deriveCharacter({
    attributes: { pow: 2, agi: 0, rea: 0, ins: 1, pre: 0, luck: 1 },
    characterRank: 3,
    ancestry: { spd: 4, sen: 12, size: "1M" },
    bonuses: { vitality: 6, guard: 3 }
  });

  test("cores", () => {
    expectStats(kira.cores, { body: 2, mind: 1, soul: 1 }, "Kira");
  });

  test("derived stats match the printed stat block", () => {
    expectStats(
      kira,
      { maxVitality: 21, maxStrain: 5, maxResolve: 9, maxGuard: 3, spd: 4, sen: 12, languagesKnown: 1 },
      "Kira"
    );
    expectStats(kira, { maxVigor: 7, vigorRefresh: 4 }, "Kira vigor"); // 3 + BODY 2 / 2
  });

  test("slots — SOUL 1 grants one wondrous item slot", () => {
    expectStats(kira.slots, { wondrous: 1, consumable: 2 }, "Kira slots");
    expectStats(kira.slots.mastery, { body: 2, mind: 1, soul: 1, wildcard: 1 }, "Kira mastery slots");
  });
});

describe("Maya — Human R1 / Scholar R2", () => {
  // Human R1:   +1 Max Vitality, +1 Max Strain, +1 wildcard slot (Versatile)
  // Scholar R1: +1 Max Strain
  // Scholar R2: +1 Max Strain
  // Armored Cloak: +2 Max Guard
  // Iron Will:     +2 Max Strain
  const maya = deriveCharacter({
    attributes: { pow: 0, agi: 0, rea: 3, ins: 0, pre: 0, luck: 1 },
    characterRank: 3,
    ancestry: { spd: 5, sen: 10, size: "1M" },
    bonuses: { vitality: 1, strain: 5, guard: 2, masteryWildcard: 1 }
  });

  test("cores", () => {
    expectStats(maya.cores, { body: 0, mind: 3, soul: 1 }, "Maya");
  });

  test("derived stats match the printed stat block", () => {
    expectStats(
      maya,
      { maxVitality: 10, maxStrain: 12, maxResolve: 9, maxGuard: 2, languagesKnown: 4 },
      "Maya"
    );
  });

  test("BODY 0 contributes nothing, and the flat 3 is the floor", () => {
    // The point of the revised formula: the floor belongs to the flat part, not
    // to BODY's half. A BODY 0 caster refreshes 3, the same as a BODY 1 fighter,
    // and BODY only starts paying at 2.
    expectStats(maya, { maxVigor: 7, vigorRefresh: 3 }, "Maya vigor");
  });

  test("Versatile grants a second wildcard mastery slot", () => {
    expectStats(maya.slots.mastery, { body: 0, mind: 3, soul: 1, wildcard: 2 }, "Maya mastery slots");
  });
});

describe("Vera — Elf R1 / Channeler R2", () => {
  // Elf R1:       +2 Max Strain
  // Channeler R1: +1 Resolve
  // Channeler R2: +1 Resolve
  // Armored Cloak: +2 Max Guard
  // Vigorous:      +1 Vigor refresh
  const vera = deriveCharacter({
    attributes: { pow: 1, agi: 0, rea: 0, ins: 3, pre: 0, luck: 0 },
    characterRank: 3,
    ancestry: { spd: 6, sen: 15, size: "1M" },
    bonuses: { strain: 2, resolve: 2, guard: 2, vigorRefresh: 1 }
  });

  test("cores", () => {
    expectStats(vera.cores, { body: 1, mind: 3, soul: 0 }, "Vera");
  });

  test("derived stats match the printed stat block", () => {
    expectStats(
      vera,
      { maxVitality: 12, maxStrain: 8, maxResolve: 10, maxGuard: 2, spd: 6, sen: 15, languagesKnown: 1 },
      "Vera"
    );
    // 3 + BODY 1 / 2 = 3, and Vigorous — which she keeps — makes it 4.
    expectStats(vera, { maxVigor: 7, vigorRefresh: 4 }, "Vera vigor");
  });

  test("wondrous item slots follow MIND, not SOUL", () => {
    // v0.31 moved them. Vera is the clearest case in the catalog: SOUL 0 with
    // MIND 3, so she went from no wondrous slots to three.
    expectStats(vera.slots, { wondrous: 3 }, "Vera slots");
  });
});

describe("advancement cadence", () => {
  test("wildcard slots gain one per full 5 character ranks", () => {
    /** @param {number} rank */
    const at = (rank) =>
      deriveCharacter({
        attributes: { pow: 0, agi: 0, rea: 0, ins: 0, pre: 0, luck: 0 },
        characterRank: rank
      }).slots.mastery.wildcard;

    assert.equal(at(3), 1, "CR3");
    assert.equal(at(5), 2, "CR5");
    assert.equal(at(10), 3, "CR10");
    assert.equal(at(15), 4, "CR15");
    assert.equal(at(20), 5, "CR20");
  });

  test("Vigor cap gains one per full 7 character ranks", () => {
    /** @param {number} rank */
    const at = (rank) =>
      deriveCharacter({
        attributes: { pow: 0, agi: 0, rea: 0, ins: 0, pre: 0, luck: 0 },
        characterRank: rank
      }).maxVigor;

    assert.equal(at(3), 7, "CR3");
    assert.equal(at(7), 8, "CR7");
    assert.equal(at(14), 9, "CR14");
    assert.equal(at(21), 10, "CR21");
  });

  test("tiers of play map to the right rank bands", () => {
    /** @param {number} rank */
    const tierAt = (rank) =>
      deriveCharacter({
        attributes: { pow: 0, agi: 0, rea: 0, ins: 0, pre: 0, luck: 0 },
        characterRank: rank
      }).tier;

    assert.equal(tierAt(3).key, "novice");
    assert.equal(tierAt(8).key, "novice");
    assert.equal(tierAt(9).key, "seasoned");
    assert.equal(tierAt(15).key, "veteran");
    assert.equal(tierAt(21).key, "paragon");
    assert.equal(tierAt(99).key, "paragon");

    assert.equal(tierAt(3).limitBreakSlots, 1);
    assert.equal(tierAt(21).limitBreakSlots, 4);
  });
});

describe("equilibrium rule", () => {
  test("a spread of 4 is legal, 5 is not", () => {
    assert.equal(checkEquilibrium({ body: 6, mind: 2, soul: 3 }).legal, true);
    assert.equal(checkEquilibrium({ body: 7, mind: 2, soul: 3 }).legal, false);
    assert.equal(checkEquilibrium({ body: 7, mind: 3, soul: 3 }).legal, true);
  });
});

describe("states", () => {
  const slots = { woundSlots: 3, burdenSlots: 3 };

  test("Crisis triggers when either harm track runs out of slots", () => {
    assert.equal(isInCrisis({ wounds: 2, burdens: 2, ...slots }), false);
    assert.equal(isInCrisis({ wounds: 3, burdens: 0, ...slots }), true);
    assert.equal(isInCrisis({ wounds: 0, burdens: 3, ...slots }), true);
  });

  test("the two tracks are checked separately, not summed", () => {
    // Two Wounds and two Burdens is four pieces of harm and no Crisis; three
    // Wounds alone is three and Crisis. That is the point of the revision — the
    // character one hit from Defeated is the one the state should name, not the
    // one carrying a bit of everything.
    assert.equal(isInCrisis({ wounds: 2, burdens: 2, ...slots }), false);
    assert.equal(isInCrisis({ wounds: 3, burdens: 0, ...slots }), true);
  });

  test("extra slots postpone Crisis", () => {
    // The Ironman mastery grants a fourth Wound slot, and a character holding
    // three Wounds against four slots is not yet in Crisis.
    assert.equal(isInCrisis({ wounds: 3, burdens: 0, woundSlots: 4, burdenSlots: 3 }), false);
  });

  test("Crisis triggers on Faltering or Unraveling regardless of count", () => {
    assert.equal(isInCrisis({ wounds: 0, burdens: 0, ...slots, faltering: true }), true);
    assert.equal(isInCrisis({ wounds: 0, burdens: 0, ...slots, unraveling: true }), true);
  });

  test("Stressed is Strain at half Max Strain, rounded down", () => {
    // The book's example: Max Strain 7 means Stressed at 3 or more.
    assert.equal(isStressed(2, 7), false);
    assert.equal(isStressed(3, 7), true);
  });
});

describe("derived output shape", () => {
  // A live regression guard. prepareDerivedData used to do
  // Object.assign(this, deriveCharacter(...)), which silently overwrote stored
  // schema fields sharing a name — the `resolve` resource object became the
  // number 6, and the next line threw "Cannot create property 'max' on number".
  // The assign is now explicit, and these are the names that must never come
  // back from the derivation.
  const STORED_FIELDS = [
    "vitality",
    "strain",
    "guard",
    "vigor",
    "resolve",
    "consumables",
    "wounds",
    "burdens",
    "skills",
    "languages",
    "bonuses",
    "biography",
    "notes"
  ];

  test("no derived key collides with a stored schema field", () => {
    const derived = deriveCharacter({
      attributes: { pow: 1, agi: 1, rea: 1, ins: 1, pre: 1, luck: 1 },
      characterRank: 3
    });

    const collisions = Object.keys(derived).filter((key) => STORED_FIELDS.includes(key));
    assert.deepEqual(
      collisions,
      [],
      `derived keys shadow stored fields: ${collisions.join(", ")}`
    );
  });
});

/* -------------------------------------------- */

describe("the pregens ship as ready-to-play actors", () => {
  const pregens = buildPregens();
  const byName = new Map(pregens.map((p) => [p.name, p]));

  /**
   * Re-derive a built pregen the way the character sheet will, from its own
   * stored attributes and embedded items — no transcribed bonuses.
   *
   * @param {string} name
   */
  function derive(name) {
    const actor = byName.get(name);
    assert.ok(actor, `${name} is in the pack`);

    const archetypes = actor.items.filter((/** @type {any} */ i) => i.type === "archetype");

    return deriveCharacter({
      attributes: actor.system.attributes,
      characterRank: archetypes.reduce((/** @type {number} */ sum, /** @type {any} */ a) =>
        sum + a.system.rank, 0),
      ancestry: (() => {
        const ancestry = archetypes.find((/** @type {any} */ a) => a.system.kind === "ancestry");
        return ancestry
          ? { spd: ancestry.system.spd, sen: ancestry.system.sen, size: ancestry.system.size }
          : {};
      })(),
      bonuses: gatherBonuses({
        archetypes: archetypes.map((/** @type {any} */ a) => ({
          rank: a.system.rank,
          features: a.system.rankFeatures
        })),
        masteries: actor.items
          .filter((/** @type {any} */ i) => i.type === "mastery" && i.system.equipped)
          .map((/** @type {any} */ i) => i.system.bonuses),
        armor: actor.items
          .filter((/** @type {any} */ i) => i.type === "armor" && i.system.equipped)
          .map((/** @type {any} */ i) => ({ guard: i.system.guard }))
      })
    });
  }

  test("all four are present", () => {
    assert.deepEqual(pregens.map((p) => p.name).sort(), ["Kira", "Maya", "Mira", "Vera"]);
  });

  /**
   * The acceptance test for the whole pipeline: build a character from
   * catalog content alone and check the printed stat block falls out.
   *
   * The bonuses are not transcribed here the way they are above — they come
   * from the archetypes and armor the actor actually carries. So this catches
   * the class of error the transcribed tests cannot: a pregen given the wrong
   * archetype rank, or shipped without its armor.
   */
  test("each one reproduces its printed stat block from its own items", () => {
    // Maya's Max Strain is 12 rather than the catalog's printed 10: she traded
    // Vigorous for Iron Will, which is +2 Max Strain.
    const printed = {
      Mira: { maxVitality: 21, maxStrain: 5, maxResolve: 8, maxGuard: 4, spd: 5, sen: 10 },
      Kira: { maxVitality: 21, maxStrain: 5, maxResolve: 9, maxGuard: 3, spd: 4, sen: 12 },
      Maya: { maxVitality: 10, maxStrain: 12, maxResolve: 9, maxGuard: 2, spd: 5, sen: 10 },
      Vera: { maxVitality: 12, maxStrain: 8, maxResolve: 10, maxGuard: 2, spd: 6, sen: 15 }
    };

    for (const [name, expected] of Object.entries(printed)) {
      expectStats(derive(name), expected, name);
    }
  });

  test("every track starts at the maximum the sheet will compute", () => {
    // A pregen handed to a player mid-session should be ready to fight. A track
    // that starts at some other number reads as damage nobody dealt.
    for (const actor of pregens) {
      const derived = derive(actor.name);
      assert.equal(actor.system.vitality.value, derived.maxVitality, `${actor.name}: vitality`);
      assert.equal(actor.system.guard.value, derived.maxGuard, `${actor.name}: guard`);
      assert.equal(actor.system.resolve.value, derived.maxResolve, `${actor.name}: resolve`);
      assert.equal(actor.system.strain.value, 0, `${actor.name}: strain starts empty`);
    }
  });

  test("no build overspends a mastery board", () => {
    // The reason the repertoire board exists: without it both casters read as
    // three slots over on their own cores, which looks exactly like a bug.
    for (const actor of pregens) {
      const slots = derive(actor.name).slots.mastery;
      const used = countSlotUsage(
        actor.items.map((/** @type {any} */ item) => ({
          type: item.type,
          equipped: item.system.equipped === true,
          gearSlots: item.system.gearSlots,
          masteryType: item.system.masteryType,
          slotBoard: item.system.slotBoard,
          slotCost: item.system.slotCost
        }))
      ).mastery;

      for (const [board, total] of Object.entries(slots)) {
        assert.ok(
          used[board] <= total,
          `${actor.name}: ${board} board uses ${used[board]} of ${total}`
        );
      }
    }
  });

  test("each one refreshes the Vigor its stat block says", () => {
    // The four values the revised formula has to produce, from the four builds
    // that exercise every part of it: BODY 3 and BODY 2 reaching 4 unaided,
    // BODY 0 sitting on the flat floor, and BODY 1 reaching 4 only because
    // Vera keeps Vigorous.
    const expected = { Mira: 4, Kira: 4, Maya: 3, Vera: 4 };

    for (const [name, refresh] of Object.entries(expected)) {
      assert.equal(derive(name).vigorRefresh, refresh, `${name}: vigor refresh`);
    }
  });

  test("only Vera still carries Vigorous", () => {
    // The other three traded it away in the same revision that raised the base:
    // Mira for Combat Reflexes, Kira for Taunt, and Maya for Iron Will.
    const carriers = pregens
      .filter((actor) =>
        actor.items.some((/** @type {any} */ i) => i.name === "Vigorous" && i.system.equipped)
      )
      .map((actor) => actor.name);

    assert.deepEqual(carriers, ["Vera"]);
  });

  test("Vigorous is still in the masteries compendium as an optional pick", () => {
    // Dropped from three builds, not from the game.
    const vigorous = buildMasteries().find((m) => m.name === "Vigorous");
    assert.ok(vigorous, "Vigorous is still in the pack");
    assert.equal(vigorous.system.bonuses.vigorRefresh, 1, "effect unchanged");
  });

  test("Mira carries Combat Reflexes, which is what enables Forestall", () => {
    // The tag is granted at derivation time to every equipped melee weapon —
    // her Rapier and her Unarmed Attack alike — rather than baked into her copy
    // of the Rapier. Baking it in gave the Rapier the tag and left the fist
    // without it, and survived unequipping the mastery.
    const mira = byName.get("Mira");
    assert.ok(mira);

    const masteries = mira.items
      .filter((/** @type {any} */ i) => i.type === "mastery" && i.system.equipped)
      .map((/** @type {any} */ i) => i.name);
    assert.ok(masteries.includes("Combat Reflexes"), masteries.join(", "));

    const rapier = mira.items.find((/** @type {any} */ i) => i.name === "Rapier");
    const catalogRapier = buildEquipment().find((i) => i.name === "Rapier");
    assert.ok(rapier && catalogRapier);
    assert.deepEqual(
      rapier.system.tags,
      catalogRapier.system.tags,
      "her Rapier is the catalog Rapier, unmodified"
    );
  });

  test("each caster carries the Arts and Resonances their masteries grant", () => {
    // Maya's Ignis Resonance mastery is the slot she spent; the Ignis item is
    // what the Cast dialog offers. Shipping one without the other gives her a
    // spell list she cannot cast from.
    for (const name of ["Maya", "Vera"]) {
      const actor = byName.get(name);
      assert.ok(actor);

      const masteries = actor.items
        .filter((/** @type {any} */ i) => i.type === "mastery")
        .map((/** @type {any} */ i) => i.name);
      const granted = actor.items
        .filter((/** @type {any} */ i) => ["art", "resonance"].includes(i.type))
        .map((/** @type {any} */ i) => i.name);

      for (const mastery of masteries) {
        const base = mastery.replace(/ (Art|Resonance)$/, "");
        if (base === mastery) continue;
        assert.ok(granted.includes(base), `${name}: ${mastery} but no ${base}`);
      }

      assert.ok(granted.length > 0, `${name} has something to cast`);
    }
  });

  test("every embedded item is equipped, except the archetypes that cannot be", () => {
    for (const actor of pregens) {
      for (const item of actor.items) {
        if (item.type === "archetype") continue;
        assert.equal(item.system.equipped, true, `${actor.name}: ${item.name}`);
      }
    }
  });
});

describe("the v0.31 formula changes", () => {
  test("Resolve is SOUL + 8", () => {
    assert.equal(deriveResolve({ body: 0, mind: 0, soul: 0 }), 8);
    assert.equal(deriveResolve({ body: 0, mind: 0, soul: 2 }), 10);
  });

  test("Max Bonds is SOUL + 3", () => {
    // Derived ahead of the Bonds subsystem: the formula belongs with the
    // formulas. Unbreakable Bonds stop counting against it, which is the Bond
    // layer's business rather than this one's.
    assert.equal(deriveMaxBonds({ body: 0, mind: 0, soul: 0 }), 3);
    assert.equal(deriveMaxBonds({ body: 0, mind: 0, soul: 3 }), 6);
  });

  test("every formula the rules print is the one the code computes", () => {
    // Quoted from the v0.31 stat table, so a rules edit that moves any of them
    // fails here rather than at the table.
    const cores = { body: 2, mind: 1, soul: 1 };

    assert.equal(deriveMaxVitality(cores), (cores.body + 3) * 3, "(BODY + 3) x 3");
    assert.equal(deriveMaxStrain(cores), cores.mind + cores.soul + 3, "MIND + SOUL + 3");
    assert.equal(deriveResolve(cores), cores.soul + 8, "SOUL + 8");
    assert.equal(deriveMaxBonds(cores), cores.soul + 3, "SOUL + 3");
    assert.equal(MANTLE.baseline.maxVigor, 7, "Max Vigor = 7");
    assert.equal(MANTLE.baseline.maxGuard, 0, "Max Guard = 0");
    assert.equal(MANTLE.baseline.woundSlots, 3, "Wound Slots = 3");
    assert.equal(MANTLE.baseline.burdenSlots, 3, "Burden Slots = 3");
    assert.equal(MANTLE.baseline.gearSlots, 3, "Gear Slots = 3");
    assert.equal(MANTLE.baseline.consumablePoints, 2, "Consumable Points = 2");
  });
});
