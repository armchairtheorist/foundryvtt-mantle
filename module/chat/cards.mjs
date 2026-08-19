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
 *  - The **net-success stepper** absorbs opposition rolls, Heroic Feats bought
 *    with Valor, and plain GM adjudication in one place. Rather than
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
  const state = { adjustment: 0, allocationIndex: 0, title, subtitle };
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

  for (const actor of targets) {
    const result = await actor.applyHarm({
      amount,
      damageTypes: context.damageTypes ?? [],
      penetrating: context.penetrating ?? false,
      strain: isStrain
    });

    await reportHarm(actor, amount, result);
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
async function reportHarm(actor, amount, result) {
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
      ? `<button type="button" data-harm="${harm}" data-actor="${actor.id}">
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

  const result = kind === "wound" ? await actor.takeWound() : await actor.takeBurden();
  if (!result) return;

  await ChatMessage.create({
    content: `<div class="mantle mantle-harm-card">
        <p><strong>${actor.name}</strong> — ${game.i18n.localize(result.label)}</p>
        <p class="notes">${result.effect}${result.affliction ? ` · ${result.affliction}` : ""}</p>
      </div>`,
    speaker: ChatMessage.getSpeaker({ actor })
  });
}

/* -------------------------------------------- */

/** Register the chat hooks. Called once during `init`. */
export function registerChatHooks() {
  Hooks.on("renderChatMessageHTML", (message, html) => activateCardListeners(message, html));
}
