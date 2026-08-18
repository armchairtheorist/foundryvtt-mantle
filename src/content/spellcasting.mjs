/**
 * The Spellcasting Catalog as compendium content.
 *
 * An Art declares the *structure* of a cast — cost, basic shape, and the band
 * ladder. A Resonance declares the *substance* — which ladder a pairing uses,
 * what tags it carries, what condition it inflicts, and what opposes it.
 *
 * An Art a Resonance does not list cannot be cast with it. Tempus has no Mend
 * entry, and that is a refusal by fiction rather than a matter of cost.
 */

import { item, ladder } from "./_build.mjs";

const PACK = "spellcasting";

const GRAZE = "Caster takes Strain from grazing.";

/** Shape helper: [step, shapeable]. */
const dim = (step, shapeable = true) => ({ step, shapeable });

const ARTS = [
  {
    name: "Rend",
    type: "attack",
    slots: 1,
    cost: 2,
    description:
      "Channels the raw power of the applied Resonance into direct harm against a foe. The bolt, lash, or jet of damage — instantaneous and singular.",
    // Range SEN, instantaneous and unshapeable, single target.
    shape: { range: dim(3), duration: dim(1, false), area: dim(1) },
    vitality: ladder(
      [`2 damage. ${GRAZE}`, "5 damage", "10 damage + 1 stack of the Resonance's condition", "16 damage + 3 stacks of the Resonance's condition"],
      "+6 damage / success"
    ),
    strain: ladder(
      [`1 Strain. ${GRAZE}`, "2 Strain", "3 Strain + 1 stack of the Resonance's condition", "5 Strain + 3 stacks of the Resonance's condition"],
      "+2 Strain / success"
    ),
    rules: 'Default attack tags: "Melee 1", "Range N" (N = spell range), plus "Imprecise" and "Seeking" if an area effect. If the Resonance-defined condition is non-stackable, it applies at 2 and 3+ successes.'
  },
  {
    name: "Afflict",
    type: "attack",
    slots: 1,
    cost: 2,
    description:
      "Channels the Resonance into a curse that takes root in the target. The affliction is the point; direct harm is incidental.",
    shape: { range: dim(2), duration: dim(1), area: dim(1) },
    vitality: ladder(
      [`1 damage. ${GRAZE}`, "1 stack of the Resonance's condition", "2 stacks of the Resonance's condition", "3 stacks of the Resonance's condition"],
      "+2 damage / success"
    ),
    strain: ladder(["", "", "", ""]),
    rules: "While an Afflict spell is active, if the inflicted condition is reduced, the caster may take 1 Strain per stack removed to restore it. Afflict ends immediately if the caster is Defeated."
  },
  {
    name: "Bolster",
    type: "utility",
    slots: 1,
    cost: 2,
    description:
      "Channels the Resonance to grant the target a transient boon — protection, power, Vigor, or insight — shaped by the Resonance that powers it.",
    shape: { range: dim(1), duration: dim(1), area: dim(1) },
    vitality: ladder(
      [
        `Apply the Resonance's bolster effect for 1 round only, regardless of the duration shape. ${GRAZE}`,
        "Apply the Resonance's bolster effect for the duration",
        "Apply the bolster effect, and target gains +1d to the Resonance's qualifying rolls for the duration",
        "Apply the bolster effect, and target gains +2d to the Resonance's qualifying rolls for the duration"
      ],
      "+2 Guard / success"
    ),
    strain: ladder(["", "", "", ""]),
    rules: "Bolster ends immediately if the caster is Defeated."
  },
  {
    name: "Mend",
    type: "restoration",
    slots: 1,
    cost: 2,
    description:
      "Channels the Resonance to restore — knitting Wounds, unspooling stress, releasing accumulated harm. Undoes damage the Resonance's nature can undo.",
    shape: { range: dim(2), duration: dim(1, false), area: dim(1) },
    vitality: ladder(
      [
        `Target gains +5 Guard. ${GRAZE}`,
        "Target recovers Vitality equal to half their maximum. Caster or target spends 1 Resolve",
        "Target recovers Vitality to full. Caster or target spends 1 Resolve",
        "Target recovers Vitality to full and gains the Resonance's bonus effect. Caster or target spends 1 Resolve"
      ],
      "+3 Guard / success"
    ),
    strain: ladder(
      [
        `Target clears 1 Strain. ${GRAZE}`,
        "Target clears 2 Strain",
        "Target clears 3 Strain",
        "Target clears 5 Strain and gains the Resonance's bonus effect"
      ],
      "+2 additional Strain cleared / success"
    ),
    rules: "The Resonance's entry specifies which ladder applies. Some Resonances support only one; some support both."
  }
];

/**
 * Per-Resonance Art entries. `ladder` picks which of the Art's two ladders the
 * pairing resolves on.
 */
