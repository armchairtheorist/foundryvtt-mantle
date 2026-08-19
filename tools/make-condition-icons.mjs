/**
 * Generate the condition status icons.
 *
 * Referencing Foundry's own `icons/svg/*` would mean guessing at filenames that
 * vary between releases, and a missing icon shows as a broken image on every
 * token carrying that condition. These are generated instead: plain, distinct,
 * and guaranteed to exist.
 *
 * Each is a filled disc with the condition's initial, tinted by what the
 * condition does — harm in red, impairment in amber, control in violet, sensory
 * in blue, and the two death-spiral conditions in near-black.
 *
 * Run once with: node tools/make-condition-icons.mjs
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = "assets/conditions";

/** @type {Record<string, {glyph: string, tint: string}>} */
const ICONS = {
  broken: { glyph: "BR", tint: "#8c2f2f" },
  cursed: { glyph: "CU", tint: "#5b2a72" },
  defeated: { glyph: "DF", tint: "#1c1c1c" },
  exhausted: { glyph: "EX", tint: "#9a6b1f" },
  faltering: { glyph: "FA", tint: "#1c1c1c" },
  frenzy: { glyph: "FZ", tint: "#8c2f2f" },
  frightened: { glyph: "FR", tint: "#5b2a72" },
  hindered: { glyph: "HI", tint: "#9a6b1f" },
  impaired: { glyph: "IM", tint: "#9a6b1f" },
  invisible: { glyph: "IN", tint: "#2f5b8c" },
  lost: { glyph: "LO", tint: "#1c1c1c" },
  provoked: { glyph: "PR", tint: "#8c2f2f" },
  shrouded: { glyph: "SH", tint: "#2f5b8c" },
  slowed: { glyph: "SL", tint: "#2f5b8c" },
  surprised: { glyph: "SU", tint: "#2f5b8c" },
  unraveling: { glyph: "UN", tint: "#1c1c1c" },
  wracked: { glyph: "WR", tint: "#8c2f2f" }
};

/**
 * @param {string} glyph
 * @param {string} tint
 */
function svg(glyph, tint) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="29" fill="${tint}" stroke="#f0ead6" stroke-width="3"/>
  <text x="32" y="33" text-anchor="middle" dominant-baseline="central"
        font-family="Signika, Helvetica, Arial, sans-serif" font-size="26"
        font-weight="700" fill="#f0ead6">${glyph}</text>
</svg>
`;
}

await mkdir(OUT, { recursive: true });

for (const [id, { glyph, tint }] of Object.entries(ICONS)) {
  await writeFile(path.join(OUT, `${id}.svg`), svg(glyph, tint), "utf8");
}

console.log(`Wrote ${Object.keys(ICONS).length} condition icons to ${OUT}/`);
