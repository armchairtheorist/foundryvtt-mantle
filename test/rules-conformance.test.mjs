/**
 * The compendium content, checked against the canonical rules documents.
 *
 * `docs/rules/` holds the Momenta rulebooks themselves. Every number in the
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
import { build as buildLimitBreaks } from "../src/content/limitbreaks.mjs";
import { build as buildArchetypes } from "../src/content/archetypes.mjs";
import { build as buildSpellcasting } from "../src/content/spellcasting.mjs";
import { build as buildPregens } from "../src/content/pregens.mjs";
import { bondCapacity, bondIntensity } from "../module/rules/bonds.mjs";
import {
  DISABLEABLE,
  countsAsFocus,
  penalizes,
  protects
} from "../module/rules/equipment.mjs";
import { deriveCores, deriveMaxBonds } from "../module/data/derive.mjs";
import { MANTLE } from "../module/config.mjs";

/**
 * The eight canonical documents, by the short name this file refers to them by.
 *
 * The paths carry no version. The rules are versioned in git and marked by a
 * `**Version:**` line inside each document, so a rules release is a content
 * diff on stable paths rather than eight new files — and no test has to be
 * edited to point at them.
 */
const DOCUMENTS = [
  "quickstart",
  "equipment",
  "masteries",
  "archetypes",
  "spellcasting",
  "limit-breaks",
  "pregen-characters",
  "pregen-enemies"
];

/**
 * Read one of the canonical documents.
 *
 * @param {string} name - A member of DOCUMENTS
 * @returns {string}
 */
function rules(name) {
  return readFileSync(
    fileURLToPath(new URL(`../docs/rules/momenta-${name}.md`, import.meta.url)),
    "utf8"
  );
}

/* -------------------------------------------- */

describe("the rules set itself", () => {
  test("all eight documents are present and readable", () => {
    for (const name of DOCUMENTS) {
      assert.ok(rules(name).length > 500, `${name} is missing or truncated`);
    }
  });

  test("every document carries a version marker", () => {
    for (const name of DOCUMENTS) {
      assert.match(
        rules(name),
        /^\*\*Version:\*\* \d+\.\d+$/m,
        `${name} has no **Version:** line under its title`
      );
    }
  });

  test("the whole set is on one version", () => {
    // Eight files updated by hand is eight chances to update seven of them.
    // A mixed set would have the packs checked against a mix of two rulebooks
    // below, with the mismatches reading as content drift rather than as a
    // half-finished import.
    const versions = new Map(
      DOCUMENTS.map((name) => [name, rules(name).match(/^\*\*Version:\*\* (\d+\.\d+)$/m)?.[1]])
    );

    const distinct = new Set(versions.values());
    assert.equal(
      distinct.size,
      1,
      `mixed rules versions: ${[...versions].map(([n, v]) => `${n}=${v}`).join(", ")}`
    );
  });
});

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

