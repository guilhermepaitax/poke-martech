"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectField } from "@/components/ui/select-field";
import { SwitchField } from "@/components/ui/switch-field";
import { useToast } from "@/components/ui/toaster";
import type { CellKind, MapGrid } from "@/lib/arena/map-grid";
import type { ArenaMap } from "@/lib/arena/map";
import {
  ClipboardCopy,
  Eraser,
  Maximize,
  Minimize,
  RotateCcw,
  Trash2,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import { useMapEditor, type EditorTool } from "./use-map-editor";

// Cores da malha e das referências. Água fica em magenta para não sumir no
// azul da arte; a legenda abaixo da barra usa as mesmas cores.
const CELL_COLOR: Record<CellKind, string> = {
  blocked: "rgb(255 48 48 / 0.5)",
  water: "rgb(232 64 255 / 0.5)",
};
const CELL_EDGE: Record<CellKind, string> = {
  blocked: "rgb(255 48 48)",
  water: "rgb(232 64 255)",
};
const SPAWN_COLOR = "#3ddc84";
const OBSTACLE_COLOR = "#ffd23a";

const LEGEND = [
  {
    label: "Bloqueado — ninguém passa andando",
    color: CELL_COLOR.blocked,
    edge: CELL_EDGE.blocked,
    shape: "cell",
  },
  {
    label: "Água — só quem nada",
    color: CELL_COLOR.water,
    edge: CELL_EDGE.water,
    shape: "cell",
  },
  {
    label: "Spawn dos lutadores",
    color: "transparent",
    edge: SPAWN_COLOR,
    shape: "ring",
  },
  {
    label: "Obstáculo quebrável",
    color: "transparent",
    edge: OBSTACLE_COLOR,
    shape: "ring",
  },
] as const;

const TOOL_OPTIONS = [
  { value: "blocked", label: "Bloqueado (B)" },
  { value: "water", label: "Água (A)" },
  { value: "erase", label: "Borracha (E)" },
] satisfies { value: EditorTool; label: string }[];

const CELL_OPTIONS = [8, 16, 24, 32].map((size) => ({
  value: `${size}`,
  label: `${size}px`,
}));
// "fit" cabe na área visível; número = escala sobre o tamanho real da arte.
const ZOOM_OPTIONS = [
  { value: "fit", label: "Ajustar" },
  { value: "1", label: "100%" },
  { value: "1.5", label: "150%" },
  { value: "2", label: "200%" },
];
const BRUSH_OPTIONS = [1, 2, 3].map((size) => ({
  value: `${size}`,
  label: `${size * 2 - 1}×${size * 2 - 1}`,
}));

function drawEditor(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  map: ArenaMap,
  grid: MapGrid,
  references: boolean,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  canvas.width = grid.artWidth;
  canvas.height = grid.artHeight;
  context.imageSmoothingEnabled = !map.background.pixelArt;
  context.drawImage(image, 0, 0);
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const kind = grid.cells[row * grid.cols + col];
      if (!kind) continue;
      context.fillStyle = CELL_COLOR[kind];
      context.fillRect(col * grid.cell, row * grid.cell, grid.cell, grid.cell);
      context.strokeStyle = CELL_EDGE[kind];
      context.lineWidth = 1;
      context.strokeRect(
        col * grid.cell + 1.5,
        row * grid.cell + 1.5,
        grid.cell - 3,
        grid.cell - 3,
      );
    }
  }
  context.strokeStyle = "rgb(255 255 255 / 0.25)";
  context.lineWidth = 1;
  context.beginPath();
  for (let col = 0; col <= grid.cols; col += 1) {
    context.moveTo(col * grid.cell + 0.5, 0);
    context.lineTo(col * grid.cell + 0.5, grid.artHeight);
  }
  for (let row = 0; row <= grid.rows; row += 1) {
    context.moveTo(0, row * grid.cell + 0.5);
    context.lineTo(grid.artWidth, row * grid.cell + 0.5);
  }
  context.stroke();
  if (!references) return;
  // Spawn e centro dos obstáculos quebráveis.
  const marks = [
    ...(map.spawn
      ? [map.spawn.player, map.spawn.opponent].map((at) => ({
          at,
          color: SPAWN_COLOR,
        }))
      : []),
    ...map.obstacles.map((spec) => ({
      at: { x: spec.x, y: spec.y },
      color: OBSTACLE_COLOR,
    })),
  ];
  for (const { at, color } of marks) {
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(
      at.x * grid.artWidth,
      at.y * grid.artHeight,
      14,
      0,
      Math.PI * 2,
    );
    context.stroke();
  }
}

