/**
 * Validate compendium content before it is compiled.
 *
 * The failure this exists for is silent: the Foundry CLI skips any document
 * without a `_key`, without warning, so a missing key compiles an empty pack
 * over a completely green build. It shipped 47 weapons into a 0-byte database
 * once already.
 *
 * Also checks the things Foundry would only complain about at import time —
 * malformed ids, duplicates, unknown subtypes, and missing required fields.
 *
 * Usage: npm run check:packs
 */

import { readdir } from "node:fs/promises";
import path from "node:path";

const CONTENT = "src/content";

/** Subtypes declared in system.json, and the collection each belongs to. */
const ITEM_TYPES = new Set([
  "archetype", "mastery", "weapon", "armor", "focus", "wondrous",
  "consumable", "art", "resonance", "feature", "limitbreak"
]);
const ACTOR_TYPES = new Set(["character", "adversary", "party"]);

/**
 * Fields each subtype must carry for its sheet and rolls to work.
 *
 * @type {Record<string, string[]>}
 */
const REQUIRED = {
  weapon: ["weightClass", "attribute", "damage", "tags", "damageTypes"],
  armor: ["armorClass", "guard"],
  focus: ["exotic"],
  wondrous: ["effect"],
  consumable: ["category"],
  archetype: ["kind", "rank", "maxRank"],
  mastery: ["domain", "masteryType", "slotCost"],
  art: ["artType", "baseCost"],
  resonance: ["arts"],
  feature: ["activation"],
  limitbreak: ["category"],
  adversary: ["challengeClass", "vitality"]
};

const problems = [];
const seenIds = new Map();
let total = 0;

const modules = (await readdir(CONTENT))
  .filter((file) => file.endsWith(".mjs") && !file.startsWith("_"))
  .sort();

for (const file of modules) {
  const pack = path.basename(file, ".mjs");
  const module = await import(path.resolve(CONTENT, file));

  if (typeof module.build !== "function") {
    problems.push(`${file}: does not export build()`);
    continue;
  }

  for (const doc of module.build()) {
    total += 1;
    const where = `${pack}/${doc.name ?? "(unnamed)"}`;

    if (!doc.name) problems.push(`${where}: missing name`);

    if (!/^[A-Za-z0-9]{16}$/.test(doc._id ?? "")) {
      problems.push(`${where}: _id must be 16 alphanumeric characters, got ${JSON.stringify(doc._id)}`);
    }

    const previous = seenIds.get(doc._id);
    if (previous) problems.push(`${where}: duplicate _id, already used by ${previous}`);
    else seenIds.set(doc._id, where);

    const isActor = ACTOR_TYPES.has(doc.type);
    const isItem = ITEM_TYPES.has(doc.type);
    if (!isActor && !isItem) problems.push(`${where}: unknown subtype ${JSON.stringify(doc.type)}`);

    // The silent one. Without a _key the CLI drops the document on the floor.
    const collection = isActor ? "actors" : "items";
    const expected = `!${collection}!${doc._id}`;
    if (doc._key !== expected) {
      problems.push(`${where}: _key must be ${expected}, got ${JSON.stringify(doc._key)} — the CLI skips documents without a valid _key`);
    }

    for (const field of REQUIRED[doc.type] ?? []) {
      if (doc.system?.[field] === undefined) problems.push(`${where}: missing system.${field}`);
    }

    // Embedded documents live in the same database under a compound key. A
    // wrong one makes the CLI throw outright; a missing one makes it drop the
    // item silently, which is how an actor ships with an empty inventory over a
    // green build.
    for (const item of doc.items ?? []) {
      const itemWhere = `${where} / ${item.name ?? "(unnamed item)"}`;

      if (!/^[A-Za-z0-9]{16}$/.test(item._id ?? "")) {
        problems.push(`${itemWhere}: embedded _id must be 16 alphanumeric characters`);
      }

      const expectedItemKey = `!actors.items!${doc._id}.${item._id}`;
      if (item._key !== expectedItemKey) {
        problems.push(
          `${itemWhere}: embedded _key must be ${expectedItemKey}, got ${JSON.stringify(item._key)}`
        );
      }

      if (!ITEM_TYPES.has(item.type)) {
        problems.push(`${itemWhere}: unknown embedded subtype ${JSON.stringify(item.type)}`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`Checked ${total} compendium documents across ${modules.length} pack(s) — all good.`);
