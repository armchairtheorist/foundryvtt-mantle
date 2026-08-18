/**
 * The Masteries Catalog as compendium content.
 *
 * Rows are [name, type, slots, effect, extras] mirroring the catalog tables.
 * `sets` lists every mastery set a mastery belongs to — several belong to more
 * than one, which is why it is a list rather than a single name.
 */

import { item } from "./_build.mjs";

const PACK = "masteries";

/** Mastery sets, from the catalog's set table. Named here so members can cite them. */
export const SETS = {
  overflowingFortune: "Overflowing Fortune",
  benkei: "Benkei",
  shukuchi: "Shukuchi",
  peakHuman: "Peak Human Condition",
  humanExcellence: "Human Excellence",
  enlightenment: "Enlightenment",
  bloodbath: "Bloodbath"
};

const S = SETS;

/**
 * @typedef {{prereq?: string, sets?: string[]}} MasteryExtras
 * @type {Record<string, Array<[string, "body"|"mind"|"soul", number, string, MasteryExtras?]>>}
 */
const MASTERIES = {
  general: [
    ["Abundance", "body", 1, "+1 Wondrous Item slot.", { sets: [S.benkei] }],
    ["Alacrity", "body", 1, "+1 SPD.", { sets: [S.shukuchi] }],
    ["Cauterize", "soul", 1, "Gain the Cauterize maneuver (Vigor 2): Remove one Wound from yourself by spending Resolve equal to the Wound's severity. You gain Wracked 3 (Fire)."],
    ["Composure", "mind", 1, "+2 Resolve."],
    ["Cosmopolitan", "soul", 1, "You learn 2 additional languages. Social action rolls involving any humanoid culture gain +1d."],
    ["Fireman", "body", 1, "Gain Resistance (Fire)."],
    ["Fleeting Spirit", "soul", 1, "If you are the first combatant to act in a round (before any allies or enemies), you gain +2d to the first attack you make on your turn.", { sets: [S.shukuchi] }],
    ["Fortune's Blessing", "soul", 2, "At the start of each Downtime, gain blessings equal to your LUCK score (unspent blessings are lost and replaced). When you receive an undesirable luck roll result, spend a blessing to reroll. You must use the new result.", { prereq: "LUCK 1", sets: [S.overflowingFortune] }],
    ["Fortune's Escape", "soul", 1, "You can spend a blessing to negate one consequence of a failure the GM agrees is plausibly luck-related. Cannot undo a Wound, a Burden, or the Defeated or Lost condition.", { prereq: "Fortune's Blessing", sets: [S.overflowingFortune] }],
    ["Improviser", "soul", 1, "When the GM rules that a task requires training in a skill you lack, you may attempt it anyway (with no training bonus). The GM may still rule certain attempts implausible by fiction."],
    ["Ironman", "body", 1, "+1 Wound slot."],
    ["Lightning Reflexes", "body", 1, "When you Dodge, gain +1d on the opposing AGI roll.", { sets: [S.shukuchi] }],
    ["Lone Wolf", "soul", 1, "If no allies are within SEN squares of you at the moment you roll, you gain +1d on that roll. Distance is checked at the moment the roll is made."],
    ["Potpourri", "body", 1, "+2 consumable points."],
    ["Quick Mind", "mind", 2, "When an ally finishes their turn, you may declare to take your own turn immediately after. This counts as one of your turns for the round, and is an exception to the usual alternating turn order. Your Vigor refresh at the start of this turn is capped at 1.", { sets: [S.shukuchi] }],
    ["Shared Fortune", "soul", 1, "Spend a blessing on an ally's behalf to grant them a luck roll reroll. They must use the new result.", { prereq: "Fortune's Blessing", sets: [S.overflowingFortune] }],
    ["Vigorous", "body", 1, "+1 Vigor refresh."],
    ["Willpower", "mind", 1, "+1d when opposing rolls with INS."]
  ],

  martial: [
    ["Bloodlust", "body", 1, "Your Slashing or Piercing melee weapon attacks gain the Bloodlust (Triple) pattern: Target gains Wracked 1 (Bleeding).", { sets: [S.bloodbath] }],
    ["Combat Reflexes", "body", 1, "All equipped melee weapons gain the Reflexive tag."],
    ["One Shot One Kill", "mind", 2, "If you defeat an enemy with an attack, you immediately regain 2 Vigor."],
    ["Pulverize", "body", 1, "Your melee weapon attacks with a Crushing damage type gain the Pulverize (Triple) pattern: Target gains Hindered 1."],
    ["Quartermaster", "body", 1, "+1 gear slot.", { sets: [S.benkei] }]
  ],

  warrior: [
    ["Battle Cry", "soul", 1, "Gain the Battle Cry maneuver (Vigor 2): All allies (including yourself) within 5 squares who have the Frightened condition immediately clear it. You cannot use Battle Cry while you are Frightened."],
    ["Missile Parry", "body", 2, "You may Deflect ranged attacks, in addition to melee attacks. The weight class rule still applies; Shield-tagged weapons remain exempt from it."],
    ["Overwatch", "mind", 1, "Gain the Overwatch maneuver (Vigor 1): Declare a Cone 5 area originating from your square as your Overwatch zone, persisting until the start of your next turn. When an enemy moves into the zone from outside it, you may make a ranged Basic Attack against them as a reaction (2 Vigor per reactive attack; ranged weapon required). Each enemy can be attacked this way at most once before the start of your next turn. While in Overwatch you cannot Move or Shift."],
    ["Shield Master", "body", 1, "+1 gear slot. When you Deflect with a Shield-tagged weapon and your Deflect roll scores 1+ successes and the attacker is within reach of your Shield, the attacker takes 2 damage.", { sets: [S.benkei] }],
    ["Spirit of the Warrior", "soul", 1, "+1d when opposing rolls with REA, INS, or PRE."],
    ["Steady Stance", "body", 1, "If you have not used the Move maneuver this turn, gain +1 Guard. This can result in Over-Guard."],
    ["Tactical Coordination", "mind", 1, "When you hit an enemy with a melee attack, the next ally to make an attack against that enemy before the start of your next turn gains +1d on that attack."],
    ["Visualization", "mind", 1, "After rolling an attack, you may take 2 Strain to re-roll. You must keep the re-roll. All modifiers that applied to the original roll apply equally to the re-roll."],
    ["Weapon Specialization", "mind", 1, "Pick one equipped weapon as your specialized weapon: attacks with that weapon gain +1d; attacks with any other weapon take -1d. You may change your specialized weapon during an Interlude.", { sets: [S.benkei] }]
  ],

  barbarian: [
    ["Battle Trance", "soul", 1, "While Frenzied, when you would take a Wound, you may take a Burden instead. Severity of the Burden is determined normally."],
    ["Berserk", "soul", 1, "Your maximum Frenzy stacks increase to 3 (from the default 1)."],
    ["Blood Scent", "soul", 1, "Creatures with 1+ stacks of Wracked (Bleeding) within SEN squares of you cannot be Hidden from you — treat them as Obscured at maximum, regardless of lighting, cover, or stealth.", { sets: [S.bloodbath] }],
    ["Bloodfeast", "body", 1, "When you defeat a creature with a melee attack while Frenzied, regain 1 Vigor (up to your cap) and gain +5 Guard. This can result in Over-Guard.", { sets: [S.bloodbath] }],
    ["Bloody Armor", "soul", 1, "While you have 1+ stacks of Wracked (Bleeding) on yourself, gain +1 Guard. This can result in Over-Guard.", { sets: [S.bloodbath] }],
    ["Charging Frenzy", "body", 1, "When the Enter Frenzy maneuver takes you from 0 to 1 Frenzy stack, you may immediately take the Move maneuver at no Vigor cost. This is in addition to the free Move maneuver you get every turn."],
    ["Taunt", "soul", 1, "Gain the Taunt maneuver (Vigor 2): Target one creature within 10 squares that you can reasonably communicate with. Creatures with the Mindless tag cannot be taunted. Make a PRE action roll opposed by the target's INS. On 1+ net successes, the target gains the Provoked condition with you as its source."],
    ["Terrifying Presence", "soul", 1, "When you use the Enter Frenzy maneuver, make a PRE action roll opposed by the target's INS for each enemy within 5 squares. Each enemy you beat with 1+ net successes gains the Frightened condition, with you as the source."],
    ["Wild Swing", "body", 1, "Gain the Wild Swing maneuver (Vigor 4): Make a melee attack against every creature within your melee weapon's range — enemy and ally alike. Each attack uses the same weapon and rolls its own pool at -1d. Allies may use reactive defenses against these attacks as normal."]
  ],

  magic: [
    ["Rend Art", "mind", 1, "Gain access to the Rend Art for spellcasting."],
    ["Afflict Art", "mind", 1, "Gain access to the Afflict Art for spellcasting."],
    ["Bolster Art", "mind", 1, "Gain access to the Bolster Art for spellcasting."],
    ["Mend Art", "mind", 1, "Gain access to the Mend Art for spellcasting."],
    ["Ignis Resonance", "mind", 1, "Gain access to the Ignis Resonance for spellcasting."],
    ["Mens Resonance", "mind", 1, "Gain access to the Mens Resonance for spellcasting."],
    ["Terra Resonance", "mind", 1, "Gain access to the Terra Resonance for spellcasting."],
    ["Lux Resonance", "mind", 2, "Gain access to the Lux Resonance for spellcasting."],
    ["Tempus Resonance", "mind", 2, "Gain access to the Tempus Resonance for spellcasting."],
    ["Cone Shaping", "mind", 1, "You may use the Cone N special area shape when shaping your spells."],
    ["Line Shaping", "mind", 1, "You may use the Line special area shape when shaping your spells."],
    ["Wall Shaping", "mind", 1, "You may use the Wall N special area shape when shaping your spells."],
    ["Salvo Shaping", "mind", 1, "You may use the Salvo N special area shape when shaping your spells."],
    ["Reflexive Casting", "mind", 1, "Spells you cast with the Melee 1 tag gain the Reflexive tag: you may cast such a spell as a Forestall reaction when a creature within your melee range attempts to move, paying the spell's full Vigor cost in place of Forestall's usual cost."],
    ["Sustained Casting", "mind", 1, "Gain the Sustained Casting maneuver (Vigor 1): Extend one of your active spells' durations by 1 round, paid separately for each spell you sustain."]
  ],

  scholar: [
    ["Analyze", "mind", 1, "Gain the Analyze maneuver (Vigor 2): Target a creature in line of sight and make a REA action roll. 0-1s: Learn the target's Max Vitality + Wound slots, OR its Max Strain + Burden slots (your choice). 2s: Learn both. 3+: Both, plus one notable feature. You may re-Analyze to attempt a higher band; pay the Vigor cost each attempt."],
    ["Arcane Shield", "mind", 1, "Gain the Arcane Shield reaction (Vigor 1). Trigger: another creature targets you with an attack (declared before the attacker rolls). Effect: gain resistance to the triggering attack. You take 2 Strain."]
  ],

  channeler: [
    ["Beseech", "soul", 1, "During Interlude, you may beseech your patron to restore 1 spent Resolve. This can only be done once per Interlude."],
    ["Patron's Mark", "mind", 1, "When you cast a spell on a creature, it gains your Patron's Mark (only one creature carries the Mark at a time). When you cast a spell on the Marked creature the spellcasting roll gains +1d. The Mark is then consumed."],
    ["Mending Spirit", "mind", 1, "When you cast Mend, both you and the target gain +5 Guard, regardless of the band rolled or which effect ladder the Mend uses. This can result in Over-Guard."],
    ["Smite of the Patron", "soul", 1, "Once per Interlude, when a Rend you cast lands 1+ successes, you may spend 1 Resolve to add +8 damage (Vitality-ladder Rend) or +4 Strain (Strain-ladder Rend) to the result. The bonus carries the Rend's own tags."]
  ],

  human: [
    ["Aggression", "soul", 1, "Gain +1 BODY mastery slot.", { sets: [S.peakHuman, S.humanExcellence] }],
    ["Brazenface", "body", 1, "Gain +1 MIND mastery slot.", { sets: [S.humanExcellence, S.enlightenment] }],
    ["Iron Will", "soul", 1, "+2 Max Strain. Gain the Iron Will reaction (Vigor 1). Trigger: another creature targets you with a Strain attack. Effect: halve the Strain damage (minimum 0)."],
    ["Mind Over Matter", "mind", 1, "Gain +1 BODY mastery slot.", { sets: [S.peakHuman, S.humanExcellence] }],
    ["Open Mind", "mind", 1, "Gain +1 SOUL mastery slot.", { sets: [S.peakHuman, S.enlightenment] }],
    ["Self-Examination", "body", 1, "Gain +1 SOUL mastery slot.", { sets: [S.peakHuman, S.enlightenment] }],
    ["Sophistry", "soul", 1, "Gain +1 MIND mastery slot.", { sets: [S.humanExcellence, S.enlightenment] }],
    ["Well-Rounded", "mind", 1, "+2 narrative skills from any group. These two skills may be swapped for any other skills during Downtime."]
  ],

  elf: [
    ["Blade Dancer", "body", 1, "When a melee attack hits you (at any band, including a graze), you may immediately move 1 square in any direction at no Vigor cost. This movement resolves after the attack's damage but before any other post-attack effects, and does not trigger Intercept or Forestall attacks."],
    ["Eldritch Sense", "mind", 1, "Gain the Detect Magic maneuver (see the Scholar archetype's Rank 2 entry)."],
    ["Elven Accuracy", "mind", 2, "+1d on ranged attacks that are not Indefensible, Imprecise, or Seeking — including spell attacks that qualify. Does not apply to melee attacks."],
    ["Elven Hivemind", "mind", 1, "During Downtime, invoke the hivemind with a luck roll. Bank a bonus of +Xd equal to the successes rolled, usable on one action roll of your choice before your next invocation. You may hold only one banked bonus at a time."],
    ["Inner Focus", "soul", 1, "Your own soul serves as a spellcasting focus: you never take the -1d no-focus penalty for casting without a spell focus equipped. This functions as a basic focus only."],
    ["Old Sight", "soul", 1, "You sense magic, Fey, and undead within 5 squares of you. No roll required. For creatures of these types in range: Hidden becomes Obscured; Obscured becomes Visible; Visible is unchanged."],
    ["Sylvan Step", "body", 1, "You ignore difficult terrain from natural sources. +1d on Stealth action rolls in natural environments."],
    ["Umbral Sight", "body", 1, "Gain Darkvision. Supersedes Low-Light Vision."]
  ],

  dwarf: [
    ["Ancestral Encouragement", "soul", 1, "While you have the Faltering condition, gain +1d bonus on all attacks and reactive defenses."],
    ["Dwarven Doughtiness", "soul", 1, "At the end of your turn, automatically clear the Frightened condition if you have it."],
    ["Dwarven Hoard", "body", 1, "+1 gear slot."],
    ["Grudge-Keeper", "mind", 1, "When a creature damages you, you may declare it your Grudge: gain +1d on attacks and opposing rolls against that creature for the rest of the encounter. Only one Grudge at a time; declaring a new one ends the previous."],
    ["Stoneskin", "body", 1, "Gain Resistance (Crushing)."]
  ]
};

/** @returns {import("./_build.mjs").PackDocument[]} */
export function build() {
  const documents = [];

  for (const [domain, rows] of Object.entries(MASTERIES)) {
    for (const [name, masteryType, slotCost, effect, extras = {}] of rows) {
      documents.push(
        item({
          pack: PACK,
          name,
          type: "mastery",
          img: "icons/svg/upgrade.svg",
          system: {
            description: `<p>${effect}</p>`,
            source: "Masteries Catalog",
            equipped: false,
            domain,
            masteryType,
            slotCost,
            slotBoard: "",
            prerequisite: extras.prereq ?? "",
            sets: extras.sets ?? []
          }
        })
      );
    }
  }

  return documents;
}
