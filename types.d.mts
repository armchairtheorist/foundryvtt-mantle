/**
 * Ambient declarations for the globals this system adds.
 *
 * This is the one TypeScript file in the project. It exists so the type checker
 * knows about `CONFIG.MANTLE` and the `mantle` global; no runtime code lives
 * here and nothing is compiled.
 */

import type { MANTLE } from "./module/config.mjs";

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
