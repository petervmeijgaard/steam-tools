import { type Canvas, type GridImage } from "./compose-grid.ts";
import { GRID_HEIGHT, GRID_WIDTH } from "./grid-size.ts";

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

/**
 * Decodes a shipped template. A file that is not 600 by 900 is rejected.
 * The tool does not scale it.
 */
export function readTemplate(src: string): Promise<GridImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth !== GRID_WIDTH || image.naturalHeight !== GRID_HEIGHT) {
        reject(new Error("A template must be 600 by 900."));
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = GRID_WIDTH;
      canvas.height = GRID_HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas rendering is not available"));
        return;
      }
      context.drawImage(image, 0, 0);
      const decoded = context.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT);
      resolve({ width: decoded.width, height: decoded.height, data: decoded.data });
    };
    image.onerror = () => reject(new Error("That template could not be read."));
    image.src = src;
  });
}

// The Canvas the page draws with, painting straight onto the element it shows.
// The tests supply their own.
export function browserCanvas(frame: HTMLCanvasElement): Canvas {
  const context = frame.getContext("2d");
  if (!context) throw new Error("Canvas rendering is not available");

  return { context, load: asImage };
}