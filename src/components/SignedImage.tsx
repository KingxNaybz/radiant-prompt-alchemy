import { ImgHTMLAttributes } from "react";

interface SignedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  signatureClassName?: string;
}

/**
 * Wraps a painting image with a discreet "VW" signature
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
        className={`pointer-events-none select-none absolute bottom-1.5 right-2 font-serif italic text-[7px] md:text-[9px] tracking-wide text-white/70 mix-blend-difference drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] ${signatureClassName}`}
      >
        VW
      </span>
    </div>
  );
}
