import { type GridImage } from "./compose-grid.ts";

/**
 * Decodes a local image file into artwork. Nothing is uploaded or fetched.
 * Rejects a file that is not an image.
 */
export async function readArtwork(file: File): Promise<GridImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("That file isn't an image.");
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is not available");
    context.drawImage(bitmap, 0, 0);
    const image = context.getImageData(0, 0, bitmap.width, bitmap.height);
    return { width: image.width, height: image.height, data: image.data };
  } finally {
    bitmap.close();
  }
}
