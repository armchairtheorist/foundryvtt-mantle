// @ts-check

/**
 * The shape a shaped spell puts on the map.
 *
 * Section 9's Area Shaping and Special Area Shapes tables. The emanation /
 * blast split is the subtle one: the same Area 2 is centred on the caster or
 * on a chosen square depending entirely on the spell's *range*.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  castTemplate,
  forGrid,
  isMultiTarget,
  turnDirection
} from "../module/rules/templates.mjs";
import { MANTLE } from "../module/config.mjs";

describe("area shaping", () => {
  test("the ladder is 3x3, 5x5, 7x7", () => {
    assert.equal(castTemplate({ areaStep: 2, rangeSquares: 12 })?.side, 3);
    assert.equal(castTemplate({ areaStep: 3, rangeSquares: 12 })?.side, 5);
    assert.equal(castTemplate({ areaStep: 4, rangeSquares: 12 })?.side, 7);
  });

  test("a single target is not an area and gets no template", () => {
    assert.equal(castTemplate({ areaStep: 1, rangeSquares: 12 }), null);
  });

  test("squares are drawn as diagonal rects, which is how Foundry makes one", () => {
    // A rect anchors a corner and extends by distance along direction, so a
    // square of side N is a 45-degree run of N·root-2.
    const area = castTemplate({ areaStep: 3, rangeSquares: 12 });
    assert.equal(area?.t, "rect");
    assert.equal(area?.distance, 5 * Math.SQRT2);
    assert.equal(area?.aimed, false);
  });

  test("Self and Touch make it an emanation from the caster", () => {
    for (const rangeSquares of [0, 1]) {
      const area = castTemplate({ areaStep: 2, rangeSquares });
      assert.equal(area?.anchor, "caster", `range ${rangeSquares}`);
      assert.ok(area?.notes.length, "the caster is not caught in their own emanation");
    }
  });

  test("a range past one square makes it a blast the caster places", () => {
    assert.equal(castTemplate({ areaStep: 2, rangeSquares: 2 })?.anchor, "chosen");
    assert.equal(castTemplate({ areaStep: 2, rangeSquares: 12 })?.anchor, "chosen");
  });

  test("area 4 is the cap the rules set, and step 5 is not a shape", () => {
    assert.equal(MANTLE.shaping.area.steps.length, 4);
    assert.equal(castTemplate({ areaStep: 5, rangeSquares: 12 }), null);
  });
});

describe("special shapes", () => {
  test("a cone N squares deep is N wide at the base", () => {
    const cone = castTemplate({ areaStep: 1, special: "cone", specialSize: 4, rangeSquares: 1 });
    assert.equal(cone?.t, "cone");
    assert.equal(cone?.distance, 4);
    assert.equal(cone?.anchor, "caster");
    assert.equal(cone?.aimed, true);

    // Depth N, base N: half the base over the depth is a half-angle of
    // atan(0.5), so the full spread is about 53.13 degrees. Check the geometry
    // rather than the constant.
    const halfBase = Math.tan(((cone.angle ?? 0) / 2) * (Math.PI / 180)) * cone.distance;
    assert.ok(Math.abs(halfBase - 2) < 0.01, `base ${halfBase * 2} for depth 4`);
  });

  test("a line is two squares wide and runs the spell's full range", () => {
    const line = castTemplate({ areaStep: 1, special: "line", specialSize: 1, rangeSquares: 9 });
    assert.deepEqual(
      { t: line?.t, distance: line?.distance, width: line?.width, anchor: line?.anchor },
      { t: "ray", distance: 9, width: 2, anchor: "caster" }
    );
  });

  test("a wall is placed where the caster likes, and says it can bend", () => {
    const wall = castTemplate({ areaStep: 1, special: "wall", specialSize: 5, rangeSquares: 6 });
    assert.equal(wall?.anchor, "chosen");
    assert.equal(wall?.distance, 5);
    assert.equal(wall?.width, 2);
    // The rules let a wall bend; one template cannot, so it must say so.
    assert.ok(wall?.notes.length);
  });

  test("Salvo puts nothing on the map — it picks tokens, not squares", () => {
    assert.equal(
      castTemplate({ areaStep: 1, special: "salvo", specialSize: 3, rangeSquares: 12 }),
      null
    );
  });

  test("a special shape replaces area shaping rather than stacking with it", () => {
    // Even at area step 4, choosing a cone gives a cone.
    const shaped = castTemplate({ areaStep: 4, special: "cone", specialSize: 3, rangeSquares: 1 });
    assert.equal(shaped?.t, "cone");
  });

  test("every special shape in CONFIG is one this knows how to draw", () => {
    for (const special of Object.keys(MANTLE.specialShapes)) {
      // Salvo draws nothing on purpose; the rest must produce a shape.
      const result = castTemplate({ areaStep: 1, special, specialSize: 3, rangeSquares: 9 });
      if (special === "salvo") assert.equal(result, null);
      else assert.ok(result, special);
    }
  });
});

describe("how many targets", () => {
  test("a single-target spell rolls once", () => {
    assert.equal(isMultiTarget({ areaStep: 1 }), false);
  });

  test("any area, and any special shape, rolls per target", () => {
    assert.equal(isMultiTarget({ areaStep: 2 }), true);
    // Salvo places no template but still hits several targets, which is why
    // this is a separate question from whether there is a shape to draw.
    assert.equal(isMultiTarget({ areaStep: 1, special: "salvo" }), true);
    assert.equal(isMultiTarget({ areaStep: 1, special: "cone" }), true);
  });
});

describe("drawing the same area on a hex grid", () => {
  /** @param {number} areaStep */
  const onHex = (areaStep) => forGrid(castTemplate({ areaStep, rangeSquares: 12 }), "hex");

  test("a square becomes the burst it was always describing", () => {
    // A 5x5 reaches 2 spaces from its centre in every direction. On hexes that
    // is a radius-2 burst — 19 hexes against 25 squares, the same reach.
    const area = onHex(3);

    assert.equal(area?.t, "circle");
    assert.equal(area?.distance, 2);
  });

  test("the whole ladder converts", () => {
    assert.equal(onHex(2)?.distance, 1);
    assert.equal(onHex(3)?.distance, 2);
    assert.equal(onHex(4)?.distance, 3);
  });

  test("nothing is left claiming to be a square", () => {
    // `side` is what the canvas layer offsets a rect's corner by. A burst is
    // centred where it is placed, so carrying a side would move it.
    assert.equal(onHex(3)?.side, undefined);
  });

  test("the burst says what it did, and keeps what the shape already said", () => {
    const blast = onHex(3);
    assert.deepEqual(blast?.notes, ["MANTLE.Template.hexNote"]);

    // An emanation already carries a note; the hex one joins it rather than
    // replacing it, since both facts still hold.
    const emanation = forGrid(castTemplate({ areaStep: 3, rangeSquares: 1 }), "hex");
    assert.deepEqual(emanation?.notes, [
      "MANTLE.Template.emanationNote",
      "MANTLE.Template.hexNote"
    ]);
  });

  test("square and gridless scenes keep the square", () => {
    for (const kind of /** @type {const} */ (["square", "gridless"])) {
      const area = forGrid(castTemplate({ areaStep: 3, rangeSquares: 12 }), kind);
      assert.equal(area?.t, "rect", kind);
      assert.equal(area?.side, 5, kind);
    }
  });

  test("shapes described by depth and spread are the same on any grid", () => {
    // A cone, a line and a wall are a reach and an angle, not a lattice, so
    // there is nothing to restate.
    for (const special of ["cone", "line", "wall"]) {
      const shape = castTemplate({ areaStep: 1, special, specialSize: 4, rangeSquares: 9 });
      assert.deepEqual(forGrid(shape, "hex"), shape, special);
    }
  });

  test("a cast that draws nothing still draws nothing", () => {
    assert.equal(forGrid(null, "hex"), null);
    assert.equal(
      forGrid(castTemplate({ areaStep: 1, special: "salvo", rangeSquares: 9 }), "hex"),
      null
    );
  });
});

