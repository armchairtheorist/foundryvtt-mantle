// @ts-nocheck — ChatMessage flag typing and Roll subclass generics need
// TypeScript-level annotations. The logic here is thin glue over the tested
// resolution modules.

/**
 * Roll chat cards.
 *
 * The card is the heart of the "assisted" automation model: it resolves the
 * roll, shows the ladder with the achieved band lit, and then lets a human
 * adjust the result rather than pretending the system knows better.
 *
 * Two controls do most of the work:
 *
 *  - The **net-success stepper** absorbs opposition rolls, Momentous Feats bought
 *    with Momentum, and plain GM adjudication in one place. Rather than
 *    orchestrating two players' rolls in code, the defender rolls their own and
 *    someone clicks minus twice.
 *  - The **allocation chips** let the player choose how their dice read, because
 *    two Doubles versus one Triple is a decision only they can make.
 *
 * Both re-render the card in place, so the state lives in message flags rather
 * than in the DOM.
 */

import MantleRoll from "../dice/roll.mjs";
import { MANTLE } from "../config.mjs";
import { maneuverEffectSize } from "../rules/maneuvers.mjs";
import { betterLuck, momentousFeatSuccesses, momentousFortune } from "../rules/momentum.mjs";

const TEMPLATE = "systems/mantle/templates/chat/roll-card.hbs";

/**
 * Post a roll to chat.
 *
 * @param {MantleRoll} roll - An evaluated roll
 * @param {object} context
 * @param {Actor} [context.actor]
 * @param {string} [context.title]
 * @param {string} [context.subtitle]
 * @returns {Promise<ChatMessage>}
 */
export async function postRollCard(roll, { actor, title = "", subtitle = "" } = {}) {
  // The actor is recorded on the card rather than read from the speaker: a
  // Momentous Feat needs the roller's party, and a speaker can be an alias.
  const state = { adjustment: 0, allocationIndex: 0, title, subtitle, actorId: actor?.id ?? null };
  const content = await renderCard(roll, state);

  return ChatMessage.create({
    content,
    rolls: [roll],
    speaker: ChatMessage.getSpeaker({ actor }),
    flags: { mantle: { card: state } }
  });
}

/* -------------------------------------------- */

/**
 * Render the card body for a roll in a given state.
 *
 * @param {MantleRoll} roll
 * @param {{adjustment: number, allocationIndex: number, title: string, subtitle: string}} state
 * @returns {Promise<string>}
 */
async function renderCard(roll, state) {
  const resolved = roll.resolve(state);
  const context = roll.mantle;

  return foundry.applications.handlebars.renderTemplate(TEMPLATE, {
    ...state,
    pool: context.pool,
    ladder: context.ladder,
    ladderKind: context.ladderKind ?? "vitality",
    damageTypes: context.damageTypes ?? [],
    penetrating: context.penetrating ?? false,
    maneuver: context.maneuver ?? null,
    maneuverEffect: context.maneuver
      ? maneuverLabel(context.maneuver, maneuverEffectSize(resolved.effective, context.maneuver.max))
      : "",
    dice: roll.diceResults,
    resolved,
    // Chips are only worth showing when the dice genuinely read more than one
    // way; a single reading is not a choice.
    showAllocations: resolved.allocations.length > 1,
    momentousFeat: momentousFeatOffer(roll, state),
    momentousFortune: momentousFortuneOffer(roll, state),
    config: CONFIG.MANTLE
  });
}

/* -------------------------------------------- */

/**
 * Re-render a card after its state changes.
 *
 * @param {ChatMessage} message
 * @param {Partial<{adjustment: number, allocationIndex: number}>} changes
 */
async function updateCard(message, changes) {
  const state = { ...message.getFlag("mantle", "card"), ...changes };
  const roll = message.rolls[0];
  if (!(roll instanceof MantleRoll)) return;

  const content = await renderCard(roll, state);
  await message.update({ content, "flags.mantle.card": state });
}

/* -------------------------------------------- */

/**
 * Whether this card can still buy successes with the party's Momentum.
 *
 * Momentous Feat is the one Momentum spend the rules explicitly allow *after* the
 * dice are read — "the character can decide to apply this after the roll is
 * made" — so it belongs on the card rather than in the roll dialog. Testing
 * your luck is the sole exclusion, and luck rolls carry no attribute pool at
 * all, which is how they are recognised here.
 *
 * @param {MantleRoll} roll
 * @param {object} state
 * @returns {{momentum: number, spent: number, max: number}|null}
 */
