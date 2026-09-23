/**
 * Lightbox — Webflow `w-lightbox` (guide 2.10).
 * Base UI Dialog (via ShadCN): focus trap, Escape, scroll-lock built in.
 * Video content mounts only while open (conditional render, no effects).
 * Usage from Astro: pass the trigger as the default slot (children).
 */
import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LightboxProps {
  children: ReactNode;
  label: string;
  imageSrc?: string;
  imageAlt?: string;
  videoSrc?: string;
}

export default function Lightbox({ children, label, imageSrc, imageAlt = "", videoSrc }: LightboxProps) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label={`Open ${label}`}
        className="block w-full cursor-pointer border-0 bg-transparent p-0"
      >
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <DialogDescription className="sr-only">{label}</DialogDescription>
        {videoSrc ? (
          <video className="max-h-[80vh] w-full rounded-2xl" controls autoPlay playsInline>
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          imageSrc && <img src={imageSrc} alt={imageAlt} className="max-h-[80vh] w-full rounded-2xl object-contain" />
        )}
      </DialogContent>
    </Dialog>
  );
}

