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
import { MANTLE } from "../module/config.mjs";

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

/** A character with a tandem partner, which is the only thing that unlocks them. */
const paired = { ...character, tandemPartners: [{ actor: { name: "Kira" }, mutual: 3 }] };

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

describe("tandem reactions", () => {
  /** @param {any} actor */
  const reactionsOf = (actor) =>
    /** @type {{id: string, label: string, vigor: number, affordable: boolean}[]} */ (
      prepareManeuvers(actor).reactions
    );

  /** @param {any} actor */
  const ids = (actor) => reactionsOf(actor).map((reaction) => reaction.id);

  test("are absent without a partner", () => {
    for (const id of Object.keys(MANTLE.tandemReactions)) {
      assert.ok(!ids(character).includes(id), `${id} without a partner`);
    }
  });

  test("appear once a mutual Bond 3 exists", () => {
    for (const id of Object.keys(MANTLE.tandemReactions)) {
      assert.ok(ids(paired).includes(id), `${id} with a partner`);
    }
  });

  test("carry the same shape as the reactions beside them", () => {
    // They share the row and the partial, so a missing key here renders a
    // blank button rather than throwing — the exact failure this file exists
    // to catch.
    const [ordinary] = reactionsOf(character);
    for (const reaction of reactionsOf(paired)) {
      assert.deepEqual(Object.keys(reaction).sort(), Object.keys(ordinary).sort(), reaction.id);
    }
  });

  test("Tandem Defense shows no cost of its own", () => {
    // It costs whatever the chosen defense costs, so the table carries null
    // and the bar prints an em dash rather than a zero.
    const defense = reactionsOf(paired).find((r) => r.id === "tandemDefense");
    assert.equal(defense?.vigor, 0);
  });

  test("adversaries never get them", () => {
    // An enemy has no Bonds field at all, but the guard is the early return
    // for anything that does not track Vigor — worth pinning either way.
    const enemy = { ...adversary, tandemPartners: [{ actor: { name: "Mira" }, mutual: 5 }] };
    assert.deepEqual(prepareManeuvers(enemy).reactions, []);
  });
});
