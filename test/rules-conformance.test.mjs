/**
 * The compendium content, checked against the canonical rules documents.
 *
 * `docs/rules/` holds the Mantle rulebooks themselves. Every number in the
 * content packs was transcribed from them by hand, and a transcription is only
 * as good as the last time somebody re-read both. This parses the documents and
 * compares them to what the packs actually build, so a weapon whose ladder
 * drifts — or a rules revision that lands in the docs and not in the code — is
 * a failing test rather than a surprise at the table.
 *
 * Deliberately narrow. It checks the parts of the rules that are *tabular*:
 * weapon stat blocks, the mastery tables, and the condition list. Prose is not
 * parsed, and effects are compared by presence rather than by wording, because
 * a test that demanded the two match word for word would fail on every
 * copy-edit and teach everyone to ignore it.
 *
 * Run with: npm test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build as buildEquipment } from "../src/content/equipment.mjs";
import { build as buildMasteries } from "../src/content/masteries.mjs";
import { build as buildAdversaries } from "../src/content/adversaries.mjs";
import { MANTLE } from "../module/config.mjs";

/**
 * Read one of the canonical documents.
 *
 * @param {string} name
 * @returns {string}
 */
function rules(name) {
  return readFileSync(
    fileURLToPath(new URL(`../docs/rules/mantle-${name}-v0.21.md`, import.meta.url)),
    "utf8"
  );
}

/* -------------------------------------------- */

/**
 * Every `[WEAPON] Name (tags)` stat block in the Equipment catalog, with the
 * four-band ladder that follows it.
 *
 * @returns {Map<string, {tags: string[], damage: number[], special: string}>}
 */
/** Every `[CONDITION]` block, capturing its name and its whole body. */
const BLOCK = /^\[CONDITION\]\s*(.+)$([\s\S]*?)(?=^```)/gm;

/** A row of the section 7 summary table: name | stackable | clear type. */
const TABLE_ROW = /^\|\s*([A-Z][A-Za-z ()]+?)\s*\|\s*(yes[^|]*|no)\s*\|\s*(auto-clear|roll-to-clear[^|]*|persistent)\s*\|$/gm;

function parseWeapons() {
  const blocks = rules("equipment").split("```").filter((block) => block.includes("[WEAPON]"));
  /** @type {Map<string, {tags: string[], damage: number[], special: string}>} */
  const weapons = new Map();

  for (const block of blocks) {
    const header = block.match(/\[WEAPON\]\s+(.+?)\s*\((.+?)\)/);
    if (!header) continue;

    const damage = [...block.matchAll(/^-\s*(?:0s|1s|2s|3\+):\s*(\d+)\s*damage/gm)].map((m) =>
      Number(m[1])
    );

    weapons.set(header[1].trim(), {
      tags: header[2].split(",").map((tag) => tag.trim().toLowerCase()),
      damage,
      special: block.match(/^Special:\s*(.+)$/m)?.[1]?.trim() ?? ""
    });
  }

  return weapons;
}

/**
 * Every row of the Masteries catalog tables.
 *
 * @returns {Map<string, {type: string, slots: number, effect: string}>}
 */
function parseMasteries() {
  /** @type {Map<string, {type: string, slots: number, effect: string}>} */
  const masteries = new Map();

  for (const line of rules("masteries").split("\n")) {
    // Domain | Name | CORE | slots | effect — the separator rows and the
    // header both fail the CORE and slot-count match, so they drop out.
    const row = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(BODY|MIND|SOUL)\s*\|\s*(\d+)\s*\|\s*(.*?)\s*\|$/);
    if (!row) continue;

    masteries.set(row[2], {
      type: row[3].toLowerCase(),
      slots: Number(row[4]),
      effect: row[5]
    });
  }

  return masteries;
}

/* -------------------------------------------- */

