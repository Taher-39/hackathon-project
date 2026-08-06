import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver to a sentinel element and calls
 * `onIntersect` whenever it scrolls into view. Used to drive infinite-scroll
 * lists — render the returned ref on an empty div at the bottom of the list.
 *
 * `onIntersect` should itself guard against firing while already loading /
 * once there's nothing left to load (this hook only reports visibility).
 */
export function useInfiniteScroll(onIntersect: () => void, enabled = true) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onIntersect);
  callbackRef.current = onIntersect;

  useEffect(() => {
    if (!enabled) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) callbackRef.current();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  return sentinelRef;
}
