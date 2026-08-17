// @ts-nocheck — ApplicationV2's generics are heavy enough that fvtt-types
// reports "excessive stack depth" on any subclass written in plain JS, and its
// render context is a closed interface JSDoc cannot widen. Checking this file
// yields pages of unfixable noise. The rules maths, which is what actually
// benefits from checking, lives in module/data and is checked there.

/**
 * The player character sheet.
 */

import { MANTLE } from "../../config.mjs";

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
      toggleSkill: MantleCharacterSheet.#onToggleSkill,
      toggleEquipped: MantleCharacterSheet.#onToggleEquipped,
      editItem: MantleCharacterSheet.#onEditItem,
      deleteItem: MantleCharacterSheet.#onDeleteItem,
      refreshTurn: MantleCharacterSheet.#onRefreshTurn
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
    skills: { template: "systems/mantle/templates/actor/character-skills.hbs", scrollable: [""] },
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
    context.tabs = this.#getTabs();
    context.items = this.#organizeItems();
    context.attributes = this.#prepareAttributes();
    context.skills = this.#prepareSkills();
    context.slots = this.#prepareSlots();

    return context;
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
      skills: "MANTLE.Tab.skills",
      bio: "MANTLE.Tab.bio"
    };

    return Object.fromEntries(
      Object.entries(entries).map(([id, label]) => [
        id,
        { id, group: "primary", label, cssClass: id === active ? "active" : "" }
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

  /** Skills grouped by their skill group, each flagged trained or not. */
  #prepareSkills() {
    const trained = this.document.system.skills;

    return Object.entries(MANTLE.skillGroups).map(([groupKey, groupLabel]) => ({
      key: groupKey,
      label: groupLabel,
      skills: Object.entries(MANTLE.skills)
        .filter(([, group]) => group === groupKey)
        .map(([skillKey]) => ({
          key: skillKey,
          label: `MANTLE.Skill.${skillKey}`,
          trained: trained.has(skillKey)
        }))
    }));
  }

  /* -------------------------------------------- */

  /**
   * Slot budgets paired with what is actually spent, so the sheet can flag an
   * overspent board. Nothing here blocks an illegal loadout — Mantle expects
   * the GM to adjudicate unusual builds.
   */
  #prepareSlots() {
    const { slots, slotsUsed } = this.document.system;

    const entry = (label, used, total) => ({ label, used, total, over: used > total });

    return {
      gear: entry("MANTLE.Slot.gear", slotsUsed.gear, slots.gear),
      wondrous: entry("MANTLE.Slot.wondrous", slotsUsed.wondrous, slots.wondrous),
      mastery: Object.entries(slots.mastery).map(([board, total]) =>
        entry(`MANTLE.Slot.${board}`, slotsUsed.mastery[board] ?? 0, total)
      )
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
  static async #onToggleSkill(_event, target) {
    const key = target.dataset.skill;
    if (!key) return;

    const trained = new Set(this.document.system.skills);
    if (trained.has(key)) trained.delete(key);
    else trained.add(key);

    await this.document.update({ "system.skills": Array.from(trained) });
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
}
