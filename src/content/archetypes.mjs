/**
 * The Archetypes Catalog as compendium content.
 *
 * Each rank carries its abilities as text and its numeric bonuses as data. The
 * character model sums the bonuses of every rank actually reached, so a Warrior
 * at rank 1 gets rank 1's Guard and not rank 2's.
 *
 * The catalog's Specialist Path Archetypes section is not yet written; the
 * schema holds them whenever it is.
 */

import { item } from "./_build.mjs";

const PACK = "archetypes";

/**
 * Shorthand for a rank entry.
 *
 * @param {number} n - The rank at which this is granted
 * @param {string} name
 * @param {string} description
 * @param {Record<string, number>} [bonuses]
 */
const rank = (n, name, description, bonuses = {}) => ({ rank: n, name, description, bonuses });

const SKILL_TRAINING_4 = "Receive training in 4 narrative skills from any group.";
const MARTIAL_TRAINING = "You may equip Medium, Heavy, and Superheavy weapons, and Martial armor.";

const ANCESTRIES = [
  {
    name: "Human",
    spd: 5, sen: 10, size: "1M",
    domains: ["general", "human"],
    ranks: [
      rank(1, "Versatile", "Gain an additional 1 wildcard mastery slot.", { vitality: 1, strain: 1, masteryWildcard: 1 }),
      rank(1, "Skill Training", SKILL_TRAINING_4),
      rank(2, "Mental Resilience", "When you take the Steady Yourself maneuver, you can spend Resolve to clear one Burden. The Resolve spent equals the Burden's severity.", { vitality: 1, strain: 1 }),
      rank(3, "Last Stand", "While you are in Crisis, you gain +1d bonus on all attacks and reactive defense rolls.", { vitality: 1, strain: 1 })
    ]
  },
  {
    name: "Half-Elf",
    spd: 5, sen: 10, size: "1M",
    domains: ["general", "human", "elf"],
    ranks: [
      rank(1, "Low-Light Vision", "Treat Dim Light as Bright Light, and Darkness as Dim Light.", { vitality: 1, strain: 1 }),
      rank(1, "Skill Training", SKILL_TRAINING_4),
      rank(2, "Elven Memories", "When making an action roll that can apply a skill from the Knowledge skill group, you may instead resolve it by testing your luck. You must take the results of the luck roll.", { vitality: 1, strain: 1 }),
      rank(3, "Cultural Fluency", "Gain +1d for all action rolls applying an Influence skill, as long as it involves Humans, Elves, or Half-Elves.", { vitality: 1, strain: 1 }),
      rank(3, "Adaptability", "During an Interlude, you may retrain one equipped mastery for another mastery that you qualify for.")
    ]
  },
  {
    name: "Elf",
    spd: 6, sen: 15, size: "1M",
    casting: { attribute: "pre", rank: 3 },
    domains: ["general", "elf"],
    ranks: [
      rank(1, "Low-Light Vision", "Treat Dim Light as Bright Light, and Darkness as Dim Light.", { strain: 2 }),
      rank(1, "Elven Memories", "When making an action roll that can apply a skill from the Knowledge skill group, you may instead resolve it by testing your luck."),
      rank(1, "Skill Training", SKILL_TRAINING_4),
      rank(2, "Dauntless Mind", "You cannot gain the Frightened condition.", { strain: 2 }),
      rank(3, "Magic Initiate", "You gain access to the Magic mastery domain.", { strain: 2 }),
      rank(3, "Innate Spellcasting", "You may cast spells, using PRE as your casting attribute. You gain 1 bonus mastery slot that must be filled with a Resonance. You gain no Arts for free, and no access to spell foci, so your spells always suffer the -1d no-focus penalty.")
    ]
  },
  {
    name: "Dwarf",
    spd: 4, sen: 12, size: "1M",
    domains: ["general", "dwarf"],
    ranks: [
      rank(1, "Darkvision", "Treat both Dim Light and Darkness as Bright Light.", { vitality: 2 }),
      rank(1, "Skill Training", SKILL_TRAINING_4),
      rank(2, "Tremorsense", "Sense the location of all grounded creatures within (SEN / 2) squares, regardless of lighting or cover. Sensed creatures count as visible for targeting. Flying creatures are unaffected.", { vitality: 2 }),
      rank(3, "Stone Will", "When you would gain the Broken condition from any source other than your own Brace reaction, you may test your luck. On 1+ success, you do not gain it.", { vitality: 2 })
    ]
  }
];

