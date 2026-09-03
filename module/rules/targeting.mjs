// @ts-check

/**
 * Reach, range, and visibility — the penalties that come from where the target
 * is standing rather than from what either combatant is carrying.
 *
 * Pure arithmetic over plain numbers: no tokens, no canvas, no Foundry. The
 * dialog measures the distance and hands it here.
 */

import { MANTLE } from "../config.mjs";

/**
 * @typedef {object} Reachability
 * @property {boolean} canTarget - False when the target is simply out of reach
 * @property {number} penalty - Dice penalty, zero or negative
 * @property {string} reason - Localization key explaining the result
 */

/**
 * Whether a ranged attack can reach, and at what penalty.
 *
 * Four bands, in the order the rules print them. Adjacent is checked first and
 * on purpose: firing at something in your face is awkward however keen your
 * senses, so the -1d applies even to an attacker whose SEN covers the whole
 * field.
 *
 * @param {object} input
 * @param {number} input.distance - Squares between attacker and target
 * @param {number} input.sen - The attacker's SEN
 * @param {number} input.maxRange - The weapon's Range N
 * @returns {Reachability}
 */
export function rangedReach({ distance, sen, maxRange }) {
  if (distance > maxRange) {
    return { canTarget: false, penalty: 0, reason: "MANTLE.Targeting.beyondRange" };
  }
  if (distance <= 1) {
    return { canTarget: true, penalty: -1, reason: "MANTLE.Targeting.adjacent" };
  }
  if (distance <= sen) {
    return { canTarget: true, penalty: 0, reason: "MANTLE.Targeting.withinSenses" };
  }
  return { canTarget: true, penalty: -1, reason: "MANTLE.Targeting.longRange" };
}

/**
 * Whether a melee attack reaches. Melee carries no distance penalty at all —
 * a weapon with Melee N either reaches or it does not.
 *
 * @param {object} input
 * @param {number} input.distance - Squares between attacker and target
 * @param {number} input.reach - The weapon's Melee N
 * @returns {Reachability}
 */
export function meleeReach({ distance, reach }) {
  return distance <= reach
    ? { canTarget: true, penalty: 0, reason: "MANTLE.Targeting.inReach" }
    : { canTarget: false, penalty: 0, reason: "MANTLE.Targeting.outOfReach" };
}

/**
 * The penalty for how well the attacker can see the target.
 *
 * Hidden is not a penalty but a refusal: an attacker who does not know where
 * the target is cannot target it at all.
 *
 * @param {string} state - A key of MANTLE.visibility
 * @returns {Reachability}
 */
export function visibilityReach(state) {
  const entry = /** @type {Record<string, {penalty: number|null}>} */ (MANTLE.visibility)[state];
  if (!entry) return { canTarget: true, penalty: 0, reason: "MANTLE.Visibility.visible" };

  return entry.penalty === null
    ? { canTarget: false, penalty: 0, reason: "MANTLE.Targeting.cannotSee" }
    : { canTarget: true, penalty: entry.penalty, reason: `MANTLE.Visibility.${state}` };
}

/**
 * Whether a ranged attack may aim at Mass.
 *
 * Cover shields part of the body: it takes Mass off the table for ranged
 * attacks and leaves only Edge and Mark. Melee ignores cover entirely, so a
 * melee attack is never restricted by it.
 *
 * @param {object} input
 * @param {boolean} input.cover - Whether the target has cover from the attacker
 * @param {boolean} input.ranged - Whether this is a ranged attack
 * @returns {boolean}
 */
export function massAvailable({ cover, ranged }) {
  return !(cover && ranged);
}

/**
 * Every positional modifier for one attack, and whether it can be made at all.
 *
 * Distance is optional: an attack resolved off-grid has no measured distance,
 * and the rules are perfectly playable without one — so a null distance simply
 * contributes nothing rather than refusing the attack.
 *
 * @param {object} input
 * @param {number|null} input.distance - Squares, or null when unmeasured
 * @param {number} input.sen - The attacker's SEN
 * @param {boolean} input.ranged - Whether this is a ranged attack
 * @param {number|null} input.reach - Melee N, when attacking in melee
 * @param {number|null} input.maxRange - Range N, when attacking at range
 * @param {string} [input.visibility] - A key of MANTLE.visibility
 * @param {boolean} [input.hiddenAttacker] - Whether the attacker is Hidden
 * @param {string} [input.hitLocation] - A key of MANTLE.hitLocations, or the
 *   name of a location printed on the target's own stat block
 * @param {number|null} [input.hitLocationPenalty] - That location's penalty,
 *   when the caller already knows it. A Razorwing's Wings are its own, not a
 *   key of the config table, so the penalty cannot always be looked up here.
 * @param {number} [input.frenzy] - Frenzy stacks held by the attacker
 * @returns {{canTarget: boolean, blockedBy: string|null,
 *   modifiers: {label: string, value: number}[]}}
 */
