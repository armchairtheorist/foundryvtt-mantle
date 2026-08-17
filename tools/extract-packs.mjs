/**
 * Extract compiled LevelDB packs back into source JSON.
 *
 * This is the round-trip of build-packs. Edit content in Foundry's compendium
 * UI — which is far easier than hand-writing JSON — then run this to pull the
 * changes back into `src/packs/` so they can be committed.
 *
 * Usage: npm run extract:packs
 */

import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const PACKS = "packs";
const OUT = "src/packs";

if (!existsSync(PACKS)) {
  console.error(`No ${PACKS} directory — build or copy your packs there first.`);
  process.exit(1);
}

const entries = await readdir(PACKS, { withFileTypes: true });
const packs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

for (const pack of packs) {
  const src = path.join(PACKS, pack);
  const dest = path.join(OUT, pack);
  await mkdir(dest, { recursive: true });
  await extractPack(src, dest, { log: true });
  console.log(`Extracted ${pack}`);
}

console.log(`\nExtracted ${packs.length} pack(s) into ${OUT}/`);
