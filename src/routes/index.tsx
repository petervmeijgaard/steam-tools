import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type DragEvent, type PointerEvent } from "react";

import { browserCanvas, readTemplate } from "../grid/browser-canvas.ts";
import {
  canReposition,
  composeGrid,
  offsetAfterDrag,
  type Fit,
  type GridImage,
  type Offset,
} from "../grid/compose-grid.ts";
import { GRID_HEIGHT, GRID_WIDTH } from "../grid/grid-size.ts";
import { readArtwork } from "../grid/read-artwork.ts";
import { initialTemplate, templates, type Template } from "../grid/templates.ts";

export const Route = createFileRoute("/")({ component: GridPage });

function GridPage() {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const requestId = useRef(0);
  const pan = useRef<{ x: number; y: number; offset: Offset } | null>(null);
  const [template, setTemplate] = useState<Template>(initialTemplate);
  const [templateImages, setTemplateImages] = useState<ReadonlyMap<string, GridImage>>(new Map());
  const [artwork, setArtwork] = useState<GridImage | null>(null);
  const [fit, setFit] = useState<Fit>("cover");
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const templateImage = templateImages.get(template.name);
  const repositionable = artwork !== null && fit === "cover" && canReposition(artwork, template.slot);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(templates.map(async (item) => [item.name, await readTemplate(item.src)] as const))
      .then((entries) => {
        if (!cancelled) setTemplateImages(new Map(entries));
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "That template could not be read.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || !artwork || !templateImage) return;

    composeGrid(
      { artwork, template: templateImage, slot: template.slot, fit, offset },
      browserCanvas(preview),
    );
  }, [artwork, template, templateImage, fit, offset]);

  async function loadArtwork(file: File) {
    const id = ++requestId.current;
    try {
      const next = await readArtwork(file);
      if (id !== requestId.current) return;
      setArtwork(next);
      setOffset({ x: 0, y: 0 });
      setError(null);
    } catch (caught) {
      if (id !== requestId.current) return;
      setError(caught instanceof Error ? caught.message : "That file isn't an image.");
    }
  }

  function beginPan(event: PointerEvent<HTMLCanvasElement>) {
    if (!repositionable || !artwork) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pan.current = { x: event.clientX, y: event.clientY, offset };
  }

  function endPan() {
    pan.current = null;
  }

  function movePan(event: PointerEvent<HTMLCanvasElement>) {
    if (!pan.current || !artwork || event.buttons === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setOffset(
      offsetAfterDrag(artwork, template.slot, pan.current.offset, {
        x: (event.clientX - pan.current.x) * (GRID_WIDTH / rect.width),
        y: (event.clientY - pan.current.y) * (GRID_HEIGHT / rect.height),
      }),
    );
  }

  function downloadGrid() {
    const preview = previewRef.current;
    if (!preview || !artwork || !templateImage) return;

    composeGrid(
      { artwork, template: templateImage, slot: template.slot, fit, offset },
      browserCanvas(preview),
    );
    const link = document.createElement("a");
    link.href = preview.toDataURL("image/png");
    link.download = "grid.png";
    link.click();
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
          <div className="mt-3 flex flex-wrap gap-3">
            {templates.map((item) => (
              <TemplateChoice
                key={item.name}
                template={item}
                selected={item === template}
                onSelect={() => {
                  if (item === template) return;
                  setTemplate(item);
                  setOffset({ x: 0, y: 0 });
                }}
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
          <div className="flex flex-col gap-3">
            <fieldset>
              <legend className="text-lg font-medium">Fit</legend>
              <div className="mt-2 flex gap-4 text-sm">
                <label>
                  <input
                    type="radio"
                    name="fit"
                    value="cover"
                    checked={fit === "cover"}
                    onChange={() => setFit("cover")}
                    className="mr-2"
                  />
                  Fill the Slot
                </label>
                <label>
                  <input
                    type="radio"
                    name="fit"
                    value="contain"
                    checked={fit === "contain"}
                    onChange={() => setFit("contain")}
                    className="mr-2"
                  />
                  Fit inside the Slot
                </label>
              </div>
            </fieldset>
            <canvas
              ref={previewRef}
              width={GRID_WIDTH}
              height={GRID_HEIGHT}
              aria-label={
                repositionable ? "Preview of the grid. Drag to reposition the crop." : "Preview of the grid"
              }
              onPointerDown={repositionable ? beginPan : undefined}
              onPointerMove={repositionable ? movePan : undefined}
              onPointerUp={endPan}
              onPointerCancel={endPan}
              onLostPointerCapture={endPan}
              className={`aspect-[2/3] h-auto w-72 ${repositionable ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
            />
            {repositionable && (
              <p className="text-sm text-neutral-600">Drag the preview to choose which part stays.</p>
            )}
          </div>
        ) : (
          <p className="text-neutral-600">Add artwork to preview the grid.</p>
        )}

        <button
          type="button"
          onClick={downloadGrid}
          disabled={!artwork || !templateImage}
          className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Download grid
        </button>
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
      <img
        src={template.src}
        alt=""
        width={GRID_WIDTH}
        height={GRID_HEIGHT}
        className="aspect-[2/3] h-auto w-16 bg-neutral-100"
      />
      <span className="text-sm">{template.name}</span>
    </button>
  );
}
