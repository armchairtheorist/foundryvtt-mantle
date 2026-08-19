// @ts-nocheck — ApplicationV2's generics are heavy enough that fvtt-types
// reports "excessive stack depth" on any subclass written in plain JS, and its
// render context is a closed interface JSDoc cannot widen. The scaling maths
// this sheet displays lives in module/rules/adversary.mjs, which is checked
// and tested.

/**
 * The adversary sheet.
 *
 * Deliberately one scrolling stat block rather than a set of tabs. A GM reads
 * an enemy the way the catalog prints it — numbers, then maneuvers, then hit
 * locations, then behaviour — and hiding any of that behind a tab means
 * clicking mid-turn to find the thing you are about to roll.
 */

import { MANTLE } from "../../config.mjs";
import { prepareConditions } from "./_conditions-context.mjs";
import { prepareManeuvers } from "./_maneuvers-context.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class MantleAdversarySheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["mantle", "sheet", "actor", "adversary"],
    position: { width: 700, height: 780 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rollManeuver: MantleAdversarySheet.#onRollManeuver,
      takeWound: MantleAdversarySheet.#onTakeWound,
      takeBurden: MantleAdversarySheet.#onTakeBurden,
      clearHarm: MantleAdversarySheet.#onClearHarm,
      resetHarm: MantleAdversarySheet.#onResetHarm,
      addCondition: MantleAdversarySheet.#onAddCondition,
      removeCondition: MantleAdversarySheet.#onRemoveCondition,
      endTurn: MantleAdversarySheet.#onEndTurn,
      useManeuver: MantleAdversarySheet.#onUseManeuver,
      useReaction: MantleAdversarySheet.#onUseReaction
    }
  };

  /** @override */
  static PARTS = {
    header: { template: "systems/mantle/templates/actor/adversary-header.hbs" },
    block: { template: "systems/mantle/templates/actor/adversary-block.hbs", scrollable: [""] }
  };

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const system = this.document.system;

    context.system = system;
    context.config = MANTLE;
    context.editable = this.isEditable;
    context.fields = system.schema.fields;

    const enrich = (html) =>
      foundry.applications.ux.TextEditor.implementation.enrichHTML(html ?? "", {
        relativeTo: this.document,
        secrets: this.document.isOwner
      });

    context.enrichedDescription = await enrich(system.description);
    context.enrichedTactics = await enrich(system.tactics);

    context.attributes = Object.entries(MANTLE.attributes).map(([key, entry]) => ({
      key,
      abbr: entry.abbr,
      label: entry.label,
      value: system.attributes[key]
    }));

    // Every maneuver's printed pool plus whatever the tier of play adds, since
    // that total is what actually goes on the table.
    context.maneuvers = system.maneuvers.map((maneuver, index) => ({
      ...maneuver,
      index,
      tags: Array.from(maneuver.tags ?? []),
      effectivePool: maneuver.pool + system.diceBonus
    }));

    // A template layered onto a stat block that already carries its own class
    // does nothing, and silently doing nothing is worse than saying so.
    context.templateIgnored = system.scaled.templateIgnored;

    context.conditions = prepareConditions(this.document);
    Object.assign(context, prepareManeuvers(this.document));

    return context;
  }

  /* -------------------------------------------- */
  /*  Actions                                      */
  /* -------------------------------------------- */

  /**
   * @this {MantleAdversarySheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onRollManeuver(_event, target) {
    await this.document.rollManeuver(Number(target.dataset.index));
  }

  /**
   * Take a Wound at a named hit location.
   *
   * Which location was struck matters for adversaries in a way it does not for
   * characters: a creature's Wound Effect is written per location, and a torn
   * wing is a different fight from a split helm.
   *
   * @this {MantleAdversarySheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onTakeWound(_event, target) {
    await this.document.takeWound({ hitLocation: target.dataset.location ?? "" });
  }

  /**
   * @this {MantleAdversarySheet}
   */
  static async #onTakeBurden() {
    await this.document.takeBurden();
  }

  /**
   * @this {MantleAdversarySheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onClearHarm(_event, target) {
    const track = target.dataset.track;
    if (track !== "wounds" && track !== "burdens") return;
    await this.document.clearHarm(track, Number(target.dataset.index));
  }

  /**
   * Put the creature back to full — the button a GM wants between waves, or
   * after a stat block has been dragged out a second time.
   *
   * @this {MantleAdversarySheet}
   */
  static async #onResetHarm() {
    const system = this.document.system;
    await this.document.update({
      "system.vitality.value": system.vitality.max,
      "system.strain.value": 0,
      "system.guard.value": system.guard.max,
      "system.wounds": [],
      "system.burdens": []
    });
  }

  /**
   * @this {MantleAdversarySheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onAddCondition(_event, target) {
    const id = target.dataset.condition;
    if (id) await this.document.changeCondition(id, 1);
  }

  /**
   * @this {MantleAdversarySheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onRemoveCondition(_event, target) {
    const id = target.dataset.condition;
    if (id) await this.document.changeCondition(id, -1);
  }

  /**
   * @this {MantleAdversarySheet}
   */
  static async #onEndTurn() {
    await this.document.endTurn();
  }

  /**
   * @this {MantleAdversarySheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onUseManeuver(_event, target) {
    const id = target.dataset.maneuver;
    if (id) await this.document.useManeuver(id);
  }

  /**
   * Take a reaction.
   *
   * Each routes to the method that knows how it resolves — the reactive
   * defenses oppose a roll, the reactive attacks make one, and Brace changes
   * the actor's state rather than rolling anything.
   *
   * @this {MantleAdversarySheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onUseReaction(_event, target) {
    const id = target.dataset.reaction;
    const actor = this.document;

    if (id === "dodge") await actor.rollDodge();
    else if (id === "brace") await actor.rollBrace();
    else if (id === "deflect") await actor.rollDeflect(actor.deflectWeapons[0]);
    else if (id === "forestall") await actor.rollForestall(actor.reflexiveWeapons[0]);
    else if (id === "intercept" || id === "counterattack") await actor.rollReactiveAttack(id);
  }
}
