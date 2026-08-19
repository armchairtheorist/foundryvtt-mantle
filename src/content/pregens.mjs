/**
 * The four pre-generated characters as ready-to-play Actors.
 *
 * Every embedded item is a copy of the one in its own pack, looked up by name,
 * rather than a second transcription. That is the whole point: if the Rapier's
 * ladder is ever corrected in the Equipment catalog, Mira's Rapier is corrected
 * with it, and the two can never quietly disagree.
 *
 * The stat blocks in the catalog are printed fully computed. Nothing computed
 * is stored here — attributes, archetype ranks, and equipment go in, and the
 * derived pipeline produces the printed numbers. `test/pregens.test.mjs` checks
 * those numbers against the catalog, so a build that comes out wrong fails
 * there with the stat named.
 */

import { actor, stableId } from "./_build.mjs";
import { deriveCharacter, gatherBonuses } from "../../module/data/derive.mjs";
import { build as buildArchetypes } from "./archetypes.mjs";
import { build as buildMasteries } from "./masteries.mjs";
import { build as buildEquipment } from "./equipment.mjs";
import { build as buildSpellcasting } from "./spellcasting.mjs";
import { build as buildLimitBreaks } from "./limitbreaks.mjs";

const PACK = "pregens";

/** Every catalog document, indexed by name, so a build reads as a shopping list. */
const CATALOG = new Map(
  [
    ...buildArchetypes(),
    ...buildMasteries(),
    ...buildEquipment(),
    ...buildSpellcasting(),
    ...buildLimitBreaks()
  ].map((document) => [document.name, document])
);

/**
 * @typedef {object} PregenRow
 * @property {string} name
 * @property {string} concept
 * @property {Record<string, number>} attributes
 * @property {Array<[string, number]>} archetypes - Name and rank held
 * @property {Record<string, string[]>} masteries - Board to mastery names
 * @property {string[]} gear - Equipment names, all equipped
 * @property {Record<string, object>} [gearOverrides]
 *   System fields to change on this character's copy of a piece of gear
 * @property {string[]} limitBreaks
 * @property {string[]} skills - Trained skill ids
 * @property {string} playstyle
 */

