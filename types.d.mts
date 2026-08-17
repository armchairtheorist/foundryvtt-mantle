/**
 * Ambient declarations for the globals and document subtypes this system adds.
 *
 * This is the one TypeScript file in the project. No runtime code lives here
 * and nothing is compiled — it exists so the type checker knows about
 * `CONFIG.MANTLE`, the `mantle` global, and Mantle's Actor and Item subtypes.
 *
 * Registering the data models here is what makes `actor.system.maxVitality`
 * resolve to a number rather than `unknown` throughout the codebase.
 */

import type { MANTLE } from "./module/config.mjs";
import type MantleActor from "./module/documents/actor.mjs";
import type MantleItem from "./module/documents/item.mjs";
import type CharacterData from "./module/data/actor-character.mjs";
import type AdversaryData from "./module/data/actor-adversary.mjs";
import type PartyData from "./module/data/actor-party.mjs";
import type {
  ArchetypeData,
  MasteryData,
  WeaponData,
  ArmorData,
  FocusData,
  WondrousData,
  ConsumableData,
  ArtData,
  ResonanceData,
  FeatureData,
  LimitBreakData
} from "./module/data/items.mjs";

declare module "fvtt-types/configuration" {
  interface DocumentClassConfig {
    Actor: typeof MantleActor;
    Item: typeof MantleItem;
  }

  interface DataModelConfig {
    Actor: {
      character: typeof CharacterData;
      adversary: typeof AdversaryData;
      party: typeof PartyData;
    };
    Item: {
      archetype: typeof ArchetypeData;
      mastery: typeof MasteryData;
      weapon: typeof WeaponData;
      armor: typeof ArmorData;
      focus: typeof FocusData;
      wondrous: typeof WondrousData;
      consumable: typeof ConsumableData;
      art: typeof ArtData;
      resonance: typeof ResonanceData;
      feature: typeof FeatureData;
      limitbreak: typeof LimitBreakData;
    };
  }
}

declare global {
  interface CONFIG {
    /** Mantle's static reference tables. See module/config.mjs. */
    MANTLE: typeof MANTLE;
  }

  /** Convenience handle for macros and the developer console. */
  // eslint-disable-next-line no-var
  var mantle: {
    config: typeof MANTLE;
  };
}

export {};
