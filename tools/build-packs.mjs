/**
 * Compile compendium content into the LevelDB packs Foundry loads.
 *
 * Content is authored in `src/content/*.mjs`, one module per pack, each
 * exporting `build()` and returning an array of documents. Authoring in JS
 * rather than raw JSON keeps the source close to the catalog tables it mirrors —
 * a weapon is one readable line — instead of hundreds of files of id and
 * ownership boilerplate.
 *
 * Ids are derived from a hash of each document's identity, so rebuilding a pack
 * preserves every id and existing worlds keep their links.
 *
 * Usage: npm run build:packs
 */

import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { readdir, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const CONTENT = "src/content";
const OUT = "packs";

if (!existsSync(CONTENT)) {
  console.log(`No ${CONTENT} directory yet — nothing to build.`);
  process.exit(0);
}

const modules = (await readdir(CONTENT))
  .filter((file) => file.endsWith(".mjs") && !file.startsWith("_"))
  .sort();

if (modules.length === 0) {
  console.log(`No content modules found in ${CONTENT}.`);
  process.exit(0);
}

await mkdir(OUT, { recursive: true });

let total = 0;

for (const file of modules) {
  const pack = path.basename(file, ".mjs");
  const module = await import(path.resolve(CONTENT, file));

  if (typeof module.build !== "function") {
    console.error(`${file} does not export build() — skipping.`);
    continue;
  }

  const documents = module.build();

  // The CLI compiles from a directory of files, so stage the documents in a
  // temporary directory rather than committing generated JSON alongside the
  // source it was generated from.
  const staging = await mkdir(path.join(os.tmpdir(), `mantle-pack-${pack}`), { recursive: true })
    .then(() => path.join(os.tmpdir(), `mantle-pack-${pack}`));
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });

  for (const document of documents) {
    await writeFile(
      path.join(staging, `${document._id}.json`),
      `${JSON.stringify(document, null, 2)}\n`,
      "utf8"
    );
  }

  const destination = path.join(OUT, pack);

  // A stale LevelDB directory merges rather than replaces, keeping documents
  // that have since been deleted, so always start from empty.
  await rm(destination, { recursive: true, force: true });
  await compilePack(staging, destination);
  await rm(staging, { recursive: true, force: true });

  console.log(`  ${pack.padEnd(14)} ${String(documents.length).padStart(4)} documents`);
  total += documents.length;
}

console.log(`\nCompiled ${modules.length} pack(s), ${total} documents, into ${OUT}/`);