function momentousFeatOffer(roll, state) {
  if (roll.mantle.attribute === "luck") return null;

  const party = partyFor(state.actorId);
  if (!party) return null;

  const spent = state.momentousFeat ?? 0;
  const available = momentousFeatSuccesses(party.system.momentum.value, MANTLE.momentousFeatMaxSuccesses - spent);

  // Nothing left to buy, and nothing already bought worth reporting.
  if (available <= 0 && spent <= 0) return null;

  return { momentum: party.system.momentum.value, spent, max: available };
}

/**
 * Whether this card can still buy a luck reroll with the party's Momentum.
 *
 * The mirror image of the Feat offer, and deliberately so: a Momentous Feat
 * may never touch a luck roll, and Momentous Fortune may never touch anything
 * else. Between them they cover every roll exactly once.
 *
 * @param {MantleRoll} roll
 * @param {object} state
 * @returns {{momentum: number, cost: number, spent: boolean}|null}
 */
function momentousFortuneOffer(roll, state) {
  if (roll.mantle.attribute !== "luck") return null;

  const party = partyFor(state.actorId);
  if (!party) return null;

  const spent = Boolean(state.momentousFortune);
  const offer = momentousFortune({
    momentum: party.system.momentum.value,
    alreadyRerolled: spent
  });

  // Nothing left to buy and nothing already bought worth reporting.
  if (!offer.available && !spent) return null;

  return { momentum: party.system.momentum.value, cost: offer.cost, spent };
}

/**
 * Reroll a luck test with Momentous Fortune, keeping the better result.
 *
 * The reroll cannot make things worse — "the character can choose the better
 * result between the old and the new roll" — so the card keeps whichever
 * scored more and records that the spend is used up.
 *
 * @param {ChatMessage} message
 */
async function spendMomentousFortune(message) {
  const roll = message.rolls[0];
  const state = message.getFlag("mantle", "card") ?? {};
  const party = partyFor(state.actorId);
  if (!party || !(roll instanceof MantleRoll)) return;

  const offer = momentousFortune({
    momentum: party.system.momentum.value,
    alreadyRerolled: Boolean(state.momentousFortune)
  });

  if (!offer.available) {
    ui.notifications.warn(game.i18n.localize("MANTLE.Momentum.noMomentousFortune"));
    return;
  }

  const before = roll.resolve(state).successes;
  const reroll = await new Roll(roll.formula).evaluate();
  const after = reroll.dice.flatMap((die) => die.results).filter((r) => r.result >= 5).length;
  const kept = betterLuck(before, after);

  await party.update({ "system.momentum.value": party.system.momentum.value - offer.cost });

  // The stepper already adjusts successes, so the reroll is recorded as an
  // adjustment rather than by rewriting the dice — which keeps the original
  // roll visible on the card, as a table would keep both sets on the felt.
  await updateCard(message, {
    adjustment: (state.adjustment ?? 0) + (kept - before),
    momentousFortune: true
  });

  await ChatMessage.create({
    content: `<div class="mantle mantle-harm-card">
        <p><strong>${party.name}</strong> — ${game.i18n.format("MANTLE.Momentum.momentousFortuneSpent", {
          cost: offer.cost,
          before,
          after,
          kept
        })}</p>
      </div>`,
    speaker: ChatMessage.getSpeaker({ actor: party })
  });
}

/**
 * The Party actor whose pool a given character draws on.
 *
 * @param {string} [actorId]
 * @returns {Actor|null}
 */
function partyFor(actorId) {
  const actor = actorId ? game.actors.get(actorId) : null;
  return actor?.party ?? null;
}

/**
 * Buy successes on this roll with the party's Momentum.
 *
 * One Momentum per success, at most three on any single roll — counted across
 * repeated presses, so three separate +1s cost three Momentum and exhaust the
 * allowance exactly as one +3 would.
 *
 * @param {ChatMessage} message
 */