describe("effect text matches the catalogs", () => {
  /**
   * Every `[TAG] Name` block in a document, with the prose under it.
   *
   * The name can carry a parenthesised summary — "Alchemist's Fire (Fire,
   * Range 5, …)" — which is not part of the name.
   *
   * @param {string} document - A member of DOCUMENTS
   * @param {string} tag - The bracketed block tag, e.g. "WONDROUS"
   * @returns {{name: string, effect: string}[]}
   */
  function printed(document, tag) {
    const pattern = new RegExp(
      "^\\[" + tag + "\\] ([^\\n(]+?)\\s*(?:\\([^)]*\\))?$([\\s\\S]*?)^```",
      "gm"
    );

    const blocks = [];
    for (const match of rules(document).matchAll(pattern)) {
      const at = match[2].indexOf("Effect:");
      if (at < 0) continue;
      blocks.push({ name: match[1].trim(), effect: match[2].slice(at + "Effect:".length) });
    }
    return blocks;
  }

  /**
   * What two pieces of prose have to agree on.
   *
   * Line breaks and indentation differ freely — the documents wrap where the
   * page wants and the packs store one string — and a trailing full stop is a
   * copy-edit rather than a rules change. Everything else must match: these
   * blocks are transcribed verbatim, and the drift this catches is the kind
   * that leaves an item still referring to a rule that no longer exists.
   *
   * @param {string} text
   * @returns {string}
   */
  const normalize = (text) => text.replace(/\s+/g, " ").trim().replace(/\.$/, "");

  /**
   * Effects the packs deliberately word differently, and why.
   *
   * @type {Record<string, string>}
   */
  const SUBSTITUTED = {
    // The catalog prints "Effect: none" for the plain focus; the sheet needs a
    // line that says what carrying one is for.
    "Basic Spell Focus": "Enables casting at full effectiveness."
  };

  const catalog = new Map(
    [...buildEquipment(), ...buildLimitBreaks()].map((doc) => [doc.name, doc])
  );

  /** @param {any} doc */
  const effectOf = (doc) =>
    doc.system.effect || String(doc.system.description ?? "").replace(/<[^>]+>/g, " ");

  for (const [document, tag] of [
    ["equipment", "WONDROUS"],
    ["equipment", "FOCUS"],
    ["equipment", "CONSUMABLE"],
    ["limit-breaks", "LIMIT BREAK"]
  ]) {
    test(`${tag.toLowerCase()} effects are transcribed as printed`, () => {
      const blocks = printed(document, tag);
      assert.ok(blocks.length > 0, `${tag}: blocks found`);

      for (const block of blocks) {
        const doc = catalog.get(block.name);
        assert.ok(doc, `${block.name} is in the packs`);

        // A thrown consumable's effect *is* its damage ladder, which the
        // weapon suite already checks band by band.
        if (doc.system.isAttack) continue;

        const expected = SUBSTITUTED[block.name] ?? block.effect;
        assert.equal(normalize(effectOf(doc)), normalize(expected), block.name);
      }
    });
  }

  test("nothing in the packs still refers to a deleted rule", () => {
    // v0.31 removed trained skills, Wound and Burden severities, Sequences and
    // Valor. A catalog entry that still names one is drift that reads as
    // perfectly good prose, so nothing else would catch it — which is exactly
    // how two Mend pairings kept costing "Resolve equal to its severity" long
    // after severities stopped existing.
    const gone = /\btrained\b|\bskills?\b|\bseverit|\bsequences?\b|\bvalor\b/i;

    for (const doc of everything()) {
      for (const text of prose(doc)) {
        assert.ok(!gone.test(text), `${doc.name}: "${text.trim()}"`);
      }
    }
  });

  test("the sweep actually reaches the places drift hides", () => {
    // A canary over an empty cage passes forever. These are the three fields
    // that have gone stale in practice — an Art pairing's bonus effect, an
    // archetype's rank feature, and an adversary's printed maneuver — so the
    // sweep is worthless if it cannot see them.
    /**
     * @param {string} name
     * @param {string} needle
     */
    const reached = (name, needle) => {
      const doc = everything().find((entry) => entry.name === name);
      assert.ok(doc, `${name} is in the packs`);
      assert.ok(
        prose(doc).some((text) => text.includes(needle)),
        `${name}: the sweep never saw "${needle}"`
      );
    };

    reached("Ignis", "heal one Wound on the target");
    reached("Human", "Human Experience");
    reached("Sorrowmaw, the Grief-Drake", "Grave-Chill Bite");
  });
});

/**
 * Every document the content packs build.
 *
 * @returns {any[]}
 */
function everything() {
  return [
    ...buildEquipment(),
    ...buildMasteries(),
    ...buildArchetypes(),
    ...buildSpellcasting(),
    ...buildLimitBreaks(),
    ...buildAdversaries(),
    ...buildPregens()
  ];
}

/**
 * Every piece of authored prose on a document, HTML stripped.
 *
 * Deliberately wide: an Art pairing's bonus effect and an archetype's rank
 * feature are as much transcribed rules text as a weapon's special, and either
 * can go stale the same way.
 *
 * @param {any} doc
 * @returns {string[]}
 */
