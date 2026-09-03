// @ts-check

/**
 * Interlude and downtime.
 *
 * Two rest periods with quite different reach. An interlude is the pause
 * between encounters: resources come back, the fight's conditions fall off, and
 * anything the *story* put on a character stays exactly where it is. Downtime
 * is the mission-level rest, where the Wounds themselves heal.
 *
 * Pure logic. What a rest actually does to a character is the caller's job;
 * this decides what it should do.
 */

import { MANTLE } from "../config.mjs";

/**
 * Conditions an interlude does not clear.
 *
 * Anchored to something outside the fight, so catching your breath does not
 * touch them. Cursed lasts until the relic is destroyed; an Affliction lasts
 * until its Burden is healed. The GM may rule others narrative case by case —
 * a Defeated character who was fatally stabbed does not simply get up.
 */
export const NARRATIVE_CONDITIONS = ["cursed", "affliction"];

/**
 * The persistent conditions an interlude clears.
 *
 * Auto-clear and roll-to-clear conditions all go, so only the persistent ones
 * need naming — and v0.31 names exactly these five. Faltering and Unraveling
 * are the change: they used to be *paused* and returned at one stack if the
 * harm underneath was unhealed, and they now simply end.
 */
export const CLEARED_PERSISTENT = ["faltering", "unraveling", "defeated", "lost", "vulnerable"];

/**
 * What an interlude does to the conditions a character is carrying.
 *
 * @param {Record<string, number>} stacks - Condition id to stacks held
 * @returns {{clears: string[], persists: string[]}}
 */
export function interludeConditions(stacks) {
  /** @type {string[]} */ const clears = [];
  /** @type {string[]} */ const persists = [];

  /** @type {Record<string, {clear: string}>} */
  const table = MANTLE.conditions;

  for (const [id, held] of Object.entries(stacks)) {
    if (held <= 0) continue;

    if (NARRATIVE_CONDITIONS.includes(id)) {
      persists.push(id);
      continue;
    }

    // Everything that clears on its own in combat clears here too; a
    // persistent condition only goes if v0.31 names it.
    const clear = table[id]?.clear;
    if (clear === "auto" || clear === "roll" || CLEARED_PERSISTENT.includes(id)) clears.push(id);
    else persists.push(id);
  }

  return { clears, persists };
}

/**
 * What one Wound or Burden costs in Resolve to heal during an interlude.
 *
 * A flat 1 in v0.31: "Player characters can choose to spend 1 Resolve to heal
 * 1 Wound or 1 Burden." Severities used to price this — a Critical Wound cost
 * 3 — and there are no severities any more, so every Wound costs the same.
 *
 * Kept as a function rather than inlined as a literal because the *shape* of
 * the rule is "each harm has a price", and a mastery or ability changing that
 * price is a far smaller edit here than at every call site.
 *
 * @param {object} [harm] - The Wound or Burden being healed
 * @returns {number}
 */
export function healCost(harm) {
  return MANTLE.healResolveCost;
}

/**
 * Which Wounds and Burdens a given amount of Resolve can afford, cheapest
 * first.
 *
 * Greedy on purpose: it answers "what could I clear with what I have", which is
 * the question a player asks before choosing. The actual choice stays theirs.
 *
 * With a flat price this reduces to "as many as you can pay for", but it stays
 * cost-aware so an ability that changes the price does not need a new function.
 *
 * @param {object[]} harms
 * @param {number} resolve
 * @returns {{indices: number[], cost: number}}
 */
export function affordableHeals(harms, resolve) {
  const order = harms
    .map((harm, index) => ({ index, cost: healCost(harm) }))
    .sort((a, b) => a.cost - b.cost || a.index - b.index);

  const indices = [];
  let cost = 0;

  for (const entry of order) {
    if (cost + entry.cost > resolve) continue;
    cost += entry.cost;
    indices.push(entry.index);
  }

  return { indices: indices.sort((a, b) => a - b), cost };
}

/**
 * @typedef {{value: number, max: number}} Resource
 *
 * @typedef {object} Restable
 * @property {Resource} vitality
 * @property {Resource} strain
 * @property {Resource} guard
 * @property {Resource} vigor
 * @property {Resource} resolve
 * @property {Resource} consumables
 */

/**
 * The resource restoration an interlude performs unconditionally.
 *
 * Vitality is deliberately absent: restoring it costs 1 Resolve and is the
 * player's choice, not the rest's.
 *
 * @param {Restable} character - The character's system data
 * @returns {Record<string, number>}
 */
export function interludeRestore(character) {
  return {
    // Over-Guard is lost rather than kept: Guard returns *to* its maximum.
    "system.guard.value": character.guard.max,
    "system.vigor.value": character.vigor.max,
    "system.strain.value": 0,
    "system.consumables.value": Math.min(
      character.consumables.value + MANTLE.interludeConsumableRestock,
      character.consumables.max
    )
  };
}

/**
 * The resource restoration downtime performs.
 *
 * Everything an interlude does, plus Vitality and Resolve at no cost — and the
 * consumables are restocked to full rather than by one.
 *
 * @param {Restable} character - The character's system data
 * @returns {Record<string, number>}
 */
export function downtimeRestore(character) {
  return {
    ...interludeRestore(character),
    "system.vitality.value": character.vitality.max,
    "system.resolve.value": character.resolve.max,
    "system.consumables.value": character.consumables.max
  };
}

/**
 * Whether the party's Momentum at downtime earns a merit.
 *
 * @param {number} momentum
 * @param {number} threshold
 * @returns {boolean}
 */
export function earnsMerit(momentum, threshold) {
  return momentum >= threshold;
}