describe("weapons match the Equipment catalog", () => {
  const canonical = parseWeapons();
  const built = new Map(
    buildEquipment()
      .filter((doc) => doc.type === "weapon")
      .map((doc) => [doc.name, doc])
  );

  test("the catalog parsed at all", () => {
    // A parser that silently matches nothing would make every check below
    // vacuously pass, which is worse than no test.
    assert.ok(canonical.size > 20, `parsed ${canonical.size} weapons`);
  });

  test("every weapon in the catalog is in the pack", () => {
    for (const name of canonical.keys()) {
      assert.ok(built.has(name), `${name} is missing from the equipment pack`);
    }
  });

  test("every damage ladder matches, band for band", () => {
    for (const [name, weapon] of canonical) {
      const ladder = built.get(name)?.system.damage;
      assert.ok(ladder, name);

      weapon.damage.forEach((amount, index) => {
        assert.equal(
          ladder[String(index)],
          `${amount} damage`,
          `${name} band ${index}`
        );
      });
    }
  });

  test("every damage type on a stat block is carried by the item", () => {
    for (const [name, weapon] of canonical) {
      const built_ = built.get(name);
      assert.ok(built_);

      // A "Slashing/Piercing" header is one tag naming two types.
      const declared = weapon.tags
        .flatMap((tag) => tag.split("/"))
        .filter((tag) => tag in MANTLE.damageTypes);

      for (const type of declared) {
        assert.ok(
          built_.system.damageTypes.includes(type),
          `${name}: catalog says ${type}, item has ${built_.system.damageTypes.join(", ")}`
        );
      }
    }
  });

  test("every weapon tag on a stat block is carried by the item", () => {
    for (const [name, weapon] of canonical) {
      const built_ = built.get(name);
      assert.ok(built_);

      for (const tag of weapon.tags) {
        if (!(tag in MANTLE.weaponTags)) continue;
        assert.ok(built_.system.tags.includes(tag), `${name}: missing tag ${tag}`);
      }
    }
  });

  /**
   * "Slashing/Piercing" is the catalog's notation for a choice made per attack,
   * and it is exactly what `dualType` means. The two have to agree in both
   * directions: a flag on a weapon the catalog does not mark would let it dodge
   * a resistance, and a missing one would silently pick a type for the player.
   */
  test("dual-type weapons are exactly the ones the catalog slashes together", () => {
    for (const [name, weapon] of canonical) {
      const dual = weapon.tags.some((tag) => tag.includes("/") && tag.includes("slashing"));
      assert.equal(
        built.get(name)?.system.dualType,
        dual,
        `${name}: catalog ${dual ? "is" : "is not"} Slashing/Piercing`
      );
    }
  });

  test("every Special note in the catalog reaches the item", () => {
    for (const [name, weapon] of canonical) {
      if (!weapon.special) continue;
      assert.equal(built.get(name)?.system.special, weapon.special, `${name}: special`);
    }
  });

  test("melee reach and range match the header", () => {
    for (const [name, weapon] of canonical) {
      const built_ = built.get(name);
      assert.ok(built_);

      const melee = weapon.tags.find((tag) => tag.startsWith("melee "));
      const range = weapon.tags.find((tag) => tag.startsWith("range "));

      assert.equal(
        built_.system.melee,
        melee ? Number(melee.split(" ")[1]) : null,
        `${name}: melee`
      );
      assert.equal(
        built_.system.range,
        range ? Number(range.split(" ")[1]) : null,
        `${name}: range`
      );
    }
  });
});

/* -------------------------------------------- */

