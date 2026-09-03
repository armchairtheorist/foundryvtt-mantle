// @ts-check

/**
 * Disabled equipment.
 *
 * An ability or an event can disable a piece of gear. It stays on the sheet —
 * that is the point of the rule, and why this is a flag rather than an unequip
 * — and simply cannot be used until whatever disabled it is rectified.
 *
 * Every consequence is a plain "no", with one asymmetry worth naming: disabled
 * armor stops protecting but keeps penalizing. That is the one place a caller
 * could reasonably get it backwards, so it is a named function rather than a
 * condition written out at each site.
 *
 * Pure logic — no Foundry dependency, so it is unit-tested directly.
 */

/**
 * The kinds of gear that can be disabled.
 *
 * Masteries, Arts, Resonances and Limit Breaks are not equipment and carry no
 * flag: the rules disable things you are *carrying*.
 */
export const DISABLEABLE = ["weapon", "armor", "focus", "wondrous", "consumable"];

/**
 * @typedef {object} Gear
 * @property {boolean} [equipped]
 * @property {boolean} [disabled]
 */

/**
 * Whether a piece of equipment can be used at all right now.
 *
 * Used for weapons (attacks and Deflect), wondrous items (active and passive
 * benefits alike), and consumables (the points remain; they just cannot be
 * spent on this).
 *
 * @param {Gear} system - An item's system data
 * @param {object} [options]
 * @param {boolean} [options.needsEquipping] - Whether being stowed also stops it
 * @returns {boolean}
 */
export function isUsable(system, { needsEquipping = true } = {}) {
  if (system.disabled) return false;
  return needsEquipping ? system.equipped === true : true;
}

/**
 * Whether armor grants its Guard.
 *
 * @param {Gear} armor
 * @returns {boolean}
 */
export function protects(armor) {
  return isUsable(armor);
}

/**
 * Whether armor's penalty applies.
 *
 * It does, disabled or not: you are still wearing the weight. The only way out
 * of an armor penalty is taking the armor off.
 *
 * @param {Gear} armor
 * @returns {boolean}
 */
export function penalizes(armor) {
  return armor.equipped === true;
}

/**
 * Whether a spell focus counts as equipped for the no-focus penalty.
 *
 * @param {Gear} focus
 * @returns {boolean}
 */
export function countsAsFocus(focus) {
  return isUsable(focus);
}
