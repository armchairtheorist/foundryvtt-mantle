/**
 * Symlink this repository into your Foundry user data directory so Foundry
 * loads the working copy directly. Edit a file, reload Foundry (F5), see the
 * change — no copying, no packaging.
 *
 * Point it at your Foundry data directory, which is the folder containing
 * `Data/`, `Config/`, and `Logs/`. Either pass it as an argument or set
 * FOUNDRY_DATA in your environment:
 *
 *   npm run link -- "/Users/you/Library/Application Support/FoundryVTT"
 *   FOUNDRY_DATA="C:/Users/you/AppData/Local/FoundryVTT" npm run link
 *
 * On Windows this needs either Developer Mode enabled or an elevated shell,
 * because creating symlinks is a privileged operation there.
 */

import { symlink, mkdir, lstat, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const dataDir = process.argv[2] ?? process.env.FOUNDRY_DATA;

if (!dataDir) {
  console.error("Foundry data directory not given.\n");
  console.error('Usage: npm run link -- "/path/to/FoundryVTT"');
  console.error("   or: FOUNDRY_DATA=/path/to/FoundryVTT npm run link\n");
  console.error("That's the folder containing Data/, Config/, and Logs/.");
  process.exit(1);
}

const systemsDir = path.join(dataDir, "Data", "systems");

if (!existsSync(dataDir)) {
  console.error(`Not found: ${dataDir}`);
  process.exit(1);
}

await mkdir(systemsDir, { recursive: true });

const target = path.join(systemsDir, "mantle");
const source = process.cwd();

// Replace an existing link, but never delete a real directory — that could be
// someone's installed copy of the system with world data alongside it.
if (existsSync(target)) {
  const stats = await lstat(target);
  if (!stats.isSymbolicLink()) {
    console.error(`${target} already exists and is not a symlink.`);
    console.error("Remove or rename it yourself, then run this again.");
    process.exit(1);
  }
  await unlink(target);
}

await symlink(source, target, "junction");

console.log(`Linked ${source}\n    -> ${target}\n`);
console.log("Restart Foundry and Mantle will appear in the systems list.");
