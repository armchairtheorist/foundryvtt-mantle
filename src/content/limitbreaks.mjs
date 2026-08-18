/**
 * The Limit Breaks Catalog as compendium content.
 *
 * Limit Breaks come in two kinds with one uniform access rule: General ones are
 * gated on a core minimum, and Archetype ones unlock when their archetype is
 * realized and carry no attribute gate at all. That split is the only structure
 * here — everything else is the effect text, which the GM adjudicates.
 */

import { item } from "./_build.mjs";

const PACK = "limitbreaks";

/**
 * @typedef {object} LimitBreakRow
 * @property {string} name
 * @property {"general"|"archetype"} category
 * @property {"body"|"mind"|"soul"} [core] - Core gate, General Limit Breaks only
 * @property {number} [coreValue]
 * @property {string} [archetype] - Which archetype must be realized
 * @property {string} effect
 */

/** @type {LimitBreakRow[]} */
const LIMIT_BREAKS = [
  {
    name: "Crescent Onslaught",
    category: "general",
    core: "body",
    coreValue: 2,
    effect:
      "Make one melee weapon attack against every enemy within your weapon's melee range (treat the weapon's reach as a minimum of 2 for this maneuver). Roll each attack separately with a +1d bonus."
  },
  {
    name: "Deadeye Requiem",
    category: "general",
    core: "body",
    coreValue: 2,
    effect:
      "Make one attack with an equipped ranged weapon with a +2d bonus. The attack gains the Seeking tag and ignores all attack roll penalties, including distance, visibility, and hit-location targeting penalties. You cannot target a Hidden creature."
  },
  {
    name: "Arcane Overdrive",
    category: "general",
    core: "mind",
    coreValue: 2,
    effect:
      "Cast one spell. Its total Vigor cost is 0, including up to 4 Vigor of spell-shaping upgrades for free. The spellcasting roll gains a +2d bonus (area shaping roll penalties still apply). Grazing with this spell causes no Strain.\n\nBecause a Limit Break is a full-turn maneuver, free maneuvers that accompany casting (e.g., Push the Craft) cannot be used."
  },
  {
    name: "Undying Vow",
    category: "general",
    core: "mind",
    coreValue: 2,
    effect:
      "Every ally within SEN squares (including yourself) restores Vitality equal to half their Max Vitality at no Resolve cost, then chooses one of the following:\n\n- Clear Strain equal to half their Max Strain; or\n- Clear one condition on themselves that is auto-clear or roll-to-clear."
  },
  {
    name: "Bulwark Unbreakable",
    category: "general",
    core: "soul",
    coreValue: 2,
    effect:
      "Gain +20 Guard (this can result in Over-Guard). Until the start of your next turn, you are immune to forced movement. Every enemy within 5 squares gains the Provoked condition with you as the source."
  },
  {
    name: "Golden Hour",
    category: "general",
    core: "soul",
    coreValue: 2,
    effect:
      "For every ally within SEN squares: Each ally may take a free Move or Shift maneuver, and may then immediately make one Basic Attack by paying its Vigor cost. An ally without enough Vigor may still make the attack, but immediately gains the Exhausted condition."
  },

  {
    name: "Inazuma Crash",
    category: "archetype",
    archetype: "Warrior",
    effect:
      "Double your SPD for this turn. Choose one equipped melee weapon. For every enemy that enters your weapon's melee range during your turn, make one Basic Attack against it; on 3 or more successes the enemy disregards the attack's normal effects and instead takes a Wound. Each enemy can only be struck once this turn in this manner."
  }
];

/** @returns {import("./_build.mjs").PackDocument[]} */
export function build() {
  return LIMIT_BREAKS.map((lb) =>
    item({
      pack: PACK,
      name: lb.name,
      type: "limitbreak",
      img: "icons/svg/explosion.svg",
      system: {
        description: `<p>${lb.effect.replace(/\n\n/g, "</p><p>")}</p>`,
        source: "Limit Breaks Catalog",
        equipped: false,
        category: lb.category,
        // Archetype Limit Breaks carry no core gate; the blank is meaningful.
        requiredCore: lb.core ?? "",
        requiredCoreValue: lb.coreValue ?? 0,
        requiredArchetype: lb.archetype ?? ""
      }
    })
  );
}
