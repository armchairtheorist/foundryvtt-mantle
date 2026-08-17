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
 * @param {Record<string, unknown>} table
 * @param {string} initial
 */
export function choice(table, initial) {
  return new fields.StringField({
    required: true,
    blank: false,
    initial,
    choices: Object.keys(table)
  });
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
