// @ts-nocheck — PIXI and the canvas layer classes are barely typed in plain
// JS. The geometry this places lives in module/rules/templates.mjs, which is
// checked and tested.

/**
 * Putting a shaped spell's area on the map.
 *
 * The descriptor arrives in squares from module/rules/templates.mjs; everything
 * here is the Foundry half — converting squares to scene units, working out
 * where the origin goes, and letting the caster aim the ones that need aiming.
 *
 * An emanation needs no placement at all: it is centred on the caster and there
 * is exactly one place it can go, so it is created outright. A blast, cone,
 * wall or line is previewed under the cursor until the caster clicks.
 */

import { MANTLE } from "../config.mjs";

/**
 * Place the template a cast calls for.
 *
 * @param {Actor} actor - The caster
 * @param {import("../rules/templates.mjs").TemplateDescriptor} descriptor
 * @returns {Promise<MeasuredTemplateDocument|null>}
 */
export async function placeSpellTemplate(actor, descriptor) {
  if (!canvas?.scene) {
    ui.notifications.warn(game.i18n.localize("MANTLE.Template.noScene"));
    return null;
  }

  const grid = canvas.scene.grid;
  const token = actor.getActiveTokens?.(true)[0];

  if (descriptor.anchor === "caster" && !token) {
    ui.notifications.warn(game.i18n.localize("MANTLE.Template.noToken"));
    return null;
  }

  const data = {
    t: descriptor.t,
    // Foundry measures in scene units; Mantle counts squares.
    distance: descriptor.distance * grid.distance,
    width: (descriptor.width ?? 0) * grid.distance,
    angle: descriptor.angle ?? 0,
    direction: 0,
    fillColor: game.user.color?.css ?? "#ffffff",
    borderColor: MANTLE.templateBorderColor,
    flags: { mantle: { spellArea: true, actor: actor.id } }
  };

  // An emanation is centred on the caster and cannot go anywhere else, so it
  // is placed rather than aimed. Everything else the caster positions.
  if (descriptor.anchor === "caster" && !descriptor.aimed) {
    Object.assign(data, originForSquare(token.center, descriptor.side, grid.size));
    return createTemplate(data, descriptor);
  }

  if (descriptor.anchor === "caster") {
    Object.assign(data, { x: token.center.x, y: token.center.y });
    const aimed = await aim(data, { rotateOnly: true });
    return aimed ? createTemplate(aimed, descriptor) : null;
  }

  const placed = await aim(data, { rotateOnly: false, descriptor, grid });
  return placed ? createTemplate(placed, descriptor) : null;
}

/* -------------------------------------------- */

/**
 * The origin a square template needs to land centred on a point.
 *
 * A rect grows down and right from its origin, so a square of side N centred on
 * a point starts half a side up and to the left of it.
 *
 * @param {{x: number, y: number}} center
 * @param {number} side - Squares per side
 * @param {number} gridSize - Pixels per square
 * @returns {{x: number, y: number, direction: number}}
 */
function originForSquare(center, side, gridSize) {
  const half = (side * gridSize) / 2;

  // 45 degrees, because the rect's distance is being read as a diagonal.
  return { x: center.x - half, y: center.y - half, direction: 45 };
}

/**
 * Create the template and report it to chat.
 *
 * @param {object} data
 * @param {object} descriptor
 * @returns {Promise<MeasuredTemplateDocument|null>}
 */
async function createTemplate(data, descriptor) {
  const [created] = await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [data]);
  if (!created) return null;

  if (descriptor.note) {
    ui.notifications.info(game.i18n.localize(descriptor.note));
  }

  return created;
}

/* -------------------------------------------- */

/**
 * Let the caster position and turn the template, then commit it.
 *
 * Left-click places, right-click or Escape cancels, and the mouse wheel turns
 * an aimed shape. A cone anchored on the caster only turns — its apex is
 * already fixed — which is what `rotateOnly` means.
 *
 * @param {object} data - Template data, less its final position
 * @param {object} options
 * @param {boolean} options.rotateOnly - Position is fixed; only direction moves
 * @param {object} [options.descriptor]
 * @param {object} [options.grid]
 * @returns {Promise<object|null>} The committed data, or null if cancelled
 */
