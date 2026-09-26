import { type GridImage } from "./compose-grid.ts";
import { GRID_HEIGHT, GRID_WIDTH } from "./grid-size.ts";

function solid(width: number, height: number, rgba: [number, number, number, number]): GridImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgba[0];
    data[i + 1] = rgba[1];
    data[i + 2] = rgba[2];
    data[i + 3] = rgba[3];
  }
  return { width, height, data };
}

// Stand-ins until real artwork and templates arrive. The artwork is wider
// than 2:3 so the default cover crop is visible; the template frames it with
// an opaque border and is transparent everywhere else.
export const fixtureArtwork = solid(900, 600, [40, 80, 160, 255]);

export const fixtureTemplate: GridImage = solid(GRID_WIDTH, GRID_HEIGHT, [0, 0, 0, 0]);

const BORDER = 24;
for (let y = 0; y < GRID_HEIGHT; y++) {
  for (let x = 0; x < GRID_WIDTH; x++) {
    const onBorder = x < BORDER || y < BORDER || x >= GRID_WIDTH - BORDER || y >= GRID_HEIGHT - BORDER;
    if (!onBorder) continue;
    const i = (y * GRID_WIDTH + x) * 4;
    fixtureTemplate.data[i] = 20;
    fixtureTemplate.data[i + 1] = 20;
    fixtureTemplate.data[i + 2] = 20;
    fixtureTemplate.data[i + 3] = 255;
  }
}