/** @type {PregenRow[]} */
const PREGENS = [
  {
    name: "Mira",
    concept: "Half-Elf, Agile Skirmisher Warrior",
    attributes: { pow: 0, agi: 3, rea: 0, ins: 1, pre: 0, luck: 0 },
    archetypes: [["Half-Elf", 1], ["Warrior", 2]],
    masteries: {
      body: ["Lightning Reflexes", "Combat Reflexes", "Bloodlust"],
      mind: ["Overwatch"],
      wildcard: ["Visualization"]
    },
    gear: ["Rapier", "Shortbow", "Chain Shirt"],
    // Combat Reflexes gives every equipped melee weapon the Reflexive tag,
    // which is what unlocks the Forestall reaction. The catalog Rapier is left
    // as printed; only Mira's copy carries the tag.
    gearOverrides: { Rapier: { tags: ["deflect", "reflexive"] } },
    limitBreaks: ["Deadeye Requiem"],
    skills: ["climbing", "stealth", "tracking", "bestiary", "seduction", "navigation"],
    playstyle:
      "Open at range with Overwatch, close with the Rapier, Focused Strike against armor. Combat Reflexes makes the Rapier Reflexive, so anything that tries to disengage from you eats a Forestall."
  },
  {
    name: "Kira",
    concept: "Dwarf, Raging Brute",
    attributes: { pow: 2, agi: 0, rea: 0, ins: 1, pre: 0, luck: 1 },
    archetypes: [["Dwarf", 1], ["Barbarian", 2]],
    masteries: {
      body: ["Bloodlust", "Bloodfeast"],
      mind: ["Willpower"],
      soul: ["Berserk"],
      wildcard: ["Taunt"]
    },
    gear: ["Greataxe", "Sling", "Plate Armor"],
    limitBreaks: ["Crescent Onslaught"],
    skills: ["lifting", "endurance", "coercion", "smithing", "tracking", "history"],
    playstyle:
      "Enter Frenzy every turn and swing the Greataxe — at Frenzy 3 you roll 5d6. Taunt whoever is about to reach the casters. Watch your Strain: the rage costs 3 a turn at full stacks against a maximum of 5, and while Frenzied you have no defensive reactions."
  },
  {
    name: "Maya",
    concept: "Human, Damage Caster",
    attributes: { pow: 0, agi: 0, rea: 3, ins: 0, pre: 0, luck: 1 },
    archetypes: [["Human", 1], ["Scholar", 2]],
    masteries: {
      mind: ["Mens Resonance", "Cone Shaping", "Arcane Shield"],
      soul: ["Improviser"],
      wildcard: ["Bolster Art", "Iron Will"],
      repertoire: ["Ignis Resonance", "Rend Art", "Afflict Art"]
    },
    gear: ["Dagger", "Basic Spell Focus", "Armored Cloak"],
    limitBreaks: ["Arcane Overdrive"],
    skills: [
      "magicTheory", "esoterica", "history", "engineering",
      "charm", "readPeople", "alchemy", "firstAid"
    ],
    playstyle:
      "Ignis Rend is the workhorse; Push the Craft when the roll has to land. Mens Afflict when the target's Strain is the softer track. Iron Will halves incoming Strain for 1 Vigor — worth holding for the Mindbinder."
  },
  {
    name: "Vera",
    concept: "Elf, Battle-Priest",
    attributes: { pow: 1, agi: 0, rea: 0, ins: 3, pre: 0, luck: 0 },
    archetypes: [["Elf", 1], ["Channeler", 2]],
    masteries: {
      body: ["Vigorous"],
      mind: ["Rend Art", "Bolster Art", "Mending Spirit"],
      wildcard: ["Beseech"],
      repertoire: ["Lux Resonance", "Mend Art"]
    },
    gear: ["Dagger", "Basic Spell Focus", "Armored Cloak"],
    limitBreaks: ["Undying Vow"],
    skills: [
      "etiquette", "charm", "religion", "herbalism",
      "nature", "firstAid", "politics", "animalHandling"
    ],
    playstyle:
      "Lux Mend keeps the line standing; Patron's Will buys a certain heal at 2 Strain a success when the roll cannot be risked."
  }
];

/* -------------------------------------------- */

/**
 * A copy of a catalog document, ready to embed on an actor.
 *
 * The `_key` is rewritten, not dropped. The CLI stores embedded documents in
 * the same database as their parent under a compound key — `!actors.items!` and
 * then the two ids — and a document whose key is still the top-level
 * `!items!<id>` form makes it throw outright. Leaving the key off entirely is
 * worse still: that is the silent failure that once compiled forty-seven
 * weapons into an empty pack.
 *
 * @param {string} owner - The pregen's name, so ids do not collide across them
 * @param {string} ownerId - The parent actor's id, for the compound key
 * @param {string} name - Catalog document name
 * @param {object} [overrides] - System fields to change on the copy
 * @returns {object}
 */
function embed(owner, ownerId, name, overrides = {}) {
  const source = CATALOG.get(name);
  if (!source) throw new Error(`pregens: no catalog document named ${JSON.stringify(name)}`);

  const copy = structuredClone(source);
  copy._id = stableId(`${PACK}/${owner}/${name}`);
  copy._key = `!actors.items!${ownerId}.${copy._id}`;
  copy.system = { ...copy.system, ...overrides };
  return copy;
}