describe("turning an aimed template", () => {
  const square = { step: MANTLE.templateRotation, phase: 0 };
  const pointyTop = { step: MANTLE.templateHexRotation, phase: 0 };
  const flatTop = { step: MANTLE.templateHexRotation, phase: 30 };

  test("one click is one step", () => {
    assert.equal(turnDirection(0, { ...square, sign: 1 }), 15);
    assert.equal(turnDirection(0, { ...square, sign: -1 }), -15);
  });

  test("a direction off the lattice is pulled back onto it", () => {
    // The old code added the step, so 17 became 32 and stayed off the lattice
    // forever. Turning lands on the next multiple in the direction of travel.
    assert.equal(turnDirection(17, { ...square, sign: 1 }), 30);
    assert.equal(turnDirection(17, { ...square, sign: -1 }), 15);
  });

  test("turning back from a facing gives the one before it, not two before", () => {
    assert.equal(turnDirection(60, { ...pointyTop, sign: -1 }), 0);
    assert.equal(turnDirection(60, { ...pointyTop, sign: 1 }), 120);
  });

  test("pointy-top hexes face east, so their facings are multiples of 60", () => {
    // Six clicks all the way round, and back where it started.
    let direction = 0;
    const seen = [];
    for (let click = 0; click < 6; click += 1) {
      direction = turnDirection(direction, { ...pointyTop, sign: 1 });
      seen.push(direction);
    }
    assert.deepEqual(seen, [60, 120, 180, 240, 300, 360]);
  });

  test("flat-top hexes face north, so theirs are offset by 30", () => {
    assert.equal(turnDirection(0, { ...flatTop, sign: 1 }), 30);
    assert.equal(turnDirection(30, { ...flatTop, sign: 1 }), 90);
    assert.equal(turnDirection(30, { ...flatTop, sign: -1 }), -30);
  });

  test("Shift nudges off a facing and back on again", () => {
    const fine = { step: MANTLE.templateFineRotation, phase: 0 };

    const nudged = turnDirection(60, { ...fine, sign: 1 });
    assert.equal(nudged, 65);

    // And the coarse step recovers the facing rather than compounding the nudge.
    assert.equal(turnDirection(nudged, { ...pointyTop, sign: -1 }), 60);
  });
});
