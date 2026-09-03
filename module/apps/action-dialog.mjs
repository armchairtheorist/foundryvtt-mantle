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
 */

import { MANTLE } from "../config.mjs";
import { buildPool } from "../dice/pool.mjs";
import { conditionModifiers } from "../rules/conditions.mjs";

const { DialogV2 } = foundry.applications.api;
const TEMPLATE = "systems/mantle/templates/apps/action-dialog.hbs";

/**
 * Ask which attribute to roll and what modifies it.
 *
 * @param {Actor} actor
 * @param {object} [options]
 * @param {string} [options.attribute] - Pre-selected attribute
 * @returns {Promise<{attribute: string, modifiers: import("../dice/pool.mjs").Modifier[], subtitle: string}|null>}
 */
export async function promptAction(actor, { attribute = "pow" } = {}) {
  // Indexed rather than keyed by text: Threads are prose, and two could
  // legitimately read alike.
  const threads = (actor.system.threads ?? []).map((text, index) => ({
    key: String(index),
    label: text
  }));

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
    render: (_event, dialog) => attachLivePool(dialog.element, actor, threads),
    rejectClose: false
  });

  if (!result) return null;

  const chosen = String(result.get("attribute") || attribute);
  const thread = threads.find((entry) => entry.key === String(result.get("thread") || ""));

  return {
    attribute: chosen,
    modifiers: readModifiers(result, threads),
    subtitle: thread?.label ?? ""
  };
}

/* -------------------------------------------- */

/**
 * Turn the submitted form into the modifier list the chat card audits the pool
 * against. Modifiers worth nothing are left out rather than listed as zero.
 *
 * @param {FormData} data
 * @param {{key: string, label: string}[]} threads
 * @returns {import("../dice/pool.mjs").Modifier[]}
 */
function readModifiers(data, threads) {
  /** @type {import("../dice/pool.mjs").Modifier[]} */
  const modifiers = [];

  const thread = threads.find((entry) => entry.key === String(data.get("thread") || ""));
  if (thread) {
    // The label is the Thread's own prose, which is what the card should show —
    // "Twenty years keeping ledgers" reads better than "Thread". Foundry's
    // localize passes an unknown key through unchanged, so prose survives it.
    modifiers.push({ label: thread.label, value: MANTLE.threadBonus });
  }

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
 */
function attachLivePool(html, actor, threads) {
  const form = html.querySelector("form");
  if (!form) return;

  const update = () => {
    const data = new FormData(form);
    const attribute = String(data.get("attribute") || "pow");
    const base = actor.system.attributes?.[attribute] ?? 0;
    const pool = buildPool(base, readModifiers(data, threads));

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
