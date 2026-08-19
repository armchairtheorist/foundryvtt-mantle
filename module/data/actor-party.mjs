// @ts-nocheck — fvtt-types requires explicit generic arguments on
// TypeDataModel and Document subclasses, which plain JSDoc cannot supply
// without heavy ceremony. The rules maths these models delegate to lives in
// module/data/derive.mjs, which IS fully typechecked and unit-tested.

/**
 * Data model for the Party actor.
 *
 * Valor is a single pooled resource earned by the whole group and spent by
 * whoever needs it. Foundry has no concept of a shared table resource, so it
 * lives on an Actor: give every player Owner permission and they can spend it
 * themselves, without any socket relaying through the GM.
 *
 * Max Valor is the sum of every player character's SOUL plus the number of
 * party members, so the model tracks its own membership.
 */

import { fields, count, resource } from "./_fields.mjs";

export default class PartyData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      valor: resource(0),

      /** Player characters counted toward Max Valor. NPC allies do not count. */
      members: new fields.SetField(new fields.DocumentUUIDField({ type: "Actor" })),

      notes: new fields.HTMLField({ required: true, blank: true })
    };
  }

  /* -------------------------------------------- */

  prepareDerivedData() {
    let soulTotal = 0;
    let memberCount = 0;

    for (const uuid of this.members) {
      const actor = fromUuidSync(uuid);
      if (!actor || actor.type !== "character") continue;
      soulTotal += actor.system.cores?.soul ?? 0;
      memberCount += 1;
    }

    this.valor.max = soulTotal + memberCount;
    this.memberCount = memberCount;

    // Valor never rises above the cap or falls below zero.
    this.valor.value = Math.clamp(this.valor.value, 0, this.valor.max);

    /**
     * Entering downtime with Valor at half the cap or better earns the party a
     * merit, so it is worth showing the threshold rather than making everyone
     * work it out.
     */
    this.meritThreshold = Math.max(1, Math.floor(this.valor.max / 2));
    this.meritEarned = this.valor.value >= this.meritThreshold;
  }
}
