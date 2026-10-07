"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  imageUrl: string | null;
  onFile: (file: File) => void;
  uploading?: boolean;
  error?: string | null;
  emptyText?: string;
  ariaLabel?: string;
}

function ImageDropzone({
  imageUrl,
  onFile,
  uploading = false,
  error,
  emptyText = "Solte a imagem ou clique para enviar",
  ariaLabel = "Enviar imagem",
}: ImageDropzoneProps) {
  const [over, setOver] = useState(false);

  function take(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    onFile(file);
  }

  return (
    <div data-slot="image-dropzone" className="flex flex-col gap-2">
      <label
        data-over={over ? "" : undefined}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          take(event.dataTransfer.files[0]);
        }}
        className={cn(
          "glass flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl p-4 text-center text-sm text-foreground-subtle focus-within:ring-2 focus-within:ring-ring data-over:bg-white/80",
        )}
      >
        {imageUrl ? (
          <span className="relative aspect-[63/88] w-28 overflow-hidden rounded-2xl">
            <Image src={imageUrl} alt="" fill className="object-cover" sizes="112px" />
          </span>
        ) : (
          <span>{uploading ? "Enviando imagem..." : emptyText}</span>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label={ariaLabel}
          onChange={(event) => {
            take(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export { ImageDropzone };
