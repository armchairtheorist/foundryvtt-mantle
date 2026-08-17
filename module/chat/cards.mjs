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
}

/* -------------------------------------------- */

/** Register the chat hooks. Called once during `init`. */
export function registerChatHooks() {
  Hooks.on("renderChatMessageHTML", (message, html) => activateCardListeners(message, html));
}
