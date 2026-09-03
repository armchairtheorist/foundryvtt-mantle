/**
 * Taking damage: Guard, Vitality, Strain, Wounds, and Burdens.
 *
 * This is the most rule-dense corner of Mantle and the most tedious to run by
 * hand, so it is all pure functions with no Foundry dependency and heavy test
 * coverage. The document layer only turns the results into updates.
 *
 * The order matters and is easy to get wrong:
 *   damage -> Guard (unless Penetrating) -> resistance/weakness -> Vitality
 *
 * Resistance and weakness apply only to the portion that gets *past* Guard, not
 * to the whole attack. Strain skips Guard entirely — mental harm ignores armor.
 */

import { MANTLE } from "../config.mjs";

/**
 * Whether a defender resists, is vulnerable to, or is unaffected by an attack's
 * damage types.
 *
 * Multi-type attacks do not stack: one resistance and no weakness means
 * resistance, one weakness and no resistance means weakness, and holding both
 * cancels out entirely. That cancellation is a deliberate speed-of-play choice
 * in the rules, not an oversight.
 *
 * @param {string[]} damageTypes - The attack's damage type tags
 * @param {string[]} [resistances]
 * @param {string[]} [weaknesses]
 * @returns {"resistant"|"weak"|"normal"}
 */
export function damageAffinity(damageTypes, resistances = [], weaknesses = []) {
  const resists = matchesAffinity(damageTypes, resistances);
  const vulnerable = matchesAffinity(damageTypes, weaknesses);

  if (resists && vulnerable) return "normal";
  if (resists) return "resistant";
  if (vulnerable) return "weak";
  return "normal";
}

/**
 * Whether any of an attack's damage types is covered by a list of affinities.
 *
 * An entry may name a single type or one of the group shorthands, so
 * "Resistance (Physical)" answers for Slashing, Piercing, and Crushing alike
 * without the stat block having to write all three.
 *
 * @param {string[]} damageTypes
 * @param {string[]} affinities
 * @returns {boolean}
 */
function matchesAffinity(damageTypes, affinities) {
  /** @type {Record<string, string[]>} */
  const groups = MANTLE.damageTypeGroups;

  // Wracked (Bleeding) is one damage type that answers to two: a resistance or
  // weakness to Piercing or to Slashing applies to it.
  const expanded = damageTypes.flatMap((type) =>
    type === "bleeding" ? MANTLE.bleedingDamageTypes : [type]
  );

  return affinities.some((entry) => {
    const group = groups[entry];
    return group ? expanded.some((type) => group.includes(type)) : expanded.includes(entry);
  });
}

/* -------------------------------------------- */

/**
 * Apply an affinity to an amount. Resistance halves and rounds down, weakness
 * doubles.
 *
 * @param {number} amount
 * @param {"resistant"|"weak"|"normal"} affinity
 * @returns {number}
 */
export function applyAffinity(amount, affinity) {
  if (affinity === "resistant") return Math.max(0, Math.floor(amount / 2));
  if (affinity === "weak") return amount * 2;
  return amount;
}

/**
 * Work out what an incoming hit does to Guard and Vitality.
 *
 * @param {object} options
 * @param {number} options.amount - Damage dealt
 * @param {number} options.guard - Current Guard
 * @param {number} options.vitality - Current Vitality
 * @param {number} options.maxVitality
 * @param {number} options.woundSlots - Total Wound slots
 * @param {number} [options.woundsTaken] - Wounds already held
 * @param {boolean} [options.penetrating] - Bypasses Guard entirely
 * @param {boolean} [options.untyped] - Environmental harm: ignores Guard and affinity alike
 * @param {"resistant"|"weak"|"normal"} [options.affinity]
 * @returns {{
 *   guardAbsorbed: number,
 *   guardAfter: number,
 *   toVitality: number,
 *   vitalityAfter: number,
 *   woundsInflicted: number,
 *   defeated: boolean
 * }}
 */
export function applyDamage({
  amount,
  guard,
  vitality,
  maxVitality,
  woundSlots,
  woundsTaken = 0,
  penetrating = false,
  untyped = false,
  affinity = "normal"
}) {
  // Guard absorbs first, unless the attack goes straight through it. Untyped
  // damage — falling, drowning — is not an attack and Guard never stops it.
  const bypassesGuard = penetrating || untyped;
  const guardAbsorbed = bypassesGuard ? 0 : Math.min(guard, amount);
  const guardAfter = guard - guardAbsorbed;

  // Resistance and weakness bite only on what gets past Guard, and never on
  // untyped damage.
  const past = amount - guardAbsorbed;
  const toVitality = untyped ? past : applyAffinity(past, affinity);

  // Excess carries onto the refilled bar, so one large hit can inflict several
  // Wounds in a row.
  let remaining = toVitality;
  let current = vitality;
  let woundsInflicted = 0;
  let defeated = false;

  while (remaining > 0) {
    current -= remaining;
    remaining = 0;

    if (current > 0) break;

    // Vitality hit zero: take a Wound and refill, carrying the overflow.
    if (woundsTaken + woundsInflicted >= woundSlots) {
      defeated = true;
      current = 0;
      break;
    }

    woundsInflicted += 1;
    remaining = -current;
    current = maxVitality;

    // The refill consumed the overflow; loop again only if damage remains.
    if (remaining === 0) break;
  }

  return {
    guardAbsorbed,
    guardAfter,
    toVitality,
    vitalityAfter: Math.max(0, current),
    woundsInflicted,
    defeated
  };
}

