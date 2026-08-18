// @ts-nocheck — fvtt-types requires explicit generic arguments on
// TypeDataModel and Document subclasses, which plain JSDoc cannot supply
// without heavy ceremony. The rules maths these models delegate to lives in
// module/data/derive.mjs, which IS fully typechecked and unit-tested.

/**
 * Data model for player characters.
 */

import { MANTLE } from "../config.mjs";
import { deriveCharacter, isInCrisis, isStressed } from "./derive.mjs";
import { fields, count, text, resource, bonuses } from "./_fields.mjs";

export default class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      attributes: new fields.SchemaField(
        Object.fromEntries(Object.keys(MANTLE.attributes).map((key) => [key, count(0)]))
      ),

      // Current values only. Every maximum is derived, so raising a core or
      // swapping armor moves the ceiling the moment the change lands.
      vitality: resource(),
      strain: resource(),
      guard: resource(),
      vigor: resource(),
      resolve: resource(),
      consumables: resource(),

      /**
       * Wounds and Burdens are slot-based persistent harm. Each entry records
       * what was rolled so the consequence stays visible for the rest of the
       * mission — a Trauma Wound remembers which gear it disabled, a Breakdown
       * remembers its affliction.
       */
      wounds: new fields.ArrayField(
        new fields.SchemaField({
          severity: count(1, { min: 1 }),
          effect: text(),
          disabledGear: text()
        })
      ),

      burdens: new fields.ArrayField(
        new fields.SchemaField({
          severity: count(1, { min: 1 }),
          effect: text(),
          affliction: text()
        })
      ),

      /** Trained narrative skills, by skill id. Training is binary. */
      skills: new fields.SetField(new fields.StringField({ blank: false })),

      languages: new fields.SetField(new fields.StringField({ blank: false })),

      bonuses: bonuses(),

      biography: new fields.HTMLField({ required: true, blank: true }),
      notes: new fields.HTMLField({ required: true, blank: true })
    };
  }

  /* -------------------------------------------- */

  /**
   * Zero the accumulators so Active Effects have a clean surface to add into.
   * Without this, bonuses would compound on every re-prepare.
   */
  prepareBaseData() {
    for (const key of Object.keys(this.bonuses)) this.bonuses[key] = 0;
  }

  /* -------------------------------------------- */

  /**
   * Compute every derived stat. Runs after Active Effects have filled in
   * `bonuses`, and after embedded items are prepared, so archetype ranks and
   * equipped armor are both readable here.
   */
  prepareDerivedData() {
    const archetypes = this.parent.items.filter((i) => i.type === "archetype");

    // Character rank is the sum of all archetype ranks — breadth and depth
    // count the same.
    const characterRank = archetypes.reduce((sum, a) => sum + (a.system.rank ?? 0), 0);

    // SPD, SEN, and SIZE are granted by the ancestry rather than computed. A
    // character has at most one; if somehow more, the first wins.
    const ancestry = archetypes.find((a) => a.system.kind === "ancestry");

    // Archetype bonuses are per rank, so only ranks actually reached count.
    // These are summed here rather than applied as Active Effects: effects
    // cannot easily be made rank-aware without one effect per rank, toggled as
    // the rank changes.
    for (const archetype of archetypes) {
      for (const feature of archetype.system.activeFeatures ?? []) {
        for (const [key, value] of Object.entries(feature.bonuses ?? {})) {
          if (value) this.bonuses[key] += value;
        }
      }
    }

    const derived = deriveCharacter({
      attributes: this.attributes,
      characterRank,
      bonuses: this.bonuses,
      ancestry: ancestry
        ? { spd: ancestry.system.spd, sen: ancestry.system.sen, size: ancestry.system.size }
        : {}
    });

    // Assign explicitly rather than Object.assign(this, derived). A blanket
    // merge overwrites stored schema fields that happen to share a name — it
    // replaced the `resolve` resource object with a bare number, which then
    // threw on the very next line.
    this.cores = derived.cores;
    this.equilibrium = derived.equilibrium;
    this.tier = derived.tier;
    this.slots = derived.slots;
    this.spd = derived.spd;
    this.sen = derived.sen;
    this.size = derived.size;
    this.languagesKnown = derived.languagesKnown;
    this.characterRank = characterRank;

    // Attach maxima to the resources so token bars and the sheet can read
    // `system.vitality.max` in the usual Foundry idiom.
    this.vitality.max = derived.maxVitality;
    this.strain.max = derived.maxStrain;
    this.guard.max = derived.maxGuard;
    this.vigor.max = derived.maxVigor;
    this.vigor.refresh = derived.vigorRefresh;
    this.resolve.max = derived.maxResolve;
    this.consumables.max = derived.slots.consumable;

    // Guard may be pushed above its maximum — Over-Guard — and when it is, the
    // start-of-turn refresh is skipped rather than pulling it back down.
    this.overGuard = this.guard.value > this.guard.max;

    this.states = {
      crisis: isInCrisis({
        wounds: this.wounds.length,
        burdens: this.burdens.length,
        faltering: this.parent.statuses?.has("faltering") ?? false,
        unraveling: this.parent.statuses?.has("unraveling") ?? false
      }),
      stressed: isStressed(this.strain.value, this.strain.max)
    };

    this.slotsUsed = this.#countSlotUsage();

    // Which attribute this character casts on, granted by an archetype at a
    // rank they have actually reached. Blank means they are not a caster.
    const caster = archetypes.find(
      (a) => a.system.casting?.attribute && a.system.rank >= (a.system.casting.rank ?? 1)
    );
    this.castingAttribute = caster?.system.casting.attribute ?? "";
    this.isCaster = Boolean(this.castingAttribute);

    // Casting without a focus costs a die, unless Inner Focus covers it.
    this.hasFocus = this.parent.items.some((i) => i.type === "focus" && i.system.equipped);
    this.innerFocus = this.parent.items.some(
      (i) => i.type === "mastery" && i.system.equipped && i.name === "Inner Focus"
    );
  }

  /* -------------------------------------------- */

  /**
   * Tally how much of each slot budget is spent, so the sheet can warn on
   * overflow. Deliberately advisory: Mantle expects the GM to adjudicate
   * unusual builds, so nothing here blocks an illegal loadout.
   *
   * @returns {{gear: number, wondrous: number, mastery: Record<string, number>}}
   */
  #countSlotUsage() {
    const items = this.parent.items;
    const equipped = (i) => i.system.equipped === true;

    // Superheavy weapons cost two gear slots; everything else costs one.
    const gear = items
      .filter((i) => ["weapon", "armor", "focus"].includes(i.type) && equipped(i))
      .reduce((sum, i) => sum + (i.system.gearSlots ?? 1), 0);

    const wondrous = items.filter((i) => i.type === "wondrous" && equipped(i)).length;

    const mastery = { body: 0, mind: 0, soul: 0, wildcard: 0 };
    for (const item of items) {
      if (item.type !== "mastery" || !equipped(item)) continue;
      const board = item.system.slotBoard ?? item.system.masteryType;
      if (board in mastery) mastery[board] += item.system.slotCost ?? 1;
    }

    return { gear, wondrous, mastery };
  }
}
