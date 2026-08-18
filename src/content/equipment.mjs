/**
 * The Equipment Catalog as compendium content.
 *
 * Rows mirror the catalog stat blocks: weight class, attribute, tags, and the
 * four-band damage ladder. "either" means the wielder picks between POW and AGI.
 */

import { item, ladder } from "./_build.mjs";

const PACK = "equipment";

/**
 * @typedef {object} WeaponRow
 * @property {string} name
 * @property {"light"|"medium"|"heavy"|"superheavy"} weight
 * @property {"pow"|"agi"|"either"} attr
 * @property {string[]} types - Damage type tags
 * @property {number|null} [melee] - Reach in squares, null if it cannot melee
 * @property {number|null} [range] - Max range in squares, null if it cannot be thrown or fired
 * @property {string[]} [tags]
 * @property {number[]} damage - The 0s, 1s, 2s, and 3+ bands
 * @property {string} [special]
 * @property {boolean} [intrinsic] - Part of the body: always equipped, no gear slot
 */

/** @type {WeaponRow[]} */
const WEAPONS = [
  // Always available, and it costs no gear slot. Every character has this
  // without owning the item at all; the copy here is for anyone who wants to
  // modify their own.
  { name: "Unarmed Attack", weight: "light", attr: "either", types: ["crushing"], melee: 1, damage: [1, 3, 6, 9], intrinsic: true },

  // Light
  { name: "Dagger", weight: "light", attr: "either", types: ["piercing"], melee: 1, range: 5, damage: [1, 4, 8, 12] },
  { name: "Stiletto", weight: "light", attr: "either", types: ["piercing"], melee: 1, tags: ["penetrating"], damage: [1, 3, 6, 9] },
  { name: "Rapier", weight: "light", attr: "agi", types: ["piercing"], melee: 1, tags: ["deflect"], damage: [1, 5, 10, 15] },
  { name: "Sling", weight: "light", attr: "either", types: ["crushing"], melee: null, range: 10, damage: [1, 4, 8, 12] },
  { name: "Chakram", weight: "light", attr: "agi", types: ["slashing"], melee: null, range: 10, tags: ["seeking"], damage: [1, 4, 8, 12] },
  { name: "Whip", weight: "light", attr: "agi", types: ["slashing"], melee: 2, tags: ["reflexive"], damage: [1, 4, 8, 12] },
  { name: "Buckler", weight: "light", attr: "either", types: ["crushing"], melee: 1, tags: ["shield"], damage: [1, 3, 6, 9] },

  // Medium
  { name: "Longsword", weight: "medium", attr: "pow", types: ["slashing"], melee: 1, tags: ["deflect"], damage: [2, 6, 11, 17] },
  { name: "Mace", weight: "medium", attr: "pow", types: ["crushing"], melee: 1, damage: [2, 7, 13, 20] },
  { name: "Warpick", weight: "medium", attr: "pow", types: ["piercing"], melee: 1, tags: ["penetrating"], damage: [2, 6, 10, 15] },
  { name: "Spear", weight: "medium", attr: "pow", types: ["piercing"], melee: 2, tags: ["reflexive"], damage: [2, 6, 11, 17] },
  { name: "Shortbow", weight: "medium", attr: "agi", types: ["piercing"], melee: null, range: 20, damage: [2, 6, 11, 17] },
  { name: "Light Crossbow", weight: "medium", attr: "agi", types: ["piercing"], melee: null, range: 30, tags: ["cumbersome"], damage: [2, 7, 13, 20] },
  { name: "Heater Shield", weight: "medium", attr: "pow", types: ["crushing"], melee: 1, tags: ["shield"], damage: [2, 4, 7, 11] },

  // Heavy
  { name: "Greataxe", weight: "heavy", attr: "pow", types: ["slashing"], melee: 1, damage: [3, 9, 17, 25] },
  { name: "Warhammer", weight: "heavy", attr: "pow", types: ["crushing"], melee: 1, damage: [3, 9, 17, 25] },
  { name: "Greatsword", weight: "heavy", attr: "pow", types: ["slashing"], melee: 1, tags: ["deflect"], damage: [3, 8, 15, 22] },
  { name: "Halberd", weight: "heavy", attr: "pow", types: ["slashing", "piercing"], melee: 2, damage: [3, 8, 15, 22] },
  {
    name: "Longbow",
    weight: "heavy",
    attr: "either",
    types: ["piercing"],
    melee: null,
    range: 40,
    damage: [3, 8, 15, 22],
    special: "If using POW as the attribute, the weapon gains the Imprecise tag."
  },
  { name: "Heavy Crossbow", weight: "heavy", attr: "agi", types: ["piercing"], melee: null, range: 60, tags: ["cumbersome"], damage: [3, 9, 17, 25] },
  {
    name: "Tower Shield",
    weight: "heavy",
    attr: "pow",
    types: ["crushing"],
    melee: 1,
    tags: ["shield"],
    damage: [3, 5, 9, 13],
    special:
      "While this shield is equipped, you have cover as long as you have not attacked since the start of your most recent turn. The moment you make an attack, the cover is lost."
  },

  // Superheavy — two gear slots each.
  { name: "Great Maul", weight: "superheavy", attr: "pow", types: ["crushing"], melee: 1, tags: ["cumbersome", "imprecise"], damage: [6, 16, 28, 40] },
  { name: "Zambato", weight: "superheavy", attr: "pow", types: ["slashing"], melee: 2, tags: ["cumbersome"], damage: [6, 14, 24, 34] },
  { name: "War Scythe", weight: "superheavy", attr: "pow", types: ["slashing"], melee: 1, tags: ["imprecise"], damage: [6, 10, 19, 28] },
  { name: "Greatlance", weight: "superheavy", attr: "pow", types: ["piercing"], melee: 2, tags: ["cumbersome"], damage: [6, 14, 24, 34] },

  // Combination weapon: equipped together for one fewer slot than the sum.
  {
    name: "Gunsword Blade",
    weight: "medium",
    attr: "pow",
    types: ["slashing"],
    melee: 1,
    tags: ["deflect", "combo"],
    damage: [2, 6, 11, 17],
    special: "Combination weapon with Gunsword Barrel."
  },
  {
    name: "Gunsword Barrel",
    weight: "medium",
    attr: "agi",
    types: ["piercing"],
    melee: null,
    range: 20,
    tags: ["combo"],
    damage: [2, 6, 11, 17],
    special: "Combination weapon with Gunsword Blade."
  }
];

