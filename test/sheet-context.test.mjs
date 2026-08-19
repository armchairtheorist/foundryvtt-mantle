/**
 * The render contexts the sheets hand to Handlebars.
 *
 * Handlebars fails silently: `{{#each maneuvers}}` over a list of the wrong
 * shape renders one empty row per entry rather than throwing, which is how the
 * adversary stat block came to show five blank attacks. These tests pin the
 * shared partials to the context builders that feed them.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

import { prepareManeuvers } from "../module/apps/sheets/_maneuvers-context.mjs";

/** @param {string} path - Repo-relative. */
function read(path) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

/**
 * The names a template iterates straight off the context, ignoring the ones
 * scoped to a block parameter (`{{#each maneuver.tags}}` inside `as |maneuver|`
 * reads the row, not the context).
 *
 * @param {string} source - Template source.
 * @returns {string[]}
 */
function iteratedContextKeys(source) {
  const names = new Set();
  for (const [, name] of source.matchAll(/\{\{#each\s+([\w.]+)/g)) {
    if (!name.includes(".")) names.add(name);
  }
  return [...names].sort();
}

/** A character: tracks Vigor, so it gets the full bar and every reaction. */
const character = {
  type: "character",
  system: { vigor: { value: 7 } },
  meleeWeapons: [{ name: "Axe" }],
  deflectWeapons: [{ name: "Shield" }],
  reflexiveWeapons: [{ name: "Rapier" }]
};

/** An adversary: no Vigor, no reactions, only the maneuvers enemies can take. */
const adversary = { type: "adversary", system: {} };

describe("the maneuver bar", () => {
  const partial = read("templates/parts/maneuvers.hbs");

  test("iterates exactly the keys prepareManeuvers provides", () => {
    assert.deepEqual(iteratedContextKeys(partial), Object.keys(prepareManeuvers(character)).sort());
  });

  test("does not claim `maneuvers`, which the adversary stat block owns", () => {
    // The adversary sheet Object.assigns this onto a context that already has
    // `maneuvers` — the enemy's printed attacks. Sharing the key silently
    // replaced the attacks with the bar.
    for (const actor of [character, adversary]) {
      assert.ok(!("maneuvers" in prepareManeuvers(actor)), `${actor.type} sheet`);
    }
  });

  test("the adversary stat block's own maneuvers are a different shape", () => {
    // Not interchangeable: if they ever were, the collision would be harmless
    // and this whole file could go. They are not.
    const block = read("templates/actor/adversary-block.hbs");
    assert.match(block, /\{\{#each maneuvers as \|maneuver\|\}\}/);
    assert.match(block, /maneuver\.effectivePool/);
    assert.match(block, /maneuver\.ladder/);

    const [bar] = prepareManeuvers(adversary).basicManeuvers;
    assert.ok(!("effectivePool" in bar));
    assert.ok(!("ladder" in bar));
  });
});

describe("the conditions tray", () => {
  test("iterates exactly the key the sheets provide", () => {
    // prepareConditions needs a live actor's effects, so this checks the
    // template's side alone: one context key, named for what the sheets set.
    assert.deepEqual(iteratedContextKeys(read("templates/parts/conditions.hbs")), ["conditions"]);
  });
});