async function spendMomentousFeat(message) {
  const state = message.getFlag("mantle", "card") ?? {};
  const party = partyFor(state.actorId);
  if (!party) return;

  const spent = state.momentousFeat ?? 0;
  const buying = momentousFeatSuccesses(
    party.system.momentum.value,
    MANTLE.momentousFeatMaxSuccesses - spent
  );

  if (buying <= 0) {
    ui.notifications.warn(game.i18n.localize("MANTLE.Momentum.noMomentousFeat"));
    return;
  }

  const wanted = await promptMomentousFeat(buying, party.system.momentum.value);
  if (!wanted) return;

  const cost = wanted * MANTLE.momentumCosts.momentousFeatPerSuccess;
  await party.update({ "system.momentum.value": party.system.momentum.value - cost });

  await updateCard(message, {
    adjustment: (state.adjustment ?? 0) + wanted,
    momentousFeat: spent + wanted
  });

  await ChatMessage.create({
    content: `<div class="mantle mantle-harm-card">
        <p><strong>${party.name}</strong> — ${game.i18n.format("MANTLE.Momentum.momentousFeatSpent", {
          successes: wanted,
          cost
        })}</p>
      </div>`,
    speaker: ChatMessage.getSpeaker({ actor: party })
  });
}

/**
 * Ask how many successes to buy.
 *
 * @param {number} max - The most this pool can afford right now
 * @param {number} momentum - Momentum remaining, for the prompt
 * @returns {Promise<number>}
 */
async function promptMomentousFeat(max, momentum) {
  const options = Array.from({ length: max }, (_, index) => index + 1)
    .map(
      (n) =>
        `<option value="${n}">${game.i18n.format("MANTLE.Momentum.momentousFeatOption", {
          successes: n,
          cost: n * MANTLE.momentumCosts.momentousFeatPerSuccess
        })}</option>`
    )
    .join("");

  const chosen = await foundry.applications.api.DialogV2.prompt({
    window: { title: game.i18n.localize("MANTLE.Momentum.momentousFeat") },
    classes: ["mantle"],
    content: `<form>
        <p class="hint">${game.i18n.format("MANTLE.Momentum.poolRemaining", { momentum })}</p>
        <label class="row"><select name="successes">${options}</select></label>
      </form>`,
    ok: {
      label: game.i18n.localize("MANTLE.Momentum.spend"),
      callback: (_event, button) => new FormData(button.form).get("successes")
    },
    rejectClose: false
  });

  return Number(chosen) || 0;
}

/* -------------------------------------------- */

/**
 * Wire up the card's controls. Registered once, for every message rendered.
 *
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
export function activateCardListeners(message, html) {
  // Harm cards are posted separately from roll cards and carry only the
  // Wound/Burden button, so they are bound first and independently.
  for (const button of html.querySelectorAll(".mantle-harm-card [data-harm]")) {
    button.addEventListener("click", () => takeHarm(button));
  }

  const card = html.querySelector(".mantle-roll-card");
  if (!card) return;

  // Only someone who can edit the message may change its result — otherwise a
  // player could quietly walk an opponent's attack down to a graze.
  if (!message.isOwner && !game.user.isGM) {
    card.classList.add("locked");
    return;
  }

  for (const button of card.querySelectorAll("[data-adjust]")) {
    button.addEventListener("click", async () => {
      const delta = Number(button.dataset.adjust);
      const current = message.getFlag("mantle", "card")?.adjustment ?? 0;
      await updateCard(message, { adjustment: current + delta });
    });
  }

  for (const chip of card.querySelectorAll("[data-allocation]")) {
    chip.addEventListener("click", async () => {
      await updateCard(message, { allocationIndex: Number(chip.dataset.allocation) });
    });
  }

  const feat = card.querySelector("[data-momentous-feat]");
  if (feat) feat.addEventListener("click", () => spendMomentousFeat(message));

  const fortune = card.querySelector("[data-momentous-fortune]");
  if (fortune) fortune.addEventListener("click", () => spendMomentousFortune(message));

  const apply = card.querySelector("[data-apply]");
  if (apply) apply.addEventListener("click", () => applyToTargets(message));
}

/* -------------------------------------------- */

/**
 * Apply this card's result to whatever the user currently has targeted.
 *
 * Targets rather than selection: you target what you are shooting at, and
 * select what you control. Applying to selection would routinely damage the
 * attacker.
 *
 * @param {ChatMessage} message
 */
