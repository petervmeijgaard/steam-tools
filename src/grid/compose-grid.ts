import { GRID_ASPECT, GRID_HEIGHT, GRID_WIDTH } from "./grid-size.ts";

export type Fit = "cover" | "contain";

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
 * The region of the artwork drawn into the frame, in source pixels.
 *
 * Contain uses all of it. Cover uses all of it on the shorter axis and crops
 * the longer one down to the frame's aspect, with the offset choosing which
 * part survives.
 */
function coverCrop(artwork: GridImage) {
  const wider = artwork.width / artwork.height > GRID_ASPECT;
  return wider
    ? { width: artwork.height * GRID_ASPECT, height: artwork.height }
    : { width: artwork.width, height: artwork.width / GRID_ASPECT };
}

/** How far the offset can move, in source pixels, before the frame shows a gap. */
function offsetLimit(artwork: GridImage): Offset {
  const crop = coverCrop(artwork);
  return {
    x: Math.max(0, (artwork.width - crop.width) / 2),
    y: Math.max(0, (artwork.height - crop.height) / 2),
  };
}

/**
 * Whether cover actually crops this artwork. An artwork that is already 2:3
 * has nothing to reposition.
 */
export function canReposition(artwork: GridImage): boolean {
  const limit = offsetLimit(artwork);
  return limit.x > 0 || limit.y > 0;
}

/**
 * The offset after a drag on the cover preview.
 *
 * `drag` is in canvas pixels, positive right and down. Dragging right reveals
 * the artwork's left side, so the offset decreases. The result is clamped so
 * the frame stays covered, and a drag on artwork that is already 2:3 changes
 * nothing.
 */
export function offsetAfterDrag(artwork: GridImage, start: Offset, drag: { x: number; y: number }): Offset {
  const crop = coverCrop(artwork);
  const limit = offsetLimit(artwork);
  return {
    x: limit.x === 0 ? 0 : clamp(start.x - drag.x / (GRID_WIDTH / crop.width), -limit.x, limit.x),
    y: limit.y === 0 ? 0 : clamp(start.y - drag.y / (GRID_HEIGHT / crop.height), -limit.y, limit.y),
  };
}

function sourceRect(artwork: GridImage, fit: Fit, offset: Offset) {
  if (fit === "contain") {
    return { x: 0, y: 0, width: artwork.width, height: artwork.height };
  }

  const crop = coverCrop(artwork);
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
 * Cover fills the frame. Contain leaves gaps on the shorter axis, where the
 * template shows through.
 */
function destination(artwork: GridImage, fit: Fit) {
  if (fit === "cover") return { x: 0, y: 0, width: GRID_WIDTH, height: GRID_HEIGHT };

  const aspect = artwork.width / artwork.height;
  return aspect > GRID_ASPECT
    ? { x: 0, y: (GRID_HEIGHT - GRID_WIDTH / aspect) / 2, width: GRID_WIDTH, height: GRID_WIDTH / aspect }
    : { x: (GRID_WIDTH - GRID_HEIGHT * aspect) / 2, y: 0, width: GRID_HEIGHT * aspect, height: GRID_HEIGHT };
}

/**
 * Composites artwork under a template into a 600 by 900 grid.
 *
 * Clears the canvas first, so a previous grid cannot show through. The artwork
 * is drawn cropped or letterboxed according to the fit, and the template is
 * drawn over it so the artwork shows through the template's transparent regions.
 */
export function composeGrid(input: GridInput, canvas: Canvas): GridImage {
  const source = sourceRect(input.artwork, input.fit, input.offset);
  const dest = destination(input.artwork, input.fit);
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