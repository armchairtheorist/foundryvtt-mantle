// @ts-nocheck — PIXI and the canvas layer classes are barely typed in plain
// JS. The geometry this places lives in module/rules/templates.mjs, which is
// checked and tested.

/**
 * Putting a shaped spell's area on the map.
 *
 * The descriptor arrives in spaces from module/rules/templates.mjs; everything
 * here is the Foundry half — converting spaces to scene units, working out
 * where the origin goes, and letting the caster aim the ones that need aiming.
 *
 * An emanation needs no placement at all: it is centred on the caster and there
 * is exactly one place it can go, so it is created outright. A blast, cone,
 * wall or line is previewed under the cursor until the caster clicks.
 *
 * The scene's grid decides what a square area is drawn as, so the descriptor is
 * put through `forGrid` before anything is measured from it.
 */

import { MANTLE } from "../config.mjs";
import { forGrid, turnDirection } from "../rules/templates.mjs";

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

  // A square area drawn over hexes lines up with nothing, which is what a hex
  // table sees as "the templates all appear weird". Restated as a burst first,
  // before anything below measures a distance or an origin from it.
  descriptor = forGrid(descriptor, gridKind());

  // A burst still draws as a smooth circle unless Foundry is snapping template
  // outlines to the grid. That is a world setting rather than ours to change,
  // and it is setup advice rather than a rule — so it is said once and then
  // left alone, unlike the notes on the descriptor, which are facts about the
  // spell and belong on every cast.
  if (descriptor.t === "circle") warnAboutAlignmentOnce();

  if (descriptor.anchor === "caster" && !token) {
    ui.notifications.warn(game.i18n.localize("MANTLE.Template.noToken"));
    return null;
  }

  const data = {
    t: descriptor.t,
    // Foundry measures in scene units; Momenta counts spaces.
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
    Object.assign(data, originForShape(descriptor, token.center, grid.size));
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
 * Which kind of grid the scene is on, as far as a shape is concerned.
 *
 * The four hex orientations are one kind: they differ in how they tile, not in
 * what a burst of N spaces means.
 *
 * @returns {import("../rules/templates.mjs").GridKind}
 */
function gridKind() {
  if (canvas.grid.isHexagonal) return "hex";
  return canvas.grid.isGridless ? "gridless" : "square";
}

/**
 * The step and phase a turn of the wheel snaps to.
 *
 * @param {boolean} fine - Whether Shift is held
 * @returns {{step: number, phase: number}}
 */
function rotationLattice(fine) {
  if (fine) return { step: MANTLE.templateFineRotation, phase: 0 };

  if (!canvas.grid.isHexagonal) return { step: MANTLE.templateRotation, phase: 0 };

  // Flat-top hexes (columns) have neighbours due north and south rather than
  // due east and west, so their facings sit 30 degrees round from zero.
  return { step: MANTLE.templateHexRotation, phase: canvas.grid.columns ? 30 : 0 };
}

/** Whether the alignment advice has already been given this session. */
let alignmentWarned = false;

/**
 * Say once that a burst will look better with grid-aligned templates on.
 *
 * The core `gridTemplates` setting is read defensively: one that is not
 * registered throws rather than returning undefined, and a missing setting
 * should leave the cast alone rather than break it.
 */
function warnAboutAlignmentOnce() {
  if (alignmentWarned) return;

  let snapping = true;
  try {
    snapping = Boolean(game.settings.get("core", "gridTemplates"));
  } catch {
    return;
  }

  if (snapping) return;

  alignmentWarned = true;
  ui.notifications.info(game.i18n.localize("MANTLE.Template.hexAlignNote"));
}

/**
 * The origin a shape needs to land centred on a point.
 *
 * Only a rect needs the offset: it grows down and right from its origin, so a
 * square of side N centred on a point starts half a side up and to the left of
 * it. Everything else — circle, cone, ray — is already anchored where it is
 * placed, and must keep whatever direction the caster has turned it to.
 *
 * @param {object} descriptor
 * @param {{x: number, y: number}} center
 * @param {number} gridSize - Pixels per space
 * @returns {{x: number, y: number, direction?: number}}
 */
function originForShape(descriptor, center, gridSize) {
  if (descriptor?.t !== "rect") return { x: center.x, y: center.y };

  const half = ((descriptor.side ?? 1) * gridSize) / 2;

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

  for (const note of descriptor.notes ?? []) {
    ui.notifications.info(game.i18n.localize(note));
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
 * Every exit resolves. This is awaited by a cast that has already spent its
 * Vigor, so a path that neither places nor cancels would suspend the spell
 * forever — no roll, no card, and no way back.
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

  // Kept on screen rather than flashed: while this is open the canvas is the
  // only thing that will answer a click, and a caster who missed a two-second
  // toast has no way to tell that anything is waiting for them.
  const prompt = ui.notifications.info(
    game.i18n.localize(rotateOnly ? "MANTLE.Template.aimHint" : "MANTLE.Template.placeHint"),
    { permanent: true }
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
      document.removeEventListener("keydown", handlers.key, true);
      canvas.app.view.oncontextmenu = null;
      canvas.app.view.onwheel = null;
      ui.notifications.remove?.(prompt);

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
      Object.assign(preview.document, originForShape(descriptor, snapped, grid.size));

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
      // Unshifted, one click is one facing: 15 degrees on squares, a whole hex
      // side on hexes, where turning by anything less only ever puts the cone
      // between two rows.
      preview.document.direction = turnDirection(preview.document.direction, {
        ...rotationLattice(event.shiftKey),
        sign: Math.sign(event.deltaY)
      });
      preview.refresh();
    };

    // Escape is the reflex for "get me out of this", and without it the only
    // ways out are a canvas click or a right-click — neither of which a caster
    // looking at their character sheet will think to try.
    handlers.key = (event) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      event.stopPropagation();
      finish(null);
    };

    canvas.stage.on("mousemove", handlers.move);
    canvas.stage.on("mousedown", handlers.click);
    document.addEventListener("keydown", handlers.key, true);
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
 * A blast is centred on a space's middle, whether it is drawn as a square or as
 * a burst; a ray starts on a corner. A hex grid has no vertices to speak of in
 * the sense Foundry means, so on hexes everything snaps to centres — which is
 * where a burst belongs and near enough for the end of a wall.
 *
 * All of it is moot on a gridless scene, where Foundry snaps to nothing.
 *
 * @param {object} [descriptor]
 * @returns {number}
 */
function snapMode(descriptor) {
  const modes = CONST.GRID_SNAPPING_MODES;
  if (canvas.grid.isHexagonal) return modes.CENTER;

  const centred = descriptor?.t === "rect" || descriptor?.t === "circle";
  return centred ? modes.CENTER : modes.VERTEX | modes.CENTER;
}
