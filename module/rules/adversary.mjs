/**
 * Adversary scaling: challenge class templates and tiers of play.
 *
 * A Mantle stat block is authored once and then scaled along two independent
 * axes. The **challenge class template** turns a Regular into a Grunt or a
 * Nemesis; the **tier of play** carries the same creature from a Novice party
 * to a Paragon one. Neither rewrites the stat block — both are overlays, which
 * is why they live here as pure functions over authored numbers rather than as
 * edits to stored data.
 *
 * Pure logic — no Foundry dependency, so it is unit-tested directly.
 */

/**
 * What each challenge class template does to a Regular baseline.
 *
 * `vitalityCap` and `strainCap` are ceilings rather than replacements: a Grunt
 * is a stat block trimmed down to 10 Vitality, not one handed exactly 10.
 *
 * @type {Record<string, {turns: number, vitalityCap?: number, strainCap?: number,
 *   vitalityBonus?: number, strainBonus?: number, woundSlots: number,
 *   burdenSlots: number, rollsDice: boolean, readsPatterns: boolean,
 *   classAbilities: number}>}
 */
export const CHALLENGE_TEMPLATES = {
  grunt: {
    turns: 1,
    vitalityCap: 10,
    strainCap: 4,
    woundSlots: 0,
    burdenSlots: 0,
    // A Grunt never rolls: every action roll it makes is exactly one success.
    // That single rule is what makes a squad of four playable at speed.
    rollsDice: false,
    readsPatterns: false,
    classAbilities: 0
  },
  regular: {
    turns: 1,
    woundSlots: 0,
    burdenSlots: 0,
    rollsDice: true,
    readsPatterns: false,
    classAbilities: 0
  },
  elite: {
    turns: 1,
    woundSlots: 1,
    burdenSlots: 1,
    rollsDice: true,
    readsPatterns: false,
    classAbilities: 1
  },
  champion: {
    turns: 2,
    woundSlots: 2,
    burdenSlots: 2,
    rollsDice: true,
    readsPatterns: true,
    classAbilities: 2
  },
  nemesis: {
    turns: 3,
    vitalityBonus: 5,
    strainBonus: 5,
    woundSlots: 3,
    burdenSlots: 3,
    rollsDice: true,
    readsPatterns: true,
    classAbilities: 4
  }
};

/**
 * What each tier of play adds, applied on top of the challenge class.
 *
 * @type {Record<string, {dice: number, vitality: number, strain: number, maneuvers: number}>}
 */
export const TIER_ADJUSTMENTS = {
  novice: { dice: 0, vitality: 0, strain: 0, maneuvers: 0 },
  seasoned: { dice: 1, vitality: 5, strain: 2, maneuvers: 0 },
  veteran: { dice: 2, vitality: 10, strain: 4, maneuvers: 1 },
  paragon: { dice: 3, vitality: 15, strain: 6, maneuvers: 2 }
};

/**
 * Scale an authored stat block to a challenge class and a tier of play.
 *
 * The template is only ever applied on top of a Regular baseline — the catalog
 * is explicit that a stat block authored at Elite or above already carries its
 * class, and layering a second template on it would double-count. A template
 * asked for on a non-Regular baseline is reported rather than silently applied,
 * so the sheet can say why nothing happened.
 *
 * Caps are applied before tier adjustments. A Seasoned Grunt is a Grunt that
 * has been dragged up to a Seasoned fight — 10 capped, then +5 — rather than
 * one pinned at 10 forever, which would make it a strictly worse Grunt than
 * its Novice cousin at the same table.
 *
 * @param {object} block
 * @param {string} block.challengeClass - What the stat block was authored at
 * @param {string} [block.template] - Class template the GM wants applied
 * @param {string} [block.tier]
 * @param {number} block.vitality - Authored Max Vitality
 * @param {number} block.strain - Authored Max Strain
 * @param {number} [block.extraManeuvers]
 * @returns {{effectiveClass: string, maxVitality: number, maxStrain: number,
 *   woundSlots: number, burdenSlots: number, turnsPerRound: number,
 *   extraManeuvers: number, diceBonus: number, rollsDice: boolean,
 *   readsPatterns: boolean, classAbilities: number, templateIgnored: boolean}}
 */
export function scaleAdversary({
  challengeClass,
  template = "",
  tier = "novice",
  vitality,
  strain,
  extraManeuvers = 1
}) {
  const templateIgnored = Boolean(template) && challengeClass !== "regular";
  const effectiveClass = templateIgnored || !template ? challengeClass : template;

  const cc = CHALLENGE_TEMPLATES[effectiveClass] ?? CHALLENGE_TEMPLATES.regular;
  const adjust = TIER_ADJUSTMENTS[tier] ?? TIER_ADJUSTMENTS.novice;

  let maxVitality = vitality;
  let maxStrain = strain;

  // The caps and bonuses belong to the *template*, not to the class. Sorrowmaw
  // is authored at Nemesis and its printed 30 Vitality already includes
  // everything Nemesis gives — applying the row's +5 again would hand it 35 for
  // free. Only a template layered onto a Regular baseline moves these numbers.
  const templated = Boolean(template) && !templateIgnored;
  if (templated) {
    if (cc.vitalityCap !== undefined) maxVitality = Math.min(maxVitality, cc.vitalityCap);
    if (cc.strainCap !== undefined) maxStrain = Math.min(maxStrain, cc.strainCap);
    maxVitality += cc.vitalityBonus ?? 0;
    maxStrain += cc.strainBonus ?? 0;
  }

  // The tier of play always applies: it scales the fight, not the creature.
  maxVitality += adjust.vitality;
  maxStrain += adjust.strain;

  return {
    effectiveClass,
    maxVitality,
    maxStrain,
    woundSlots: cc.woundSlots,
    burdenSlots: cc.burdenSlots,
    turnsPerRound: cc.turns,
    extraManeuvers: extraManeuvers + adjust.maneuvers,
    diceBonus: adjust.dice,
    rollsDice: cc.rollsDice,
    readsPatterns: cc.readsPatterns,
    classAbilities: cc.classAbilities,
    templateIgnored
  };
}

/**
 * How many Wound slots an *authored* stat block should have.
 *
 * The catalog prints these on the block, and they always agree with the class,
 * so the class is the single source of truth and the printed figure is a
 * cross-check rather than an input.
 *
 * @param {string} challengeClass
 * @returns {{wounds: number, burdens: number}}
 */
export function authoredHarmSlots(challengeClass) {
  const cc = CHALLENGE_TEMPLATES[challengeClass] ?? CHALLENGE_TEMPLATES.regular;
  return { wounds: cc.woundSlots, burdens: cc.burdenSlots };
}
