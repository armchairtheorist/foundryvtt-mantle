// @ts-nocheck — ApplicationV2 and DialogV2 generics overwhelm fvtt-types in
// plain JS. The shaping economy this drives lives in module/rules/shaping.mjs,
// which is checked and tested.

/**
 * The Cast dialog.
 *
 * Casting is the one place in Mantle where the player makes several priced
 * decisions at once, so the dialog's job is to keep the running cost and the
 * roll penalty visible while they do it. Reach further, last longer, or cover
 * more ground — each costs Vigor, and area costs accuracy as well.
 *
 * Only combinations the caster can actually cast are offered. An Art a
 * Resonance does not list is refused by fiction, not priced out of reach, so it
 * never appears rather than appearing greyed.
 */

import { computeCast, rangeAtStep, durationAtStep, validCombinations } from "../rules/shaping.mjs";
import { MANTLE } from "../config.mjs";

const { DialogV2 } = foundry.applications.api;
const TEMPLATE = "systems/mantle/templates/apps/cast-dialog.hbs";

/**
 * Ask the caster how they want to shape a spell.
 *
 * @param {Actor} actor
 * @returns {Promise<{art: Item, resonance: Item, shape: object, cast: object}|null>}
 */
export async function promptCast(actor) {
  const arts = actor.items.filter((i) => i.type === "art");
  const resonances = actor.items.filter((i) => i.type === "resonance");

  if (arts.length === 0 || resonances.length === 0) {
    ui.notifications.warn(game.i18n.localize("MANTLE.Cast.needBoth"));
    return null;
  }

  // Owning an Art and a Resonance is not the same as being able to pair them.
  // Refusing here beats opening a dialog whose Cast button cannot work.
  const pairings = validCombinations(resonances, arts);
  if (pairings.length === 0) {
    ui.notifications.warn(game.i18n.localize("MANTLE.Cast.noValidPairings"));
    return null;
  }

  // Which special shapes this caster has unlocked. Each is gated behind its own
  // shaping mastery, so an unowned shape is simply not on the menu.
  const shapingMasteries = new Set(
    actor.items
      .filter((i) => i.type === "mastery" && i.system.equipped)
      .map((i) => i.name.toLowerCase())
  );
  const specials = Object.entries(MANTLE.specialShapes)
    .filter(([key]) => shapingMasteries.has(`${key} shaping`))
    .map(([key, shape]) => ({ key, label: shape.label }));

  const content = await foundry.applications.handlebars.renderTemplate(TEMPLATE, {
    arts: arts.map((a) => ({ id: a.id, name: a.name })),
    resonances: resonances.map((r) => ({
      id: r.id,
      name: r.name,
      arts: (r.system.arts ?? []).map((entry) => entry.art)
    })),
    specials,
    sen: actor.system.sen ?? 10,
    config: MANTLE
  });

  const result = await DialogV2.wait({
    window: { title: game.i18n.localize("MANTLE.Cast.title") },
    classes: ["mantle"],
    content,
    buttons: [
      {
        action: "cast",
        label: game.i18n.localize("MANTLE.Cast.cast"),
        default: true,
        callback: (_event, button) => new FormData(button.form)
      },
      { action: "cancel", label: game.i18n.localize("MANTLE.Cast.cancel") }
    ],
    render: (_event, dialog) => attachLiveCost(dialog.element, actor, arts, resonances),
    rejectClose: false
  });

  if (!result) return null;

  const art = arts.find((a) => a.id === result.get("art"));
  const resonance = resonances.find((r) => r.id === result.get("resonance"));

  // Nothing should be able to submit this form without both selected, so if it
  // happens the caster needs to hear about it rather than watch the button do
  // nothing at all.
  if (!art || !resonance) {
    ui.notifications.warn(game.i18n.localize("MANTLE.Cast.nothingChosen"));
    return null;
  }

  const shape = readShape(result);
  const cast = computeCast({
    art: art.system,
    shape,
    hasFocus: actor.system.hasFocus,
    innerFocus: actor.system.innerFocus
  });

  return { art, resonance, shape, cast };
}

/* -------------------------------------------- */

/**
 * Read the chosen shape out of the submitted form.
 *
 * @param {FormData} data
 */
function readShape(data) {
  const special = data.get("special");
  return {
    range: Number(data.get("range")) || 1,
    duration: Number(data.get("duration")) || 1,
    area: Number(data.get("area")) || 1,
    special: special || null,
    specialSize: Number(data.get("specialSize")) || 1
  };
}

/* -------------------------------------------- */

/**
 * Keep the cost readout in step with the controls, and hide Art choices the
 * selected Resonance cannot support.
 *
 * @param {HTMLElement} html
 * @param {Actor} actor
 * @param {Item[]} arts
 * @param {Item[]} resonances
 */
function attachLiveCost(html, actor, arts, resonances) {
  const form = html.querySelector("form");
  if (!form) return;

  const update = () => {
    const data = new FormData(form);
    const resonance = resonances.find((r) => r.id === data.get("resonance"));
    const supported = new Set((resonance?.system.arts ?? []).map((entry) => entry.art));

    // Offer only pairings the Resonance actually supports, and move off an
    // Art that has just become invalid rather than leaving it selected.
    const artSelect = form.querySelector('[name="art"]');
    let selectionValid = false;
    for (const option of artSelect.options) {
      const art = arts.find((a) => a.id === option.value);
      option.hidden = !supported.has(art?.name);
      if (!option.hidden && option.value === artSelect.value) selectionValid = true;
    }
    if (!selectionValid) {
      const first = Array.from(artSelect.options).find((option) => !option.hidden);
      if (first) artSelect.value = first.value;
    }

    const art = arts.find((a) => a.id === artSelect.value);
    if (!art) return;

    // A dimension the Art fixes cannot be shaped, so disable rather than
    // silently ignore the control.
    const basic = art.system.basicShape ?? {};
    for (const dimension of ["range", "duration", "area"]) {
      const input = form.querySelector(`[name="${dimension}"]`);
      const fixed = basic[dimension]?.shapeable === false;
      input.disabled = fixed;
      input.min = basic[dimension]?.step ?? 1;
      if (Number(input.value) < Number(input.min)) input.value = input.min;
      input.closest(".shape-row")?.classList.toggle("fixed", fixed);
    }

    const shape = readShape(new FormData(form));
    const cast = computeCast({
      art: art.system,
      shape,
      hasFocus: actor.system.hasFocus,
      innerFocus: actor.system.innerFocus
    });

    const sen = actor.system.sen ?? 10;
    html.querySelector("[data-cost]").textContent = String(cast.vigorCost);
    html.querySelector("[data-penalty]").textContent = cast.penalty ? `${cast.penalty}d` : "—";
    html.querySelector("[data-range]").textContent = String(rangeAtStep(cast.steps.range, sen).squares);
    html.querySelector("[data-duration]").textContent = String(durationAtStep(cast.steps.duration));
    html.querySelector("[data-graze]").textContent = String(cast.grazeStrain);

    // Vigor you do not have is worth flagging before the roll, not after.
    const affordable = cast.vigorCost <= (actor.system.vigor?.value ?? 0);
    html.querySelector(".cast-summary")?.classList.toggle("unaffordable", !affordable);
  };

  // The readout is a convenience; the Cast button is the point. An exception
  // thrown here would escape the render callback and reject the dialog's own
  // promise, leaving a dialog on screen whose button can never resolve.
  const safely = () => {
    try {
      update();
    } catch (error) {
      console.error("Mantle | the cast readout failed to update", error);
    }
  };

  form.addEventListener("change", safely);
  form.addEventListener("input", safely);
  safely();
}
