/**
 * Compile compendium source JSON into the LevelDB packs Foundry actually loads.
 *
 * Source of truth is `src/packs/<pack-name>/*.json` — one JSON file per document,
 * version-controlled and diffable. Output goes to `packs/<pack-name>`, which is
 * git-ignored and rebuilt on demand.
 *
 * Usage: npm run build:packs
 */

import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { readdir, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC = "src/packs";
const OUT = "packs";

if (!existsSync(SRC)) {
  console.log(`No ${SRC} directory yet — nothing to build.`);
  process.exit(0);
}

const entries = await readdir(SRC, { withFileTypes: true });
const packs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

if (packs.length === 0) {
  console.log(`No pack directories found in ${SRC}.`);
  process.exit(0);
}

await mkdir(OUT, { recursive: true });

for (const pack of packs) {
  const src = path.join(SRC, pack);
  const dest = path.join(OUT, pack);

  // A stale LevelDB directory will happily merge with new documents and keep
  // deleted ones around, so always start from empty.
  await rm(dest, { recursive: true, force: true });

  await compilePack(src, dest, { log: true });
  console.log(`Built ${pack}`);
}

console.log(`\nCompiled ${packs.length} pack(s) into ${OUT}/`);
