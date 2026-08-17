/**
 * Static checks for the things Foundry only complains about at runtime, usually
 * in the middle of a session.
 *
 * Three failure modes this catches:
 *  1. A Handlebars template that does not parse. Foundry reports this as a
 *     blank sheet with a console error.
 *  2. A localization key used somewhere but absent from lang/en.json. Foundry
 *     renders the raw key, so the sheet reads "MANTLE.Sheet.wounds".
 *  3. A template named in a sheet's PARTS that does not exist on disk.
 *
 * Usage: npm run check
 */

import Handlebars from "handlebars";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const problems = [];

/* 1. Templates must compile. */
const templates = walk("templates");
for (const file of templates) {
  try {
    Handlebars.precompile(readFileSync(file, "utf8"));
  } catch (error) {
    problems.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/* 2. Every localization key referenced must exist. */
const lang = JSON.parse(readFileSync("lang/en.json", "utf8"));
const sources = [...templates, ...walk("module"), "mantle.mjs"];
const referenced = new Set();

for (const file of sources) {
  const text = readFileSync(file, "utf8");
  const patterns = [
    /localize\s+["']([A-Za-z0-9_.]+)["']/g, // {{localize "KEY"}}
    /localize\(["']([A-Za-z0-9_.]+)["']\)/g, // game.i18n.localize("KEY")
    /label:\s*["'](MANTLE\.[A-Za-z0-9_.]+)["']/g, // config table labels
    /["'](MANTLE\.(?:Tab|Slot|Activation|Sheet)\.[A-Za-z0-9_]+)["']/g // keys built in JS
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) referenced.add(match[1]);
  }
}

for (const key of [...referenced].sort()) {
  if (!(key in lang)) problems.push(`missing localization key: ${key}`);
}

/* 3. Every template a sheet declares must exist. */
const sheets = walk("module/apps");
for (const file of sheets) {
  for (const match of readFileSync(file, "utf8").matchAll(/template:\s*"([^"]+)"/g)) {
    const path = match[1];
    if (!path.startsWith("systems/mantle/")) continue; // a core template
    const local = path.replace("systems/mantle/", "");
    if (!existsSync(local)) problems.push(`${file}: missing template ${path}`);
  }
}

/* -------------------------------------------- */

if (problems.length > 0) {
  console.error(`${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(
  `Checked ${templates.length} templates and ${referenced.size} localization keys — all good.`
);
