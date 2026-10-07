import { Stepper } from "@/components/ui/stepper";
import Image from "next/image";
import { useCardPlacement } from "./use-card-placement";

function CardPlacementEditor({
  imageUrl,
  x,
  y,
  scale,
  onPositionChange,
  onScaleChange,
}: {
  imageUrl: string;
  x: number;
  y: number;
  scale: number;
  onPositionChange: (position: { x: number; y: number }) => void;
  onScaleChange: (scale: number) => void;
}) {
  const drag = useCardPlacement(x, y, onPositionChange);
  return (
    <div data-slot="card-placement-editor" className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground-subtle">
        Arraste para posicionar
      </p>
      <div
        role="application"
        aria-label="Posição da imagem"
        className="relative aspect-17/10 cursor-grab touch-none overflow-hidden rounded-2xl bg-muted active:cursor-grabbing"
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
      >
        <Image
          src={imageUrl}
          alt=""
          fill
          draggable={false}
          className="pointer-events-none object-cover"
          style={{
            objectPosition: `${x}% ${y}%`,
            transform: `scale(${scale / 100})`,
          }}
          sizes="320px"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground-subtle">Escala</p>
        <Stepper
          ariaLabel="Escala da imagem"
          value={scale}
          min={40}
          max={220}
          step={10}
          onValueChange={onScaleChange}
        />
      </div>
    </div>
  );
}

export { CardPlacementEditor };
