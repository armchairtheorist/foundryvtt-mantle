/**
 * Condition stacking and clearing.
 *
 * Every condition in Mantle is either stackable or not, and has one of three
 * clear types. Those two facts drive everything here: how many stacks an
 * application lands, and what happens at the end of the affected creature's
 * turn.
 *
 * Pure logic — no Foundry dependency, so it is unit-tested directly.
 */

import { MANTLE } from "../config.mjs";

/**
 * The condition table, indexable by id. CONFIG.MANTLE is a plain object literal,
 * so its inferred type has no index signature; every condition entry has the
 * same shape, and this is the one place that needs to say so.
 *
 * @type {Record<string, {label: string, stackable: boolean, cap?: number,
 *   clear: string, rollAttributes?: string[], typed?: boolean,
 *   strainPerStack?: number, damagePerStack?: number}>}
 */
const CONDITIONS = MANTLE.conditions;

/** Stacked conditions cap at 3. Faltering and Unraveling are the exceptions. */
export const DEFAULT_CAP = 3;

/**
 * Wracked deals this much damage per stack, at the end of the turn.
 *
 * The authority is `damagePerStack` on the condition itself; this is kept as a
 * named constant because the figure is quoted in tests and reads better than a
 * literal 2.
 */
export const WRACKED_DAMAGE_PER_STACK = 2;

/**
 * How many stacks a condition can hold.
 *
 * A non-stackable condition counts as having exactly one stack — that is what
 * makes "remove a number of stacks equal to the successes rolled" work the same
 * way for Frightened as it does for Hindered.
 *
 * @param {string} id
 * @returns {number}
 */
export function stackCap(id) {
  const condition = CONDITIONS[id];
  if (!condition) return DEFAULT_CAP;
  if (!condition.stackable) return 1;
  return condition.cap ?? DEFAULT_CAP;
}

/**
 * Apply a change in stacks, clamped to the condition's cap.
 *
 * @param {string} id
 * @param {number} current
 * @param {number} delta - Positive to inflict, negative to clear
 * @returns {number} Stacks after the change; 0 means the condition is gone
 */
export function applyStacks(id, current, delta) {
  return Math.max(0, Math.min(current + delta, stackCap(id)));
}

/**
 * What the end of a creature's turn does to each condition it carries.
 *
 * Three outcomes, one per clear type: auto-clear loses a stack, roll-to-clear
 * needs a roll whose successes are the stacks removed, and persistent does
 * nothing at all. Faltering and Unraveling are persistent but still act at end
 * of turn — they roll a d6 against their own stack count — so they are reported
 * separately rather than lumped in with the conditions that simply sit there.
 *
 * @param {Record<string, number>} stacks - Condition id to stacks held
 * @returns {{auto: string[], roll: {id: string, attributes: string[]}[],
 *   persistent: string[], escalating: string[],
 *   wracked: {id: string, stacks: number, damage: number}[],
 *   selfStrain: {id: string, stacks: number, strain: number}[]}}
 */
export function endOfTurnPlan(stacks) {
  /** @type {string[]} */ const auto = [];
  /** @type {{id: string, attributes: string[]}[]} */ const roll = [];
  /** @type {string[]} */ const persistent = [];
  /** @type {string[]} */ const escalating = [];
  /** @type {{id: string, stacks: number, damage: number}[]} */ const wracked = [];
  /** @type {{id: string, stacks: number, strain: number}[]} */ const selfStrain = [];

  for (const [id, held] of Object.entries(stacks)) {
    if (held <= 0) continue;
    const condition = CONDITIONS[id];
    if (!condition) continue;

    // Wracked deals its damage before the stack is reduced, so it is reported
    // alongside the auto-clear rather than instead of it.
    //
    // Gated on `damagePerStack`, not on `typed`: Affliction is also typed —
    // it carries one of the six affliction names — and deals nothing.
    if (condition.damagePerStack) {
      wracked.push({ id, stacks: held, damage: held * condition.damagePerStack });
    }

    // Frenzy costs its carrier Strain equal to its stacks, every turn. Unlike
    // Wracked this is not damage and Guard does not answer it.
    if (condition.strainPerStack) {
      selfStrain.push({ id, stacks: held, strain: held * condition.strainPerStack });
    }

    if (condition.clear === "auto") auto.push(id);
    else if (condition.clear === "roll") {
      roll.push({ id, attributes: condition.rollAttributes ?? [] });
    } else if (condition.cap === Infinity) escalating.push(id);
    else persistent.push(id);
  }

  return { auto, roll, persistent, escalating, wracked, selfStrain };
}

/**
 * Whether an escalating condition tips over this turn.
 *
 * Faltering and Unraveling each roll a single d6 at end of turn: below the
 * stack count and the creature is Defeated or Lost outright; otherwise the
 * stack grows, and next turn is worse. A creature on 1 stack can never fail,
 * which is what makes the first one survivable.
 *
 * @param {number} stacks
 * @param {number} die - The d6 result
 * @returns {{collapses: boolean, stacksAfter: number}}
 */
export function escalate(stacks, die) {
  const collapses = die < stacks;
  return { collapses, stacksAfter: collapses ? stacks : stacks + 1 };
}

/**
 * The roll modifiers a creature's conditions impose.
 *
 * Impaired costs a die per stack on everything except a luck test, and
 * Hindered costs one more on attacks. Both are offered by the action dialog
 * pre-filled rather than applied silently — the GM may well have already
 * accounted for them, and a modifier applied twice is worse than one applied
 * by hand.
 *
 * @param {Record<string, number>} stacks
 * @returns {{impaired: number, hindered: boolean}}
 */
export function conditionModifiers(stacks) {
  return {
    impaired: stacks.impaired ?? 0,
    hindered: (stacks.hindered ?? 0) > 0
  };
}

/**
 * Conditions that a newly applied condition drags along with it, and ones it
 * clears outright.
 *
 * Three conditions in the catalog rewrite the creature's state as they land:
 * Defeated clears Faltering, Lost clears Unraveling, and Surprised carries
 * Slowed with it for as long as it lasts.
 *
 * @param {string} id
 * @returns {{clears: string[], carries: string[]}}
 */
export function conditionSideEffects(id) {
  switch (id) {
    case "defeated":
      return { clears: ["faltering"], carries: [] };
    case "lost":
      return { clears: ["unraveling"], carries: [] };
    case "surprised":
      return { clears: [], carries: ["slowed"] };
    default:
      return { clears: [], carries: [] };
  }
}

/**
 * Whether a creature's conditions forbid an action, and which one forbids it.
 *
 * Two conditions lock actions out rather than merely taxing them. Broken stops
 * everything until it clears — which is what makes Brace a last resort rather
 * than a cheap defense. Frenzy stops defenses only: a Frenzied character cannot
 * Brace or use a reactive defense, but their reactive *attacks* are sharper
 * than ever.
 *
 * This reports rather than enforces. Whether a locked-out action is refused
 * outright or merely warned about is a table decision, not a rules one.
 *
 * @param {Record<string, number>} stacks - Condition id to stacks held
 * @param {object} action
 * @param {boolean} [action.defensive] - Whether it is Brace or a reactive defense
 * @returns {{allowed: boolean, blockedBy: string|null}}
 */
export function actionAllowed(stacks, { defensive = false } = {}) {
  if ((stacks.broken ?? 0) > 0) return { allowed: false, blockedBy: "broken" };
  if (defensive && (stacks.frenzy ?? 0) > 0) return { allowed: false, blockedBy: "frenzy" };

  return { allowed: true, blockedBy: null };
}