const ARMOR = [
  { name: "Leather Armor", cls: "standard", guard: 1, penalty: 0, applies: "" },
  { name: "Armored Cloak", cls: "standard", guard: 2, penalty: -1, applies: "on all AGI action rolls" },
  { name: "Chain Shirt", cls: "martial", guard: 2, penalty: 0, applies: "" },
  { name: "Plate Armor", cls: "martial", guard: 3, penalty: -1, applies: "on all AGI action rolls" },
  { name: "Great Plate", cls: "martial", guard: 4, penalty: -2, applies: "on all AGI action rolls" }
];

const FOCI = [
  { name: "Basic Spell Focus", exotic: false, effect: "", description: "Enables casting at full effectiveness." },
  { name: "Ignis Crown", exotic: true, effect: "+1d to all spellcasting rolls using the Ignis Resonance.", description: "A circlet of bronze-laid garnet, warm to the touch. Worn by the last fire-priests of the Sundered Order." },
  { name: "Whispering Locket", exotic: true, effect: "+2d to all spellcasting rolls using the Mens Resonance. -1d to all other spellcasting rolls using any other Resonance.", description: "A small silver locket that hums faintly when worn near sleeping minds." },
  { name: "Mender's Sigil", exotic: true, effect: "+1d to all spellcasting rolls casting the Mend Art.", description: "A worn brass seal pressed with the image of a closed eye." },
  { name: "Reliquary of the Dawn", exotic: true, effect: "For Lux Resonance spells you cast, reduce the Vigor cost for spell-shaping by 1 (minimum total spell-shaping cost 1).", description: "A sliver of gilded bone in a sunburst case. It grows warm at dawn, wherever it is kept." },
  { name: "Deadman's Choker", exotic: true, effect: "+3d to all spellcasting rolls. While this spell focus is equipped, you have the Cursed condition. The Cursed condition ends when you unequip the spell focus.", description: "A band of blackened silver, cold as a grave." }
];