function MapEditor() {
  const editor = useMapEditor();
  const { pushToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stroke = useRef<{
    value: CellKind | null;
    last: [number, number];
  } | null>(null);
  const [references, setReferences] = useState(true);
  const [exported, setExported] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [zoom, setZoom] = useState("fit");
  const [fullscreen, setFullscreen] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () =>
      setFullscreen(document.fullscreenElement === workspaceRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void workspaceRef.current?.requestFullscreen();
  }
  const { art, grid, map } = editor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !art || !grid) return;
    drawEditor(canvas, art.image, map, grid, references);
  }, [art, grid, map, references]);

  // Atalhos: B / A / E trocam a ferramenta, Ctrl+Z desfaz.
  const { setTool, undo } = editor;
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea")
      )
        return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
        return;
      }
      const tool = { b: "blocked", a: "water", e: "erase" }[
        event.key.toLowerCase()
      ] as EditorTool | undefined;
      if (tool) setTool(tool);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setTool, undo]);

  function cellAt(
    event: PointerEvent<HTMLCanvasElement>,
  ): [number, number] | null {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return null;
    const box = canvas.getBoundingClientRect();
    // Com `object-contain` a arte pode ter faixas vazias: desconta antes de converter.
    const scale = Math.min(
      box.width / grid.artWidth,
      box.height / grid.artHeight,
    );
    const left = box.left + (box.width - grid.artWidth * scale) / 2;
    const top = box.top + (box.height - grid.artHeight * scale) / 2;
    const x = (event.clientX - left) / scale;
    const y = (event.clientY - top) / scale;
    const col = Math.floor(x / grid.cell);
    const row = Math.floor(y / grid.cell);
    if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return null;
    return [col, row];
  }

  // Pinta a linha entre a célula anterior e a atual para o arrasto não falhar.
  function paintLine(
    from: [number, number],
    to: [number, number],
    value: CellKind | null,
  ) {
    const steps = Math.max(
      Math.abs(to[0] - from[0]),
      Math.abs(to[1] - from[1]),
      1,
    );
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      editor.paint(
        Math.round(from[0] + (to[0] - from[0]) * t),
        Math.round(from[1] + (to[1] - from[1]) * t),
        value,
      );
    }
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const at = cellAt(event);
    if (!at) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const erase = event.button === 2 || editor.tool === "erase";
    const value = erase ? null : (editor.tool as CellKind);
    editor.beginStroke();
    stroke.current = { value, last: at };
    editor.paint(at[0], at[1], value);
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const current = stroke.current;
    if (!current) return;
    const at = cellAt(event);
    if (!at || (at[0] === current.last[0] && at[1] === current.last[1])) return;
    paintLine(current.last, at, current.value);
    current.last = at;
  }

  function endStroke() {
    stroke.current = null;
  }

  async function exportAreas() {
    const text = editor.exportText();
    setExported(text);
    const target = `src/lib/arena/maps/${map.id}.ts`;
    try {
      await navigator.clipboard.writeText(text);
      pushToast({
        tone: "success",
        title: `Copiado: ${editor.counts.blocked} bloqueadas, ${editor.counts.water} água`,
        description: `Cole no lugar de blockedAreas/waterAreas em ${target}.`,
      });
    } catch {
      pushToast({
        tone: "error",
        title: "Não foi possível copiar",
        description: "Copie o texto abaixo da malha manualmente.",
      });
    }
  }

  return (
    <section data-slot="map-editor" className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Editor de mapas
        </h1>
        <p className="text-sm text-foreground-subtle">
          Pinte na malha as áreas bloqueadas e de água. Exportar copia os arrays
          para o arquivo do mapa.
        </p>
      </header>

      <div
        ref={workspaceRef}
        className={cn(
          "flex flex-col gap-4",
          fullscreen && "h-dvh bg-background p-4",
        )}
      >
        <div className="glass flex flex-wrap items-end gap-3 rounded-3xl p-3">
          <div className="w-56">
            <SelectField
              ariaLabel="Mapa"
              value={map.id}
              onValueChange={(id) => {
                setExported("");
                editor.setMapId(id);
              }}
              options={editor.maps.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
          </div>
          <SegmentedControl
            ariaLabel="Ferramenta"
            value={editor.tool}
            onValueChange={(value) => editor.setTool(value as EditorTool)}
            options={TOOL_OPTIONS}
          />
          <SegmentedControl
            ariaLabel="Tamanho da célula"
            value={`${editor.cell}`}
            onValueChange={(value) => editor.changeCell(Number(value))}
            options={CELL_OPTIONS}
          />
          <SegmentedControl
            ariaLabel="Tamanho do pincel"
            value={`${editor.brush}`}
            onValueChange={(value) => editor.setBrush(Number(value))}
            options={BRUSH_OPTIONS}
          />
          <SegmentedControl
            ariaLabel="Zoom"
            value={zoom}
            onValueChange={setZoom}
            options={ZOOM_OPTIONS}
          />
          <SwitchField
            label="Spawn e obstáculos"
            checked={references}
            onCheckedChange={setReferences}
          />
          <ul
            aria-label="Legenda"
            className="flex w-full flex-wrap gap-x-4 gap-y-1.5 text-xs text-foreground-subtle"
          >
            {LEGEND.filter((item) => references || item.shape === "cell").map(
              (item) => (
                <li key={item.label} className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={cn(
                      "size-3.5 shrink-0 border-2",
                      item.shape === "ring" ? "rounded-full" : "rounded-sm",
                    )}
                    style={{ background: item.color, borderColor: item.edge }}
                  />
                  {item.label}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={exportAreas} disabled={!grid}>
            <ClipboardCopy aria-hidden className="size-4" />
            Exportar áreas
          </Button>
          <Button variant="outline" onClick={editor.undo}>
            <Undo2 aria-hidden className="size-4" />
            Desfazer
          </Button>
          <Button variant="outline" onClick={editor.reset}>
            <RotateCcw aria-hidden className="size-4" />
            Recarregar do config
          </Button>
          <Button variant="outline" onClick={toggleFullscreen}>
            {fullscreen ? (
              <Minimize aria-hidden className="size-4" />
            ) : (
              <Maximize aria-hidden className="size-4" />
            )}
            {fullscreen ? "Sair da tela cheia" : "Tela cheia"}
          </Button>
          <Button variant="outline" onClick={() => setConfirmClear(true)}>
            <Trash2 aria-hidden className="size-4" />
            Limpar
          </Button>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-foreground-subtle">
            <Eraser aria-hidden className="size-3.5" />
            Botão direito apaga · {editor.counts.blocked} retângulos bloqueados
            · {editor.counts.water} de água
          </span>
        </div>

        <div
          className={cn(
            "overflow-auto rounded-2xl border border-white/70 bg-muted",
            fullscreen ? "min-h-0 flex-1" : "max-h-[85dvh]",
          )}
        >
          {grid && art ? (
            <canvas
              ref={canvasRef}
              aria-label={`Malha do mapa ${map.name}`}
              className={cn(
                "block cursor-crosshair touch-none",
                zoom === "fit" &&
                  (fullscreen
                    ? "h-full w-full object-contain"
                    : "h-auto w-full"),
              )}
              style={{
                imageRendering: map.background.pixelArt ? "pixelated" : "auto",
                width:
                  zoom === "fit" ? undefined : grid.artWidth * Number(zoom),
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              onContextMenu={(event) => event.preventDefault()}
            />
          ) : (
            <p role="status" className="p-6 text-sm text-foreground-subtle">
              Carregando mapa…
            </p>
          )}
        </div>
      </div>

      {exported ? (
        <label className="flex flex-col gap-2 text-sm font-medium">
          Último export
          <textarea
            readOnly
            value={exported}
            rows={Math.min(16, exported.split("\n").length)}
            onFocus={(event) => event.currentTarget.select()}
            className="glass rounded-2xl p-3 font-mono text-xs"
          />
        </label>
      ) : null}

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Limpar a malha?"
        description="Remove todas as áreas pintadas deste mapa. Dá para desfazer."
        confirmLabel="Limpar"
        onConfirm={() => {
          editor.clear();
          setConfirmClear(false);
        }}
      />
    </section>
  );
}

export { MapEditor };