async function aim(data, { rotateOnly, descriptor, grid }) {
  const preview = new CONFIG.MeasuredTemplate.objectClass(
    new CONFIG.MeasuredTemplate.documentClass(data, { parent: canvas.scene })
  );

  await preview.draw();
  preview.layer.preview.addChild(preview);
  canvas.templates.activate();

  ui.notifications.info(
    game.i18n.localize(rotateOnly ? "MANTLE.Template.aimHint" : "MANTLE.Template.placeHint")
  );

  return new Promise((resolve) => {
    /** Everything bound below, so one teardown can undo all of it. */
    const handlers = {};
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;

      canvas.stage.off("mousemove", handlers.move);
      canvas.stage.off("mousedown", handlers.click);
      canvas.app.view.oncontextmenu = null;
      canvas.app.view.onwheel = null;

      // Clearing the container is what actually removes the preview; destroying
      // the placeable alone leaves an orphan child behind.
      preview.layer.preview.removeChildren();
      preview.destroy({ children: true });

      resolve(result);
    };

    handlers.move = (event) => {
      event.stopPropagation();
      const point = localPoint(event, preview.layer);

      // An emanated cone's apex is already fixed on the caster, so the cursor
      // aims it rather than moves it — pointing where the spell should go is
      // more natural than scrolling to it.
      if (rotateOnly) {
        preview.document.direction =
          (Math.atan2(point.y - data.y, point.x - data.x) * 180) / Math.PI;
        preview.refresh();
        return;
      }

      const snapped = canvas.grid.getSnappedPoint(point, { mode: snapMode(descriptor) });

      // A rect is anchored by its corner, so the cursor marks the centre and
      // the origin is derived from it — the same offset an emanation uses.
      Object.assign(
        preview.document,
        descriptor?.t === "rect"
          ? originForSquare(snapped, descriptor.side, grid.size)
          : { x: snapped.x, y: snapped.y }
      );

      preview.refresh();
    };

    handlers.click = (event) => {
      // Right-click arrives here as well as at the context menu; let the
      // context menu handle it so a cancel is not read as a placement.
      if ((event.button ?? event.data?.button ?? 0) !== 0) return;

      event.stopPropagation();
      finish(preview.document.toObject());
    };

    handlers.wheel = (event) => {
      // A square is drawn as a 45-degree rect, so its direction is geometry
      // rather than facing — turning it would stop it being a square.
      if (!rotateOnly && !descriptor?.aimed) return;

      event.preventDefault();
      event.stopPropagation();

      // Shift turns by the fine step, so a cone can be lined up on a corridor.
      const step = event.shiftKey ? MANTLE.templateFineRotation : MANTLE.templateRotation;
      preview.document.direction += step * Math.sign(event.deltaY);
      preview.refresh();
    };

    canvas.stage.on("mousemove", handlers.move);
    canvas.stage.on("mousedown", handlers.click);
    canvas.app.view.oncontextmenu = () => finish(null);
    canvas.app.view.onwheel = handlers.wheel;
  });
}

/**
 * The cursor's position in a layer's own coordinates.
 *
 * PIXI 7 hands the handler a FederatedPointerEvent, which carries
 * `getLocalPosition` itself; older builds wrapped it in `event.data`. Reading
 * both costs one line and saves a silent failure on either.
 *
 * @param {object} event
 * @param {object} layer
 * @returns {{x: number, y: number}}
 */
function localPoint(event, layer) {
  return event.getLocalPosition?.(layer) ?? event.data.getLocalPosition(layer);
}

/**
 * Where a shape's origin wants to snap.
 *
 * A square of odd side is centred on a square's middle; a ray starts on a
 * corner. Both are the same on a gridless scene, where Foundry snaps to
 * nothing at all.
 *
 * @param {object} [descriptor]
 * @returns {number}
 */
function snapMode(descriptor) {
  const modes = CONST.GRID_SNAPPING_MODES;
  return descriptor?.t === "rect" ? modes.CENTER : modes.VERTEX | modes.CENTER;
}
