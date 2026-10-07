import Image from "next/image";
import type { CSSProperties } from "react";

function CardCover({
  overlayImageUrl,
  overlayX,
  overlayY,
  overlayScale,
}: {
  overlayImageUrl: string | null;
  overlayX: number;
  overlayY: number;
  overlayScale: number;
}) {
  if (!overlayImageUrl) return null;

  const overlayStyle = {
    width: "78%",
    left: `${overlayX}%`,
    top: `${overlayY}%`,
    "--overlay-scale": overlayScale / 100,
  } as CSSProperties;

  return (
    <div
      data-slot="card-cover"
      className="pointer-events-none absolute inset-0 z-10"
    >
      <Image
        src={overlayImageUrl}
        alt=""
        width={640}
        height={640}
        className="card-overlay absolute max-w-none"
        style={overlayStyle}
      />
    </div>
  );
}

export { CardCover };