function prose(doc) {
  const system = doc.system ?? {};
  const strings = [
    system.description,
    system.effect,
    system.special,
    system.rules,
    system.notes,
    system.biography,
    ...(system.rankFeatures ?? []).map(
      (/** @type {any} */ feature) => `${feature.name ?? ""} ${feature.effect ?? ""}`
    ),
    ...(system.arts ?? []).flatMap((/** @type {any} */ pairing) =>
      [pairing.bolsterEffect, pairing.bonusEffect, pairing.qualifyingRolls, pairing.notes]
    ),
    system.tactics,
    ...(system.maneuvers ?? []).map(
      (/** @type {any} */ maneuver) => `${maneuver.name ?? ""} ${maneuver.notes ?? ""}`
    ),
    ...(system.abilities ?? []).map(
      (/** @type {any} */ ability) => `${ability.name ?? ""} ${ability.description ?? ""}`
    ),
    ...(system.hitLocations ?? []).flatMap(
      (/** @type {any} */ location) => [location.hitEffect, location.woundEffect]
    )
  ];

  return strings
    .filter((text) => typeof text === "string" && text.length > 0)
    .map((text) => String(text).replace(/<[^>]+>/g, " "));
}

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
  const enemies = rules("pregen-enemies");
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

/* -------------------------------------------- */