/** @returns {import("./_build.mjs").PackDocument[]} */
export function build() {
  return PREGENS.map((pregen) => {
    // The actor's id has to be known before its items are built, since each
    // item's storage key is compounded from both. It is derived the same way
    // `actor()` derives it.
    const actorId = stableId(`${PACK}/character/${pregen.name}`);
    const items = [];

    for (const [name, rank] of pregen.archetypes) {
      items.push(embed(pregen.name, actorId, name, { rank }));
    }

    // Every mastery is equipped and carries the board that actually paid for
    // it, so the slot meters read the way the catalog prints them rather than
    // defaulting everything onto its own core and overspending.
    for (const [board, names] of Object.entries(pregen.masteries)) {
      for (const name of names) {
        items.push(embed(pregen.name, actorId, name, { equipped: true, slotBoard: board }));
      }
    }

    for (const name of pregen.gear) {
      items.push(
        embed(pregen.name, actorId, name, {
          equipped: true,
          ...(pregen.gearOverrides?.[name] ?? {})
        })
      );
    }

    for (const name of pregen.limitBreaks) {
      items.push(embed(pregen.name, actorId, name, { equipped: true }));
    }

    // The Arts and Resonances a caster's repertoire masteries grant. The
    // mastery is the slot spent; the Art is the thing you cast, and the Cast
    // dialog reads these two lists.
    for (const name of spellcastingFor(pregen)) {
      items.push(embed(pregen.name, actorId, name, { equipped: true }));
    }

    const starting = startingResources(pregen, items);

    return actor({
      pack: PACK,
      name: pregen.name,
      type: "character",
      img: "icons/svg/mystery-man.svg",
      system: {
        attributes: pregen.attributes,
        skills: pregen.skills,
        languages: [],

        // Every track starts full. A pregen handed to a player at the table
        // should be ready to fight, not ready to be filled in — and the
        // starting values come from the same derivation the sheet runs, so a
        // formula change moves them rather than leaving four stale numbers.
        vitality: { value: starting.maxVitality },
        strain: { value: 0 },
        guard: { value: starting.maxGuard },
        vigor: { value: starting.maxVigor },
        resolve: { value: starting.maxResolve },
        consumables: { value: starting.slots.consumable },
        wounds: [],
        burdens: [],
        biography: `<p><em>${pregen.concept}</em></p>`,
        notes: `<p><strong>Playstyle.</strong> ${pregen.playstyle}</p>`
      },
      items
    });
  });
}

/**
 * Where each track starts, from the same derivation the character sheet runs.
 *
 * Only the bonuses this build actually carries are counted — archetype ranks
 * reached and worn armor. Masteries that grant bonuses (Vigorous, and its kin)
 * are not modelled as data yet, so a value they would raise starts a little
 * low rather than a little high; the sheet computes the true maximum the
 * moment the actor is opened, and a track below its maximum is a smaller
 * surprise than one above it.
 *
 * @param {PregenRow} pregen
 * @param {any[]} items - The embedded items, already built
 * @returns {ReturnType<typeof deriveCharacter>}
 */
function startingResources(pregen, items) {
  const archetypes = items.filter((item) => item.type === "archetype");

  return deriveCharacter({
    attributes: /** @type {any} */ (pregen.attributes),
    characterRank: archetypes.reduce((sum, a) => sum + a.system.rank, 0),
    bonuses: gatherBonuses({
      archetypes: archetypes.map((a) => ({
        rank: a.system.rank,
        features: a.system.rankFeatures
      })),
      masteries: items
        .filter((item) => item.type === "mastery" && item.system.equipped)
        .map((item) => item.system.bonuses),
      armor: items
        .filter((item) => item.type === "armor")
        .map((item) => ({ guard: item.system.guard }))
    })
  });
}

/**
 * The Art and Resonance documents a build's masteries entitle it to.
 *
 * A "Rend Art" mastery is the slot spent to know Rend; the Art item is the
 * thing the Cast dialog offers. Deriving one from the other keeps the two in
 * step — adding "Mend Art" to a build is enough to give that character Mend.
 *
 * @param {PregenRow} pregen
 * @returns {string[]}
 */
function spellcastingFor(pregen) {
  const names = Object.values(pregen.masteries).flat();
  const spellcasting = new Set(buildSpellcasting().map((doc) => doc.name));

  return names
    .map((name) => name.replace(/ (Art|Resonance)$/, ""))
    .filter((base, index, all) => all.indexOf(base) === index)
    .filter((base) => spellcasting.has(base));
}
