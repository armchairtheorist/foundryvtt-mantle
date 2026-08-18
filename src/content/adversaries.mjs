/**
 * The Pre-Generated Enemies catalog as compendium content.
 *
 * Every stat block is transcribed at the challenge class it was authored at,
 * with the printed numbers exactly as they appear — no scaling baked in. Both
 * the class template and the tier of play are overlays applied in derived data
 * (see module/rules/adversary.mjs), so a Bandit Thug dragged onto a Veteran
 * table is the same document as the one on a Novice table.
 *
 * Attribute rows and maneuver pools are both transcribed rather than one being
 * computed from the other. Enemy pools are authored as a whole — a Cultist's
 * Screech is 2d6 while its Sickle is 3d6, off the same attributes — so deriving
 * either from the other would quietly contradict the book.
 */

import { actor, ladder } from "./_build.mjs";

const PACK = "adversaries";

/**
 * @typedef {object} ManeuverRow
 * @property {string} name
 * @property {number} pool
 * @property {string[]} [tags] - Damage types and weapon tags alike
 * @property {string} [opposedBy]
 * @property {boolean} [signature]
 * @property {boolean} [telegraphed]
 * @property {Array<number|string>} damage - The 0s, 1s, 2s, and 3+ bands
 * @property {string} [suffix] - "damage" unless the maneuver deals Strain
 * @property {string} [notes]
 */

/**
 * @typedef {object} EnemyRow
 * @property {string} name
 * @property {"grunt"|"regular"|"elite"|"champion"|"nemesis"} cc
 * @property {string[]} tags
 * @property {number} vitality
 * @property {number} strain
 * @property {number} guard
 * @property {number[]} attributes - POW, AGI, REA, INS, PRE, LUCK
 * @property {number} spd
 * @property {number} sen
 * @property {string} size
 * @property {ManeuverRow[]} maneuvers
 * @property {Array<[string, number, string, string]>} locations
 *   Name, targeting penalty, hit effect, Wound effect
 * @property {Array<[string, string]>} [abilities]
 * @property {string} tactics
 * @property {string} [description]
 */

/**
 * The Unarmed Attack every enemy has by default, at whatever pool it rolls.
 *
 * @param {number} pool
 * @returns {ManeuverRow}
 */
const unarmed = (pool) => ({
  name: "Unarmed Attack",
  pool,
  tags: ["crushing", "melee 1"],
  damage: [1, 3, 6, 9]
});