async function applyToTargets(message) {
  const roll = message.rolls[0];
  if (!(roll instanceof MantleRoll)) return;

  const state = message.getFlag("mantle", "card") ?? {};
  const resolved = roll.resolve(state);

  // Shove, Grab, and Feint deal no damage: what they land is scaled to net
  // successes, which is exactly the number the card's stepper has been
  // adjusting. Applying from here rather than at roll time is what lets the
  // defender's Dodge reduce it — including all the way to nothing.
  if (roll.mantle.maneuver) return applyManeuverToTargets(message, roll.mantle.maneuver, resolved);

  const amount = resolved.result?.total;

  if (!amount) {
    ui.notifications.warn(game.i18n.localize("MANTLE.Card.nothingToApply"));
    return;
  }

  const targets = Array.from(game.user.targets).map((token) => token.actor).filter(Boolean);
  if (targets.length === 0) {
    ui.notifications.warn(game.i18n.localize("MANTLE.Card.noTargets"));
    return;
  }

  const context = roll.mantle;
  const isStrain = (context.ladderKind ?? "vitality") === "strain";

  const hitLocation = context.hitLocation ?? "mass";
  /** @type {{onHit?: string, onWound?: string, weakness?: boolean}} */
  const location = CONFIG.MANTLE.hitLocations[hitLocation] ?? {};

  // "Attacks that deal Strain will generally have no additional benefit from
  // hit locations", so a called shot on the Strain track lands nothing extra.
  const called = !isStrain;

  for (const actor of targets) {
    const result = await actor.applyHarm({
      amount,
      damageTypes: context.damageTypes ?? [],
      penetrating: context.penetrating ?? false,
      strain: isStrain,
      // A Mark shot makes the defender weak to this attack whatever their own
      // affinities say, which doubles what gets past Guard.
      forceWeak: called && Boolean(location.weakness)
    });

    // Edge lands its condition on any hit; the damage having been applied at
    // all is what "on a hit with 1+ successes" means by the time we are here.
    if (called && location.onHit) {
      await actor.changeCondition(location.onHit, 1);
    }

    // Mark adds its condition only when the attack actually Wounds — which is
    // owed rather than taken, so it waits for the Wound button.
    if (called && location.onWound && result.woundsInflicted > 0) {
      await actor.changeCondition(location.onWound, 1);
    }

    await reportHarm(actor, amount, result, hitLocation);
  }
}

/* -------------------------------------------- */

/**
 * How a maneuver's effect reads at a given size.
 *
 * @param {object} maneuver
 * @param {number} size
 * @returns {string}
 */
function maneuverLabel(maneuver, size) {
  if (size <= 0) return game.i18n.localize("MANTLE.Maneuver.noEffect");

  if (maneuver.applies) {
    const condition = game.i18n.localize(MANTLE.conditions[maneuver.applies].label);
    return `${condition} ${size}`;
  }

  return game.i18n.format(maneuver.effect, { size });
}

/**
 * Apply a maneuver's effect to whatever is targeted.
 *
 * Zero net successes lands nothing at all — a Feint the defender fully dodged
 * applies no Vulnerable, rather than a minimum of one.
 *
 * @param {ChatMessage} message
 * @param {object} maneuver
 * @param {object} resolved
 */
