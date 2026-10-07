import { CARD_DECORATIONS, type CardDecorationId } from "@/lib/card-decorations";
import { cn } from "@/lib/utils";
import { CardDecoration } from "@/components/holo-card/card-decoration";
import { ImageDropzone } from "@/components/ui/image-dropzone";

function CardDecorationPicker({
  asset,
  imageUrl,
  uploading,
  error,
  onSelect,
  onFile,
}: {
  asset: CardDecorationId | null;
  imageUrl: string | null;
  uploading: boolean;
  error: string | null;
  onSelect: (asset: CardDecorationId | null) => void;
  onFile: (file: File) => void;
}) {
  return (
    <div data-slot="card-decoration-picker" className="flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground-subtle">Decoração</p>
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          aria-pressed={asset == null && !imageUrl}
          onClick={() => onSelect(null)}
          className="flex aspect-[63/88] items-center justify-center rounded-xl bg-white/50 text-xs font-medium text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:ring-2 aria-pressed:ring-primary"
        >
          Nenhuma
        </button>
        {CARD_DECORATIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={asset === item.id && !imageUrl}
            aria-label={item.label}
            onClick={() => onSelect(item.id)}
            className={cn(
              "relative aspect-[63/88] overflow-hidden rounded-xl bg-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:ring-2 aria-pressed:ring-primary",
            )}
          >
            <CardDecoration decorationAsset={item.id} decorationImageUrl={null} />
          </button>
        ))}
      </div>
      <ImageDropzone
        imageUrl={imageUrl}
        onFile={onFile}
        uploading={uploading}
        error={error}
        emptyText="Ou envie uma decoração"
        ariaLabel="Enviar decoração"
      />
    </div>
  );
}

export { CardDecorationPicker };
