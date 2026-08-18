/**
 * Mantle — a game system for Foundry Virtual Tabletop.
 *
 * Entry point. Foundry loads this as an ES module (declared in system.json's
 * `esmodules`), so everything the system needs is reachable from here.
 */

import { MANTLE } from "./module/config.mjs";
import CharacterData from "./module/data/actor-character.mjs";
import AdversaryData from "./module/data/actor-adversary.mjs";
import PartyData from "./module/data/actor-party.mjs";
import { itemDataModels } from "./module/data/items.mjs";
import MantleActor from "./module/documents/actor.mjs";
import MantleItem from "./module/documents/item.mjs";
import MantleCharacterSheet from "./module/apps/sheets/character-sheet.mjs";
import MantleAdversarySheet from "./module/apps/sheets/adversary-sheet.mjs";
import MantlePartySheet from "./module/apps/sheets/party-sheet.mjs";
import MantleItemSheet from "./module/apps/sheets/item-sheet.mjs";
import MantleRoll from "./module/dice/roll.mjs";
import { registerChatHooks } from "./module/chat/cards.mjs";

/* -------------------------------------------- */
/*  Initialization                               */
/* -------------------------------------------- */

Hooks.once("init", () => {
  console.log("Mantle | Initializing the Mantle game system");

  // Publish the reference tables so macros, modules, and the console can reach them.
  CONFIG.MANTLE = MANTLE;

  // Document classes.
  CONFIG.Actor.documentClass = MantleActor;
  CONFIG.Item.documentClass = MantleItem;

  // Data models, keyed by the subtypes declared in system.json.
  CONFIG.Actor.dataModels = {
    character: CharacterData,
    adversary: AdversaryData,
    party: PartyData
  };
  CONFIG.Item.dataModels = itemDataModels;

  // Mantle resolves initiative through side-alternating zipper turn order rather
  // than a rolled formula, so there is deliberately no CONFIG.Combat.initiative
  // formula here. Turn order is driven by the combat tracker.

  // Registering the Roll subclass is what lets a card survive a page reload:
  // without it, message.rolls[0] comes back as a plain Roll and the card's
  // controls stop working.
  // @ts-expect-error — a Roll subclass with extra members does not satisfy
  // fvtt-types' invariant typeof Roll, but this is exactly how Foundry
  // expects custom roll classes to be registered.
  CONFIG.Dice.rolls.push(MantleRoll);

  registerPartials();
  registerSheets();
  registerChatHooks();
  registerConditions();

  globalThis.mantle = { config: MANTLE };
});

/* -------------------------------------------- */

/**
 * Register shared Handlebars partials.
 *
 * The condition bar is the only one so far, and it earns its keep: a Bandit
 * Captain carries Hindered exactly the way a player character does, so both
 * actor sheets render the same markup rather than two copies that drift.
 */
function registerPartials() {
  foundry.applications.handlebars.loadTemplates([
    "systems/mantle/templates/parts/conditions.hbs"
  ]);
}

/* -------------------------------------------- */

/** Replace the core sheets with Mantle's own. */
function registerSheets() {
  const { Actors, Items } = foundry.documents.collections;
  const { sheets } = foundry.applications;

  Actors.unregisterSheet("core", sheets.ActorSheetV2);
  Actors.registerSheet("mantle", MantleCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "MANTLE.Sheet.character"
  });

  Actors.registerSheet("mantle", MantleAdversarySheet, {
    types: ["adversary"],
    makeDefault: true,
    label: "MANTLE.Sheet.adversary"
  });

  Actors.registerSheet("mantle", MantlePartySheet, {
    types: ["party"],
    makeDefault: true,
    label: "MANTLE.Sheet.party"
  });

  Items.unregisterSheet("core", sheets.ItemSheetV2);
  Items.registerSheet("mantle", MantleItemSheet, {
    makeDefault: true,
    label: "MANTLE.Sheet.item"
  });
}

/* -------------------------------------------- */

/**
 * Register Mantle's conditions as token status effects.
 *
 * Stack counts are mirrored into `flags.statuscounter.value` so the Status Icon
 * Counters module renders them on the token. Without that module the counts are
 * still tracked and shown on the character sheet — the icons just don't carry a
 * number.
 */
function registerConditions() {
  CONFIG.statusEffects = Object.entries(MANTLE.conditions).map(([id, condition]) => ({
    id,
    name: condition.label,
    img: `systems/mantle/assets/conditions/${id}.svg`
  }));

  // Stacking rules and caps stay in CONFIG.MANTLE.conditions rather than being
  // copied onto the status effects. One source of truth, and the sheet and the
  // effect code read the same table.
}

/* -------------------------------------------- */

Hooks.once("ready", () => {
  console.log(`Mantle | Ready — system version ${game.system?.version} on Foundry ${game.version}`);
});
