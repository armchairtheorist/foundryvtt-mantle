// @ts-nocheck — ApplicationV2's generics are heavy enough that fvtt-types
// reports "excessive stack depth" on any subclass written in plain JS, and its
// render context is a closed interface JSDoc cannot widen.

/**
 * The Party sheet — the Momentum tracker.
 *
 * Momentum is one pooled resource earned by the whole group and spent by whoever
 * needs it. Foundry has no concept of a shared table resource, so it lives on
 * an Actor: give every player Owner permission on this one document and they
 * can spend Momentum themselves, with no socket relaying through the GM and no
 * "can you spend two for me" at the table.
 *
 * The three ways Momentum is spent are buttons rather than a bare number, because
 * each has a fixed price and getting the arithmetic wrong in either direction
 * is the kind of mistake nobody notices until much later.
 */

import { MANTLE } from "../../config.mjs";
import { earnsMerit } from "../../rules/rest.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class MantlePartySheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["mantle", "sheet", "actor", "party"],
    position: { width: 560, height: 620 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      spendMomentum: MantlePartySheet.#onSpendMomentum,
      gainMomentum: MantlePartySheet.#onGainMomentum,
      addMember: MantlePartySheet.#onAddMember,
      removeMember: MantlePartySheet.#onRemoveMember,
      openMember: MantlePartySheet.#onOpenMember,
      interlude: MantlePartySheet.#onInterlude,
      downtime: MantlePartySheet.#onDowntime,
      beginCombat: MantlePartySheet.#onBeginCombat
    }
  };

  /** @override */
  static PARTS = {
    body: { template: "systems/mantle/templates/actor/party.hbs", scrollable: [""] }
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

    context.enrichedNotes = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      system.notes ?? "",
      { relativeTo: this.document, secrets: this.document.isOwner }
    );

    // A member whose actor has been deleted still has its uuid on the list.
    // Showing it as unresolved beats dropping it silently, since the party's
    // Max Momentum changes when it goes.
    context.members = Array.from(system.members).map((uuid) => {
      const actor = fromUuidSync(uuid);
      return {
        uuid,
        name: actor?.name ?? game.i18n.localize("MANTLE.Party.missingMember"),
        img: actor?.img ?? "icons/svg/mystery-man.svg",
        soul: actor?.system?.cores?.soul ?? 0,
        found: Boolean(actor)
      };
    });

    // Each way of spending Momentum, priced, and flagged when it is out of
    // reach. Momentous Feat and Momentous Fortune also appear on the roll card
    // itself, which is where the rules put those decisions — these are the
    // manual route for a table that has already resolved a roll by hand.
    context.spends = [
      { key: "limitBreak", label: "MANTLE.Momentum.limitBreak", cost: MANTLE.momentumCosts.limitBreak },
      {
        key: "momentousFortune",
        label: "MANTLE.Momentum.momentousFortune",
        cost: MANTLE.momentumCosts.momentousFortune
      },
      {
        key: "momentousFeat",
        label: "MANTLE.Momentum.momentousFeat",
        cost: MANTLE.momentumCosts.momentousFeatPerSuccess
      },
      {
        key: "momentousDevelopment",
        label: "MANTLE.Momentum.momentousDevelopment",
        cost: MANTLE.momentumCosts.momentousDevelopment
      }
    ].map((spend) => ({ ...spend, affordable: spend.cost <= system.momentum.value }));

    return context;
  }

  /* -------------------------------------------- */
  /*  Actions                                      */
  /* -------------------------------------------- */

  /**
   * @this {MantlePartySheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onSpendMomentum(_event, target) {
    const cost = Number(target.dataset.cost) || 1;
    const system = this.document.system;

    if (cost > system.momentum.value) {
      ui.notifications.warn(game.i18n.format("MANTLE.Momentum.notEnough", { cost }));
      return;
    }

    await this.document.update({ "system.momentum.value": system.momentum.value - cost });

    // Spending Momentum is a table event — someone just did something heroic on
    // the group's shared credit — so it goes to chat rather than quietly
    // decrementing a number nobody was watching.
    await ChatMessage.create({
      content: `<div class="mantle mantle-harm-card">
          <p><strong>${this.document.name}</strong> — ${game.i18n.format("MANTLE.Momentum.spent", {
            cost,
            what: game.i18n.localize(target.dataset.label ?? "MANTLE.Momentum.momentum")
          })}</p>
        </div>`
    });
  }

  /**
   * @this {MantlePartySheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onGainMomentum(_event, target) {
    const amount = Number(target.dataset.amount) || 1;
    const system = this.document.system;
    await this.document.update({
      "system.momentum.value": Math.min(system.momentum.value + amount, system.momentum.max)
    });
  }

  /**
   * Add whichever characters the user currently has selected on the canvas.
   *
   * Selection rather than a picker: the party is usually all four tokens on
   * screen, and asking someone to find four names in a dropdown they already
   * have selected is busywork.
   *
   * @this {MantlePartySheet}
   */
  static async #onAddMember() {
    const selected = canvas.tokens?.controlled ?? [];
    const characters = selected.map((token) => token.actor).filter((a) => a?.type === "character");

    if (characters.length === 0) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Party.selectCharacters"));
      return;
    }

    const members = new Set(this.document.system.members);
    for (const actor of characters) members.add(actor.uuid);

    await this.document.update({ "system.members": Array.from(members) });
  }

  /**
   * @this {MantlePartySheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onRemoveMember(_event, target) {
    const members = new Set(this.document.system.members);
    members.delete(target.dataset.uuid);
    await this.document.update({ "system.members": Array.from(members) });
  }

  /**
   * @this {MantlePartySheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onOpenMember(_event, target) {
    const actor = await fromUuid(target.dataset.uuid);
    actor?.sheet?.render({ force: true });
  }

  /* -------------------------------------------- */
  /*  Rest                                         */
  /* -------------------------------------------- */

  /** Every member that still resolves to a character actor. */
  get #characters() {
    return Array.from(this.document.system.members)
      .map((uuid) => fromUuidSync(uuid))
      .filter((actor) => actor?.type === "character");
  }

  /**
   * Run one rest across every member and post a single report.
   *
   * One card rather than one per character: an interlude is a party-level
   * event, and four separate cards would bury the one line that matters.
   *
   * @this {MantlePartySheet}
   * @param {string} method - The actor method to run
   * @param {string} title
   */
  async #rest(method, title) {
    const characters = this.#characters;
    if (characters.length === 0) {
      ui.notifications.warn(game.i18n.localize("MANTLE.Party.noMembers"));
      return;
    }

    const sections = [];
    for (const actor of characters) {
      // Sequential on purpose: each character's Resolve spends are asked one
      // at a time, and four dialogs at once would be unanswerable.
      const lines = await actor[method]();
      if (lines.length > 0) sections.push(`<p><strong>${actor.name}</strong> — ${lines.join(" · ")}</p>`);
    }

    if (sections.length === 0) return;

    await ChatMessage.create({
      content: `<div class="mantle mantle-harm-card">
          <p class="what">${title}</p>
          ${sections.join("")}
        </div>`,
      speaker: ChatMessage.getSpeaker({ actor: this.document })
    });
  }

  /**
   * @this {MantlePartySheet}
   */
  static async #onInterlude() {
    await this.#rest("interlude", game.i18n.localize("MANTLE.Rest.interlude"));
  }

  /**
   * Downtime also resets the party's Momentum to zero — and awards a merit first
   * if the pool got high enough, which is why the check happens before the
   * reset rather than after it.
   *
   * @this {MantlePartySheet}
   */
  static async #onDowntime() {
    const system = this.document.system;
    const earned = earnsMerit(system.momentum.value, system.meritThreshold);

    await this.#rest("downtime", game.i18n.localize("MANTLE.Rest.downtime"));
    await this.document.update({ "system.momentum.value": 0 });

    await ChatMessage.create({
      content: `<div class="mantle mantle-harm-card">
          <p><strong>${this.document.name}</strong> — ${game.i18n.localize(
            earned ? "MANTLE.Rest.meritEarned" : "MANTLE.Rest.noMerit"
          )}</p>
          <p class="notes">${game.i18n.localize("MANTLE.Rest.momentumReset")}</p>
        </div>`,
      speaker: ChatMessage.getSpeaker({ actor: this.document })
    });
  }

  /**
   * @this {MantlePartySheet}
   */
  static async #onBeginCombat() {
    await this.#rest("beginCombat", game.i18n.localize("MANTLE.Rest.beginCombat"));
  }
}
