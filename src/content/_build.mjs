/**
 * Helpers for turning catalog data into Foundry documents.
 *
 * Content is authored in compact modules that mirror the catalog tables, then
 * expanded here into full documents. That keeps the source diffable and close
 * to the rules text, rather than hand-maintaining hundreds of JSON files with
 * their own ids and boilerplate.
 */

import { createHash } from "node:crypto";

/**
 * A compendium document, as authored here: enough shape for the content modules
 * and their tests to work with, without restating Foundry's full document type.
 *
 * @typedef {object} PackDocument
 * @property {string} _id
 * @property {string} _key
 * @property {string} name
 * @property {string} type
 * @property {string} img
 * @property {Record<string, any>} system
 *
 * Foundry requires further fields on a stored document — effects, ownership,
 * sort, and so on — which the builders fill in with defaults.
 * @property {any} [effects]
 * @property {any} [items]
 * @property {any} [folder]
 * @property {any} [sort]
 * @property {any} [ownership]
 * @property {any} [prototypeToken]
 * @property {any} [flags]
 * @property {any} [_stats]
 */

/**
 * A stable Foundry id derived from the document's identity.
 *
 * Foundry ids must be exactly 16 alphanumeric characters. Deriving them from a
 * hash rather than generating them randomly means rebuilding a pack keeps every
 * id it had, so existing worlds keep their links to compendium documents.
 *
 * @param {string} key
 * @returns {string}
 */
export function stableId(key) {
  const hash = createHash("sha256").update(key).digest("base64url").replace(/[^A-Za-z0-9]/g, "");
  return hash.slice(0, 16);
}

/**
 * Wrap system data into a full Item document.
 *
 * @param {object} options
 * @param {string} options.pack - Pack name, so ids are unique across packs
 * @param {string} options.name
 * @param {string} options.type - Item subtype
 * @param {object} options.system
 * @param {string} [options.img]
 * @returns {PackDocument}
 */
export function item({ pack, name, type, system, img }) {
  const _id = stableId(`${pack}/${type}/${name}`);
  return {
    _id,
    // The CLI skips any document without a _key, silently and without warning,
    // so omitting it compiles an empty pack over a green build.
    _key: `!items!${_id}`,
    name,
    type,
    img: img ?? "icons/svg/item-bag.svg",
    system,
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    _stats: { systemId: "mantle" }
  };
}

/**
 * Wrap system data into a full Actor document.
 *
 * @param {object} options
 * @param {string} options.pack
 * @param {string} options.name
 * @param {string} options.type
 * @param {object} options.system
 * @param {string} [options.img]
 * @returns {PackDocument}
 */
export function actor({ pack, name, type, system, img }) {
  const _id = stableId(`${pack}/${type}/${name}`);
  return {
    _id,
    _key: `!actors!${_id}`,
    name,
    type,
    img: img ?? "icons/svg/mystery-man.svg",
    system,
    items: [],
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    prototypeToken: { name, actorLink: false },
    flags: {},
    _stats: { systemId: "mantle" }
  };
}

/**
 * Expand a four-value damage array into the ladder shape the schema expects.
 *
 * @param {Array<number|string>} bands - The 0s, 1s, 2s, and 3+ entries
 * @param {string} [overflow]
 * @param {string} [suffix] - Appended to numeric entries, e.g. "damage"
 */
export function ladder(bands, overflow = "", suffix = "damage") {
  /** @param {number|string} value */
  const format = (value) => (typeof value === "number" ? `${value} ${suffix}` : String(value));
  return {
    0: format(bands[0]),
    1: format(bands[1]),
    2: format(bands[2]),
    3: format(bands[3]),
    overflow
  };
}
