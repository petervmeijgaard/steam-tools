import { createFileRoute } from "@tanstack/react-router";

import { browserCanvas } from "../grid/browser-canvas.ts";
import { composeGrid } from "../grid/compose-grid.ts";
import { GRID_HEIGHT, GRID_WIDTH } from "../grid/grid-size.ts";
import { fixtureArtwork, fixtureTemplate } from "../grid/fixtures.ts";

export const Route = createFileRoute("/")({ component: GridPage });

function GridPage() {
  function draw(canvas: HTMLCanvasElement | null) {
    if (!canvas) return;

    composeGrid(
      { artwork: fixtureArtwork, template: fixtureTemplate, fit: "cover", offset: { x: 0, y: 0 } },
      browserCanvas(canvas),
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold">Grid</h1>
      <canvas
        ref={draw}
        width={GRID_WIDTH}
        height={GRID_HEIGHT}
        aria-label="A 600 by 900 grid composed from the bundled artwork and template"
        className="mt-4 w-72"
      />
    </main>
  );
}