describe("masteries match the Masteries catalog", () => {
  const canonical = parseMasteries();
  const built = new Map(buildMasteries().map((doc) => [doc.name, doc]));

  test("the catalog parsed at all", () => {
    assert.ok(canonical.size > 50, `parsed ${canonical.size} masteries`);
  });

  test("the pack holds exactly the catalog's masteries", () => {
    const missing = [...canonical.keys()].filter((name) => !built.has(name));
    const extra = [...built.keys()].filter((name) => !canonical.has(name));

    assert.deepEqual(missing, [], "in the catalog but not the pack");
    assert.deepEqual(extra, [], "in the pack but not the catalog");
  });

  test("every mastery's core and slot cost match", () => {
    for (const [name, mastery] of canonical) {
      assert.equal(built.get(name)?.system.masteryType, mastery.type, `${name}: core`);
      assert.equal(built.get(name)?.system.slotCost, mastery.slots, `${name}: slots`);
    }
  });

  /**
   * Vigor costs printed inside a mastery's effect text are the ones a player
   * reads off the sheet, so a revision that changes one — Wild Swing going from
   * 4 to 5 — has to reach the pack.
   */
  test("every Vigor cost quoted in an effect matches", () => {
    for (const [name, mastery] of canonical) {
      const cost = mastery.effect.match(/\(Vigor (\d+)\)/);
      if (!cost) continue;

      assert.match(
        built.get(name)?.system.description ?? "",
        new RegExp(`Vigor ${cost[1]}\\)`),
        `${name}: catalog says Vigor ${cost[1]}`
      );
    }
  });
});

/* -------------------------------------------- */

describe("conditions match the rules", () => {
  /**
   * Every condition, from every `[CONDITION]` block in every rules document.
   *
   * Not the section 7 summary table: that table is a summary, and two real
   * conditions live outside it — Invisible, defined under Invisibility in
   * section 8, and Frenzy, defined in the Barbarian archetype. Reading the
   * table alone is what led to Invisible being deleted from CONFIG as an
   * invention. The blocks are the definition; the table is a convenience.
   */
  const canonical = [
    ...rules("quickstart").matchAll(BLOCK),
    ...rules("archetypes").matchAll(BLOCK),
    ...rules("masteries").matchAll(BLOCK),
    ...rules("spellcasting").matchAll(BLOCK),
    ...rules("limit-breaks").matchAll(BLOCK)
  ].map((block) => {
    const body = block[0];
    const stackable = /Stackable:\s*yes/i.test(body);
    const clear = body.match(/Clear[- ]Type:\s*(\w+)/i)?.[1].toLowerCase() ?? "";

    return {
      // "Wracked (Damage Type)" is `wracked`; the rest lowercase directly.
      id: block[1].replace(/\s*\(.*\)$/, "").trim().toLowerCase(),
      name: block[1].trim(),
      stackable,
      // "yes (max 3)" is the norm; Faltering and Unraveling say "unlimited".
      uncapped: /Stackable:[^\n]*(unlimited|uncapped|no max)/i.test(body),
      clear: clear.startsWith("auto") ? "auto" : clear.startsWith("roll") ? "roll" : "persistent"
    };
  });

  test("the blocks parsed at all", () => {
    assert.ok(canonical.length >= 18, `parsed ${canonical.length} conditions`);

    // The two that live outside section 7 are the whole reason this reads
    // blocks rather than the table. If a rules edit ever moves them, the rest
    // of this suite would quietly stop covering them.
    const ids = canonical.map((c) => c.id);
    assert.ok(ids.includes("invisible"), "Invisible, from section 8");
    assert.ok(ids.includes("frenzy"), "Frenzy, from the Barbarian archetype");
  });

  test("the system knows every condition the rules define", () => {
    for (const condition of canonical) {
      assert.ok(condition.id in MANTLE.conditions, `${condition.name} → ${condition.id}`);
    }
  });

  test("stackability and clear type match, condition for condition", () => {
    for (const condition of canonical) {
      const known = /** @type {Record<string, any>} */ (MANTLE.conditions)[condition.id];

      assert.equal(Boolean(known.stackable), condition.stackable, `${condition.id}: stackable`);
      assert.equal(known.clear, condition.clear, `${condition.id}: clear type`);

      // Faltering and Unraveling are the only two without a cap of 3.
      if (condition.uncapped) assert.equal(known.cap, Infinity, `${condition.id}: uncapped`);
    }
  });

  test("the system invents no condition the rules do not have", () => {
    const defined = new Set(canonical.map((c) => c.id));

    for (const id of Object.keys(MANTLE.conditions)) {
      assert.ok(defined.has(id), `${id} is in CONFIG but no rules document defines it`);
    }
  });

  test("the section 7 table agrees with the blocks it summarizes", () => {
    // The table is not the source of truth, but a table that disagrees with a
    // block is a rules bug worth surfacing to the author.
    const table = [...rules("quickstart").matchAll(TABLE_ROW)].map((row) => ({
      id: row[1].replace(/\s*\(.*\)$/, "").trim().toLowerCase(),
      stackable: row[2].startsWith("yes")
    }));

    assert.ok(table.length >= 16, `parsed ${table.length} table rows`);

    for (const row of table) {
      const block = canonical.find((c) => c.id === row.id);
      assert.ok(block, `${row.id} is in the table but has no [CONDITION] block`);
      assert.equal(block.stackable, row.stackable, `${row.id}: table vs block`);
    }
  });
});

