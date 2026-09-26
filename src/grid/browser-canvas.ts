import { type Canvas, type GridImage } from "./compose-grid.ts";

/** Paints a grid image onto a canvas at its native size. */
export function paintImage(canvas: HTMLCanvasElement, image: GridImage) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is not available");
  context.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
}

function asImage(image: GridImage): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  paintImage(canvas, image);
  return canvas;
}

// The Canvas the page draws with, painting straight onto the element it shows.
// The tests supply their own.
export function browserCanvas(frame: HTMLCanvasElement): Canvas {
  const context = frame.getContext("2d");
  if (!context) throw new Error("Canvas rendering is not available");

  return { context, load: asImage };
}