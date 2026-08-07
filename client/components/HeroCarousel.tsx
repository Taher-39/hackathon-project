"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface HeroSlide {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  primaryHref?: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  onPrimaryClick?: () => void;
}

const AUTOPLAY_MS = 6000;

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = useCallback(
    (next: number) => {
      setDirection(next > index || (index === slides.length - 1 && next === 0) ? 1 : -1);
      setIndex((next + slides.length) % slides.length);
    },
    [index, slides.length]
  );

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, slides.length]);

  const slide = slides[index];

  return (
    <section className="relative overflow-hidden bg-gray-900 text-white">
      <div className="relative h-[520px] sm:h-[560px]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={slide.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              aria-hidden
              fill
              sizes="100vw"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/70 to-gray-950/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl py-16 sm:py-0"
            >
              <span className="inline-block bg-white/10 backdrop-blur-sm border border-white/10 text-indigo-100 text-xs font-medium px-3 py-1 rounded-full mb-5">
                {slide.eyebrow}
              </span>
              <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4">{slide.title}</h1>
              <p className="text-gray-200 text-base sm:text-lg max-w-xl mb-8">{slide.description}</p>
              <div className="flex flex-wrap gap-3">
                {slide.onPrimaryClick ? (
                  <button
                    onClick={slide.onPrimaryClick}
                    className="bg-white text-indigo-700 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors shadow-lg shadow-black/20"
                  >
                    {slide.primaryLabel}
                  </button>
                ) : (
                  <Link
                    href={slide.primaryHref || "#"}
                    className="bg-white text-indigo-700 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors shadow-lg shadow-black/20"
                  >
                    {slide.primaryLabel}
                  </Link>
                )}
                {slide.secondaryLabel && (
                  <Link
                    href={slide.secondaryHref || "#"}
                    className="border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
                  >
                    {slide.secondaryLabel}
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-colors"
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="relative h-1.5 rounded-full bg-white/30 overflow-hidden transition-all"
                  style={{ width: i === index ? 28 : 8 }}
                >
                  {i === index && (
                    <motion.span
                      key={index}
                      className="absolute inset-0 bg-white rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                      style={{ transformOrigin: "left" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
