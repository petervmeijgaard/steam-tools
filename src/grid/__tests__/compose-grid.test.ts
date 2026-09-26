import { describe, expect, it } from "vitest";

import { composeGrid } from "../compose-grid.ts";
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

// 90x30, wider than 2:3. Red everywhere except a blue strip in the rightmost
// third. Cover crops both sides and lands entirely on red; contain shows the
// whole image, so the right edge of the frame lands on blue.
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
  it("returns a grid of exactly 600 by 900", () => {
    const artwork = solidImage(2, 3, [255, 0, 0, OPAQUE]);
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    const grid = composeGrid({
      artwork,
      template,
      fit: "cover",
      offset: { x: 0, y: 0 },
    }, canvas);

    expect(grid.width).toBe(600);
    expect(grid.height).toBe(900);
  });

  it("covers the frame with a wide artwork and crops the overflow", () => {
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    const grid = composeGrid({
      artwork: wideArtwork(),
      template,
      fit: "cover",
      offset: { x: 0, y: 0 },
    }, canvas);

    expect(pixel(grid, 0, 450)).toEqual([255, 0, 0, OPAQUE]);
    expect(pixel(grid, 599, 450)).toEqual([255, 0, 0, OPAQUE]);
    expect(pixel(grid, 300, 450)).toEqual([255, 0, 0, OPAQUE]);
  });

  it("fits a wide artwork inside the frame and shows the template in the gaps", () => {
    // Green only in the bars above and below the artwork; transparent across
    // the band the artwork occupies, so it doesn't hide it.
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);
    for (let y = 0; y < 350; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const i = (y * GRID_WIDTH + x) * 4;
        template.data[i + 1] = 255;
        template.data[i + 3] = OPAQUE;
      }
    }

    const grid = composeGrid({
      artwork: wideArtwork(),
      template,
      fit: "contain",
      offset: { x: 0, y: 0 },
    }, canvas);

    // The whole artwork is visible, so the right edge reaches the blue strip.
    expect(pixel(grid, 599, 450)).toEqual([0, 0, 255, OPAQUE]);
    // The artwork is only 200px tall, centred, so the frame above it is template.
    expect(pixel(grid, 300, 0)).toEqual([0, 255, 0, OPAQUE]);
  });

  it("crops nothing and ignores the offset when artwork is already 2:3", () => {
    // 20x30, exactly 2:3. Blue everywhere except a red pixel in the top-left
    // corner, which must survive even with an offset pushing it away.
    const artwork = solidImage(20, 30, [0, 0, 255, OPAQUE]);
    artwork.data[0] = 255;
    artwork.data[2] = 0;
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    const grid = composeGrid({
      artwork,
      template,
      fit: "cover",
      offset: { x: 5, y: 5 },
    }, canvas);

    expect(pixel(grid, 0, 0)).toEqual([255, 0, 0, OPAQUE]);
    expect(pixel(grid, 599, 899)).toEqual([0, 0, 255, OPAQUE]);
  });

  it("shifts the crop with the offset, and never leaves the frame short", () => {
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

    // Panning right by 30 source pixels brings the blue strip, which starts
    // at x=60, into the frame.
    const panned = composeGrid({
      artwork: wideArtwork(),
      template,
      fit: "cover",
      offset: { x: 30, y: 0 },
    }, canvas);
    expect(pixel(panned, 599, 450)).toEqual([0, 0, 255, OPAQUE]);

    // An offset far beyond the artwork can't expose a gap: the frame stays
    // covered, clamped to the artwork's far edge.
    const clamped = composeGrid({
      artwork: wideArtwork(),
      template,
      fit: "cover",
      offset: { x: 1000, y: 0 },
    }, canvas);
    expect(pixel(clamped, 0, 450)[3]).toBe(OPAQUE);
    expect(pixel(clamped, 599, 450)).toEqual([0, 0, 255, OPAQUE]);
  });

  it("lets the template's opaque pixels win over the artwork", () => {
    const artwork = solidImage(WIDE_WIDTH, WIDE_HEIGHT, [255, 0, 0, OPAQUE]);
    const template = solidImage(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);
    // A single opaque green pixel in the template's corner.
    template.data[1] = 255;
    template.data[3] = OPAQUE;

    const grid = composeGrid({
      artwork,
      template,
      fit: "cover",
      offset: { x: 0, y: 0 },
    }, canvas);

    expect(pixel(grid, 0, 0)).toEqual([0, 255, 0, OPAQUE]);
    expect(pixel(grid, 1, 0)).toEqual([255, 0, 0, OPAQUE]);
  });
});
