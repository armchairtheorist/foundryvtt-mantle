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
 * A depletable resource with a current value. Maxima are derived rather than
 * stored, so that changing a mastery immediately moves the ceiling.
 *
 * @param {number} [initial]
 */
export function resource(initial = 0) {
  return new fields.SchemaField({ value: count(initial) });
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
    masteryWildcard: modifier()
  });
}

export { fields };
