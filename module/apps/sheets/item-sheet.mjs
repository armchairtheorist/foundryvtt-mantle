// @ts-nocheck — see the note in character-sheet.mjs: ApplicationV2 subclasses
// written in plain JS overwhelm fvtt-types' generics.

/**
 * A single item sheet serving every Item subtype.
 *
 * Rather than eleven near-identical classes, one sheet swaps its detail part
 * based on the item's type. The header, description, and effects sections are
 * shared; only the middle changes.
 */

import { MANTLE } from "../../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export default class MantleItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["mantle", "sheet", "item"],
    position: { width: 560, height: 620 },
    window: { resizable: true },
    form: { submitOnChange: true }
  };

  /** @override */
  static PARTS = {
    header: { template: "systems/mantle/templates/item/item-header.hbs" },
    details: { template: "systems/mantle/templates/item/item-details.hbs", scrollable: [""] },
    description: { template: "systems/mantle/templates/item/item-description.hbs", scrollable: [""] }
  };

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;

    context.system = item.system;
    context.config = MANTLE;
    context.editable = this.isEditable;

    // Which detail block the template renders. Keeping this as a flag per type
    // keeps the Handlebars free of long else-if chains.
    context.is = Object.fromEntries(
      ["archetype", "mastery", "weapon", "armor", "focus", "wondrous", "consumable", "art", "resonance", "feature", "limitbreak"].map(
        (type) => [type, item.type === type]
      )
    );

    context.hasLadder = ["weapon", "consumable"].includes(item.type);

    context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      item.system.description ?? "",
      { relativeTo: item, secrets: item.isOwner }
    );

    return context;
  }
}