/** @type {EnemyRow[]} */
const ENEMIES = [
  /* ---- Regular ---- */
  {
    name: "Goblin Skirmisher",
    cc: "regular",
    tags: ["humanoid"],
    vitality: 20,
    strain: 5,
    guard: 0,
    attributes: [1, 2, 0, 1, 0, 1],
    spd: 5,
    sen: 10,
    size: "1S",
    maneuvers: [
      { name: "Shiv", pool: 2, tags: ["piercing", "melee 1"], damage: [1, 4, 8, 12] },
      { name: "Sling", pool: 2, tags: ["crushing", "range 10"], damage: [1, 4, 8, 12] },
      unarmed(2),
      {
        name: "Trip",
        pool: 2,
        opposedBy: "AGI",
        damage: ["—", "Hindered 1", "Hindered 1", "Hindered 1"],
        suffix: "",
        notes: "1+ success: the target gains Hindered 1."
      }
    ],
    locations: [
      ["Mass", 0, "", ""],
      ["Edge", -2, "Hindered 1", ""],
      ["Mark", -3, "Impaired 1", ""]
    ],
    tactics: "Swarms in squads of 3–4; gangs up on whoever a bigger ally is already fighting."
  },
  {
    name: "Bandit Thug",
    cc: "regular",
    tags: ["humanoid"],
    vitality: 22,
    strain: 6,
    guard: 0,
    attributes: [2, 1, 0, 1, 1, 2],
    spd: 5,
    sen: 10,
    size: "1M",
    maneuvers: [
      { name: "Cudgel", pool: 3, tags: ["crushing", "melee 1"], damage: [2, 6, 11, 17] },
      unarmed(3)
    ],
    locations: [
      ["Mass", 0, "", ""],
      ["Edge", -2, "Hindered 1", ""],
      ["Mark", -3, "", ""]
    ],
    tactics: "Fights as a pack; focuses whoever is already bleeding."
  },
  {
    name: "Cultist",
    cc: "regular",
    tags: ["humanoid"],
    vitality: 22,
    strain: 6,
    guard: 0,
    attributes: [1, 1, 1, 1, 2, 1],
    spd: 5,
    sen: 10,
    size: "1M",
    maneuvers: [
      { name: "Ritual Sickle", pool: 3, tags: ["slashing", "melee 1"], damage: [2, 6, 11, 17] },
      {
        name: "Zealot's Screech",
        pool: 2,
        tags: ["mental", "range 10", "indefensible", "imprecise", "seeking"],
        opposedBy: "INS",
        damage: [1, 2, 3, 4],
        suffix: "Strain"
      },
      unarmed(3)
    ],
    locations: [
      ["Mass", 0, "", ""],
      ["Edge", -2, "", ""],
      ["Mark", -3, "", ""]
    ],
    tactics:
      "Screeches from the back until a Mindbinder or Hierophant falls — then charges in a frenzy of sickles."
  },
  {
    name: "Ironshell Sentinel",
    cc: "regular",
    tags: ["humanoid"],
    vitality: 22,
    strain: 6,
    guard: 3,
    attributes: [2, 0, 0, 1, 1, 1],
    spd: 4,
    sen: 10,
    size: "1M",
    maneuvers: [
      { name: "Flanged Mace", pool: 3, tags: ["crushing", "melee 1"], damage: [2, 7, 13, 20] },
      unarmed(3)
    ],
    locations: [
      ["Mass", 0, "", ""],
      ["Edge", -2, "", ""],
      ["Mark", -3, "A chink opens: the next attack against it gains +1d", ""]
    ],
    tactics:
      "Holds a chokepoint and never chases; spreads its attacks to whoever presses the line. Chip attacks bounce off its Guard; Penetrating, Wracked, and Strain damage walk straight through."
  },
  {
    name: "Crag Troll",
    cc: "regular",
    tags: ["humanoid"],
    vitality: 26,
    strain: 5,
    guard: 0,
    attributes: [3, 0, 0, 1, 0, 1],
    spd: 4,
    sen: 12,
    size: "1L",
    maneuvers: [
      {
        name: "Slam",
        pool: 3,
        tags: ["crushing", "melee 1"],
        damage: [3, 8, 15, 22],
        notes: "+1d against a Grabbed target."
      },
      {
        name: "Grab",
        pool: 3,
        tags: ["melee 1"],
        opposedBy: "POW or AGI",
        damage: ["—", "Hindered 1", "Hindered 2", "Hindered 3"],
        suffix: "",
        notes:
          "1+: the target gains Hindered stacks equal to net successes (max 3) and is Grabbed. Core Grab rules apply; separation ends the grab."
      },
      unarmed(3)
    ],
    locations: [
      ["Mass", 0, "", ""],
      ["Edge", -2, "Hindered 1", ""],
      ["Mark", -3, "", ""]
    ],
    tactics: "Grabs the biggest threat it can reach and slams whatever it's holding."
  },
  {
    name: "Razorwing",
    cc: "regular",
    tags: ["beast", "avian"],
    vitality: 18,
    strain: 5,
    guard: 0,
    attributes: [1, 3, 0, 2, 0, 1],
    spd: 6,
    sen: 12,
    size: "1S",
    maneuvers: [
      {
        name: "Diving Talons",
        pool: 3,
        tags: ["slashing", "melee 1"],
        damage: [2, 6, 11, 17],
        notes: "+2 damage if it Moved 3+ squares straight toward the target this turn."
      },
      unarmed(3)
    ],
    abilities: [
      [
        "Flight",
        "Moves over creatures and obstacles; ignores ground-based difficult terrain."
      ]
    ],
    // No Mark: a Razorwing is all wing and speed, and the catalog gives it a
    // Wings location in the Edge slot instead.
    locations: [
      ["Mass", 0, "", ""],
      [
        "Wings",
        -2,
        "Loses Flight until the end of its next turn (falls if airborne — untyped falling damage applies).",
        "Loses Flight for the rest of the encounter."
      ]
    ],
    tactics: "Circles high, dives the most isolated PC, and retreats out of reach."
  },
  {
    name: "Alley Blade",
    cc: "regular",
    tags: ["humanoid"],
    vitality: 18,
    strain: 6,
    guard: 0,
    attributes: [1, 3, 1, 1, 1, 1],
    spd: 6,
    sen: 10,
    size: "1M",
    maneuvers: [
      {
        name: "Stiletto",
        pool: 3,
        tags: ["piercing", "melee 1", "penetrating"],
        damage: [1, 3, 6, 9],
        notes: "Ignores Guard."
      },
      unarmed(3)
    ],
    abilities: [
      [
        "Shadow Start",
        "If the fiction allows, begins the encounter Hidden — +2d on its first attack, which reveals it."
      ]
    ],
    locations: [
      ["Mass", 0, "", ""],
      ["Edge", -2, "", ""],
      ["Mark", -3, "", ""]
    ],
    tactics:
      "Ignores the unarmored; hunts whoever is wearing the heaviest armor — its blade doesn't care."
  },

  /* ---- Elite ---- */
  {
    name: "Bandit Captain",
    cc: "elite",
    tags: ["humanoid"],
    vitality: 24,
    strain: 9,
    guard: 0,
    attributes: [3, 2, 1, 2, 2, 2],
    spd: 5,
    sen: 10,
    size: "1M",
    maneuvers: [
      { name: "Longsword", pool: 4, tags: ["slashing", "melee 1"], damage: [3, 8, 15, 22] },
      {
        name: "Executioner's Swing",
        pool: 4,
        signature: true,
        telegraphed: true,
        tags: ["slashing", "melee 1"],
        damage: [6, 14, 24, 34],
        notes:
          "Announce now; resolves at the start of the Captain's next turn. Usable every other round."
      },
      unarmed(4)
    ],
    abilities: [
      ["Parry", "Scripted defense, once per round: oppose one melee attack against the Captain with 3d6."],
      ["Commander", "Challenge class ability: allies within SEN/2 (5) squares receive +1d on action rolls."],
      ["Discipline", "Sheds 1 stack of every condition at end of turn."]
    ],
    locations: [
      ["Mass", 0, "", ""],
      ["Edge", -2, "Hindered 1", "Sword arm mangled: Signature unavailable for the rest of the fight."],
      ["Mark", -3, "", "Helm split: loses Parry."]
    ],
    tactics:
      "Duels the strongest-looking PC and orders the pack — fights alongside Thugs, whom his Commander aura sharpens."
  },
  {
    name: "Cult Mindbinder",
    cc: "elite",
    tags: ["humanoid"],
    vitality: 20,
    strain: 10,
    guard: 0,
    attributes: [0, 1, 2, 3, 3, 1],
    spd: 5,
    sen: 12,
    size: "1M",
    maneuvers: [
      {
        name: "Mind Spike",
        pool: 4,
        tags: ["mental", "range 12", "indefensible", "imprecise", "seeking"],
        opposedBy: "INS",
        damage: [1, 2, 4, 6],
        suffix: "Strain"
      },
      {
        name: "Dread Whisper",
        pool: 4,
        signature: true,
        telegraphed: true,
        tags: ["mental", "range 12", "indefensible", "imprecise", "seeking"],
        opposedBy: "INS",
        damage: [2, 4, 6, 9],
        suffix: "Strain",
        notes:
          "Every other round; up to two creatures within 12. On 2+ net successes the target gains Frightened, with the Mindbinder as the source."
      },
      unarmed(2)
    ],
    abilities: [
      ["Veil of Doubt", "Scripted defense, once per round: oppose one attack against the Mindbinder with 3d6."],
      [
        "Terrifying Presence",
        "Challenge class ability: the first time a character sees the Mindbinder, they gain Frightened."
      ],
      ["Discipline", "Sheds 1 stack of every condition at end of turn."]
    ],
    locations: [
      ["Mass", 0, "", ""],
      ["Edge", -2, "", "Concentration shattered: Signature unavailable next round."],
      [
        "Mark",
        -3,
        "",
        "The binding slips: every condition the Mindbinder has inflicted ends immediately."
      ]
    ],
    tactics:
      "Stays behind bodies; Spikes whoever has the least Strain remaining — it wants a collapse, not a corpse."
  },

  /* ---- Champion ---- */
  {
    name: "Cult Hierophant",
    cc: "champion",
    tags: ["humanoid"],
    vitality: 26,
    strain: 10,
    guard: 0,
    attributes: [1, 1, 2, 4, 4, 2],
    spd: 5,
    sen: 12,
    size: "1M",
    maneuvers: [
      { name: "Scourge of Doctrine", pool: 5, tags: ["slashing", "melee 2"], damage: [4, 10, 19, 28] },
      {
        name: "Word of Unmaking",
        pool: 5,
        tags: ["mental", "range 12", "indefensible", "imprecise", "seeking"],
        opposedBy: "INS",
        damage: [2, 4, 6, 9],
        suffix: "Strain"
      },
      {
        name: "Litany of the Hollow God",
        pool: 5,
        signature: true,
        telegraphed: true,
        tags: ["mental", "range 12", "indefensible", "imprecise", "seeking"],
        opposedBy: "INS",
        damage: [8, 16, 28, 40],
        notes:
          "Every other round; one creature. Half the damage (round down) is dealt to Vitality, half to Strain."
      },
      unarmed(3)
    ],
    abilities: [
      ["Faith Unshaken", "Scripted defense, once per round: oppose one attack against the Hierophant with 4d6."],
      ["Battlefield Awareness", "Challenge class ability: immune to Shrouded."],
      ["Resilient", "Challenge class ability: restores 5 Vitality at the start of its first turn each round."],
      [
        "Wound bar effects",
        "1st bar lost — the mask cracks: all Cultists within 12 immediately make one Ritual Sickle attack. 2nd bar lost — the Hollow God stirs: the Hierophant's next Signature does not need to be telegraphed."
      ],
      [
        "Strain Breakdown",
        "Once, at its first Strain bar lost: doubt floods in — the Hierophant loses its next turn, then continues with its remaining Strain bars."
      ],
      ["Discipline", "Sheds 1 stack of every condition at the end of each of its turns."]
    ],
    locations: [
      ["Mass", 0, "", ""],
      ["Edge", -2, "", "Voice broken: cannot use Word of Unmaking or its Signature next round."],
      ["Mark", -3, "", "The icon shatters: loses Faith Unshaken."]
    ],
    tactics:
      "Opens with the Litany telegraph to force scattering, Scourges whoever closes, and saves the second turn each round to answer whatever hurt it most."
  },

  /* ---- Nemesis ---- */
  {
    name: "Sorrowmaw, the Grief-Drake",
    cc: "nemesis",
    tags: ["undead", "beast"],
    vitality: 30,
    strain: 10,
    guard: 0,
    attributes: [4, 3, 1, 3, 4, 2],
    spd: 6,
    sen: 15,
    size: "3",
    description:
      "It remembers every death it has ever caused. It treasures them. When Sorrowmaw descends, the air itself weeps.",
    maneuvers: [
      { name: "Grave-Chill Bite", pool: 6, tags: ["piercing", "melee 2"], damage: [4, 11, 20, 30] },
      {
        name: "Wing Buffet",
        pool: 6,
        tags: ["crushing", "melee 2"],
        damage: [2, 6, 11, 17],
        notes:
          "All creatures in range. Each target hit (1+) is Shoved 2 squares directly away. One roll, opposed individually."
      },
      {
        name: "Keening of the Lost",
        pool: 6,
        tags: ["mental", "range 6", "indefensible", "imprecise", "seeking"],
        opposedBy: "INS",
        damage: [2, 4, 6, 9],
        suffix: "Strain",
        notes: "Emanation: all creatures within 6. One roll, opposed individually."
      },
      {
        name: "Sorrow Made Flesh",
        pool: 6,
        signature: true,
        telegraphed: true,
        tags: ["melee 2"],
        damage: [6, 14, 24, 34],
        notes:
          "Cone 6 breath, every other round. It inhales and the light dims; resolves at the start of its next turn. Defended normally — Dodge, Deflect, and Brace all apply. Creatures damaged by the breath also take 2 Strain."
      },
      unarmed(6)
    ],
    abilities: [
      ["Flight", "Moves over creatures and obstacles; ignores ground-based difficult terrain."],
      [
        "Miasma of Grief",
        "At the start of each of Sorrowmaw's turns, every creature within 3 squares takes 1 Strain."
      ],
      ["Chosen One", "Challenge class ability: may re-roll any luck roll, but must keep the re-rolled result."],
      ["Unbreakable", "Challenge class ability: immune to Broken."],
      ["Hardened", "Challenge class ability: resistance (Slashing) — old scars teach old lessons."],
      [
        "Terrifying Presence",
        "Challenge class ability: the first time a character sees Sorrowmaw, they gain Frightened."
      ],
      [
        "Wound bar effects",
        "1st bar lost — the death-wind rises: +2 SPD for the rest of the fight. 2nd bar lost — grief given voice: Keening of the Lost gains +1d. 3rd bar lost — the hollow heart shows: Sorrowmaw loses Flight, its Signature no longer needs to be telegraphed, and it gains +1d on all action rolls."
      ],
      [
        "Strain Breakdown",
        "Each time a Strain bar is lost: the grief overwhelms — Sorrowmaw spends its next turn keening at the sky (that turn: Move only)."
      ]
    ],
    locations: [
      ["Mass", 0, "", ""],
      [
        "Wings",
        -2,
        "Faltering flight: cannot use Flight-dependent movement on its next turn.",
        "Wing torn: loses Flight for the rest of the fight (falls if airborne — untyped falling damage applies)."
      ],
      [
        "The Hollow Heart",
        -3,
        "The grief flickers: Miasma of Grief is suppressed until its next turn.",
        "The heart gutters: Sorrowmaw loses its next turn entirely."
      ]
    ],
    tactics:
      "Opens from the sky: Terrifying Presence, then Keening over the clustered party. Telegraphs the breath to shatter formations, lands to Bite whoever stands alone, and uses Wing Buffet + Flight to escape when surrounded. It saves its third turn each round to punish healers — Sorrowmaw hates hope most of all."
  }
];

