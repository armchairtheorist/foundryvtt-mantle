// @ts-check

/**
 * The shape a shaped spell puts on the map.
 *
 * Momenta describes its areas in squares — "Area 2 (5x5 squares)", "a triangle
 * N squares deep and N wide at the base" — and Foundry describes templates in
 * scene units with a type, a distance and an angle. This module does that
 * translation and nothing else: it returns a *descriptor* in squares, and the
 * canvas layer converts and places it.
 *
 * "Square" in the rules means a space on the grid, and plenty of tables play
 * Momenta on hexes. A square area has no hex equivalent that is also a square,
 * so `forGrid` restates one as the burst it actually describes — N spaces in
 * every direction — which is the same region a 5x5 marks out on squares.
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
 * @property {string[]} notes - Rules the template cannot express on its own
 */

/**
 * The kinds of grid a scene can use, as far as a shape is concerned.
 *
 * The four hex orientations differ in how they tile, not in what a burst of N
 * spaces means, so they are one kind here.
 *
 * @typedef {"square"|"hex"|"gridless"} GridKind
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
    notes: emanation ? ["MANTLE.Template.emanationNote"] : []
  };
}

/**
 * The same shape, drawn the way the scene's grid can actually draw it.
 *
 * Only the square areas change. A cone, a line and a wall are described by a
 * depth and a spread rather than by a lattice, so they mean the same thing on
 * any grid and are handed back untouched.
 *
 * A square of side N reaches (N-1)/2 spaces from its centre in every direction.
 * On hexes that is a burst of that radius: 19 hexes where the rules print a
 * 5x5, against 25 squares. Fewer spaces, the same reach — which is the half of
 * the shape the rules were actually describing, since an axis-aligned box drawn
 * over hexes lines up with nothing at all.
 *
 * @param {TemplateDescriptor|null} descriptor
 * @param {GridKind} kind
 * @returns {TemplateDescriptor|null}
 */
export function forGrid(descriptor, kind) {
  if (!descriptor || kind !== "hex" || descriptor.t !== "rect") return descriptor;

  const radius = ((descriptor.side ?? 1) - 1) / 2;

  return {
    ...descriptor,
    t: "circle",
    distance: radius,
    side: undefined,
    notes: [...descriptor.notes, "MANTLE.Template.hexNote"]
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
        label: "MANTLE.Shape.cone",
        notes: []
      };

    case "line":
      // Two squares wide, from the caster, out to the spell's full range.
      return {
        t: "ray",
        distance: rangeSquares,
        width: 2,
        anchor: "caster",
        aimed: true,
        label: "MANTLE.Shape.line",
        notes: []
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
        notes: ["MANTLE.Template.wallNote"]
      };

    default:
      break;
  }

  const rung = MANTLE.shaping.area.steps[areaStep - 1];
  if (!rung?.size) return null;

  return square(rung.size, emanation, rung.label);
}

/**
 * The next direction a turn of the wheel should land on.
 *
 * Snapping rather than adding: a template nudged to 17 degrees and then turned
 * by 15 would sit at 32 and stay off the lattice forever. Turning always lands
 * on the next multiple of the step *in the direction of travel*, so a shape can
 * always be brought back onto a facing.
 *
 * `phase` is what makes hexes work. Pointy-top hexes have neighbours due east
 * and west, so their six facings are multiples of 60 from zero; flat-top hexes
 * have neighbours due north and south, and theirs are offset by 30.
 *
 * @param {number} direction - Current direction, in degrees
 * @param {object} input
 * @param {number} input.step - Degrees per turn
 * @param {number} [input.phase] - Degrees the lattice is offset by
 * @param {number} input.sign - +1 or -1
 * @returns {number}
 */
export function turnDirection(direction, { step, phase = 0, sign }) {
  const units = (direction - phase) / step;
  const next = sign > 0 ? Math.floor(units) + 1 : Math.ceil(units) - 1;

  return next * step + phase;
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
