// @ts-nocheck — fvtt-types requires explicit generic arguments on
// TypeDataModel and Document subclasses, which plain JSDoc cannot supply
// without heavy ceremony. The rules maths these models delegate to lives in
// module/data/derive.mjs, which IS fully typechecked and unit-tested.

/**
 * Data model for player characters.
 */

import { MANTLE } from "../config.mjs";
import {
  deriveCharacter,
  gatherBonuses,
  countSlotUsage,
  isInCrisis,
  isStressed,
  BONUS_KEYS
} from "./derive.mjs";
import { fields, count, text, resource, track, bonuses, affinities } from "./_fields.mjs";

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
       * what it rolled, so the consequence stays readable for the rest of the
       * mission after the condition itself has been cleared and re-cleared.
       *
       * Neither carries a severity any more: v0.31 dropped severities, and a
       * Wound is now a Wound whatever else is already on the sheet.
       */
      wounds: new fields.ArrayField(
        new fields.SchemaField({
          /** The condition this Wound rolled on the 1d6 table, for display. */
          consequence: text()
        })
      ),

      burdens: new fields.ArrayField(
        new fields.SchemaField({
          /**
           * The affliction this Burden brought. Afflictions are cleared by
           * healing a Burden and the player chooses which, so the Burden is
           * where the record has to live.
           */
          affliction: text()
        })
      ),

      /**
       * The Wound and Burden tracks as bar-shaped fields, so a GM can put them
       * over a token. Both halves are filled in by `prepareDerivedData` from the
       * arrays above and the slot budget — these are a second view of the same
       * data, never a second copy of it.
       */
      woundSlots: track(),
      burdenSlots: track(),

      /**
       * Threads: free-text chapters of the character's life, in the order they
       * were written. An array rather than a set because they are prose and two
       * could legitimately read alike, and because the order is the player's.
       *
       * Languages left with them: v0.31 governs language by the same
       * Expert/Familiar framework Threads answer, with no number to store.
       */
      threads: new fields.ArrayField(new fields.StringField({ blank: false })),

      /**
       * Damage affinities. Characters gain these from masteries and gear;
       * adversaries carry them on the stat block, like Sorrowmaw's Hardened.
       */
      resistances: affinities(),
      weaknesses: affinities(),

      bonuses: bonuses(),

      biography: new fields.HTMLField({ required: true, blank: true }),
      notes: new fields.HTMLField({ required: true, blank: true })
    };
  }

  /* -------------------------------------------- */

  /**
   * Zero the accumulators so Active Effects have a clean surface to add into.
   *
   * Driven from the schema's own field list rather than from `this.bonuses`.
   * Iterating the live object is one initialization change away from resetting
   * nothing at all — and a reset that silently does nothing is exactly the kind
   * of bug that shows up much later as a stat that keeps growing.
   */
  prepareBaseData() {
    for (const key of BONUS_KEYS) this.bonuses[key] = 0;
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

    // Archetype ranks and worn armor are totalled here rather than applied as
    // Active Effects: an effect cannot easily be made rank-aware without one
    // effect per rank, toggled as the rank changes.
    //
    // The totals land in a *new* object rather than being added into
    // `this.bonuses`. Adding into the stored accumulator is only correct while
    // something zeroes it between every pair of derivations, and Foundry calls
    // `prepareDerivedData` more often than it calls `prepareBaseData` — which
    // is how Max Vitality ended up climbing on its own.
    this.bonusTotals = gatherBonuses({
      effects: this.bonuses,
      archetypes: archetypes.map((a) => ({
        rank: a.system.rank ?? 0,
        features: a.system.rankFeatures ?? []
      })),
      masteries: this.parent.items
        .filter((i) => i.type === "mastery" && i.system.equipped)
        .map((i) => i.system.bonuses ?? {}),
      armor: this.parent.items
        .filter((i) => i.type === "armor" && i.system.equipped)
        .map((i) => ({ guard: i.system.guard ?? 0 })),
      conditions: this.#conditionBonuses()
    });

    const derived = deriveCharacter({
      attributes: this.attributes,
      characterRank,
      bonuses: this.bonusTotals,
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
    this.maxThreads = derived.maxThreads;
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

    // The harm tracks fill up rather than drain, so `value` is how many have
    // been taken and `max` is the budget. Same numbers the sheet reads out of
    // `slots`, exposed in the shape a token bar needs.
    this.woundSlots.value = this.wounds.length;
    this.woundSlots.max = derived.slots.wound;
    this.burdenSlots.value = this.burdens.length;
    this.burdenSlots.max = derived.slots.burden;

    // Guard may be pushed above its maximum — Over-Guard — and when it is, the
    // start-of-turn refresh is skipped rather than pulling it back down.
    this.overGuard = this.guard.value > this.guard.max;

    this.states = {
      crisis: isInCrisis({
        wounds: this.wounds.length,
        burdens: this.burdens.length,
        woundSlots: derived.slots.wound,
        burdenSlots: derived.slots.burden,
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

    // Affinities the character holds outright, plus any their equipped
    // masteries grant. Kept as a derived pair rather than merged into the
    // stored sets, so removing a mastery removes its resistance again.
    const equippedMasteries = this.parent.items.filter(
      (i) => i.type === "mastery" && i.system.equipped
    );

    this.affinities = {
      resistances: [
        ...this.resistances,
        ...equippedMasteries.flatMap((i) => Array.from(i.system.resistances ?? []))
      ],
      weaknesses: [
        ...this.weaknesses,
        ...equippedMasteries.flatMap((i) => Array.from(i.system.weaknesses ?? []))
      ]
    };

    /**
     * Combat Reflexes gives *every* equipped melee weapon the Reflexive tag,
     * the intrinsic Unarmed Attack included. Derived here rather than written
     * onto each weapon, so unequipping the mastery takes the tag back.
     */
    this.combatReflexes = equippedMasteries.some((i) => i.name === "Combat Reflexes");

    // Casting without a focus costs a die, unless Inner Focus covers it.
    this.hasFocus = this.parent.items.some((i) => i.type === "focus" && i.system.equipped);
    this.innerFocus = this.parent.items.some(
      (i) => i.type === "mastery" && i.system.equipped && i.name === "Inner Focus"
    );
  }

  /* -------------------------------------------- */

  /**
   * Flat bonuses from conditions the character is currently carrying.
   *
   * Read from `statuses` rather than from stack counts: every rider in the
   * table is flat for as long as the condition lasts, however deep it is
   * stacked. Frenzy's per-stack +1d on melee attacks is a roll modifier, not a
   * derived stat, and is applied on the roll instead.
   *
   * @returns {object[]}
   */
  #conditionBonuses() {
    const statuses = this.parent.statuses;
    if (!statuses) return [];

    return Object.entries(MANTLE.conditionBonuses)
      .filter(([id]) => statuses.has(id))
      .map(([, granted]) => granted);
  }

  /* -------------------------------------------- */

  /**
   * Read the loadout out of the actor's items and hand it to the pure tally.
   *
   * @returns {{gear: number, wondrous: number, mastery: Record<string, number>}}
   */
  #countSlotUsage() {
    return countSlotUsage(
      this.parent.items.map((item) => ({
        type: item.type,
        equipped: item.system.equipped === true,
        gearSlots: item.system.gearSlots,
        masteryType: item.system.masteryType,
        slotBoard: item.system.slotBoard,
        slotCost: item.system.slotCost
      }))
    );
  }
}
