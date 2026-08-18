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
 * Only skills the character is actually trained in are offered. Training is
 * binary and worth +2d, at most one skill per roll, so a dropdown of the
 * trained ones is the whole interaction.
 */

import { MANTLE } from "../config.mjs";
import { buildPool } from "../dice/pool.mjs";

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
  const trained = actor.system.skills ?? new Set();

  const skills = Object.keys(MANTLE.skills)
    .filter((key) => trained.has(key))
    .map((key) => ({ key, label: game.i18n.localize(`MANTLE.Skill.${key}`) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const attributes = Object.entries(MANTLE.attributes).map(([key, entry]) => ({
    key,
    label: game.i18n.localize(entry.label),
    value: actor.system.attributes?.[key] ?? 0,
    selected: key === attribute
  }));

  const content = await foundry.applications.handlebars.renderTemplate(TEMPLATE, {
    attributes,
    skills,
    skillBonus: MANTLE.skillBonus
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
    render: (_event, dialog) => attachLivePool(dialog.element, actor, skills),
    rejectClose: false
  });

  if (!result) return null;

  const chosen = String(result.get("attribute") || attribute);
  const skill = String(result.get("skill") || "");

  return {
    attribute: chosen,
    modifiers: readModifiers(result, skills),
    subtitle: skill ? game.i18n.localize(`MANTLE.Skill.${skill}`) : ""
  };
}

/* -------------------------------------------- */

/**
 * Turn the submitted form into the modifier list the chat card audits the pool
 * against. Modifiers worth nothing are left out rather than listed as zero.
 *
 * @param {FormData} data
 * @param {{key: string, label: string}[]} skills
 * @returns {import("../dice/pool.mjs").Modifier[]}
 */
function readModifiers(data, skills) {
  /** @type {import("../dice/pool.mjs").Modifier[]} */
  const modifiers = [];

  const skill = String(data.get("skill") || "");
  if (skill && skills.some((entry) => entry.key === skill)) {
    modifiers.push({ label: `MANTLE.Skill.${skill}`, value: MANTLE.skillBonus });
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
 * @param {{key: string, label: string}[]} skills
 */
function attachLivePool(html, actor, skills) {
  const form = html.querySelector("form");
  if (!form) return;

  const update = () => {
    const data = new FormData(form);
    const attribute = String(data.get("attribute") || "pow");
    const base = actor.system.attributes?.[attribute] ?? 0;
    const pool = buildPool(base, readModifiers(data, skills));

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
