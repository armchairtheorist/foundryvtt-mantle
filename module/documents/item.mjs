// @ts-nocheck — fvtt-types requires explicit generic arguments on
// TypeDataModel and Document subclasses, which plain JSDoc cannot supply
// without heavy ceremony. The rules maths these models delegate to lives in
// module/data/derive.mjs, which IS fully typechecked and unit-tested.

/**
 * The Mantle Item document.
 *
 * Thin by design — the per-subtype logic lives in the data models. This class
 * exists for behaviour that needs the document rather than its system data,
 * such as reading the owning actor.
 */

export default class MantleItem extends Item {
  /**
   * Whether this item currently contributes anything. An unequipped mastery or
   * a weapon left in the pack has no effect; an archetype always does, since
   * every rank a character holds is permanently active.
   */
  get isActive() {
    if (this.type === "archetype" || this.type === "feature") return true;
    return this.system.equipped === true;
  }

  /* -------------------------------------------- */

  /**
   * Gear disabled by a Trauma Wound stops working until that Wound is healed.
   * The Wound records which item it disabled, so the check reads from the actor.
   */
  get isDisabled() {
    const wounds = this.actor?.system?.wounds;
    if (!wounds) return false;
    return wounds.some((wound) => wound.disabledGear === this.id);
  }
}
