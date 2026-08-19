/**
 * Which stats each actor type offers as a token bar.
 *
 * This is the one invariant in the system that lives entirely in the *shape* of
 * the schema rather than in any value: Foundry's `TokenDocument.getTrackedAttributes`
 * walks the data model and offers as a bar only a SchemaField holding both a
 * `value` and a `max`. A resource whose maximum is computed in derived data
 * looks like a bare number to that walk, and a bare number cannot be drawn as a
 * coloured bar over a token.
 *
 * Characters shipped that way for seven versions. Nothing threw, no test failed,
 * and the sheets were correct throughout — the stat simply never appeared in the
 * bar dropdown. So the check has to be on the declaration, which means standing
 * up enough of Foundry's field classes to read the schemas back.
 *
 * Run with: npm test
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** @type {Record<string, any>} */
const MODELS = {};

/**
 * The smallest stand-in for Foundry's field constructors that lets a data model
 * be defined and its schema read back.
 *
 * Deliberately not a re-implementation: nothing here validates, cleans, or
 * initializes. Each field records what it is, which is all the walk below needs
 * — and a shim that only records cannot drift into disagreeing with Foundry
 * about behaviour it does not have.
 */
function installFoundryShim() {
  class DataField {
    /** @param {object} [options] */
    constructor(options = {}) {
      this.options = options;
    }
  }

  class SchemaField extends DataField {
    /** @param {Record<string, any>} fields @param {object} [options] */
    constructor(fields, options = {}) {
      super(options);
      this.fields = fields;
    }
  }

  class ArrayField extends DataField {
    /** @param {any} element @param {object} [options] */
    constructor(element, options = {}) {
      super(options);
      this.element = element;
    }
  }

  const fields = {
    NumberField: class NumberField extends DataField {},
    StringField: class StringField extends DataField {},
    BooleanField: class BooleanField extends DataField {},
    HTMLField: class HTMLField extends DataField {},
    FilePathField: class FilePathField extends DataField {},
    DocumentUUIDField: class DocumentUUIDField extends DataField {},
    ObjectField: class ObjectField extends DataField {},
    SchemaField,
    ArrayField,
    SetField: ArrayField,
    DataField
  };

  // Cast wholesale: fvtt-types describes the real `foundry` global, and this is
  // a deliberate handful of it rather than an attempt at the whole surface.
  globalThis.foundry = /** @type {any} */ ({
    data: { fields },
    abstract: { TypeDataModel: class TypeDataModel {} },
    utils: { deepClone: structuredClone }
  });

  return fields;
}

/**
 * Every bar-shaped path in a schema, exactly the way Foundry finds them: a
 * SchemaField holding both `value` and `max` is a bar, and anything else that
 * is a SchemaField is recursed into.
 *
 * @param {Record<string, any>} schema
 * @param {string[]} [path]
 * @returns {string[]}
 */
function trackedBars(schema, path = []) {
  const { SchemaField } = /** @type {any} */ (globalThis.foundry).data.fields;
  /** @type {string[]} */
  const bars = [];

  for (const [name, field] of Object.entries(schema)) {
    if (!(field instanceof SchemaField)) continue;

    const here = [...path, name];
    if ("value" in field.fields && "max" in field.fields) bars.push(here.join("."));
    else bars.push(...trackedBars(field.fields, here));
  }

  return bars;
}

before(async () => {
  installFoundryShim();

  // Imported after the shim is in place: the data models call the field
  // constructors while their classes are being defined.
  MODELS.character = (await import("../module/data/actor-character.mjs")).default;
  MODELS.adversary = (await import("../module/data/actor-adversary.mjs")).default;
  MODELS.party = (await import("../module/data/actor-party.mjs")).default;
});

/* -------------------------------------------- */

describe("token bars", () => {
  test("a character offers every stat with a known maximum", () => {
    const bars = trackedBars(MODELS.character.defineSchema());

    assert.deepEqual(bars.sort(), [
      "burdenSlots",
      "consumables",
      "guard",
      "resolve",
      "strain",
      "vigor",
      "vitality",
      "woundSlots"
    ]);
  });

  test("an adversary offers the same tracks it shares with a character", () => {
    const bars = trackedBars(MODELS.adversary.defineSchema());

    // Adversaries track no Vigor, no Resolve, and no consumables — they run a
    // different action economy — so those are absent by design rather than by
    // oversight.
    assert.deepEqual(bars.sort(), [
      "burdenSlots",
      "guard",
      "strain",
      "vitality",
      "woundSlots"
    ]);
  });

  test("a party offers its Valor pool", () => {
    assert.deepEqual(trackedBars(MODELS.party.defineSchema()), ["valor"]);
  });

  test("both creature types agree on the tracks they share", () => {
    // The bug this exists for was an inconsistency: adversaries declared their
    // maxima and characters did not, so the same stat was a bar on one and a
    // bare number on the other.
    const character = new Set(trackedBars(MODELS.character.defineSchema()));
    const adversary = trackedBars(MODELS.adversary.defineSchema());

    for (const bar of adversary) {
      assert.ok(character.has(bar), `adversaries expose ${bar}, characters do not`);
    }
  });

  test("the manifest's default token bars are ones a character actually offers", () => {
    // system.json names these as the prototype token's two bars. Naming a stat
    // that is not bar-shaped leaves a new token with an empty bar and no error.
    const manifest = JSON.parse(readFileSync("system.json", "utf8"));
    const bars = new Set(trackedBars(MODELS.character.defineSchema()));

    assert.ok(bars.has(manifest.primaryTokenAttribute), manifest.primaryTokenAttribute);
    assert.ok(bars.has(manifest.secondaryTokenAttribute), manifest.secondaryTokenAttribute);
  });
});
