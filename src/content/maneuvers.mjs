/**
 * The basic maneuvers and reactions, as compendium reference.
 *
 * Built from `CONFIG.MANTLE.maneuvers` and `CONFIG.MANTLE.reactions` rather
 * than transcribed alongside them. Every combatant already has all of these —
 * the sheet drives them from the same tables — so these documents exist to be
 * read, dragged into a journal, or handed to a player learning the game. A
 * second transcription would be a second thing to keep in step.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { item } from "./_build.mjs";
import { MANTLE } from "../../module/config.mjs";

const PACK = "maneuvers";

/**
 * Display names, keyed by localization key.
 *
 * The compendium is built outside Foundry, where `game.i18n` does not exist, so
 * the English names come from the same lang file the system ships — resolved
 * relative to this module rather than to whatever directory the build was run
 * from.
 */
const LABELS = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../lang/en.json", import.meta.url)), "utf8")
);

/**
 * What each maneuver actually does, in the Quick Start's own words.
 *
 * @type {Record<string, string>}
 */
const MANEUVER_TEXT = {
  move: "Move a number of squares up to SPD. The movement cannot be broken up. Every Move costs 1 Vigor, but the first Move each turn is free.",
  shift: "Move a number of squares up to half SPD (minimum 1). Does not trigger reactive attacks.",
  shove: "Make one attack with the Unarmed Attack weapon. Instead of dealing damage, push the target away N squares, where N = net successes (maximum 3). This is forced movement.",
  grab: "Make one attack with the Unarmed Attack weapon. Instead of dealing damage, the target gains Hindered N, where N = net successes (maximum 3).",
  feint: "Make a Basic Attack roll with an equipped melee weapon — the Unarmed Attack qualifies. The attack deals no damage; the target gains Vulnerable N, where N = net successes (maximum 3). Feint is an attack, so the target may answer it with a reactive defense, and zero net successes applies nothing.",
  useConsumable: "Spend a consumable point to activate the effects of one consumable.",
  hide: "Become Hidden, if the conditions for hiding are met.",
  shakeItOff: "Clear one stack of the Hindered or Exhausted condition.",
  catchYourBreath: "Spend 1 Resolve to restore Vitality equal to half your Max Vitality. Costs no Vigor, but you may take no other maneuvers or reactions until the start of your next turn, except your free Move.",
  steadyYourself: "Clear Strain equal to half your Max Strain. Costs no Vigor, but you may take no other maneuvers or reactions until the start of your next turn, except your free Move.",
  surge: "Once per turn: gain Vigor up to your MIND, taking 2 Strain for each point gained. Cannot raise Vigor above your maximum. A character with MIND 0 cannot Surge.",
  limitBreak: "See the Limit Breaks section. Costs no Vigor, but you may take no other maneuvers or reactions until the start of your next turn, except your free Move."
};

/**
 * Trigger and effect for each reaction.
 *
 * @type {Record<string, string>}
 */
const REACTION_TEXT = {
  dodge: "When you are targeted by an attack: oppose it with AGI.",
  deflect: "When you are targeted by a melee attack and have an equipped weapon with the Deflect or Shield tag: oppose it with the attribute of the deflecting weapon. For Deflect weapons, the weight class must equal or exceed the attacker's. A weapon that has deflected cannot do so again until the start of your next turn.",
  forestall: "A combatant within reach of one of your equipped Reflexive melee weapons attempts to move, and it is not forced movement: make a Basic Attack against them. This interrupts the movement, which they may finish afterwards.",
  intercept: "A combatant out of reach of one of your equipped melee weapons moves into reach: make a Basic Attack against them. This interrupts the movement, which they may finish afterwards.",
  counterattack: "When you are targeted by a melee attack: immediately make a Basic Attack against the attacker with an equipped melee weapon. Resolve the counterattack first, then take the triggering damage in full.",
  brace: "When you are about to take damage from an attack: gain resistance to it, and immediately become Broken. Resistance never reduces Strain, so bracing against a Strain attack does nothing."
};

/**
 * How a cost reads on the card.
 *
 * @param {{vigor?: number, vigorCost?: number, resolve?: number, fullTurn?: boolean}} entry
 * @returns {string}
 */
function costLine(entry) {
  const vigor = entry.vigor ?? entry.vigorCost ?? 0;
  const parts = [];

  if (entry.fullTurn) parts.push("Full turn");
  if (vigor > 0) parts.push(`${vigor} Vigor`);
  if (entry.resolve) parts.push(`${entry.resolve} Resolve`);
  if (parts.length === 0) parts.push("Free");

  return parts.join(" · ");
}

/** @returns {import("./_build.mjs").PackDocument[]} */
export function build() {
  const documents = [];

  for (const [id, maneuver] of Object.entries(/** @type {Record<string, any>} */ (MANTLE.maneuvers))) {
    documents.push(
      item({
        pack: PACK,
        name: LABELS[maneuver.label] ?? id,
        type: "feature",
        img: "icons/svg/combat.svg",
        system: {
          description: `<p><strong>${costLine(maneuver)}</strong></p><p>${MANEUVER_TEXT[id]}</p>`,
          source: "Quick Start — Maneuvers",
          activation: {
            type: maneuver.fullTurn ? "fullTurn" : "maneuver",
            vigorCost: maneuver.vigor ?? 0
          }
        }
      })
    );
  }

  for (const [id, reaction] of Object.entries(/** @type {Record<string, any>} */ (MANTLE.reactions))) {
    documents.push(
      item({
        pack: PACK,
        name: LABELS[reaction.label] ?? id,
        type: "feature",
        img: "icons/svg/shield.svg",
        system: {
          description: `<p><strong>${costLine(reaction)}</strong></p><p>${REACTION_TEXT[id]}</p>`,
          source: "Quick Start — Reactions",
          activation: { type: "reaction", vigorCost: reaction.vigorCost ?? 0 }
        }
      })
    );
  }

  return documents;
}
