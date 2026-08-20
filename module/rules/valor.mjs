// @ts-check

/**
 * Valor: the party's shared heroic momentum, and what it buys.
 *
 * Pure arithmetic. Valor lives on a Party actor rather than on any character,
 * so every question here is asked of a pool and an amount rather than of a
 * document.
 */

import { MANTLE } from "../config.mjs";

/**
 * How a Limit Break gets paid for.
 *
 * Two routes, and the rules order them: spend 3 Valor, or — if the character
 * is in Crisis — spend nothing and take Exhausted once the Limit Break has
 * resolved. The Crisis route refreshes at the next Interlude, so it is once per
 * combat rather than once per turn.
 *
 * @param {object} input
 * @param {number} input.valor - Valor in the party pool
 * @param {boolean} input.crisis - Whether the character is in Crisis
 * @param {boolean} input.crisisUsed - Whether the Crisis route is already spent
 * @returns {{route: "valor"|"crisis", cost: number, exhausts: boolean}[]}
 */
export function limitBreakRoutes({ valor, crisis, crisisUsed }) {
  /** @type {{route: "valor"|"crisis", cost: number, exhausts: boolean}[]} */
  const routes = [];

  if (valor >= MANTLE.valorCosts.limitBreak) {
    routes.push({ route: "valor", cost: MANTLE.valorCosts.limitBreak, exhausts: false });
  }

  if (crisis && !crisisUsed) {
    routes.push({ route: "crisis", cost: 0, exhausts: true });
  }

  return routes;
}

/**
 * How many successes a given amount of Valor buys on an ally's roll.
 *
 * One success per Valor, capped at 3 on any single roll — and never on a luck
 * test, which the caller is responsible for refusing.
 *
 * @param {number} valor - Valor available in the pool
 * @param {number} [wanted] - Successes asked for
 * @returns {number}
 */
export function heroicFeatSuccesses(valor, wanted = MANTLE.heroicFeatMaxSuccesses) {
  const affordable = Math.floor(valor / MANTLE.valorCosts.heroicFeatPerSuccess);

  return Math.max(0, Math.min(wanted, affordable, MANTLE.heroicFeatMaxSuccesses));
}

/**
 * Whether Heroic Fortune can be applied to a Wound or Burden, and what it
 * leaves behind.
 *
 * It downgrades severity by one, once per Wound or Burden. Severity 1 is the
 * floor: there is no severity 0, so a Minor Wound cannot be bought off.
 *
 * @param {object} input
 * @param {number} input.valor - Valor in the party pool
 * @param {number} input.severity - The severity about to land
 * @param {boolean} [input.alreadyApplied] - Whether this harm was already softened
 * @returns {{available: boolean, cost: number, severityAfter: number}}
 */
export function heroicFortune({ valor, severity, alreadyApplied = false }) {
  const cost = MANTLE.valorCosts.heroicFortune;
  const available = !alreadyApplied && severity > 1 && valor >= cost;

  return { available, cost, severityAfter: available ? severity - 1 : severity };
}
