import { ImgHTMLAttributes } from "react";

interface SignedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  signatureClassName?: string;
}

/**
 * Wraps a painting image with a discreet "Naybz" signature
 * pinned to the bottom-right corner — small, low-opacity, but visible.
 */
export default function SignedImage({
  wrapperClassName = "",
  signatureClassName = "",
  className,
  ...imgProps
}: SignedImageProps) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <img {...imgProps} className={className} />
      <span
        aria-hidden="true"
        className={`pointer-events-none select-none absolute bottom-2 right-3 font-serif italic text-[10px] md:text-xs tracking-wide text-white/80 mix-blend-difference drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] ${signatureClassName}`}
      >
        Naybz
      </span>
    </div>
  );
}
