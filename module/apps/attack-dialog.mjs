// @ts-nocheck — ApplicationV2 and DialogV2 generics overwhelm fvtt-types in
// plain JS. The positional arithmetic this drives lives in
// module/rules/targeting.mjs, which is checked and tested.

/**
 * The attack dialog.
 *
 * An attack in Mantle is a pool assembled from where you are standing as much
 * as from what you are holding: the hit location you are aiming at, how far the
 * target is, whether you can see it, whether it can see you. All of that sums
 * before a die is rolled, so the dialog's job is to show the player the pool
 * while they assemble it — the same contract the action dialog keeps.
 *
 * Where the canvas can answer a question, it does: a targeted token gives the
 * distance and the hit locations that target actually has. Everything measured
 * stays editable, because the canvas is often a sketch of the fiction rather
 * than the fiction itself.
 */

import { MANTLE } from "../config.mjs";
import { buildPool } from "../dice/pool.mjs";
import { conditionModifiers } from "../rules/conditions.mjs";
import { attackModifiers, targetableLocations } from "../rules/targeting.mjs";

const { DialogV2 } = foundry.applications.api;
const TEMPLATE = "systems/mantle/templates/apps/attack-dialog.hbs";

/**
 * Ask how this attack is being made.
 *
 * @param {Actor} actor - The attacker
 * @param {{name: string, system: object}} weapon
 * @param {object} [options]
 * @param {string} [options.attribute] - The attribute already chosen
 * @param {number} [options.base] - Dice the roll starts from, when they do not
 *   come from an attribute. An adversary's pool is printed on its stat block.
 * @returns {Promise<{modifiers: import("../dice/pool.mjs").Modifier[],
 *   hitLocation: string}|null>}
 */
export async function promptAttack(actor, weapon, { attribute = "pow", base } = {}) {
  const target = firstTarget(actor);
  const isRanged = pickMode(weapon, target);
  const tags = Array.from(weapon.system.tags ?? []).map(String);

  const context = {
    weapon: weapon.name,
    ranged: isRanged,
    reach: weapon.system.melee,
    maxRange: weapon.system.range,
    sen: actor.system.sen ?? 0,
    canSwitchMode: weapon.system.melee !== null && weapon.system.range !== null,
    distance: target?.distance ?? null,

    // An Imprecise weapon cannot target hit locations at all, so it is offered
    // Mass and nothing else rather than a list it may not use.
    imprecise: tags.includes("imprecise"),
    // A Seeking weapon is not affected by cover, which is what otherwise takes
    // Mass off the table for a ranged attack.
    seeking: tags.includes("seeking"),
    locations: hitLocationChoices(target, tags.includes("imprecise")),
    visibility: Object.entries(MANTLE.visibility)
      // Hidden is not a choice an attacker makes — you cannot aim at something
      // whose location you do not know — so it is left out of the list.
      .filter(([key]) => MANTLE.visibility[key].penalty !== null)
      .map(([key, entry]) => ({ key, label: game.i18n.localize(entry.label) })),
    conditions: conditionModifiers(actor.conditions ?? {}),
    frenzy: actor.conditionStacks?.("frenzy") ?? 0,
    attribute,
    base: base ?? actor.system.attributes?.[attribute] ?? 0
  };

  const content = await foundry.applications.handlebars.renderTemplate(TEMPLATE, context);

  const result = await DialogV2.wait({
    window: { title: game.i18n.format("MANTLE.Attack.title", { weapon: weapon.name }) },
    classes: ["mantle"],
    content,
    buttons: [
      {
        action: "roll",
        label: game.i18n.localize("MANTLE.Attack.roll"),
        default: true,
        callback: (_event, button) => new FormData(button.form)
      },
      { action: "cancel", label: game.i18n.localize("MANTLE.Action.cancel") }
    ],
    render: (_event, dialog) => attachLivePool(dialog.element, actor, context),
    rejectClose: false
  });

  if (!result) return null;

  const { modifiers, canTarget, blockedBy } = readAttack(result, context);

  // Out of reach, out of range, or unseen. The roll is refused rather than
  // rolled at a penalty, because the rules refuse it.
  if (!canTarget) {
    ui.notifications.warn(
      game.i18n.format("MANTLE.Attack.cannotTarget", {
        reason: game.i18n.localize(blockedBy)
      })
    );
    return null;
  }

  return { modifiers, hitLocation: String(result.get("hitLocation") || "mass") };
}

/* -------------------------------------------- */

/**
 * The token the attacker has targeted, with the distance to it measured on the
 * canvas. Null when nothing is targeted, or when either side has no token —
 * plenty of tables run theatre-of-the-mind, and the dialog works without it.
 *
 * @param {Actor} actor
 * @returns {{actor: Actor|null, distance: number|null}|null}
 */
function firstTarget(actor) {
  const targeted = game.user?.targets?.first();
  if (!targeted) return null;

  const from = actor.getActiveTokens?.(true)[0];
  const distance =
    from && canvas?.grid
      ? Math.round(canvas.grid.measurePath([from.center, targeted.center]).distance / canvas.grid.distance)
      : null;

  return { actor: targeted.actor ?? null, distance };
}

/**
 * Whether to open in ranged mode. A weapon that can do both opens as whatever
 * the distance suggests, since that is nearly always what was meant.
 *
 * @param {{system: object}} weapon
 * @param {{distance: number|null}|null} target
 * @returns {boolean}
 */