describe("the pregens' Bonds", () => {
  // The catalog prints each Bond inside its Threads/Bonds table, bracketed:
  // "[To Kira / Bond 2 / 3 Strands] I am forever indebted to him…". Both the
  // slash and the dash forms appear, and the unit is singular at one Strand.
  const PRINTED =
    /\[To ([A-Z][a-z]+)\s*[/-]\s*Bond (\d+)\s*[/-]\s*(\d+) Strands?\]\s*([^|]+?)\s*\|/g;

  const printed = [...rules("pregen-characters").matchAll(PRINTED)].map((match) => ({
    target: match[1],
    intensity: Number(match[2]),
    strands: Number(match[3]),
    descriptor: match[4]
  }));

  test("the catalog prints six Bonds", () => {
    // One each for Mira, Kira and Maya; three for Vera. If the catalog gains a
    // Bond and the pack does not, this is where it shows.
    assert.equal(printed.length, 6);
  });

  test("every printed intensity is the one its Strands buy", () => {
    for (const bond of printed) {
      assert.equal(
        bondIntensity(bond.strands),
        bond.intensity,
        `To ${bond.target}: ${bond.strands} Strands is not Bond ${bond.intensity}`
      );
    }
  });

  test("each pregen ships the Bonds their block prints", () => {
    const built = new Map(buildPregens().map((doc) => [doc.name, doc.system.bonds]));
    const owners = ownersOfPrintedBonds();

    for (const [owner, expected] of owners) {
      const bonds = built.get(owner);
      assert.ok(bonds, `${owner} is a pregen`);
      assert.equal(bonds.length, expected.length, `${owner}: Bond count`);

      expected.forEach((want, index) => {
        assert.equal(bonds[index].name, want.target, `${owner}: Bond ${index} target`);
        assert.equal(bonds[index].strands, want.strands, `${owner}: Bond ${index} Strands`);
        assert.equal(bonds[index].descriptor, want.descriptor, `${owner}: Bond ${index} text`);
      });
    }
  });

  test("nobody starts over their Bond cap", () => {
    for (const doc of buildPregens()) {
      const cap = deriveMaxBonds(deriveCores(doc.system.attributes));
      assert.ok(
        doc.system.bonds.length <= cap,
        `${doc.name}: ${doc.system.bonds.length} Bonds against a cap of ${cap}`
      );
    }
  });

  test("everyone spends the three Strands character creation grants", () => {
    for (const doc of buildPregens()) {
      const spent = doc.system.bonds.reduce(
        (/** @type {number} */ total, /** @type {{strands: number}} */ bond) =>
          total + bond.strands,
        0
      );
      assert.equal(spent, 3, `${doc.name}: Strands allocated`);
    }
  });

  /**
   * The printed Bonds grouped under the pregen whose block they appear in.
   *
   * The catalog gives each character one Threads/Bonds table, so a Bond
   * belongs to whichever name heading precedes it in the document.
   *
   * @returns {Map<string, typeof printed>}
   */
  function ownersOfPrintedBonds() {
    const document = rules("pregen-characters");
    const headings = [...document.matchAll(/^#+\s+(?:\d+\.\s*)?([A-Z][a-z]+)\b[^\n]*$/gm)].map(
      (match) => ({ name: match[1], at: match.index ?? 0 })
    );

    const owners = new Map();
    for (const match of document.matchAll(PRINTED)) {
      const at = match.index ?? 0;
      const owner = [...headings].reverse().find((heading) => heading.at < at);
      assert.ok(owner, `no heading precedes "${match[0]}"`);

      if (!owners.has(owner.name)) owners.set(owner.name, []);
      owners.get(owner.name).push({
        target: match[1],
        intensity: Number(match[2]),
        strands: Number(match[3]),
        descriptor: match[4]
      });
    }
    return owners;
  }
});

/* -------------------------------------------- */

describe("the Bond tables", () => {
  const quickstart = rules("quickstart");

  test("the intensity thresholds are the ones the table prints", () => {
    // "| 1 - Fleeting | 1 | …" through "| 5 - Unbreakable | 15+ | …". The
    // fifth row prints a "+" because Strands keep accruing past it.
    const rows = [
      ...quickstart.matchAll(/^\|\s*(\d)\s*-\s*\w+\s*\|\s*(\d+)\+?\s*\|/gm)
    ];
    assert.equal(rows.length, 5, "five intensity rows");

    const printed = Object.fromEntries(rows.map((row) => [row[1], Number(row[2])]));
    assert.deepEqual(
      Object.fromEntries(Object.entries(MANTLE.bondIntensities).map(([k, v]) => [k, v])),
      printed
    );
  });

  test("the labels are the ones the table prints", () => {
    const rows = [...quickstart.matchAll(/^\|\s*(\d)\s*-\s*(\w+)\s*\|\s*\d+\+?\s*\|/gm)];

    for (const [, level, label] of rows) {
      const key = /** @type {Record<string, string>} */ (MANTLE.bondLabels)[level];
      assert.ok(key, `Bond ${level} has a label`);
      assert.equal(
        english(key),
        label,
        `Bond ${level}: "${english(key)}" against the printed "${label}"`
      );
    }
  });

  test("the Bond maneuvers cost what the table prints", () => {
    // "| **Invoke** | Bond 1+ toward the target | 1 Resolve | …" — and Come
    // Back to Me! is the one that says "Mutual Bond 4+".
    const rows = [
      ...quickstart.matchAll(
        /^\|\s*\*\*(Invoke|Stay With Me!|Come Back to Me!)\*\*\s*\|\s*(Mutual )?Bond (\d)\+[^|]*\|\s*([^|]+?)\s*\|/gm
      )
    ];
    assert.equal(rows.length, 3, "three Bond maneuvers");

    // The config table is an object literal, so its inferred type is a union
    // of one shape per entry rather than one shape with optional fields.
    /** @type {Record<string, any>} */
    const table = MANTLE.bondManeuvers;
    const byLabel = new Map(
      Object.values(table).map((maneuver) => [english(maneuver.label), maneuver])
    );

    for (const [, label, mutual, intensity, cost] of rows) {
      const maneuver = byLabel.get(label);
      assert.ok(maneuver, `${label} is in the table`);
      assert.equal(maneuver.intensity, Number(intensity), `${label}: intensity`);
      assert.equal(Boolean(maneuver.mutual), Boolean(mutual), `${label}: mutual`);
      assert.match(cost, /1 Resolve/, `${label}: costs Resolve`);
      assert.equal(maneuver.resolve, 1, `${label}: Resolve cost`);

      // Both of the reaching maneuvers take the whole turn; Invoke does not,
      // because it rides on a roll you were making anyway.
      assert.equal(Boolean(maneuver.fullTurn), /Full turn/.test(cost), `${label}: full turn`);
    }
  });

  test("Invoke is worth the dice the table says", () => {
    const row = quickstart.match(/\*\*Invoke\*\*[\s\S]{0,400}?gains \*\*\+(\d)d\*\*/);
    assert.ok(row, "the Invoke row states its bonus");
    assert.equal(MANTLE.bondManeuvers.invoke.bonus, Number(row[1]));
  });

  test("tandem and Combo Limit Breaks unlock at the printed intensities", () => {
    assert.match(quickstart, /mutual Bond 3\*\*[^|]*Tandem Maneuvers/);
    assert.equal(MANTLE.bondUnlocks.tandem, 3);

    assert.match(quickstart, /mutual Bond 4\*\*[^|]*Combo Limit Breaks/);
    assert.equal(MANTLE.bondUnlocks.comboLimitBreak, 4);
  });

  test("tandem reactions cost the Vigor the table prints", () => {
    // Tandem Defense's cell reads "As per the chosen defense", which is why it
    // carries null rather than a number.
    assert.match(quickstart, /\*\*Tandem Strike\*\*[^|]*\|[^|]*\|\s*2\s*\|/);
    assert.equal(MANTLE.tandemReactions.tandemStrike.vigor, 2);

    assert.match(quickstart, /\*\*Tandem Advance\*\*[^|]*\|[^|]*\|\s*2\s*\|/);
    assert.equal(MANTLE.tandemReactions.tandemAdvance.vigor, 2);

    assert.match(quickstart, /\*\*Tandem Defense\*\*[^|]*\|[^|]*\|\s*As per the chosen defense\s*\|/);
    assert.equal(MANTLE.tandemReactions.tandemDefense.vigor, null);
  });

  test("the Bond cap is SOUL + 3", () => {
    assert.match(quickstart, /\*\*SOUL \+ 3 Bonds\*\*/);
    assert.equal(deriveMaxBonds({ body: 0, mind: 0, soul: 2 }), 5);
  });

  test("character creation grants three Strands", () => {
    assert.match(quickstart, /you start with \*\*3 Strands\*\*/);
  });
});

/* -------------------------------------------- */

describe("disabling equipment", () => {
  const quickstart = rules("quickstart");

  // "- Disabled **weapons** cannot be used for attacks…", one bullet per kind,
  // except consumables, whose bullet is phrased the other way round.
  const bullets = [
    ...quickstart.matchAll(/^- (?:Disabled|If a character's) \*\*([^*]+)\*\*/gm)
  ].map((match) => match[1].toLowerCase());

  /**
   * The item type each printed phrase names. Spelled out rather than derived:
   * "wondrous items" and "spell focus" do not reduce to their item type by any
   * rule worth writing, and an explicit map is the honest translation.
   */
  const TYPES = {
    weapons: "weapon",
    armor: "armor",
    "spell focus": "focus",
    "wondrous items": "wondrous",
    consumables: "consumable"
  };

  test("the rules name five kinds of gear", () => {
    assert.equal(bullets.length, 5, `found: ${bullets.join(", ")}`);
  });

  test("each printed kind is one the map knows", () => {
    // A rules edit that renames a bullet fails here rather than silently
    // dropping that kind out of the comparison below.
    assert.deepEqual([...bullets].sort(), Object.keys(TYPES).sort());
  });

  test("each is a kind the code can disable", () => {
    assert.deepEqual(
      bullets.map((printed) => /** @type {Record<string, string>} */ (TYPES)[printed]).sort(),
      [...DISABLEABLE].sort()
    );
  });

  test("an interlude restores what was disabled", () => {
    assert.match(quickstart, /Restore any disabled equipment, unless the disabling effect states otherwise/);
  });

  test("armor keeps its penalty while disabled", () => {
    // Every other bullet is a plain "no"; this is the one that carves out an
    // exception, and the one the code could most easily get backwards.
    assert.match(
      quickstart,
      /Disabled \*\*armor\*\*[^\n]*armor penalty \(if it exists\) still applies/
    );
    assert.equal(penalizes({ equipped: true, disabled: true }), true);
    assert.equal(protects({ equipped: true, disabled: true }), false);
  });

  test("a missing focus costs a die, so a disabled one does too", () => {
    const printed = quickstart.match(/without a spell focus equipped[^\n]*?\*\*-(\d)d penalty\*\*/);
    assert.ok(printed, "the no-focus penalty is printed");
    assert.equal(MANTLE.noFocusPenalty, -Number(printed[1]));
    assert.equal(countsAsFocus({ equipped: true, disabled: true }), false);
  });
});

/**
 * The English string a localization key stands for.
 *
 * The rules print "Fleeting"; the code stores "MANTLE.Bond.fleeting". Comparing
 * them means going through lang/en.json, which is the file a rename would have
 * to touch anyway.
 *
 * @param {string} key
 * @returns {string}
 */
function english(key) {
  return LANG[key] ?? key;
}

/** @type {Record<string, string>} */
const LANG = JSON.parse(
  readFileSync(fileURLToPath(new URL("../lang/en.json", import.meta.url)), "utf8")
);