/**
 * Work out what incoming Strain does.
 *
 * Strain never touches Guard, and a Burden lands when Strain *reaches* Max
 * Strain, not when it exceeds it — an easy off-by-one to get wrong.
 *
 * Resistance and weakness are deliberately absent, and this function takes no
 * affinity to be passed. Nothing halves or doubles Strain: not Brace, not
 * Arcane Shield, not a Mark called shot. The one exception in the game is the
 * Iron Will mastery, which is its own halving rather than an affinity, and is
 * applied by the player before the amount reaches here.
 *
 * @param {object} options
 * @param {number} options.amount
 * @param {number} options.strain - Current Strain
 * @param {number} options.maxStrain
 * @param {number} options.burdenSlots
 * @param {number} [options.burdensTaken]
 * @returns {{strainAfter: number, burdensInflicted: number, lost: boolean}}
 */
export function applyStrain({
  amount,
  strain,
  maxStrain,
  burdenSlots,
  burdensTaken = 0
}) {
  let current = strain + amount;
  let burdensInflicted = 0;
  let lost = false;

  while (current >= maxStrain) {
    if (burdensTaken + burdensInflicted >= burdenSlots) {
      lost = true;
      current = 0;
      break;
    }

    burdensInflicted += 1;
    current -= maxStrain;
  }

  return { strainAfter: Math.max(0, current), burdensInflicted, lost };
}

/**
 * What a Wound does, from the 1d6 table.
 *
 * v0.31 replaced Wound severities with a straight roll: no luck test, no
 * severity, just one of six conditions. Two wrinkles, and both matter:
 *
 *  - **Impaired** scales with the number of Wounds held and *sets* the stacks
 *    rather than adding to them — "if N is greater than the current Impaired
 *    stacks, then the number of stacks gets reset to N". Rolling it while
 *    already more Impaired than the new N therefore changes nothing, and is
 *    still not a reroll.
 *  - **Every other row rerolls** if the character already carries it. This
 *    reports that rather than looping, so the caller owns the dice.
 *
 * @param {number} die - The 1d6 result
 * @param {object} state
 * @param {number} state.woundsHeld - Wounds held including the one just taken
 * @param {Record<string, number>} [state.stacks] - Condition id to stacks held
 * @returns {{condition: string, stacks: number, sets: boolean, reroll: boolean}|null}
 */
export function woundConsequence(die, { woundsHeld, stacks = {} }) {
  const row = /** @type {Record<number, {condition: string, scalesWithWounds?: boolean}>} */ (
    MANTLE.woundConsequences
  )[die];
  if (!row) return null;

  if (row.scalesWithWounds) {
    return { condition: row.condition, stacks: woundsHeld, sets: true, reroll: false };
  }

  return {
    condition: row.condition,
    stacks: 1,
    sets: false,
    reroll: (stacks[row.condition] ?? 0) > 0
  };
}

/**
 * The affliction a Burden inflicts, from the 1d6 table.
 *
 * Every Burden brings one in v0.31, where only severity 2 and 3 did before.
 * An affliction the character already holds is rerolled — a character may not
 * hold two of the same type.
 *
 * @param {number} die
 * @param {string[]} [held] - Affliction keys already held
 * @returns {{affliction: string, reroll: boolean}|null}
 */
export function burdenAffliction(die, held = []) {
  const affliction = /** @type {Record<number, string>} */ (MANTLE.afflictions)[die];
  if (!affliction) return null;

  return { affliction, reroll: held.includes(affliction) };
}

/**
 * Whether filling a slot brings the escalating condition with it.
 *
 * Faltering and Unraveling used to come from a Critical Wound and a Breakdown —
 * the top severities. With severity gone, they arrive when the *last* slot
 * fills, which is a different trigger reached by a different route.
 *
 * @param {number} slotsFilled - Slots filled including the one just taken
 * @param {number} slots - Total slots
 * @returns {boolean}
 */
export function fillsLastSlot(slotsFilled, slots) {
  return slots > 0 && slotsFilled >= slots;
}