/** Wound and Burden slots by challenge class, as the catalog prints them. */
const HARM_SLOTS = {
  grunt: 0,
  regular: 0,
  elite: 1,
  champion: 2,
  nemesis: 3
};

const ATTRIBUTE_ORDER = ["pow", "agi", "rea", "ins", "pre", "luck"];

/** @returns {import("./_build.mjs").PackDocument[]} */
export function build() {
  return ENEMIES.map((enemy) => {
    const slots = HARM_SLOTS[enemy.cc];

    return actor({
      pack: PACK,
      name: enemy.name,
      type: "adversary",
      img: "icons/svg/mystery-man.svg",
      system: {
        challengeClass: enemy.cc,
        template: "",
        tier: "novice",
        tags: enemy.tags,

        attributes: Object.fromEntries(
          ATTRIBUTE_ORDER.map((key, index) => [key, enemy.attributes[index]])
        ),

        // Current values start full, so a stat block dragged onto the canvas is
        // ready to fight without anyone touching it first.
        vitality: { value: enemy.vitality, max: enemy.vitality },
        strain: { value: 0, max: enemy.strain },
        guard: { value: enemy.guard, max: enemy.guard },

        woundSlots: slots,
        burdenSlots: slots,
        wounds: [],
        burdens: [],

        spd: enemy.spd,
        sen: enemy.sen,
        size: enemy.size,

        turnsPerRound: 1,
        extraManeuvers: 1,

        maneuvers: enemy.maneuvers.map((maneuver) => ({
          name: maneuver.name,
          pool: maneuver.pool,
          tags: maneuver.tags ?? [],
          opposedBy: maneuver.opposedBy ?? "",
          signature: Boolean(maneuver.signature),
          telegraphed: Boolean(maneuver.telegraphed),
          ladder: ladder(maneuver.damage, "", maneuver.suffix ?? "damage"),
          notes: maneuver.notes ?? ""
        })),

        hitLocations: enemy.locations.map(([name, penalty, hitEffect, woundEffect]) => ({
          name,
          penalty,
          hitEffect,
          woundEffect
        })),

        abilities: (enemy.abilities ?? []).map(([name, description]) => ({ name, description })),

        description: enemy.description ? `<p><em>${enemy.description}</em></p>` : "",
        tactics: `<p>${enemy.tactics}</p>`
      }
    });
  });
}
