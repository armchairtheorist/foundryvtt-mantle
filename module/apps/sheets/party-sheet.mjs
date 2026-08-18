// @ts-nocheck — ApplicationV2's generics are heavy enough that fvtt-types
// reports "excessive stack depth" on any subclass written in plain JS, and its
// render context is a closed interface JSDoc cannot widen.

/**
 * The Party sheet — the Valor tracker.
 *
 * Valor is one pooled resource earned by the whole group and spent by whoever
 * needs it. Foundry has no concept of a shared table resource, so it lives on
 * an Actor: give every player Owner permission on this one document and they
 * can spend Valor themselves, with no socket relaying through the GM and no
 * "can you spend two for me" at the table.
 *
 * The three ways Valor is spent are buttons rather than a bare number, because
 * each has a fixed price and getting the arithmetic wrong in either direction
 * is the kind of mistake nobody notices until much later.
 */

import { MANTLE } from "../../config.mjs";

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
      spendValor: MantlePartySheet.#onSpendValor,
      gainValor: MantlePartySheet.#onGainValor,
      addMember: MantlePartySheet.#onAddMember,
      removeMember: MantlePartySheet.#onRemoveMember,
      openMember: MantlePartySheet.#onOpenMember
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
    // Max Valor changes when it goes.
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

    // Each way of spending Valor, priced, and flagged when it is out of reach.
    context.spends = [
      { key: "limitBreak", label: "MANTLE.Valor.limitBreak", cost: MANTLE.valorCosts.limitBreak },
      {
        key: "heroicFortune",
        label: "MANTLE.Valor.heroicFortune",
        cost: MANTLE.valorCosts.heroicFortune
      },
      {
        key: "heroicFeat",
        label: "MANTLE.Valor.heroicFeat",
        cost: MANTLE.valorCosts.heroicFeatPerSuccess
      }
    ].map((spend) => ({ ...spend, affordable: spend.cost <= system.valor.value }));

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
  static async #onSpendValor(_event, target) {
    const cost = Number(target.dataset.cost) || 1;
    const system = this.document.system;

    if (cost > system.valor.value) {
      ui.notifications.warn(game.i18n.format("MANTLE.Valor.notEnough", { cost }));
      return;
    }

    await this.document.update({ "system.valor.value": system.valor.value - cost });

    // Spending Valor is a table event — someone just did something heroic on
    // the group's shared credit — so it goes to chat rather than quietly
    // decrementing a number nobody was watching.
    await ChatMessage.create({
      content: `<div class="mantle mantle-harm-card">
          <p><strong>${this.document.name}</strong> — ${game.i18n.format("MANTLE.Valor.spent", {
            cost,
            what: game.i18n.localize(target.dataset.label ?? "MANTLE.Valor.valor")
          })}</p>
        </div>`
    });
  }

  /**
   * @this {MantlePartySheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onGainValor(_event, target) {
    const amount = Number(target.dataset.amount) || 1;
    const system = this.document.system;
    await this.document.update({
      "system.valor.value": Math.min(system.valor.value + amount, system.valor.max)
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
}
