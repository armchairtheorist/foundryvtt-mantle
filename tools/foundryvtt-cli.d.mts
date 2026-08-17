/**
 * Minimal type declarations for @foundryvtt/foundryvtt-cli, which ships plain
 * JavaScript with no types of its own. Only the two functions the build scripts
 * use are declared.
 */

declare module "@foundryvtt/foundryvtt-cli" {
  interface PackageOptions {
    /** Emit a line per document processed. */
    log?: boolean;
    /** Read source files from nested directories as well as the top level. */
    recursive?: boolean;
    /** Treat source files as YAML rather than JSON. */
    yaml?: boolean;
  }

  /** Compile a directory of source documents into a LevelDB compendium pack. */
  export function compilePack(src: string, dest: string, options?: PackageOptions): Promise<void>;

  /** Extract a LevelDB compendium pack into a directory of source documents. */
  export function extractPack(src: string, dest: string, options?: PackageOptions): Promise<void>;
}
