"use client";

import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageLightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: { url: string }[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate((index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onNavigate((index + 1) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close image viewer"
        className="absolute top-4 right-4 text-white/80 hover:text-white"
      >
        <X size={28} />
      </button>

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index - 1 + images.length) % images.length);
          }}
          aria-label="Previous image"
          className="absolute left-2 sm:left-6 text-white/80 hover:text-white"
        >
          <ChevronLeft size={36} />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]?.url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] object-contain"
      />

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index + 1) % images.length);
          }}
          aria-label="Next image"
          className="absolute right-2 sm:right-6 text-white/80 hover:text-white"
        >
          <ChevronRight size={36} />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 text-white/70 text-sm">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
