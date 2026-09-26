import { describe, expect, it } from "vitest";

import { canReposition, composeGrid, offsetAfterDrag } from "../compose-grid.ts";
import { GRID_HEIGHT, GRID_WIDTH } from "../grid-size.ts";
import { nodeCanvas } from "../node-canvas.ts";

const OPAQUE = 255;

const canvas = nodeCanvas();

function solidImage(
  width: number,
  height: number,
  rgba: [number, number, number, number],
) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgba[0];
    data[i + 1] = rgba[1];
    data[i + 2] = rgba[2];
    data[i + 3] = rgba[3];
  }
  return { width, height, data };
}

function pixel(
  image: { data: Uint8ClampedArray; width: number },
  x: number,
  y: number,
): [number, number, number, number] {
  const i = (y * image.width + x) * 4;
  return [image.data[i], image.data[i + 1], image.data[i + 2], image.data[i + 3]];
}

// 90x30. Red everywhere except a blue strip in the rightmost third, from x=60.
const WIDE_WIDTH = 90;
const WIDE_HEIGHT = 30;

function wideArtwork() {
  const image = solidImage(WIDE_WIDTH, WIDE_HEIGHT, [255, 0, 0, OPAQUE]);
  for (let y = 0; y < WIDE_HEIGHT; y++) {
    for (let x = 60; x < WIDE_WIDTH; x++) {
      const i = (y * WIDE_WIDTH + x) * 4;
      image.data[i] = 0;
      image.data[i + 2] = 255;
    }
  }
  return image;
}

