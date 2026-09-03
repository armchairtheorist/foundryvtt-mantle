// @ts-check

/**
 * Momentum: the party's shared heroic momentum, and what it buys.
 *
 * Pure arithmetic. Momentum lives on a Party actor rather than on any character,
 * so every question here is asked of a pool and an amount rather than of a
 * document.
 */

import { MANTLE } from "../config.mjs";

/**
 * How a Limit Break gets paid for.
 *
 * Two routes, and the rules order them: spend 3 Momentum, or — if the character
 * is in Crisis — spend nothing and take Exhausted once the Limit Break has
 * resolved. The Crisis route refreshes at the next Interlude, so it is once per
 * combat rather than once per turn.
 *
 * @param {object} input
 * @param {number} input.momentum - Momentum in the party pool
 * @param {boolean} input.crisis - Whether the character is in Crisis
 * @param {boolean} input.crisisUsed - Whether the Crisis route is already spent
 * @returns {{route: "momentum"|"crisis", cost: number, exhausts: boolean}[]}
 */
export function limitBreakRoutes({ momentum, crisis, crisisUsed }) {
  /** @type {{route: "momentum"|"crisis", cost: number, exhausts: boolean}[]} */
  const routes = [];

  if (momentum >= MANTLE.momentumCosts.limitBreak) {
    routes.push({ route: "momentum", cost: MANTLE.momentumCosts.limitBreak, exhausts: false });
  }

  if (crisis && !crisisUsed) {
    routes.push({ route: "crisis", cost: 0, exhausts: true });
  }

  return routes;
}

/**
 * How many successes a given amount of Momentum buys on an ally's roll.
 *
 * One success per Momentum, capped at 3 on any single roll — and never on a luck
 * test, which the caller is responsible for refusing.
 *
 * @param {number} momentum - Momentum available in the pool
 * @param {number} [wanted] - Successes asked for
 * @returns {number}
 */
export function momentousFeatSuccesses(momentum, wanted = MANTLE.momentousFeatMaxSuccesses) {
  const affordable = Math.floor(momentum / MANTLE.momentumCosts.momentousFeatPerSuccess);

  return Math.max(0, Math.min(wanted, affordable, MANTLE.momentousFeatMaxSuccesses));
}

/**
 * Whether Momentous Fortune can be spent on a luck roll.
 *
 * This is a different mechanic from the Heroic Fortune it replaced, not a
 * rename. Heroic Fortune downgraded a Wound or Burden's severity by one, and
 * v0.31 has no severities to downgrade. Momentous Fortune instead rerolls an
 * undesirable luck roll and keeps the better of the two results.
 *
 * Once per luck roll, and only on luck rolls — the pairing with Momentous
 * Feat is deliberate, since a Feat may never touch a luck roll and this may
 * never touch anything else.
 *
 * @param {object} input
 * @param {number} input.momentum - Momentum in the party pool
 * @param {boolean} [input.alreadyRerolled] - Whether this roll was already rerolled
 * @returns {{available: boolean, cost: number}}
 */
export function momentousFortune({ momentum, alreadyRerolled = false }) {
  const cost = MANTLE.momentumCosts.momentousFortune;

  return { available: !alreadyRerolled && momentum >= cost, cost };
}

/**
 * Which of two luck rolls Momentous Fortune keeps.
 *
 * "The character can choose the better result between the old and the new
 * roll" — so the reroll can never make things worse, which is what makes it
 * worth 2 Momentum rather than a gamble.
 *
 * @param {number} before - Successes on the original roll
 * @param {number} after - Successes on the reroll
 * @returns {number}
 */
export function betterLuck(before, after) {
  return Math.max(before, after);
}