const RESONANCES = [
  {
    name: "Ignis",
    slots: 1,
    description:
      "Flames, heat, transformation through consumption. The most volatile of the elemental Resonances — quick to apply, quick to consume itself. Ignis takes; Ignis reveals.",
    arts: [
      { art: "Rend", ladder: "vitality", bonusDamage: 2, tags: ["fire"], condition: "Wracked (Fire)" },
      { art: "Afflict", ladder: "vitality", tags: ["fire", "indefensible", "imprecise", "seeking"], condition: "Wracked (Fire)", opposedBy: "POW" },
      { art: "Bolster", ladder: "vitality", bolsterEffect: "+2 Fire damage on melee weapon attacks", qualifyingRolls: "Melee weapon attacks" },
      { art: "Mend", ladder: "vitality", bonusEffect: "The caster may spend extra Resolve to heal one Wound on the target, equal to its severity. The target then gains Wracked 3 (Fire)." }
    ]
  },
  {
    name: "Lux",
    slots: 2,
    description:
      "The light made manifest — banishing darkness, revealing truth, scouring corruption. To channel Lux is to wield certainty against shadow.",
    arts: [
      { art: "Rend", ladder: "vitality", bonusDamage: 2, tags: ["radiant", "indefensible", "imprecise"], condition: "Shrouded", opposedBy: "PRE" },
      { art: "Afflict", ladder: "vitality", tags: ["radiant", "indefensible", "imprecise"], condition: "Shrouded", opposedBy: "PRE" },
      { art: "Bolster", ladder: "vitality", bolsterEffect: "All weapon attacks made by the target gain the Radiant tag. The target is immune to becoming Frightened, and any existing Frightened is cleared.", qualifyingRolls: "None" },
      { art: "Mend", ladder: "both", bonusEffect: "Vitality: all stackable auto-clear or roll-to-clear conditions are cleared. Strain: all non-stackable auto-clear or roll-to-clear conditions are cleared." }
    ]
  },
  {
    name: "Mens",
    slots: 1,
    description:
      "The realm of thought, will, and perception. Mens reaches past flesh and bone to act directly on consciousness. No armor guards the mind; only the mind itself does.",
    arts: [
      { art: "Rend", ladder: "strain", tags: ["mental", "indefensible", "imprecise", "seeking"], condition: "Frightened", opposedBy: "INS" },
      { art: "Afflict", ladder: "vitality", tags: ["mental", "indefensible", "imprecise", "seeking"], condition: "Frightened", opposedBy: "INS" },
      { art: "Bolster", ladder: "vitality", bolsterEffect: "+2d on REA and INS rolls made to oppose another roll", qualifyingRolls: "All other REA and INS rolls" },
      { art: "Mend", ladder: "strain", bonusEffect: "The target is cleansed of Frightened. The caster may spend extra Resolve to heal one Burden, equal to its severity." }
    ]
  },
  {
    name: "Tempus",
    slots: 2,
    description:
      "The rarest of Resonances — the flow of moments themselves. Tempus does not destroy; it accelerates, retards, or reveals.",
    arts: [
      { art: "Rend", ladder: "vitality", tags: ["cosmic", "indefensible", "imprecise", "seeking", "penetrating"], condition: "Slowed", opposedBy: "a luck roll", notes: "Damage manifests as accelerated decay." },
      { art: "Afflict", ladder: "vitality", tags: ["cosmic", "indefensible", "imprecise", "seeking", "penetrating"], condition: "Slowed", opposedBy: "a luck roll" },
      { art: "Bolster", ladder: "vitality", bolsterEffect: "If the target starts a turn with less than 3 Vigor after refresh, their Vigor is set to 3.", qualifyingRolls: "Any roll made as part of a reaction" }
      // Mend is deliberately absent: the catalog marks Tempus/Mend Not Supported.
    ]
  },
  {
    name: "Terra",
    slots: 1,
    description:
      "The stubborn weight of the world made into a weapon or a shield. Terra presses, crushes, grounds; the slowest of the elements and the most enduring.",
    arts: [
      { art: "Rend", ladder: "vitality", bonusDamage: 1, tags: ["earth", "crushing"], condition: "Impaired" },
      { art: "Afflict", ladder: "vitality", tags: ["earth", "imprecise", "seeking"], condition: "Impaired" },
      { art: "Bolster", ladder: "vitality", bolsterEffect: "Target gains +2 Max Guard", qualifyingRolls: "All POW rolls" },
      { art: "Mend", ladder: "vitality", bonusEffect: "Target gains +2 Guard." }
    ]
  }
];

/** @returns {import("./_build.mjs").PackDocument[]} */
export function build() {
  const documents = [];

  for (const art of ARTS) {
    documents.push(
      item({
        pack: PACK,
        name: art.name,
        type: "art",
        img: "icons/svg/explosion.svg",
        system: {
          description: `<p>${art.description}</p>`,
          source: "Spellcasting Catalog",
          equipped: false,
          artType: art.type,
          slotCost: art.slots,
          baseCost: art.cost,
          basicShape: art.shape,
          vitalityLadder: art.vitality,
          strainLadder: art.strain,
          universalRules: art.rules
        }
      })
    );
  }

  for (const resonance of RESONANCES) {
    documents.push(
      item({
        pack: PACK,
        name: resonance.name,
        type: "resonance",
        img: "icons/svg/lightning.svg",
        system: {
          description: `<p>${resonance.description}</p>`,
          source: "Spellcasting Catalog",
          equipped: false,
          slotCost: resonance.slots,
          arts: resonance.arts.map((entry) => ({
            art: entry.art,
            ladder: entry.ladder,
            tags: entry.tags ?? [],
            condition: entry.condition ?? "",
            opposedBy: entry.opposedBy ?? "",
            bonusDamage: entry.bonusDamage ?? 0,
            bolsterEffect: entry.bolsterEffect ?? "",
            qualifyingRolls: entry.qualifyingRolls ?? "",
            bonusEffect: entry.bonusEffect ?? "",
            notes: entry.notes ?? ""
          }))
        }
      })
    );
  }

  return documents;
}
