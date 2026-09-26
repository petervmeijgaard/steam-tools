import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type DragEvent } from "react";

import { browserCanvas, paintImage } from "../grid/browser-canvas.ts";
import { composeGrid, type GridImage } from "../grid/compose-grid.ts";
import { GRID_HEIGHT, GRID_WIDTH } from "../grid/grid-size.ts";
import { readArtwork } from "../grid/read-artwork.ts";
import { templates, type Template } from "../grid/templates.ts";

export const Route = createFileRoute("/")({ component: GridPage });

function GridPage() {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const requestId = useRef(0);
  const [template, setTemplate] = useState<Template>(templates[0]);
  const [artwork, setArtwork] = useState<GridImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || !artwork) return;

    composeGrid(
      { artwork, template: template.image, fit: "cover", offset: { x: 0, y: 0 } },
      browserCanvas(preview),
    );
  }, [artwork, template]);

  async function loadArtwork(file: File) {
    const id = ++requestId.current;
    try {
      const next = await readArtwork(file);
      if (id !== requestId.current) return;
      setArtwork(next);
      setError(null);
    } catch (caught) {
      if (id !== requestId.current) return;
      setError(caught instanceof Error ? caught.message : "That file isn't an image.");
    }
  }

  function takeDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void loadArtwork(file);
  }

  return (
    <div
      className="min-h-screen"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={takeDrop}
    >
      <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
        <h1 className="text-4xl font-bold">Grid</h1>

        <fieldset>
          <legend className="text-lg font-medium">Template</legend>
          <div className="mt-3 flex gap-3">
            {templates.map((item) => (
              <TemplateChoice
                key={item.name}
                template={item}
                selected={item === template}
                onSelect={() => setTemplate(item)}
              />
            ))}
          </div>
        </fieldset>

        <div
          className={`flex flex-col items-start gap-3 rounded-lg border border-dashed p-4 ${dragging ? "border-black bg-neutral-100" : "border-neutral-300"}`}
        >
          <label className="text-lg font-medium">
            {artwork ? "Replace artwork" : "Artwork"}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void loadArtwork(file);
              }}
              className="mt-2 block text-sm"
            />
          </label>
          <p className="text-sm text-neutral-600">Or drop an image on the page. It stays on this device.</p>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        {artwork ? (
          <canvas
            ref={previewRef}
            width={GRID_WIDTH}
            height={GRID_HEIGHT}
            aria-label="Preview of the grid"
            className="aspect-[2/3] h-auto w-72"
          />
        ) : (
          <p className="text-neutral-600">Add artwork to preview the grid.</p>
        )}
      </main>
    </div>
  );
}

function TemplateChoice({
  template,
  selected,
  onSelect,
}: {
  template: Template;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 rounded-md p-2 ${selected ? "ring-2 ring-black" : "ring-1 ring-neutral-200"}`}
    >
      <canvas
        ref={(canvas) => {
          if (canvas) paintImage(canvas, template.image);
        }}
        width={GRID_WIDTH}
        height={GRID_HEIGHT}
        aria-hidden="true"
        className="aspect-[2/3] h-auto w-16 bg-neutral-100"
      />
      <span className="text-sm">{template.name}</span>
    </button>
  );
}
