/**
 * Small builders for the field shapes this system repeats.
 *
 * Foundry's field constructors are verbose by design; these wrap the handful of
 * patterns Mantle uses over and over so the schemas below read as rules rather
 * than as configuration.
 */

const fields = foundry.data.fields;

/**
 * A non-negative whole number. Attributes, stack counts, and most stats.
 *
 * @param {number} [initial]
 * @param {object} [options]
 */
export function count(initial = 0, options = {}) {
  return new fields.NumberField({
    required: true,
    nullable: false,
    integer: true,
    min: 0,
    initial,
    ...options
  });
}

/**
 * A whole number that may go negative — dice modifiers, Guard adjustments.
 *
 * @param {number} [initial]
 * @param {object} [options]
 */
export function modifier(initial = 0, options = {}) {
  return new fields.NumberField({
    required: true,
    nullable: false,
    integer: true,
    initial,
    ...options
  });
}

/**
 * A short plain-text field.
 *
 * @param {string} [initial]
 * @param {object} [options]
 */
export function text(initial = "", options = {}) {
  return new fields.StringField({ required: true, blank: true, initial, ...options });
}

/**
 * A choice from a config table, keyed by the table's own keys.
 *
 * Choices must be an **object** of value-to-label, never an array. Given an
 * array, Foundry's select input emits the array *index* as the option value, so
 * picking "Basic Path Archetype" submits `1` and validation rejects it. The
 * object form also gets us localized labels in the dropdown for free.
 *
 * Localization runs inside the function so it happens at render time, once
 * `game.i18n` exists — the schema is built during `init`, before it does.
 *
 * @param {Record<string, string | {label: string}>} table
 *   A CONFIG.MANTLE table. Values are either a localization key or an object
 *   carrying one as `label`.
 * @param {string} initial
 */
export function choice(table, initial) {
  return new fields.StringField({
    required: true,
    blank: false,
    initial,
    choices: () => localizeChoices(table)
  });
}

/**
 * A choice from an inline map of value to localization key, for the small
 * vocabularies that don't warrant a CONFIG table.
 *
 * @param {Record<string, string>} map
 * @param {string} initial
 * @param {{blank?: boolean}} [options] - `blank` permits an empty selection.
 */
export function options(map, initial, { blank = false } = {}) {
  return new fields.StringField({
    required: true,
    blank,
    initial,
    choices: () => localizeChoices(map)
  });
}

/**
 * Turn a config table into the `{value: label}` object a select expects,
 * localizing as we go.
 *
 * @param {Record<string, string | {label: string}>} table
 * @returns {Record<string, string>}
 */
function localizeChoices(table) {
  return Object.fromEntries(
    Object.entries(table).map(([key, entry]) => {
      const label = typeof entry === "string" ? entry : entry.label;
      return [key, game.i18n?.localize(label) ?? label];
    })
  );
}

/**
 * A depletable resource: a current value and a maximum.
 *
 * The maximum is *declared* here but never authored — every `prepareDerivedData`
 * overwrites it from the formulas, so changing a mastery still moves the ceiling
 * immediately. It has to be in the schema all the same, because that is where
 * Foundry looks: `TokenDocument.getTrackedAttributes` walks the data model for
 * SchemaFields holding both `value` and `max`, and offers only those as token
 * bars. A resource with a derived-only maximum is offered as a bare number, and
 * a number cannot be drawn as a bar over a token.
 *
 * @param {number} [initial]
 */
export function resource(initial = 0) {
  return new fields.SchemaField({ value: count(initial), max: count(0) });
}

/**
 * A track measured by how full it is rather than by what is left — Wounds and
 * Burdens, where `value` is how many have been taken and `max` is the slots
 * available.
 *
 * Both halves are derived: the count comes from the length of the Wound or
 * Burden array, and the ceiling from the slot budget. The field exists purely so
 * the track can be shown as a token bar, and `MantleActor#modifyTokenAttribute`
 * refuses writes to it rather than letting an edit vanish.
 */
export function track() {
  return new fields.SchemaField({ value: count(0), max: count(0) });
}

/**
 * The four-band effect ladder every attack, spell, and maneuver resolves on.
 * Values are free text so a ladder can read "12 damage" or "Wracked 2 (Fire)"
 * or "Target recovers Vitality to full" without a separate schema for each.
 */
export function ladder() {
  return new fields.SchemaField({
    0: text(),
    1: text(),
    2: text(),
    3: text(),
    overflow: text()
  });
}

/**
 * The bonus accumulators that Active Effects write into.
 *
 * Foundry applies effects after `prepareBaseData` and before
 * `prepareDerivedData`, so an effect cannot write to a derived value like Max
 * Vitality directly — the derivation would overwrite it moments later. Instead
 * every archetype, mastery, and piece of armor adds into one of these, and the
 * derivation reads them. Keeping them as their own fields also means the sheet
 * can show where a number came from, rather than just the total.
 */
export function bonuses() {
  return new fields.SchemaField({
    vitality: modifier(),
    strain: modifier(),
    resolve: modifier(),
    guard: modifier(),
    vigorRefresh: modifier(),
    vigorCap: modifier(),
    spd: modifier(),
    sen: modifier(),
    woundSlots: modifier(),
    burdenSlots: modifier(),
    gearSlots: modifier(),
    wondrousSlots: modifier(),
    consumablePoints: modifier(),
    languages: modifier(),
    masteryBody: modifier(),
    masteryMind: modifier(),
    masterySoul: modifier(),
    masteryWildcard: modifier(),
    masteryRepertoire: modifier()
  });
}

export { fields };