/* -------------------------------------------- */

describe("adversaries match the Pre-Generated Enemies catalog", () => {
  const enemies = readFileSync(
    fileURLToPath(new URL("../docs/rules/mantle-pregen-enemies-v0.21.md", import.meta.url)),
    "utf8"
  );
  const built = new Map(buildAdversaries().map((doc) => [doc.name, doc]));

  /**
   * The stat block under a given creature's heading.
   *
   * Sliced by heading rather than parsed as a whole, because the two tables
   * that matter — the class row and the attribute row — are positional, and
   * matching them across the whole document would find the wrong creature's.
   *
   * @param {string} name
   * @returns {string}
   */
  function block(name) {
    const start = enemies.indexOf(`### ${name}`);
    assert.ok(start >= 0, `${name} has a heading in the catalog`);

    const next = enemies.indexOf("\n### ", start + 5);
    return enemies.slice(start, next < 0 ? undefined : next);
  }

  test("every enemy in the pack is in the catalog, and the reverse", () => {
    // Headings that are section titles rather than creatures have no class row,
    // which is what separates them.
    const headings = [...enemies.matchAll(/^### (.+)$/gm)]
      .map((row) => row[1].trim())
      .filter((name) => /^\|\s*(Grunt|Regular|Elite|Champion|Nemesis)\s*\|/m.test(block(name)));

    assert.deepEqual([...built.keys()].sort(), headings.sort());
  });

  test("challenge class, tracks, and slots match the printed block", () => {
    for (const [name, doc] of built) {
      const row = block(name).match(
        /^\|\s*(Grunt|Regular|Elite|Champion|Nemesis)\s*\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/m
      );
      assert.ok(row, `${name}: class row`);

      const [, klass, tags, vitality, wounds, strain, burdens, guard] = row;

      assert.equal(doc.system.challengeClass, klass.toLowerCase(), `${name}: class`);
      assert.equal(doc.system.vitality.max, Number(vitality), `${name}: Vitality`);
      assert.equal(doc.system.strain.max, Number(strain), `${name}: Strain`);
      assert.equal(doc.system.guard.max, Number(guard), `${name}: Guard`);
      assert.equal(doc.system.woundSlots.max, Number(wounds), `${name}: Wound slots`);
      assert.equal(doc.system.burdenSlots.max, Number(burdens), `${name}: Burden slots`);
      assert.deepEqual(
        doc.system.tags,
        tags.split(",").map((tag) => tag.trim().toLowerCase()),
        `${name}: tags`
      );
    }
  });

  test("attributes, SPD, SEN, and SIZE match the printed block", () => {
    for (const [name, doc] of built) {
      const row = block(name).match(
        /^\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\S+)\s*\|$/m
      );
      assert.ok(row, `${name}: attribute row`);

      ["pow", "agi", "rea", "ins", "pre", "luck"].forEach((key, index) => {
        assert.equal(doc.system.attributes[key], Number(row[index + 1]), `${name}: ${key}`);
      });

      assert.equal(doc.system.spd, Number(row[7]), `${name}: SPD`);
      assert.equal(doc.system.sen, Number(row[8]), `${name}: SEN`);
      assert.equal(doc.system.size, row[9], `${name}: SIZE`);
    }
  });
});
