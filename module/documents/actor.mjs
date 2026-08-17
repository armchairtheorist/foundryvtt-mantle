// @ts-nocheck — fvtt-types requires explicit generic arguments on
// TypeDataModel and Document subclasses, which plain JSDoc cannot supply
// without heavy ceremony. The rules maths these models delegate to lives in
// module/data/derive.mjs, which IS fully typechecked and unit-tested.

/**
 * The Mantle Actor document.
 *
 * Most preparation lives in the data models; this class carries the behaviour
 * that spans an actor as a whole — turn-start refreshes, applying damage, and
 * taking Wounds and Burdens.
 */

export default class MantleActor extends Actor {
  /**
   * v14 splits Active Effect application into phases and tracks which have run.
   * Skipping the super call leaves that tracking set unreset, which throws on
   * the next data preparation.
   */
  prepareBaseData() {
    super.prepareBaseData();
  }

  /* -------------------------------------------- */

  /** Convenience: the ancestry archetype, which sets SPD, SEN, and SIZE. */
  get ancestry() {
    return this.items.find((i) => i.type === "archetype" && i.system.kind === "ancestry") ?? null;
  }

  /** Equipped weapons, in sheet order. */
  get weapons() {
    return this.items.filter((i) => i.type === "weapon" && i.system.equipped);
  }

  /* -------------------------------------------- */

  /**
   * Start-of-turn refresh: regain Vigor equal to the refresh rate, and restore
   * Guard to its maximum.
   *
   * Over-Guard is deliberately left alone. A character carrying more Guard than
   * their maximum keeps it rather than having it pulled back down, so the
   * refresh is skipped entirely in that case.
   *
   * @returns {Promise<this>}
   */
  async refreshForTurn() {
    if (this.type !== "character") return this;
    const system = this.system;

    const vigor = Math.min(system.vigor.value + system.vigor.refresh, system.vigor.max);
    const updates = { "system.vigor.value": vigor };

    if (!system.overGuard) updates["system.guard.value"] = system.guard.max;

    return this.update(updates);
  }
}
