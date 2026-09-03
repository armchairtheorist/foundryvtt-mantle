// @ts-nocheck — ApplicationV2's generics are heavy enough that fvtt-types
// reports "excessive stack depth" on any subclass written in plain JS, and its
// render context is a closed interface JSDoc cannot widen. Checking this file
// yields pages of unfixable noise. The rules maths, which is what actually
// benefits from checking, lives in module/data and is checked there.

/**
 * The player character sheet.
 */

import { MANTLE } from "../../config.mjs";
import { prepareConditions } from "./_conditions-context.mjs";
import { prepareManeuvers } from "./_maneuvers-context.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class MantleCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["mantle", "sheet", "actor", "character"],
    position: { width: 800, height: 860 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      addThread: MantleCharacterSheet.#onAddThread,
      deleteThread: MantleCharacterSheet.#onDeleteThread,
      toggleEquipped: MantleCharacterSheet.#onToggleEquipped,
      cycleBoard: MantleCharacterSheet.#onCycleBoard,
      takeWound: MantleCharacterSheet.#onTakeWound,
      takeBurden: MantleCharacterSheet.#onTakeBurden,
      clearHarm: MantleCharacterSheet.#onClearHarm,
      editItem: MantleCharacterSheet.#onEditItem,
      deleteItem: MantleCharacterSheet.#onDeleteItem,
      refreshTurn: MantleCharacterSheet.#onRefreshTurn,
      rollWeapon: MantleCharacterSheet.#onRollWeapon,
      rollUnarmed: MantleCharacterSheet.#onRollUnarmed,
      rollAttribute: MantleCharacterSheet.#onRollAttribute,
      rollDodge: MantleCharacterSheet.#onRollDodge,
      rollDeflect: MantleCharacterSheet.#onRollDeflect,
      rollForestall: MantleCharacterSheet.#onRollForestall,
      testLuck: MantleCharacterSheet.#onTestLuck,
      castSpell: MantleCharacterSheet.#onCastSpell,
      addCondition: MantleCharacterSheet.#onAddCondition,
      removeCondition: MantleCharacterSheet.#onRemoveCondition,
      endTurn: MantleCharacterSheet.#onEndTurn,
      useManeuver: MantleCharacterSheet.#onUseManeuver,
      useReaction: MantleCharacterSheet.#onUseReaction,
      useItem: MantleCharacterSheet.#onUseItem
    }
  };

  /** @override */
  static PARTS = {
    header: { template: "systems/mantle/templates/actor/character-header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    main: { template: "systems/mantle/templates/actor/character-main.hbs", scrollable: [""] },
    build: { template: "systems/mantle/templates/actor/character-build.hbs", scrollable: [""] },
    gear: { template: "systems/mantle/templates/actor/character-gear.hbs", scrollable: [""] },
    magic: { template: "systems/mantle/templates/actor/character-magic.hbs", scrollable: [""] },
    threads: { template: "systems/mantle/templates/actor/character-threads.hbs", scrollable: [""] },
    bio: { template: "systems/mantle/templates/actor/character-bio.hbs", scrollable: [""] }
  };

  /** @override */
  tabGroups = { primary: "main" };

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const system = this.document.system;

    context.system = system;
    context.config = MANTLE;
    context.editable = this.isEditable;

    // Schema fields drive the rich-text editors, which need the field
    // definition rather than just the value.
    context.fields = system.schema.fields;

    const enrich = (html) =>
      foundry.applications.ux.TextEditor.implementation.enrichHTML(html ?? "", {
        relativeTo: this.document,
        secrets: this.document.isOwner
      });

    context.enrichedBiography = await enrich(system.biography);
    context.enrichedNotes = await enrich(system.notes);

    context.tabs = this.#getTabs();
    context.items = this.#organizeItems();
    context.attributes = this.#prepareAttributes();
    context.slots = this.#prepareSlots();

    // The Unarmed Attack is always available and never costs a gear slot, so
    // the gear tab shows it whether or not the player owns the item.
    const unarmed = this.document.unarmedAttack;
    context.unarmed = { name: unarmed.name, system: unarmed.system, owned: Boolean(unarmed.id) };

    // Each reaction needs a weapon that permits it; without one the button
    // would only ever produce a warning, so it is not offered at all.
    context.canDeflect = this.document.deflectWeapons.length > 0;
    context.canForestall = this.document.reflexiveWeapons.length > 0;

    context.conditions = prepareConditions(this.document);
    Object.assign(context, prepareManeuvers(this.document));

    return context;
  }

  /* -------------------------------------------- */

  /**
   * Hand each tab part its own tab descriptor.
   *
   * Without this the section never receives the `active` class, and Foundry's
   * own stylesheet hides every inactive tab — which renders the whole sheet
   * body blank rather than just the unselected tabs.
   *
   * @override
   */
  async _preparePartContext(partId, context, options) {
    const part = await super._preparePartContext(partId, context, options);
    if (partId in part.tabs) part.tab = part.tabs[partId];
    return part;
  }

  /* -------------------------------------------- */

  /** @returns {Record<string, {id: string, group: string, label: string, cssClass: string}>} */
  #getTabs() {
    const active = this.tabGroups.primary;
    const entries = {
      main: "MANTLE.Tab.main",
      build: "MANTLE.Tab.build",
      gear: "MANTLE.Tab.gear",
      magic: "MANTLE.Tab.magic",
      threads: "MANTLE.Tab.threads",
      bio: "MANTLE.Tab.bio"
    };

    return Object.fromEntries(
      Object.entries(entries).map(([id, label]) => [
        id,
        {
          id,
          group: "primary",
          label,
          active: id === active,
          cssClass: id === active ? "active" : ""
        }
      ])
    );
  }

  /* -------------------------------------------- */

  /**
   * Attributes paired with their cores, so the sheet can group POW and AGI
   * under BODY rather than listing six numbers in a row.
   */
  #prepareAttributes() {
    const system = this.document.system;
    return Object.entries(MANTLE.cores).map(([coreKey, core]) => ({
      key: coreKey,
      label: core.label,
      value: system.cores[coreKey],
      attributes: core.attributes.map((attrKey) => ({
        key: attrKey,
        label: MANTLE.attributes[attrKey].label,
        abbr: MANTLE.attributes[attrKey].abbr,
        value: system.attributes[attrKey]
      }))
    }));
  }

  /* -------------------------------------------- */

  /* -------------------------------------------- */

  /**
   * Slot budgets paired with what is actually spent, so the sheet can flag an
   * overspent board. Nothing here blocks an illegal loadout — Mantle expects
   * the GM to adjudicate unusual builds.
   */
  #prepareSlots() {
    // Safety net rather than a fix: if data preparation throws, Foundry keeps
    // the actor but leaves the derived fields unset. Falling back to zeros lets
    // the sheet still open so the console error can be read, instead of the
    // sheet itself throwing and showing nothing at all.
    const system = this.document.system;
    const slots = system.slots ?? { gear: 0, wondrous: 0, mastery: {} };
    const slotsUsed = system.slotsUsed ?? { gear: 0, wondrous: 0, mastery: {} };

    const entry = (label, used, total) => ({ label, used, total, over: used > total });

    return {
      gear: entry("MANTLE.Slot.gear", slotsUsed.gear, slots.gear),
      wondrous: entry("MANTLE.Slot.wondrous", slotsUsed.wondrous, slots.wondrous),
      // The repertoire board only exists for casters, so a character with no
      // repertoire slots gets no meter for it rather than a permanent 0 / 0.
      mastery: Object.entries(slots.mastery)
        .filter(([board, total]) => board !== "repertoire" || total > 0)
        .map(([board, total]) => entry(`MANTLE.Slot.${board}`, slotsUsed.mastery[board] ?? 0, total))
    };
  }

  /* -------------------------------------------- */

  /** Bucket the actor's items by the sheet section each belongs in. */
  #organizeItems() {
    const buckets = {
      archetypes: [],
      masteries: [],
      weapons: [],
      armor: [],
      foci: [],
      wondrous: [],
      consumables: [],
      arts: [],
      resonances: [],
      features: [],
      limitBreaks: []
    };

    const destination = {
      archetype: "archetypes",
      mastery: "masteries",
      weapon: "weapons",
      armor: "armor",
      focus: "foci",
      wondrous: "wondrous",
      consumable: "consumables",
      art: "arts",
      resonance: "resonances",
      feature: "features",
      limitbreak: "limitBreaks"
    };

    for (const item of this.document.items) {
      const bucket = destination[item.type];
      if (bucket) buckets[bucket].push(item);
    }

    // Archetypes read best ancestry-first, then by descending rank.
    buckets.archetypes.sort((a, b) => {
      if (a.system.kind === "ancestry" && b.system.kind !== "ancestry") return -1;
      if (b.system.kind === "ancestry" && a.system.kind !== "ancestry") return 1;
      return b.system.rank - a.system.rank;
    });

    return buckets;
  }

  /* -------------------------------------------- */
  /*  Actions                                      */
  /* -------------------------------------------- */

  /**
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onAddThread() {
    // Added blank for the player to write into. Threads are earned in play, so
    // the count from their build is a guide on the sheet rather than a cap:
    // nothing here refuses a fourth Thread the GM awarded.
    const threads = [...this.document.system.threads, ""];
    await this.document.update({ "system.threads": threads });
  }

  /**
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onDeleteThread(_event, target) {
    const index = Number(target.closest("[data-index]")?.getAttribute("data-index"));
    if (!Number.isInteger(index)) return;

    const threads = this.document.system.threads.filter((_, at) => at !== index);
    await this.document.update({ "system.threads": threads });
  }

  /**
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onToggleEquipped(_event, target) {
    const item = this.#itemFor(target);
    if (!item) return;
    await item.update({ "system.equipped": !item.system.equipped });
  }

  /**
   * Cycle a mastery between the boards that could legally pay for it.
   *
   * That is its own core's board and wildcard — never another core's — plus a
   * repertoire slot when the mastery is an Art or a Resonance and the character
   * has repertoire slots to spend. Cycling through the legal two or three beats
   * a dropdown of mostly-illegal options.
   *
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onCycleBoard(_event, target) {
    const item = this.#itemFor(target);
    if (item?.type !== "mastery") return;

    const boards = [item.system.masteryType, "wildcard"];
    if (item.system.repertoireEligible && (this.document.system.slots?.mastery?.repertoire ?? 0) > 0) {
      boards.push("repertoire");
    }

    const current = boards.indexOf(item.system.board);
    const next = boards[(current + 1) % boards.length];
    await item.update({ "system.slotBoard": next });
  }

  /**
   * @this {MantleCharacterSheet}
   */
  static async #onTakeWound() {
    await this.document.takeWound();
  }

  /**
   * @this {MantleCharacterSheet}
   */
  static async #onTakeBurden() {
    await this.document.takeBurden();
  }

  /**
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onClearHarm(_event, target) {
    const track = target.dataset.track;
    const index = Number(target.dataset.index);
    if (track !== "wounds" && track !== "burdens") return;
    await this.document.clearHarm(track, index);
  }

  /**
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onEditItem(_event, target) {
    this.#itemFor(target)?.sheet?.render({ force: true });
  }

  /**
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onDeleteItem(_event, target) {
    const item = this.#itemFor(target);
    if (!item) return;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("MANTLE.Prompt.deleteItemTitle") },
      content: `<p>${game.i18n.format("MANTLE.Prompt.deleteItem", { name: item.name })}</p>`
    });

    if (confirmed) await item.delete();
  }

  /**
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onRollWeapon(_event, target) {
    const weapon = this.#itemFor(target);
    if (weapon) await this.document.rollWeapon(weapon);
  }

  /**
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onUseItem(_event, target) {
    const item = this.#itemFor(target);
    if (item) await this.document.useItem(item);
  }

  /**
   * @this {MantleCharacterSheet}
   */
  static async #onRollUnarmed() {
    await this.document.rollUnarmed();
  }

  /**
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onRollAttribute(_event, target) {
    const attribute = target.dataset.attribute;
    if (!attribute) return;

    // Testing your luck takes no modifiers of any kind — no skills, no
    // Impaired, no Momentous Feats — so offering the modifier dialog for LUCK
    // would invite exactly the roll the rules forbid. Send it straight through.
    if (attribute === "luck") {
      await this.document.testLuck();
      return;
    }

    await this.document.rollAttributeAction(attribute);
  }

  /**
   * @this {MantleCharacterSheet}
   */
  static async #onRollDodge() {
    await this.document.rollDodge();
  }

  /**
   * Deflect with an equipped Deflect or Shield weapon.
   *
   * Which weapon matters — it sets the attribute rolled, and a weapon that has
   * already deflected this round cannot do so again — so with more than one
   * available the player is asked rather than guessed for.
   *
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onRollDeflect(_event, target) {
    const weapon = await this.#pickWeapon(
      target,
      this.document.deflectWeapons,
      "MANTLE.Reaction.deflect",
      "MANTLE.Reaction.noDeflectWeapon"
    );
    if (weapon) await this.document.rollDeflect(weapon);
  }

  /**
   * Resolve which weapon a reaction uses.
   *
   * A button on a weapon row names its own weapon. The one in the header does
   * not, so with a single candidate it is used and with several the player is
   * asked — for both Deflect and Forestall the weapon decides how the roll
   * comes out, so guessing would be guessing at the interesting part.
   *
   * @param {HTMLElement} target - The button that was clicked
   * @param {Item[]} available
   * @param {string} titleKey
   * @param {string} noneKey
   * @returns {Promise<Item|null>}
   */
  async #pickWeapon(target, available, titleKey, noneKey) {
    if (available.length === 0) {
      ui.notifications.warn(game.i18n.localize(noneKey));
      return null;
    }

    const named = this.#itemFor(target);
    if (named && available.includes(named)) return named;
    if (available.length === 1) return available[0];

    const options = available
      .map((weapon) => `<option value="${weapon.id}">${weapon.name}</option>`)
      .join("");

    const weaponId = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize(titleKey) },
      classes: ["mantle"],
      content: `<form><label class="row">${game.i18n.localize("MANTLE.Reaction.reactWith")}
          <select name="weapon">${options}</select></label></form>`,
      ok: {
        label: game.i18n.localize("MANTLE.Action.roll"),
        callback: (_dialogEvent, button) => new FormData(button.form).get("weapon")
      },
      rejectClose: false
    });

    return available.find((entry) => entry.id === weaponId) ?? null;
  }

  /**
   * Forestall with an equipped Reflexive melee weapon.
   *
   * As with Deflect, which weapon matters — it is the weapon that attacks — so
   * with more than one available the player is asked rather than guessed for.
   *
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onRollForestall(_event, target) {
    const weapon = await this.#pickWeapon(
      target,
      this.document.reflexiveWeapons,
      "MANTLE.Reaction.forestall",
      "MANTLE.Reaction.noReflexiveWeapon"
    );
    if (weapon) await this.document.rollForestall(weapon);
  }

  /**
   * @this {MantleCharacterSheet}
   */
  static async #onCastSpell() {
    await this.document.castSpell();
  }

  /**
   * @this {MantleCharacterSheet}
   */
  static async #onTestLuck() {
    await this.document.testLuck();
  }

  /**
   * @this {MantleCharacterSheet}
   */
  static async #onRefreshTurn() {
    await this.document.refreshForTurn();
  }

  /* -------------------------------------------- */

  /**
   * Resolve the item an action was fired on, from the nearest ancestor tagged
   * with its id.
   *
   * @param {HTMLElement} target
   */
  #itemFor(target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    return id ? this.document.items.get(id) : null;
  }

  /**
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onAddCondition(_event, target) {
    const id = target.dataset.condition;
    if (id) await this.document.changeCondition(id, 1);
  }

  /**
   * @this {MantleCharacterSheet}
   * @param {PointerEvent} _event
   * @param {HTMLElement} target
   */
  static async #onRemoveCondition(_event, target) {
    const id = target.dataset.condition;
    if (id) await this.document.changeCondition(id, -1);
  }

  /**
   * @this {MantleCharacterSheet}
   */
  static async #onEndTurn() {
    await this.document.endTurn();
  }

  /**
   * @this {MantleCharacterSheet}
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
   * @this {MantleCharacterSheet}
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
