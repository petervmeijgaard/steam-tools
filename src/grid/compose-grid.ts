import { GRID_HEIGHT, GRID_WIDTH } from "./grid-size.ts";

export type Fit = "cover" | "contain";

/** Where a template places artwork, in grid pixels from the top-left. */
export type Slot = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GridImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

// A pan across the artwork, in source pixels. Positive x reveals more of the
// artwork's right side; positive y reveals more of its bottom.
export type Offset = {
  x: number;
  y: number;
};

export type GridInput = {
  artwork: GridImage;
  template: GridImage;
  slot: Slot;
  fit: Fit;
  offset: Offset;
};

// What the compositor needs from a canvas, typed against the browser's own
// canvas. @napi-rs/canvas mirrors it closely enough to adapt in the tests.
export type Canvas = {
  load(image: GridImage): CanvasImageSource;
  context: CanvasRenderingContext2D;
};

/**
 * The region of the artwork drawn into the Slot, in source pixels.
 *
 * Contain uses all of it. Cover uses all of it on the shorter axis and crops
 * the longer one down to the Slot's aspect, with the offset choosing which
 * part survives.
 */
function coverCrop(artwork: GridImage, slot: Slot) {
  const aspect = slot.width / slot.height;
  const wider = artwork.width / artwork.height > aspect;
  return wider
    ? { width: artwork.height * aspect, height: artwork.height }
    : { width: artwork.width, height: artwork.width / aspect };
}

/** How far the offset can move, in source pixels, before the Slot shows a gap. */
function offsetLimit(artwork: GridImage, slot: Slot): Offset {
  const crop = coverCrop(artwork, slot);
  return {
    x: Math.max(0, (artwork.width - crop.width) / 2),
    y: Math.max(0, (artwork.height - crop.height) / 2),
  };
}

/**
 * Whether cover actually crops this artwork. An artwork that already matches
 * the Slot's aspect has nothing to reposition.
 */
export function canReposition(artwork: GridImage, slot: Slot): boolean {
  const limit = offsetLimit(artwork, slot);
  return limit.x > 0 || limit.y > 0;
}

/**
 * The offset after a drag on the cover preview.
 *
 * `drag` is in grid pixels, positive right and down. Dragging right reveals
 * the artwork's left side, so the offset decreases. The result is clamped so
 * the Slot stays covered, and a drag on artwork that already matches the Slot
 * changes nothing.
 */
export function offsetAfterDrag(
  artwork: GridImage,
  slot: Slot,
  start: Offset,
  drag: { x: number; y: number },
): Offset {
  const crop = coverCrop(artwork, slot);
  const limit = offsetLimit(artwork, slot);
  return {
    x: limit.x === 0 ? 0 : clamp(start.x - drag.x / (slot.width / crop.width), -limit.x, limit.x),
    y: limit.y === 0 ? 0 : clamp(start.y - drag.y / (slot.height / crop.height), -limit.y, limit.y),
  };
}

function sourceRect(artwork: GridImage, slot: Slot, fit: Fit, offset: Offset) {
  if (fit === "contain") {
    return { x: 0, y: 0, width: artwork.width, height: artwork.height };
  }

  const crop = coverCrop(artwork, slot);
  return {
    x: clamp((artwork.width - crop.width) / 2 + offset.x, 0, Math.max(0, artwork.width - crop.width)),
    y: clamp((artwork.height - crop.height) / 2 + offset.y, 0, Math.max(0, artwork.height - crop.height)),
    width: crop.width,
    height: crop.height,
  };
}

/** Clamps a value to the inclusive range between min and max. */
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Where the artwork is drawn, and how big.
 *
 * Cover fills the Slot. Contain leaves gaps on the shorter axis. Uncovered
 * pixels stay transparent.
 */
function destination(artwork: GridImage, slot: Slot, fit: Fit) {
  if (fit === "cover") return { x: slot.x, y: slot.y, width: slot.width, height: slot.height };

  const aspect = artwork.width / artwork.height;
  const slotAspect = slot.width / slot.height;
  return aspect > slotAspect
    ? {
        x: slot.x,
        y: slot.y + (slot.height - slot.width / aspect) / 2,
        width: slot.width,
        height: slot.width / aspect,
      }
    : {
        x: slot.x + (slot.width - slot.height * aspect) / 2,
        y: slot.y,
        width: slot.height * aspect,
        height: slot.height,
      };
}

/**
 * Composites artwork into a template's Slot, then paints the template over
 * the grid. The result is 600 by 900.
 *
 * Clears the canvas first, so a previous grid cannot show through. Artwork is
 * fitted into the Slot. Opaque template pixels win, including a stem that
 * overlaps the Slot.
 */
export function composeGrid(input: GridInput, canvas: Canvas): GridImage {
  const source = sourceRect(input.artwork, input.slot, input.fit, input.offset);
  const dest = destination(input.artwork, input.slot, input.fit);
  const { context } = canvas;

  context.clearRect(0, 0, GRID_WIDTH, GRID_HEIGHT);

  context.drawImage(
    canvas.load(input.artwork),
    source.x,
    source.y,
    source.width,
    source.height,
    dest.x,
    dest.y,
    dest.width,
    dest.height,
  );
  context.drawImage(
    canvas.load(input.template),
    0,
    0,
    input.template.width,
    input.template.height,
    0,
    0,
    GRID_WIDTH,
    GRID_HEIGHT,
  );

  const composed = context.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT);
  return { width: composed.width, height: composed.height, data: composed.data };
}