describe("composeGrid", () => {
  it("draws artwork inside the Slot and leaves the grid outside it empty", () => {
    const slot = { x: 100, y: 150, width: 200, height: 300 };
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    const grid = composeGrid(
      {
        artwork: solidImage(10, 10, [255, 0, 0, OPAQUE]),
        template,
        slot,
        fit: "cover",
        offset: { x: 0, y: 0 },
      },
      canvas,
    );

    expect(pixel(grid, 100, 150)).toEqual([255, 0, 0, OPAQUE]);
    expect(pixel(grid, 299, 449)).toEqual([255, 0, 0, OPAQUE]);
    expect(pixel(grid, 99, 200)).toEqual([0, 0, 0, 0]);
    expect(pixel(grid, 300, 200)).toEqual([0, 0, 0, 0]);
    expect(pixel(grid, 200, 149)).toEqual([0, 0, 0, 0]);
    expect(pixel(grid, 200, 450)).toEqual([0, 0, 0, 0]);
  });

  it("lets a stem inside the Slot hide the artwork under it", () => {
    const slot = { x: 100, y: 100, width: 200, height: 200 };
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);
    for (let y = slot.y; y < slot.y + slot.height; y++) {
      const i = (y * GRID_WIDTH + 200) * 4;
      template.data[i + 1] = 255;
      template.data[i + 3] = OPAQUE;
    }

    const grid = composeGrid(
      {
        artwork: solidImage(20, 20, [255, 0, 0, OPAQUE]),
        template,
        slot,
        fit: "cover",
        offset: { x: 0, y: 0 },
      },
      canvas,
    );

    expect(pixel(grid, 200, 200)).toEqual([0, 255, 0, OPAQUE]);
    expect(pixel(grid, 150, 200)).toEqual([255, 0, 0, OPAQUE]);
  });

  it("leaves uncovered Slot pixels transparent when the artwork fits inside", () => {
    // Slot is 3:1. Artwork is square, so contain leaves bars on either side.
    const slot = { x: 40, y: 80, width: 300, height: 100 };
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    const grid = composeGrid(
      {
        artwork: solidImage(20, 20, [255, 0, 0, OPAQUE]),
        template,
        slot,
        fit: "contain",
        offset: { x: 0, y: 0 },
      },
      canvas,
    );

    expect(pixel(grid, 40, 130)).toEqual([0, 0, 0, 0]);
    expect(pixel(grid, 190, 130)).toEqual([255, 0, 0, OPAQUE]);
    expect(pixel(grid, 339, 130)).toEqual([0, 0, 0, 0]);
  });

  it("leaves gaps above and below when the artwork is wider than the Slot", () => {
    const slot = { x: 20, y: 40, width: 100, height: 200 };
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    const grid = composeGrid(
      {
        artwork: wideArtwork(),
        template,
        slot,
        fit: "contain",
        offset: { x: 0, y: 0 },
      },
      canvas,
    );

    expect(pixel(grid, 70, 40)).toEqual([0, 0, 0, 0]);
    expect(pixel(grid, 70, 140)).toEqual([255, 0, 0, OPAQUE]);
  });

  it("crops cover to the Slot's aspect, not the grid's 2:3", () => {
    // Slot is 2:1. The wide artwork's blue strip is on the right. A 2:3 crop
    // never reaches it; a crop to this Slot does.
    const slot = { x: 0, y: 0, width: 400, height: 200 };
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    const grid = composeGrid(
      {
        artwork: wideArtwork(),
        template,
        slot,
        fit: "cover",
        offset: { x: 0, y: 0 },
      },
      canvas,
    );

    expect(pixel(grid, 100, 100)).toEqual([255, 0, 0, OPAQUE]);
    expect(pixel(grid, 350, 100)).toEqual([0, 0, 255, OPAQUE]);
  });

  it("shifts the crop inside the Slot, and a wild offset cannot leave it uncovered", () => {
    const slot = { x: 0, y: 0, width: 400, height: 200 };
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    const centered = composeGrid(
      {
        artwork: wideArtwork(),
        template,
        slot,
        fit: "cover",
        offset: { x: 0, y: 0 },
      },
      canvas,
    );
    expect(pixel(centered, 250, 100)).toEqual([255, 0, 0, OPAQUE]);

    const panned = composeGrid(
      {
        artwork: wideArtwork(),
        template,
        slot,
        fit: "cover",
        offset: { x: 15, y: 0 },
      },
      canvas,
    );
    expect(pixel(panned, 250, 100)).toEqual([0, 0, 255, OPAQUE]);

    const clamped = composeGrid(
      {
        artwork: wideArtwork(),
        template,
        slot,
        fit: "cover",
        offset: { x: 1000, y: 0 },
      },
      canvas,
    );
    expect(pixel(clamped, 0, 100)[3]).toBe(OPAQUE);
    expect(pixel(clamped, 399, 100)).toEqual([0, 0, 255, OPAQUE]);
  });

  it("ignores the offset when the artwork already matches the Slot", () => {
    // 40x20 is 2:1, like the Slot, and not 2:3. A red pixel in the corner
    // must survive an offset that would push it away if the crop used 2:3.
    const slot = { x: 10, y: 20, width: 200, height: 100 };
    const artwork = solidImage(40, 20, [0, 0, 255, OPAQUE]);
    artwork.data[0] = 255;
    artwork.data[2] = 0;
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    const grid = composeGrid(
      {
        artwork,
        template,
        slot,
        fit: "cover",
        offset: { x: 10, y: 5 },
      },
      canvas,
    );

    expect(pixel(grid, 10, 20)).toEqual([255, 0, 0, OPAQUE]);
    expect(pixel(grid, 209, 119)).toEqual([0, 0, 255, OPAQUE]);
  });

  it("moves the offset opposite the drag, scaled to the Slot", () => {
    const artwork = solidImage(WIDE_WIDTH, WIDE_HEIGHT, [0, 0, 0, OPAQUE]);
    const slot = { x: 0, y: 0, width: 300, height: 300 };

    // Crop is 30 source pixels wide, drawn across a 300px Slot, so 10 grid
    // pixels is one source pixel. Dragging right reveals the left side.
    expect(offsetAfterDrag(artwork, slot, { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({ x: -1, y: 0 });

    const clamped = offsetAfterDrag(artwork, slot, { x: 0, y: 0 }, { x: -100_000, y: 0 });
    expect(clamped.x).toBe(30);
    expect(clamped.y).toBe(0);
  });

  it("scales a downward drag by the Slot, not the grid", () => {
    const artwork = solidImage(30, 90, [0, 0, 0, OPAQUE]);
    const slot = { x: 0, y: 0, width: 300, height: 300 };

    // Crop is 30 source pixels tall, drawn across a 300px Slot, so 10 grid
    // pixels is one source pixel. Dragging down reveals the top.
    expect(offsetAfterDrag(artwork, slot, { x: 0, y: 0 }, { x: 0, y: 10 })).toEqual({ x: 0, y: -1 });
  });

  it("ignores a drag when the artwork already matches the Slot", () => {
    const artwork = solidImage(40, 20, [0, 0, 0, OPAQUE]);
    const slot = { x: 0, y: 0, width: 200, height: 100 };

    expect(offsetAfterDrag(artwork, slot, { x: 5, y: 5 }, { x: 100, y: 80 })).toEqual({ x: 5, y: 5 });
  });

  it("can reposition only when cover crops against the Slot", () => {
    const slot = { x: 0, y: 0, width: 100, height: 100 };

    expect(canReposition(solidImage(101, 100, [0, 0, 0, OPAQUE]), slot)).toBe(true);
    expect(canReposition(solidImage(100, 100, [0, 0, 0, OPAQUE]), slot)).toBe(false);
  });

  it("shows the whole artwork inside the Slot", () => {
    // Slot is 4:1. The artwork is 3:1, so contain leaves side gaps and the
    // blue strip on the artwork's right stays visible.
    const slot = { x: 0, y: 50, width: 400, height: 100 };
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    const grid = composeGrid(
      {
        artwork: wideArtwork(),
        template,
        slot,
        fit: "contain",
        offset: { x: 0, y: 0 },
      },
      canvas,
    );

    expect(pixel(grid, 10, 100)).toEqual([0, 0, 0, 0]);
    expect(pixel(grid, 100, 100)).toEqual([255, 0, 0, OPAQUE]);
    expect(pixel(grid, 300, 100)).toEqual([0, 0, 255, OPAQUE]);
  });

  it("returns a grid of exactly 600 by 900", () => {
    const slot = { x: 24, y: 24, width: 552, height: 852 };
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    const grid = composeGrid(
      {
        artwork: solidImage(2, 3, [255, 0, 0, OPAQUE]),
        template,
        slot,
        fit: "cover",
        offset: { x: 0, y: 0 },
      },
      canvas,
    );

    expect(grid.width).toBe(600);
    expect(grid.height).toBe(900);
  });

  it("replaces the previous grid instead of painting over it", () => {
    const slot = { x: 0, y: 0, width: GRID_WIDTH, height: GRID_HEIGHT };
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    composeGrid(
      {
        artwork: solidImage(WIDE_WIDTH, WIDE_HEIGHT, [255, 0, 0, OPAQUE]),
        template,
        slot,
        fit: "cover",
        offset: { x: 0, y: 0 },
      },
      canvas,
    );

    const grid = composeGrid(
      {
        artwork: solidImage(WIDE_WIDTH, WIDE_HEIGHT, [0, 0, 0, 0]),
        template,
        slot,
        fit: "cover",
        offset: { x: 0, y: 0 },
      },
      canvas,
    );

    expect(pixel(grid, 300, 450)).toEqual([0, 0, 0, 0]);
  });
});