async function applyManeuverToTargets(message, maneuver, resolved) {
  const size = maneuverEffectSize(resolved.effective, maneuver.max);
  if (size <= 0) {
    ui.notifications.warn(game.i18n.localize("MANTLE.Maneuver.noEffect"));
    return;
  }

  const targets = Array.from(game.user.targets).map((token) => token.actor).filter(Boolean);
  if (targets.length === 0) {
    ui.notifications.warn(game.i18n.localize("MANTLE.Card.noTargets"));
    return;
  }

  for (const actor of targets) {
    // A maneuver with no condition to apply — Shove — is pure narration: the
    // squares are pushed by whoever is moving the token.
    if (maneuver.applies) await actor.changeCondition(maneuver.applies, size);

    await ChatMessage.create({
      content: `<div class="mantle mantle-harm-card">
          <p><strong>${actor.name}</strong> — ${maneuverLabel(maneuver, size)}</p>
        </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });
  }
}

/* -------------------------------------------- */

/**
 * Announce what an applied hit did, including whether a Wound or Burden is now
 * owed. The Wound itself is a separate button: its severity needs a luck roll,
 * which is a decision point rather than something to resolve behind the scenes.
 *
 * @param {Actor} actor
 * @param {number} amount
 * @param {object} result
 */
async function reportHarm(actor, amount, result, hitLocation = "mass") {
  const owed = result.strain ? result.burdensInflicted : result.woundsInflicted;
  const lines = [];

  if (result.affinity === "resistant") lines.push(game.i18n.localize("MANTLE.Card.resisted"));
  if (result.affinity === "weak") lines.push(game.i18n.localize("MANTLE.Card.vulnerable"));
  if (!result.strain && result.guardAbsorbed) {
    lines.push(game.i18n.format("MANTLE.Card.guardAbsorbed", { amount: result.guardAbsorbed }));
  }
  if (result.defeated) lines.push(game.i18n.localize("MANTLE.Condition.defeated"));
  if (result.lost) lines.push(game.i18n.localize("MANTLE.Condition.lost"));

  const harm = result.strain ? "burden" : "wound";
  const button =
    owed > 0 && !result.defeated && !result.lost
      ? `<button type="button" data-harm="${harm}" data-actor="${actor.id}"
             data-hit-location="${hitLocation}">
           ${game.i18n.format(`MANTLE.Card.take${harm === "wound" ? "Wound" : "Burden"}`, { count: owed })}
         </button>`
      : "";

  await ChatMessage.create({
    content: `<div class="mantle mantle-harm-card">
        <p><strong>${actor.name}</strong> ${game.i18n.format(
          result.strain ? "MANTLE.Card.tookStrain" : "MANTLE.Card.tookDamage",
          { amount }
        )}</p>
        ${lines.length ? `<p class="notes">${lines.join(" · ")}</p>` : ""}
        ${button}
      </div>`,
    speaker: ChatMessage.getSpeaker({ actor })
  });
}

/* -------------------------------------------- */

/**
 * Resolve an owed Wound or Burden.
 *
 * The actor is read from the button that was actually clicked. Looking it up by
 * selector would find the first matching button anywhere in the chat log, and
 * wound the wrong character as soon as two harm cards are on screen.
 *
 * @param {HTMLElement} button
 */
async function takeHarm(button) {
  const kind = button.dataset.harm;
  const actor = game.actors.get(button.dataset.actor ?? "");
  if (!actor) return;

  // A Wound is taken once; disable immediately so a double-click cannot take two.
  button.disabled = true;

  // The location declared when the attack was rolled has to survive all the way
  // to the button that finally takes the Wound. Burdens have no location.
  const hitLocation = button.dataset.hitLocation ?? "mass";

  const result =
    kind === "wound" ? await actor.takeWound({ hitLocation }) : await actor.takeBurden();
  if (!result) return;

  // What the 1d6 landed, and the dice it discarded on the way. Showing the
  // rerolls matters: a table watching one die become another wants to see why.
  const what = kind === "wound" ? result.consequence : result.affliction;
  const notes = [
    game.i18n.format("MANTLE.Harm.rolled", { die: result.die }),
    result.rerolls.length
      ? game.i18n.format("MANTLE.Harm.rerolled", { dice: result.rerolls.join(", ") })
      : "",
    result.faltering ? game.i18n.localize("MANTLE.Condition.faltering") + " 1" : "",
    result.unraveling ? game.i18n.localize("MANTLE.Condition.unraveling") + " 1" : ""
  ].filter(Boolean);

  await ChatMessage.create({
    content: `<div class="mantle mantle-harm-card">
        <p><strong>${actor.name}</strong> — ${game.i18n.localize(
          kind === "wound" ? "MANTLE.Sheet.wound" : "MANTLE.Sheet.burden"
        )}</p>
        <p class="what">${what}</p>
        <p class="notes">${notes.join(" · ")}</p>
      </div>`,
    speaker: ChatMessage.getSpeaker({ actor })
  });
}

/* -------------------------------------------- */

/** Register the chat hooks. Called once during `init`. */
export function registerChatHooks() {
  Hooks.on("renderChatMessageHTML", (message, html) => activateCardListeners(message, html));
}
