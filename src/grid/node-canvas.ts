import { createCanvas, ImageData } from "@napi-rs/canvas";

import { type Canvas, type GridImage } from "./compose-grid.ts";
import { GRID_HEIGHT, GRID_WIDTH } from "./grid-size.ts";

// Adapts @napi-rs/canvas to the browser canvas types the compositor expects.
// The casts are confined here because the library mirrors the browser API
// without sharing its types.
export function nodeCanvas(): Canvas {
  const frame = createCanvas(GRID_WIDTH, GRID_HEIGHT);

  return {
    context: frame.getContext("2d") as unknown as CanvasRenderingContext2D,
    load(image: GridImage) {
      const canvas = createCanvas(image.width, image.height);
      canvas
        .getContext("2d")
        .putImageData(
          new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
          0,
          0,
        );
      return canvas as unknown as CanvasImageSource;
    },
  };
}