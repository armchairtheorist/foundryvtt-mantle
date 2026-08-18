/**
 * The condition bar's render context.
 *
 * Shared by both actor sheets, because a Bandit Captain carries Hindered the
 * same way a player character does — the rules make no distinction, so neither
 * should the UI.
 */

import { MANTLE } from "../../config.mjs";

/**
 * Build the condition list for a sheet.
 *
 * Every condition in the catalog appears, present or not. A GM reaching for
 * Provoked mid-turn should not have to remember which submenu it lives in, and
 * sixteen small icons cost less screen than a dropdown costs attention.
 *
 * @param {any} actor - A MantleActor; typed loosely so the sheet context
 *   helper does not need the document subclass generics
 * @returns {{id: string, label: string, img: string, stacks: number,
 *   stackable: boolean, clear: string, tooltip: string}[]}
 */
export function prepareConditions(actor) {
  return Object.entries(MANTLE.conditions).map(([id, condition]) => ({
    id,
    label: condition.label,
    img: `systems/mantle/assets/conditions/${id}.svg`,
    stacks: actor.conditionStacks(id),
    stackable: Boolean(condition.stackable),
    clear: condition.clear,
    tooltip: `MANTLE.ConditionHint.${id}`
  }));
}