function pickMode(weapon, target) {
  if (weapon.system.range === null) return false;
  if (weapon.system.melee === null) return true;

  const reach = weapon.system.melee ?? 1;
  return target?.distance != null && target.distance > reach;
}

/**
 * The hit locations to offer.
 *
 * A targeted adversary has its own printed locations — a Razorwing has Wings
 * and no Mark — so those are used when there is a target, and the generic
 * three otherwise.
 *
 * @param {{actor: Actor|null}|null} target
 * @param {boolean} [imprecise] - Whether the weapon can target locations at all
 * @returns {{key: string, label: string, penalty: number}[]}
 */
function hitLocationChoices(target, imprecise = false) {
  if (imprecise) {
    return [{ key: "mass", label: game.i18n.localize(MANTLE.hitLocations.mass.label), penalty: 0 }];
  }

  const printed = target?.actor?.system?.hitLocations;

  if (printed?.length) {
    return printed.map((location) => ({
      key: location.name.toLowerCase(),
      label: location.name,
      penalty: location.penalty ?? 0
    }));
  }

  return Object.entries(MANTLE.hitLocations).map(([key, entry]) => ({
    key,
    label: game.i18n.localize(entry.label),
    penalty: entry.penalty
  }));
}

/* -------------------------------------------- */

/**
 * Turn the submitted form into the modifier list and the verdict on whether
 * the attack can be made at all.
 *
 * @param {FormData} data
 * @param {object} context
 */
function readAttack(data, context) {
  const ranged = data.get("mode") ? data.get("mode") === "ranged" : context.ranged;
  const raw = String(data.get("distance") ?? "");
  const distance = raw === "" ? null : Number(raw);

  const hitLocation = String(data.get("hitLocation") || "mass");
  const chosen = context.locations.find(
    (/** @type {{key: string}} */ entry) => entry.key === hitLocation
  );

  // Cover with nothing left to aim at is a refusal, not a penalty: a target
  // offering no valid Edge or Mark cannot be hit by a ranged attack from that
  // angle, and an Imprecise weapon that may only aim at Mass is in exactly
  // that position the moment the target takes cover.
  const available = targetableLocations({
    locations: context.locations,
    cover: data.get("cover") === "on",
    ranged,
    seeking: context.seeking
  });

  const positional = attackModifiers({
    distance,
    sen: context.sen,
    ranged,
    reach: context.reach,
    maxRange: context.maxRange,
    visibility: String(data.get("visibility") || "visible"),
    hiddenAttacker: data.get("hiddenAttacker") === "on",
    hitLocation,
    // The target's own printed locations are named rather than keyed, so the
    // penalty comes from the list this dialog built rather than the config.
    hitLocationPenalty: chosen?.penalty ?? null,
    frenzy: Number(data.get("frenzy")) || 0
  });

  const modifiers = [...positional.modifiers];

  const impaired = Number(data.get("impaired")) || 0;
  if (impaired > 0) modifiers.push({ label: "MANTLE.Condition.impaired", value: -impaired });

  if (data.get("hindered") === "on") {
    modifiers.push({ label: "MANTLE.Condition.hindered", value: -1 });
  }

  const situational = Number(data.get("situational")) || 0;
  if (situational) modifiers.push({ label: "MANTLE.Modifier.situational", value: situational });

  if (available.length === 0) {
    return { ...positional, modifiers, canTarget: false, blockedBy: "MANTLE.Attack.noLocation" };
  }

  return { ...positional, modifiers, available };
}

/**
 * Keep the pool readout, the cover warning, and the Mass option in step with
 * the controls.
 *
 * @param {HTMLElement} html
 * @param {Actor} actor
 * @param {object} context
 */
function attachLivePool(html, actor, context) {
  const form = html.querySelector("form");
  if (!form) return;

  const update = () => {
    const data = new FormData(form);
    const ranged = data.get("mode") ? data.get("mode") === "ranged" : context.ranged;

    // Cover shields part of the body from a ranged attack: Mass comes off the
    // table and only Edge and Mark remain. Melee ignores cover entirely.
    const allowed = new Set(
      targetableLocations({
        locations: context.locations,
        cover: data.get("cover") === "on",
        ranged,
        seeking: context.seeking
      }).map((/** @type {{key: string}} */ location) => location.key)
    );

    for (const option of form.querySelectorAll('[name="hitLocation"] option')) {
      option.disabled = !allowed.has(option.value);
    }

    const selected = form.querySelector('[name="hitLocation"] option:checked');
    if (selected?.disabled) {
      const fallback = form.querySelector('[name="hitLocation"] option:not([disabled])');
      if (fallback) fallback.selected = true;
    }

    const { modifiers, canTarget, blockedBy } = readAttack(new FormData(form), context);
    const pool = buildPool(context.base, modifiers);

    const readout = html.querySelector("[data-pool]");
    if (readout) {
      readout.textContent = canTarget
        ? pool.desperate
          ? game.i18n.localize("MANTLE.Action.desperate")
          : `${pool.dice}d6`
        : game.i18n.localize(blockedBy);
    }

    const summary = html.querySelector(".action-summary");
    summary?.classList.toggle("desperate", canTarget && pool.desperate);
    summary?.classList.toggle("blocked", !canTarget);
  };

  form.addEventListener("change", update);
  form.addEventListener("input", update);
  update();
}
