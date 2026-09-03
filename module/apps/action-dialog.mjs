// @ts-nocheck — ApplicationV2 and DialogV2 generics overwhelm fvtt-types in
// plain JS. The pool arithmetic this drives lives in module/dice/pool.mjs,
// which is checked and tested.

/**
 * The action roll dialog.
 *
 * An action roll is an attribute plus whatever the fiction adds or takes away,
 * and Mantle sums every modifier before any die is rolled — so the only thing
 * this dialog has to get right is showing the player the pool they are about to
 * roll while they assemble it.
 *
 * Only the character's own Threads are offered. A Thread is worth +2d when the
 * GM rules it applies, at most one per roll — the same shape training had — so
 * a dropdown of the ones they hold is the whole interaction. Whether a Thread
 * *does* apply is the GM's call and stays at the table; the dialog only prices
 * the answer.
 *
 * Invoking a Bond sits alongside it: also +2d, also at most one per roll, but
 * paid for with 1 Resolve and barred on luck rolls. The dialog does not spend
 * the Resolve — it reports what was chosen, and the caller pays.
 */

import { MANTLE } from "../config.mjs";
import { buildPool } from "../dice/pool.mjs";
import { conditionModifiers } from "../rules/conditions.mjs";
import { bondIntensity } from "../rules/bonds.mjs";

const { DialogV2 } = foundry.applications.api;
const TEMPLATE = "systems/mantle/templates/apps/action-dialog.hbs";

/**
 * Ask which attribute to roll and what modifies it.
 *
 * @param {Actor} actor
 * @param {object} [options]
 * @param {string} [options.attribute] - Pre-selected attribute
 * @returns {Promise<{attribute: string, modifiers: import("../dice/pool.mjs").Modifier[], subtitle: string, resolveSpent: number, bond: string}|null>}
 */
export async function promptAction(actor, { attribute = "pow" } = {}) {
  // Indexed rather than keyed by text: Threads are prose, and two could
  // legitimately read alike.
  const threads = (actor.system.threads ?? []).map((text, index) => ({
    key: String(index),
    label: text
  }));

  // Only Bonds that have actually reached Fleeting can be invoked, and only
  // while there is Resolve to pay with. Indexed for the same reason Threads
  // are: two Bonds may carry the same descriptor.
  const bonds = (actor.system.bonds ?? [])
    .map((bond, index) => ({ bond, index }))
    .filter(({ bond }) => bondIntensity(bond.strands) >= MANTLE.bondManeuvers.invoke.intensity)
    .map(({ bond, index }) => ({
      key: String(index),
      label: bond.descriptor || bond.name || game.i18n.localize("MANTLE.Sheet.bonds")
    }));

  const canInvoke = (actor.system.resolve?.value ?? 0) >= MANTLE.bondManeuvers.invoke.resolve;

  const attributes = Object.entries(MANTLE.attributes).map(([key, entry]) => ({
    key,
    label: game.i18n.localize(entry.label),
    value: actor.system.attributes?.[key] ?? 0,
    selected: key === attribute
  }));

  // Impaired is pre-filled from what the character is actually carrying, but
  // left editable rather than applied silently: the GM may already have
  // accounted for it, and a penalty applied twice is worse than one applied by
  // hand.
  const conditions = conditionModifiers(actor.conditions ?? {});

  const content = await foundry.applications.handlebars.renderTemplate(TEMPLATE, {
    attributes,
    threads,
    threadBonus: MANTLE.threadBonus,
    bonds,
    bondBonus: MANTLE.bondManeuvers.invoke.bonus,
    canInvoke,
    impaired: conditions.impaired
  });

  const result = await DialogV2.wait({
    window: { title: game.i18n.localize("MANTLE.Action.title") },
    classes: ["mantle"],
    content,
    buttons: [
      {
        action: "roll",
        label: game.i18n.localize("MANTLE.Action.roll"),
        default: true,
        callback: (_event, button) => new FormData(button.form)
      },
      { action: "cancel", label: game.i18n.localize("MANTLE.Action.cancel") }
    ],
    render: (_event, dialog) => attachLivePool(dialog.element, actor, threads, bonds),
    rejectClose: false
  });

  if (!result) return null;

  const chosen = String(result.get("attribute") || attribute);
  const thread = threads.find((entry) => entry.key === String(result.get("thread") || ""));
  const bond = invokedBond(result, bonds);

  // The subtitle is the one line of prose the card carries. A Bond invocation
  // is the more particular thing to have happened, so it wins the slot.
  return {
    attribute: chosen,
    modifiers: readModifiers(result, threads, bonds),
    subtitle: bond?.label ?? thread?.label ?? "",
    resolveSpent: bond ? MANTLE.bondManeuvers.invoke.resolve : 0,
    bond: bond?.label ?? ""
  };
}