const WONDROUS = [
  { name: "Pathfinder's Compass", effect: "+1d to action rolls that can apply the character's trained Navigation skill.", description: "A brass compass whose needle points not north, but home." },
  { name: "Spider-Grip Gloves", effect: "When climbing in combat, the wearer is considered as trained in the Climbing skill. In addition, while climbing, every square is not treated as difficult terrain, but as normal terrain instead.", description: "Supple leather gloves stitched with a faint, tacky resin." },
  { name: "Pendant of the Ox", effect: "The character is considered trained in the Lifting and Endurance skills. If already trained, they get an additional +1d when applying those skills.", description: "A soapstone ox on a leather cord, worn smooth by generations of labourers' thumbs." }
];

const CONSUMABLES = [
  { name: "Restoration Balm", category: "common", target: "Self, Adjacent Ally", effect: "The target spends 1 Resolve and restores Vitality equal to half their maximum Vitality." },
  { name: "Energy Drink", category: "common", target: "Self, Adjacent Ally", effect: "Restore the target's Vigor by 3." },
  {
    name: "Alchemist's Fire",
    category: "common",
    target: "",
    effect: "",
    attack: { attr: "agi", types: ["fire"], range: 5, tags: ["seeking", "imprecise"], damage: ["1 damage", "4 damage", "8 damage, target gains Wracked 1 (Fire)", "12 damage, target gains Wracked 1 (Fire)"] }
  },
  { name: "Smoke Bomb", category: "exotic", target: "Self", effect: "Target becomes Obscured from all enemies until the start of their next turn." },
  {
    name: "Lightning in a Bottle",
    category: "exotic",
    target: "",
    effect: "",
    attack: { attr: "agi", types: ["shock"], range: 5, tags: ["seeking", "imprecise"], damage: ["1 damage", "4 damage, target gains Wracked 1 (Shock)", "8 damage, target gains Wracked 2 (Shock)", "12 damage, target gains Wracked 3 (Shock)"] }
  }
];

/** @returns {import("./_build.mjs").PackDocument[]} */
export function build() {
  const documents = [];

  for (const w of WEAPONS) {
    documents.push(
      item({
        pack: PACK,
        name: w.name,
        type: "weapon",
        img: "icons/svg/sword.svg",
        system: {
          description: "",
          source: "Equipment Catalog",
          equipped: Boolean(w.intrinsic),
          intrinsic: Boolean(w.intrinsic),
          weightClass: w.weight,
          attribute: w.attr,
          damageTypes: w.types,
          tags: w.tags ?? [],
          melee: w.melee === undefined ? 1 : w.melee,
          range: w.range ?? null,
          damage: ladder(w.damage),
          special: w.special ?? ""
        }
      })
    );
  }

  for (const a of ARMOR) {
    documents.push(
      item({
        pack: PACK,
        name: a.name,
        type: "armor",
        img: "icons/svg/shield.svg",
        system: {
          description: "",
          source: "Equipment Catalog",
          equipped: false,
          armorClass: a.cls,
          guard: a.guard,
          penalty: a.penalty,
          penaltyApplies: a.applies
        }
      })
    );
  }

  for (const f of FOCI) {
    documents.push(
      item({
        pack: PACK,
        name: f.name,
        type: "focus",
        img: "icons/svg/daze.svg",
        system: { description: f.description, source: "Equipment Catalog", equipped: false, exotic: f.exotic, effect: f.effect }
      })
    );
  }

  for (const w of WONDROUS) {
    documents.push(
      item({
        pack: PACK,
        name: w.name,
        type: "wondrous",
        img: "icons/svg/aura.svg",
        system: { description: w.description, source: "Equipment Catalog", equipped: false, effect: w.effect }
      })
    );
  }

  for (const c of CONSUMABLES) {
    const attack = c.attack;
    documents.push(
      item({
        pack: PACK,
        name: c.name,
        type: "consumable",
        img: "icons/svg/chest.svg",
        system: {
          description: "",
          source: "Equipment Catalog",
          category: c.category,
          target: c.target,
          effect: c.effect,
          isAttack: Boolean(attack),
          attribute: attack?.attr ?? "agi",
          damageTypes: attack?.types ?? [],
          tags: attack?.tags ?? [],
          range: attack?.range ?? null,
          damage: attack ? ladder(attack.damage) : ladder(["", "", "", ""])
        }
      })
    );
  }

  return documents;
}
