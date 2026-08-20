// @ts-nocheck — ActiveEffect flag typing and the status-effect API need
// TypeScript-level annotations. The stacking and clearing rules this glue
// drives live in module/rules/conditions.mjs, which is checked and tested.

/**
 * Conditions as Foundry status effects.
 *
 * Mantle's conditions stack, and Foundry's status effects do not — a status is
 * either on a token or off it. The stack count therefore lives on the effect,
 * in `flags.statuscounter.value`, which is the flag the Status Icon Counters
 * module reads to draw the number on the token. Without that module the counts
 * are still tracked and still shown on the sheet; only the token badge is
 * missing, so nothing here depends on it being installed.
 */

import { MANTLE } from "../config.mjs";
import {
  applyStacks,
  conditionSideEffects,
  endOfTurnPlan,
  escalate
} from "../rules/conditions.mjs";

/** Where Status Icon Counters expects to find a stack count. */
const COUNTER_FLAG = "statuscounter";

/**
 * The Active Effect carrying a condition, if the actor has it.
 *
 * @param {Actor} actor
 * @param {string} id
 * @returns {ActiveEffect|undefined}
 */
export function conditionEffect(actor, id) {
  return actor.effects.find((effect) => effect.statuses?.has(id));
}

/**
 * How many stacks of a condition an actor is carrying.
 *
 * A condition that is present but carries no counter is one stack — that is
 * how a non-stackable condition reads, and how any effect applied by another
 * module or by hand reads too.
 *
 * @param {Actor} actor
 * @param {string} id
 * @returns {number}
 */
export function conditionStacks(actor, id) {
  const effect = conditionEffect(actor, id);
  if (!effect) return 0;
  return effect.getFlag(COUNTER_FLAG, "value") ?? 1;
}

/**
 * Every condition the actor carries, as id to stacks.
 *
 * @param {Actor} actor
 * @returns {Record<string, number>}
 */
export function allConditionStacks(actor) {
  /** @type {Record<string, number>} */
  const stacks = {};
  for (const id of Object.keys(MANTLE.conditions)) {
    const held = conditionStacks(actor, id);
    if (held > 0) stacks[id] = held;
  }
  return stacks;
}

/* -------------------------------------------- */

/**
 * Set a condition to an exact number of stacks, creating or removing the
 * effect as needed.
 *
 * @param {Actor} actor
 * @param {string} id
 * @param {number} stacks - Zero removes the condition
 * @returns {Promise<void>}
 */
export async function setCondition(actor, id, stacks) {
  const existing = conditionEffect(actor, id);

  if (stacks <= 0) {
    if (existing) await existing.delete();
    return;
  }

  if (!existing) {
    await actor.toggleStatusEffect(id, { active: true });
  }

  // Read the effect back rather than trusting the toggle's return value: some
  // Foundry versions hand back a boolean, and the flag has to land on the
  // document either way.
  const effect = conditionEffect(actor, id);
  if (effect) await effect.setFlag(COUNTER_FLAG, "value", stacks);
}

/**
 * Change a condition by some number of stacks, clamped to its cap.
 *
 * Applying a condition can rewrite other parts of the creature's state:
 * Defeated clears Faltering, Lost clears Unraveling, and Surprised carries
 * Slowed with it. Those follow automatically, because a GM who applies
 * Defeated should not also have to remember to clear the Faltering that caused
 * it.
 *
 * @param {Actor} actor
 * @param {string} id
 * @param {number} delta
 * @returns {Promise<number>} Stacks after the change
 */
export async function changeCondition(actor, id, delta) {
  const before = conditionStacks(actor, id);
  const after = applyStacks(id, before, delta);
  if (after === before) return before;

  await setCondition(actor, id, after);

  if (after > 0 && before === 0) {
    const { clears, carries } = conditionSideEffects(id);
    for (const other of clears) await setCondition(actor, other, 0);
    for (const other of carries) {
      if (conditionStacks(actor, other) === 0) await setCondition(actor, other, 1);
    }

    // Defeated and Lost each reset a track as they land.
    if (id === "defeated") await actor.update({ "system.vitality.value": 0 });
    if (id === "lost") await actor.update({ "system.strain.value": 0 });
  }

  // Surprised takes its attached Slowed with it when it goes.
  if (after === 0 && id === "surprised") await setCondition(actor, "slowed", 0);

  return after;
}

/* -------------------------------------------- */

