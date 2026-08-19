/**
 * The maneuver bar's render context.
 *
 * Shared by both actor sheets. Enemies run a leaner action economy — no Vigor,
 * no reactions by default — but the maneuvers they *can* take are the same
 * general ones a character takes, Shove and Feint included, so the bar is built
 * from one table for both.
 *
 * The list is `basicManeuvers`, not `maneuvers`: an adversary's stat block has
 * its own printed maneuvers — its attacks — under that name, and the two must
 * not share a key in the render context.
 */

import { MANTLE } from "../../config.mjs";

/**
 * Build the maneuver and reaction lists for a sheet.
 *
 * A maneuver whose requirement the actor cannot meet is offered anyway rather
 * than hidden — Surge at MIND 0 and Shake It Off with nothing to shake both
 * refuse with a message, which teaches the rule. What *is* filtered is the
 * reactions that need a weapon the actor is not holding: those would only ever
 * produce a warning.
 *
 * @param {any} actor - A MantleActor
 * @returns {{basicManeuvers: object[], reactions: object[]}}
 */
export function prepareManeuvers(actor) {
  /**
   * The config tables are object literals, so their inferred types are a union
   * of one shape per entry rather than one shape with optional fields. Reading
   * them as records is the one place that needs saying.
   *
   * @type {Record<string, any>}
   */
  const maneuverTable = MANTLE.maneuvers;
  /** @type {Record<string, any>} */
  const reactionTable = MANTLE.reactions;

  // Enemies track no Vigor, so nothing is ever unaffordable for them and no
  // cost is worth showing.
  const tracksVigor = actor.type !== "adversary";

  /** @param {number} cost */
  const affordable = (cost) =>
    !tracksVigor || cost <= (actor.system.vigor?.value ?? 0);

  const basicManeuvers = Object.entries(maneuverTable)
    .filter(([, maneuver]) => tracksVigor || maneuver.enemy === true)
    .map(([id, maneuver]) => ({
      id,
      label: maneuver.label,
      vigor: tracksVigor ? maneuver.vigor ?? 0 : 0,
      resolve: tracksVigor ? maneuver.resolve ?? 0 : 0,
      fullTurn: Boolean(maneuver.fullTurn),
      affordable: affordable(maneuver.vigor ?? 0)
    }));

  // Enemies have no reactions by default; anything they can answer with is
  // written on the stat block instead.
  if (!tracksVigor) return { basicManeuvers, reactions: [] };

  const hasMelee = actor.meleeWeapons?.length > 0;
  /** @type {Record<string, boolean>} */
  const available = {
    dodge: true,
    brace: true,
    deflect: actor.deflectWeapons?.length > 0,
    forestall: actor.reflexiveWeapons?.length > 0,
    intercept: hasMelee,
    counterattack: hasMelee
  };

  const reactions = Object.entries(reactionTable)
    .filter(([id]) => available[id])
    .map(([id, reaction]) => ({
      id,
      label: reaction.label,
      vigor: reaction.vigorCost ?? 0,
      affordable: affordable(reaction.vigorCost ?? 0)
    }));

  return { basicManeuvers, reactions };
}
