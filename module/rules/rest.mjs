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
 * Two quite different reasons to survive a rest, so they are listed apart:
 *
 *  - *Narrative* conditions are anchored to something in the story. Cursed
 *    lasts until the relic is destroyed, not until the party catches its
 *    breath. The GM may rule others narrative case by case — a Defeated
 *    character who was fatally stabbed does not simply get up.
 *  - *Paused* conditions are Faltering and Unraveling. They neither clear nor
 *    tick during an interlude: no checks are rolled. If the Critical Wound or
 *    Breakdown underneath is still there when the next fight starts, the
 *    character re-enters at one stack.
 */
export const NARRATIVE_CONDITIONS = ["cursed"];
export const PAUSED_CONDITIONS = ["faltering", "unraveling"];

/**
 * What an interlude does to the conditions a character is carrying.
 *
 * @param {Record<string, number>} stacks - Condition id to stacks held
 * @returns {{clears: string[], persists: string[], pauses: string[]}}
 */
export function interludeConditions(stacks) {
  /** @type {string[]} */ const clears = [];
  /** @type {string[]} */ const persists = [];
  /** @type {string[]} */ const pauses = [];

  for (const [id, held] of Object.entries(stacks)) {
    if (held <= 0) continue;

    if (PAUSED_CONDITIONS.includes(id)) pauses.push(id);
    else if (NARRATIVE_CONDITIONS.includes(id)) persists.push(id);
    else clears.push(id);
  }

  return { clears, persists, pauses };
}

/**
 * What a character re-enters combat carrying.
 *
 * Faltering and Unraveling were paused rather than cleared, and the harm
 * underneath is what decides whether they come back: an unhealed Critical Wound
 * restarts Faltering at 1, an unhealed Breakdown restarts Unraveling at 1.
 *
 * @param {object} input
 * @param {boolean} input.criticalWound - A Critical Wound is still unhealed
 * @param {boolean} input.breakdown - A Breakdown is still unhealed
 * @returns {Record<string, number>}
 */
export function combatReentry({ criticalWound, breakdown }) {
  /** @type {Record<string, number>} */
  const stacks = {};

  if (criticalWound) stacks.faltering = 1;
  if (breakdown) stacks.unraveling = 1;

  return stacks;
}

/**
 * What one Wound or Burden costs in Resolve to heal during an interlude.
 *
 * "The amount of Resolve it costs to heal each Wound or Burden is equal to the
 * severity" — so a Critical Wound is the expensive one, which is the point.
 *
 * @param {{severity: number}} harm
 * @returns {number}
 */
export function healCost(harm) {
  return harm.severity;
}

/**
 * Which Wounds and Burdens a given amount of Resolve can afford, cheapest
 * first.
 *
 * Greedy on purpose: it answers "what could I clear with what I have", which is
 * the question a player asks before choosing. The actual choice stays theirs.
 *
 * @param {{severity: number}[]} harms
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
 * Whether the party's Valor at downtime earns a merit.
 *
 * @param {number} valor
 * @param {number} threshold
 * @returns {boolean}
 */
export function earnsMerit(valor, threshold) {
  return valor >= threshold;
}
