/**
 * Effect ladder resolution.
 *
 * Every attack, spell, and maneuver resolves on a four-band ladder whose entries
 * are free text — "13 damage", "12 damage + Wracked 1 (Fire)", "Target recovers
 * Vitality to full". Free text is the right call for authoring, but it means
 * numeric riders like Solid Hit have to be folded in carefully rather than by
 * rewriting the string.
 *
 * So an entry is split into a leading amount and the rest. Riders adjust the
 * amount; the remainder is passed through untouched, which keeps conditions and
 * prose intact while still showing the player a single final number.
 *
 * Pure logic — no Foundry dependency, so it is unit-tested directly.
 */

/** Solid Hit adds this much damage per allocated Double. */
export const SOLID_HIT_DAMAGE = 3;

/**
 * @typedef {object} LadderEntry
 * @property {number|null} amount - The leading number, if the entry starts with one
 * @property {string} remainder - Everything after the amount
 * @property {string} text - The entry as authored
 */

/**
 * Split a ladder entry into its leading amount and the rest.
 *
 * @param {string} [text]
 * @returns {LadderEntry}
 */
export function parseLadderEntry(text) {
  const entry = (text ?? "").trim();

  // Overflow entries are authored with a leading plus — "+6 damage / success" —
  // so the sign has to be optional, or overflow silently contributes nothing.
  const match = entry.match(/^\+?\s*(\d+)\s*(.*)$/s);

  if (!match) return { amount: null, remainder: entry, text: entry };
  return { amount: Number(match[1]), remainder: match[2].trim(), text: entry };
}

/**
 * Resolve a ladder band into what the table should actually read.
 *
 * Solid Hit applies only to attacks that deal damage. Strain is explicitly not
 * damage — the rules treat the two as separate tracks, and Guard stops one but
 * not the other — so a Strain ladder never picks up the bonus.
 *
 * @param {object} options
 * @param {string} [options.text] - The band's authored text
 * @param {number} [options.doubles] - Allocated Doubles, each worth +3 damage
 * @param {"vitality"|"strain"} [options.kind] - Which track this ladder resolves on
 * @param {number} [options.bonusDamage] - Flat rider, e.g. a Resonance's bonus damage
 * @param {number} [options.overflow] - Successes past 3
 * @param {string} [options.overflowText] - The ladder's overflow entry
 * @returns {{
 *   base: number|null,
 *   total: number|null,
 *   remainder: string,
 *   text: string,
 *   solidHits: number,
 *   solidHitDamage: number,
 *   bonusDamage: number,
 *   applied: boolean
 * }}
 */
export function resolveLadderBand({
  text = "",
  doubles = 0,
  kind = "vitality",
  bonusDamage = 0,
  overflow = 0,
  overflowText = ""
} = {}) {
  const entry = parseLadderEntry(text);

  // Solid Hit is a damage rider, and Strain is not damage.
  const solidHits = kind === "vitality" ? doubles : 0;
  const solidHitDamage = solidHits * SOLID_HIT_DAMAGE;

  const overflowPer = overflow > 0 ? parseLadderEntry(overflowText).amount ?? 0 : 0;
  const overflowTotal = overflowPer * overflow;

  const riders = solidHitDamage + bonusDamage + overflowTotal;
  const total = entry.amount === null ? null : entry.amount + riders;

  return {
    base: entry.amount,
    total,
    remainder: entry.remainder,
    text: entry.text,
    solidHits,
    solidHitDamage,
    bonusDamage,
    // Whether any rider actually moved the number, which is what decides
    // if the card shows the arithmetic or just the value.
    applied: total !== null && riders !== 0
  };
}

/**
 * Read a ladder object by band key, tolerating a missing entry.
 *
 * @param {Record<string, string>} ladder
 * @param {"0"|"1"|"2"|"3"} band
 * @returns {string}
 */
export function bandText(ladder, band) {
  return ladder?.[band] ?? "";
}
