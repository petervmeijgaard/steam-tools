import { type GridImage, type Slot } from "./compose-grid.ts";
import { GRID_HEIGHT, GRID_WIDTH } from "./grid-size.ts";

export type Template = {
  name: string;
  image: GridImage;
  slot: Slot;
};

const INK: [number, number, number, number] = [20, 20, 20, 255];

function solid(rgba: [number, number, number, number]): GridImage {
  const data = new Uint8ClampedArray(GRID_WIDTH * GRID_HEIGHT * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgba[0];
    data[i + 1] = rgba[1];
    data[i + 2] = rgba[2];
    data[i + 3] = rgba[3];
  }
  return { width: GRID_WIDTH, height: GRID_HEIGHT, data };
}

/** Paints a rectangle of the grid. Coordinates are in grid pixels. */
function fillRect(
  image: GridImage,
  x: number,
  y: number,
  width: number,
  height: number,
  rgba: [number, number, number, number],
) {
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      const i = (row * image.width + col) * 4;
      image.data[i] = rgba[0];
      image.data[i + 1] = rgba[1];
      image.data[i + 2] = rgba[2];
      image.data[i + 3] = rgba[3];
    }
  }
}

/** A template that is a solid border, transparent inside. */
function border(thickness: number): GridImage {
  const image = solid([0, 0, 0, 0]);
  fillRect(image, 0, 0, GRID_WIDTH, thickness, INK);
  fillRect(image, 0, GRID_HEIGHT - thickness, GRID_WIDTH, thickness, INK);
  fillRect(image, 0, 0, thickness, GRID_HEIGHT, INK);
  fillRect(image, GRID_WIDTH - thickness, 0, thickness, GRID_HEIGHT, INK);
  return image;
}

/** A template that is an L-shaped mark in each corner, transparent elsewhere. */
function corners(arm: number, thickness: number): GridImage {
  const image = solid([0, 0, 0, 0]);
  const right = GRID_WIDTH - arm;
  const bottom = GRID_HEIGHT - arm;
  const farX = GRID_WIDTH - thickness;
  const farY = GRID_HEIGHT - thickness;

  for (const [x, y] of [
    [0, 0],
    [right, 0],
    [0, bottom],
    [right, bottom],
  ] as const) {
    fillRect(image, x, y === 0 ? 0 : farY, arm, thickness, INK);
    fillRect(image, x === 0 ? 0 : farX, y, thickness, arm, INK);
  }

  return image;
}

const BORDER_THICKNESS = 24;

/** The templates shipped with the tool. Adding one is a code change. */
export const templates: readonly Template[] = [
  {
    name: "Border",
    image: border(BORDER_THICKNESS),
    slot: {
      x: BORDER_THICKNESS,
      y: BORDER_THICKNESS,
      width: GRID_WIDTH - BORDER_THICKNESS * 2,
      height: GRID_HEIGHT - BORDER_THICKNESS * 2,
    },
  },
  {
    name: "Corners",
    image: corners(120, 16),
    slot: { x: 0, y: 0, width: GRID_WIDTH, height: GRID_HEIGHT },
  },
];
