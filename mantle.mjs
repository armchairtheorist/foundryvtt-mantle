/**
 * Mantle — a game system for Foundry Virtual Tabletop.
 *
 * Entry point. Foundry loads this as an ES module (declared in system.json's
 * `esmodules`), so everything the system needs is reachable from here.
 */

import { MANTLE } from "./module/config.mjs";

/* -------------------------------------------- */
/*  Initialization                               */
/* -------------------------------------------- */

Hooks.once("init", () => {
  console.log("Mantle | Initializing the Mantle game system");

  // Publish the reference tables so macros, modules, and the console can reach them.
  CONFIG.MANTLE = MANTLE;

  // Mantle resolves initiative through side-alternating zipper turn order rather
  // than a rolled formula, so there is deliberately no CONFIG.Combat.initiative
  // formula here. Turn order is driven by the combat tracker.

  globalThis.mantle = { config: MANTLE };
});

Hooks.once("ready", () => {
  console.log(`Mantle | Ready — system version ${game.system?.version} on Foundry ${game.version}`);
});