const PATHS = [
  {
    name: "Barbarian",
    prerequisites: "POW 2",
    domains: ["martial", "barbarian"],
    ranks: [
      rank(1, "Martial Training", MARTIAL_TRAINING, { vitality: 2 }),
      rank(1, "Skill Training", "Receive training in 2 narrative skills from the Athletics or Fieldcraft skill groups."),
      rank(1, "Enter Frenzy", "You have access to the Enter Frenzy maneuver (Vigor 0, 1/turn) to gain the Frenzy condition. Maximum Frenzy stacks cannot exceed 1 without the Berserk mastery."),
      rank(2, "Relentless", "Your melee weapon attacks deal +2 damage for every stack of Frenzy.", { vitality: 2 }),
      rank(2, "Adrenaline", "While Frenzied, you can perform the Surge maneuver using BODY instead of MIND."),
      rank(3, "Indomitable", "While Frenzied, you may auto-clear one stack of Exhausted, Hindered, or Slowed at the end of your turn instead of rolling.", { vitality: 2 }),
      rank(3, "Dauntless Frenzy", "You cannot gain the Frightened condition while Frenzied.")
    ]
  },
  {
    name: "Warrior",
    prerequisites: "BODY 2",
    domains: ["martial", "warrior"],
    ranks: [
      rank(1, "Martial Training", MARTIAL_TRAINING, { vitality: 1, guard: 1 }),
      rank(1, "Skill Training", "Receive training in 2 narrative skills from the Athletics or Subterfuge skill groups."),
      rank(1, "Deflect", "You have access to the Deflect reactive defense."),
      rank(2, "Counterattack", "You have access to the Counterattack reactive attack.", { vitality: 1, guard: 1 }),
      rank(2, "Focused Strike", "When you make a Basic Attack with a weapon, you can spend +2 Vigor to roll with a +2d bonus."),
      rank(3, "Veteran's Edge", "When you take the Brace reaction, you may pay +1 Vigor to gain Impaired 1 instead of becoming Broken, as often as you can pay for it.", { vitality: 1, guard: 1 }),
      rank(3, "Endless Endurance", "When you spend Resolve to heal a Wound or Burden, reduce its cost by 1 (minimum 1).")
    ]
  },
  {
    name: "Scholar",
    prerequisites: "REA 2",
    casting: { attribute: "rea", rank: 1 },
    domains: ["magic", "scholar"],
    ranks: [
      rank(1, "Spellcasting", "You may perform the Cast a Spell maneuver, using REA as the spellcasting attribute.", { strain: 1 }),
      rank(1, "Starting Repertoire", "You get 3 bonus mastery slots that must be filled with Resonances and Arts, including at least 1 of each.", { masteryRepertoire: 3 }),
      rank(1, "Spell Focus", "You may use your gear slots to equip spell foci. Casting without one incurs a -1d penalty."),
      rank(1, "Skill Training", "Receive training in Magic Theory, and 3 additional narrative skills from the Knowledge skill group."),
      rank(2, "Detect Magic", "You have access to the Detect Magic maneuver (Vigor 2).", { strain: 1 }),
      rank(2, "Push the Craft", "When you cast a spell, you may take up to MIND Strain. Each Strain taken grants +1d on the cast. Declare before rolling."),
      rank(3, "Long Casting", "You may spread a spell's Vigor cost across two turns, resolving on the second. You cannot take reactions while holding the cast.", { strain: 1 }),
      rank(3, "Magic Expertise", "All Resonance and Art masteries have their cost reduced by 1 slot (minimum 1).")
    ]
  },
  {
    name: "Channeler",
    prerequisites: "INS 2",
    casting: { attribute: "ins", rank: 1 },
    domains: ["magic", "channeler"],
    ranks: [
      rank(1, "Spellcasting", "You may perform the Cast a Spell maneuver, using INS as the spellcasting attribute.", { resolve: 1 }),
      rank(1, "Starting Repertoire", "You get 3 bonus mastery slots that must be filled with Resonances and Arts, including at least 1 of each.", { masteryRepertoire: 3 }),
      rank(1, "Spell Focus", "You may use your gear slots to equip spell foci. Casting without one incurs a -1d penalty."),
      rank(1, "Skill Training", "Receive training in 2 narrative skills from the Influence skill group, and 2 from any group."),
      rank(2, "Patron's Aura", "You project an aura of divine protection covering all squares within 5 squares of you. You also gain the Helping Hand reaction.", { resolve: 1 }),
      rank(2, "Patron's Will", "When you cast a spell, you may bypass the spellcasting roll and declare successes at 2 Strain each. No modifiers apply. Declare before rolling."),
      rank(3, "Patron's Aegis", "When you would take a Wound, you may spend 2 Resolve to prevent it entirely. Once per combat encounter.", { resolve: 1 }),
      rank(3, "Patron's Gift", "Patron's Will costs 1 Strain for the first success and 2 for the second; further successes cost 2 each.")
    ]
  }
];

/** @returns {import("./_build.mjs").PackDocument[]} */
export function build() {
  const documents = [];

  /**
   * @param {any} row
   * @param {"ancestry"|"basic"|"specialist"} kind
   */
  const make = (row, kind) =>
    item({
      pack: PACK,
      name: row.name,
      type: "archetype",
      img: kind === "ancestry" ? "icons/svg/mystery-man.svg" : "icons/svg/combat.svg",
      system: {
        description: "",
        source: "Archetypes Catalog",
        kind,
        rank: 1,
        maxRank: 3,
        domains: row.domains,
        prerequisites: row.prerequisites ?? "",
        casting: row.casting ?? { attribute: "", rank: 1 },
        spd: row.spd ?? 5,
        sen: row.sen ?? 10,
        size: row.size ?? "1M",
        rankFeatures: row.ranks
      }
    });

  for (const row of ANCESTRIES) documents.push(make(row, "ancestry"));
  for (const row of PATHS) documents.push(make(row, "basic"));

  return documents;
}