/* -------------------------------------------- */

/**
 * The Bond this roll invokes, if any.
 *
 * A luck roll cannot be Bond-boosted, so choosing LUCK after picking a Bond
 * drops the invocation rather than refusing the roll — and because this is the
 * same function the live readout uses, the pool the player sees already
 * reflects that.
 *
 * @param {FormData} data
 * @param {{key: string, label: string}[]} bonds
 * @returns {{key: string, label: string}|undefined}
 */
function invokedBond(data, bonds) {
  if (String(data.get("attribute") || "") === "luck") return undefined;
  return bonds.find((entry) => entry.key === String(data.get("bond") || ""));
}

/* -------------------------------------------- */

/**
 * Turn the submitted form into the modifier list the chat card audits the pool
 * against. Modifiers worth nothing are left out rather than listed as zero.
 *
 * @param {FormData} data
 * @param {{key: string, label: string}[]} threads
 * @param {{key: string, label: string}[]} [bonds]
 * @returns {import("../dice/pool.mjs").Modifier[]}
 */
function readModifiers(data, threads, bonds = []) {
  /** @type {import("../dice/pool.mjs").Modifier[]} */
  const modifiers = [];

  const thread = threads.find((entry) => entry.key === String(data.get("thread") || ""));
  if (thread) {
    // The label is the Thread's own prose, which is what the card should show —
    // "Twenty years keeping ledgers" reads better than "Thread". Foundry's
    // localize passes an unknown key through unchanged, so prose survives it.
    modifiers.push({ label: thread.label, value: MANTLE.threadBonus });
  }

  const bond = invokedBond(data, bonds);
  if (bond) modifiers.push({ label: bond.label, value: MANTLE.bondManeuvers.invoke.bonus });

  const impaired = Number(data.get("impaired")) || 0;
  if (impaired > 0) modifiers.push({ label: "MANTLE.Condition.impaired", value: -impaired });

  const situational = Number(data.get("situational")) || 0;
  if (situational) modifiers.push({ label: "MANTLE.Modifier.situational", value: situational });

  return modifiers;
}

/* -------------------------------------------- */

/**
 * Keep the pool readout in step with the controls.
 *
 * A pool driven to zero is not a failure in Mantle — it becomes a desperate
 * roll of 2d6 keeping the lowest — so the readout says so rather than showing
 * a nonsensical "0d".
 *
 * @param {HTMLElement} html
 * @param {Actor} actor
 * @param {{key: string, label: string}[]} threads
 * @param {{key: string, label: string}[]} bonds
 */
function attachLivePool(html, actor, threads, bonds) {
  const form = html.querySelector("form");
  if (!form) return;

  const update = () => {
    const data = new FormData(form);
    const attribute = String(data.get("attribute") || "pow");
    const base = actor.system.attributes?.[attribute] ?? 0;
    const pool = buildPool(base, readModifiers(data, threads, bonds));

    // Luck rolls cannot be Bond-boosted, so the control greys out rather than
    // silently ignoring what is selected in it.
    const invoke = html.querySelector('[name="bond"]');
    if (invoke) invoke.closest(".row")?.classList.toggle("unavailable", attribute === "luck");

    const readout = html.querySelector("[data-pool]");
    if (readout) {
      readout.textContent = pool.desperate
        ? game.i18n.localize("MANTLE.Action.desperate")
        : `${pool.dice}d6`;
    }
    html.querySelector(".action-summary")?.classList.toggle("desperate", pool.desperate);
  };

  form.addEventListener("change", update);
  form.addEventListener("input", update);
  update();
}