export function attackModifiers({
  distance,
  sen,
  ranged,
  reach,
  maxRange,
  visibility = "visible",
  hiddenAttacker = false,
  hitLocation = "mass",
  hitLocationPenalty = null,
  frenzy = 0
}) {
  /** @type {{label: string, value: number}[]} */
  const modifiers = [];
  /** @type {string|null} */
  let blockedBy = null;

  /** @param {Reachability} result */
  const take = (result) => {
    if (!result.canTarget) blockedBy ??= result.reason;
    if (result.penalty) modifiers.push({ label: result.reason, value: result.penalty });
  };

  if (distance !== null) {
    take(
      ranged
        ? rangedReach({ distance, sen, maxRange: maxRange ?? 0 })
        : meleeReach({ distance, reach: reach ?? 1 })
    );
  }

  take(visibilityReach(visibility));

  const location = /** @type {Record<string, {penalty: number}>} */ (MANTLE.hitLocations)[
    hitLocation
  ];
  const penalty = hitLocationPenalty ?? location?.penalty ?? 0;
  if (penalty) {
    // Printed locations are named rather than keyed, and localize passes an
    // unknown key through unchanged — so "Wings" arrives on the card as Wings.
    modifiers.push({
      label: location ? `MANTLE.HitLocation.${hitLocation}` : hitLocation,
      value: penalty
    });
  }

  // Striking from hiding is worth two dice, and only against the target the
  // attacker was hidden from — which is why it is asked rather than derived.
  if (hiddenAttacker) {
    modifiers.push({ label: "MANTLE.Modifier.hidden", value: MANTLE.hiddenAttackBonus });
  }

  // Frenzy sharpens melee only, reactive attacks included.
  if (frenzy > 0 && !ranged) {
    modifiers.push({ label: "MANTLE.Condition.frenzy", value: frenzy });
  }

  return { canTarget: blockedBy === null, blockedBy, modifiers };
}

/* -------------------------------------------- */

/**
 * The hit locations an attack may actually aim at.
 *
 * Cover takes Mass off the table for a ranged attack — the target is behind
 * something that shields the bulk of them — and Seeking ignores cover. Melee
 * ignores cover entirely.
 *
 * Returning a list rather than a boolean is what lets the caller answer the
 * rule's last clause: a target that offers no valid Edge or Mark simply cannot
 * be hit by a ranged attack from that angle, and an Imprecise weapon, which
 * may only ever aim at Mass, is refused by cover for the same reason.
 *
 * @template {{key: string}} Location
 * @param {object} input
 * @param {Location[]} input.locations - The locations this target offers
 * @param {boolean} [input.cover]
 * @param {boolean} [input.ranged]
 * @param {boolean} [input.seeking]
 * @returns {Location[]}
 */
export function targetableLocations({ locations, cover = false, ranged = false, seeking = false }) {
  if (seeking || massAvailable({ cover, ranged })) return locations;
  return locations.filter((location) => location.key !== "mass");
}

/**
 * The reach and range a tag list declares.
 *
 * Adversary stat blocks carry these inside the tag list — "Melee 1", "Range 6"
 * — rather than as fields, because that is how they are printed. An attack that
 * names neither is melee at reach 1: that is what a stat block means by saying
 * nothing, and it is the shape of every unarmed line in the catalog.
 *
 * @param {string[]} tags
 * @returns {{melee: number|null, range: number|null}}
 */
export function reachFromTags(tags) {
  /** @param {string} word */
  const distance = (word) => {
    const tag = tags.find((entry) => entry.toLowerCase().startsWith(`${word} `));
    const value = tag ? Number(tag.slice(word.length + 1)) : NaN;
    return Number.isFinite(value) ? value : null;
  };

  const melee = distance("melee");
  const range = distance("range");

  return { melee: range === null && melee === null ? 1 : melee, range };
}