/**
 * Run the end-of-turn condition pass and report what happened.
 *
 * Three things resolve here, in the order the rules put them: Wracked deals its
 * damage *before* its stack is reduced, auto-clearing conditions lose a stack,
 * and roll-to-clear conditions each roll their attribute and lose a stack per
 * success. Faltering and Unraveling roll a d6 against their own stack count and
 * may collapse the creature outright.
 *
 * Every roll is posted to chat, because each one is a moment the table wants to
 * see — a Faltering check is not a bookkeeping step.
 *
 * @param {Actor} actor
 * @returns {Promise<{lines: string[], collapsed: string|null}>}
 */
export async function clearConditionsForTurn(actor) {
  const plan = endOfTurnPlan(allConditionStacks(actor));
  const lines = [];
  let collapsed = null;

  // Wracked first: its damage is taken before the stack drops.
  for (const entry of plan.wracked) {
    await actor.applyHarm({ amount: entry.damage, penetrating: true });
    lines.push(
      game.i18n.format("MANTLE.Condition.wrackedTick", {
        damage: entry.damage,
        stacks: entry.stacks
      })
    );
  }

  // Frenzy next: Strain the carrier pays for their own rage. It is Strain
  // rather than damage, so Guard does not answer it.
  for (const entry of plan.selfStrain) {
    await actor.applyHarm({ amount: entry.strain, strain: true });
    lines.push(
      game.i18n.format("MANTLE.Condition.selfStrainTick", {
        condition: game.i18n.localize(MANTLE.conditions[entry.id].label),
        strain: entry.strain
      })
    );
  }

  for (const id of plan.auto) {
    const after = await changeCondition(actor, id, -1);
    lines.push(conditionLine(id, after));
  }

  for (const entry of plan.roll) {
    // "POW or AGI" means the creature picks; the higher attribute is what a
    // player would pick anyway, and the GM can always roll it by hand instead.
    const attribute = bestAttribute(actor, entry.attributes);
    const message = await actor.rollAction({
      attribute,
      title: game.i18n.format("MANTLE.Condition.clearRoll", {
        condition: game.i18n.localize(MANTLE.conditions[entry.id].label)
      }),
      subtitle: actor.name
    });

    const successes = message?.rolls?.[0]?.resolve()?.successes ?? 0;
    const after = await changeCondition(actor, entry.id, -successes);
    lines.push(conditionLine(entry.id, after));
  }

  for (const id of plan.escalating) {
    const stacks = conditionStacks(actor, id);
    const die = await new Roll("1d6").evaluate();
    const { collapses, stacksAfter } = escalate(stacks, die.total);

    if (collapses) {
      const outcome = id === "faltering" ? "defeated" : "lost";
      await changeCondition(actor, outcome, 1);
      collapsed = outcome;
      lines.push(
        game.i18n.format("MANTLE.Condition.collapsed", {
          die: die.total,
          stacks,
          outcome: game.i18n.localize(MANTLE.conditions[outcome].label)
        })
      );
    } else {
      await setCondition(actor, id, stacksAfter);
      lines.push(conditionLine(id, stacksAfter));
    }
  }

  if (lines.length > 0) {
    await ChatMessage.create({
      content: `<div class="mantle mantle-harm-card">
          <p><strong>${actor.name}</strong> — ${game.i18n.localize("MANTLE.Condition.endOfTurn")}</p>
          <p class="notes">${lines.join(" · ")}</p>
        </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });
  }

  return { lines, collapsed };
}

/* -------------------------------------------- */

/**
 * One line of the end-of-turn report.
 *
 * @param {string} id
 * @param {number} stacks
 * @returns {string}
 */
function conditionLine(id, stacks) {
  const label = game.i18n.localize(MANTLE.conditions[id].label);
  return stacks > 0
    ? game.i18n.format("MANTLE.Condition.reduced", { condition: label, stacks })
    : game.i18n.format("MANTLE.Condition.cleared", { condition: label });
}

/**
 * Pick the best of several attributes a roll may use.
 *
 * @param {Actor} actor
 * @param {string[]} attributes
 * @returns {string}
 */
function bestAttribute(actor, attributes) {
  if (attributes.length === 0) return "pow";
  return attributes.reduce((best, key) =>
    (actor.system.attributes?.[key] ?? 0) > (actor.system.attributes?.[best] ?? 0) ? key : best
  );
}
