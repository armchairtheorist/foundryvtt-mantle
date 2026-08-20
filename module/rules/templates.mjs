// @ts-check

/**
 * The shape a shaped spell puts on the map.
 *
 * Mantle describes its areas in squares — "Area 2 (5x5 squares)", "a triangle
 * N squares deep and N wide at the base" — and Foundry describes templates in
 * scene units with a type, a distance and an angle. This module does that
 * translation and nothing else: it returns a *descriptor* in squares, and the
 * canvas layer converts and places it.
 *
 * Pure geometry, no Foundry. Every figure is from the Area Shaping and Special
 * Area Shapes tables in section 9.
 */

import { MANTLE } from "../config.mjs";

/**
 * @typedef {object} TemplateDescriptor
 * @property {"circle"|"cone"|"rect"|"ray"} t - Foundry's template type
 * @property {number} distance - In squares; the canvas layer converts
 * @property {number} [width] - In squares, for rays
 * @property {number} [angle] - Degrees of spread, for cones
 * @property {number} [side] - Square side in squares, for rects
 * @property {"caster"|"chosen"} anchor - Where the template's origin sits
 * @property {boolean} aimed - Whether the caster picks a direction
 * @property {string} label
 * @property {string} [note] - A rule the template cannot express on its own
 */

/**
 * A square area of side N, as Foundry draws it.
 *
 * Foundry's rect anchors one corner at the origin and extends by `distance` in
 * `direction`, so a square of side N is a rect run diagonally: 45 degrees, and
 * a distance of the diagonal. The canvas layer offsets the anchor to the
 * top-left so the square lands centred on the point the caster picked.
 *
 * @param {number} side - Squares per side: 3, 5 or 7
 * @param {boolean} emanation - Centred on the caster rather than a chosen point
 * @param {string} label
 * @returns {TemplateDescriptor}
 */
function square(side, emanation, label) {
  return {
    t: "rect",
    side,
    distance: side * Math.SQRT2,
    anchor: emanation ? "caster" : "chosen",
    aimed: false,
    label,
    note: emanation ? "MANTLE.Template.emanationNote" : undefined
  };
}

/**
 * The template a cast wants, or null when it wants none.
 *
 * Two shapes deliberately return null. A single-target spell is not an area at
 * all. Salvo is not either: it picks N additional targets anywhere in range,
 * which is a list of tokens rather than a region of the map.
 *
 * @param {object} input
 * @param {number} input.areaStep - Step on the area ladder, 1 to 4
 * @param {string|null} [input.special] - A special shape, if one was chosen
 * @param {number} [input.specialSize] - The N in Cone N or Wall N
 * @param {number} input.rangeSquares - The spell's range, in squares
 * @returns {TemplateDescriptor|null}
 */
export function castTemplate({ areaStep, special = null, specialSize = 1, rangeSquares }) {
  // Range Self or Touch makes an area an emanation from the caster; a range
  // greater than one square makes it a blast centred where the caster chooses.
  const emanation = rangeSquares <= 1;
  const size = Math.max(1, specialSize);

  switch (special) {
    case "salvo":
      return null;

    case "cone":
      // N deep and N wide at the base, so the full spread is 2·atan(½).
      return {
        t: "cone",
        distance: size,
        angle: Math.round(2 * Math.atan(0.5) * (180 / Math.PI) * 100) / 100,
        anchor: "caster",
        aimed: true,
        label: "MANTLE.Shape.cone"
      };

    case "line":
      // Two squares wide, from the caster, out to the spell's full range.
      return {
        t: "ray",
        distance: rangeSquares,
        width: 2,
        anchor: "caster",
        aimed: true,
        label: "MANTLE.Shape.line"
      };

    case "wall":
      // N x 2 squares that need only be adjacent, not straight. A straight
      // ray is the closest a single template comes; the note says so.
      return {
        t: "ray",
        distance: size,
        width: 2,
        anchor: "chosen",
        aimed: true,
        label: "MANTLE.Shape.wall",
        note: "MANTLE.Template.wallNote"
      };

    default:
      break;
  }

  const rung = MANTLE.shaping.area.steps[areaStep - 1];
  if (!rung?.size) return null;

  return square(rung.size, emanation, rung.label);
}

/**
 * Whether a cast affects more than one target, and so rolls once per target.
 *
 * Every shape but the single target does — Salvo included, which is why this
 * is asked separately from whether there is a template to place.
 *
 * @param {object} input
 * @param {number} input.areaStep
 * @param {string|null} [input.special]
 * @returns {boolean}
 */
export function isMultiTarget({ areaStep, special = null }) {
  return Boolean(special) || areaStep > 1;
}
