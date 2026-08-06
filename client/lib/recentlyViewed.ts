// Lightweight localStorage-backed "recently viewed" tracker. Client-only —
// every call is guarded so it's safe to import from server-rendered code.
import { useAuthStore } from "./store";

const PREFIX = "textilehub_recently_viewed";
const MAX = 10;

// Namespaced per logged-in account (falls back to a shared "guest" bucket
// when logged out) — otherwise this list would leak between accounts that
// log in one after another on the same browser, the same way cart/wishlist
// used to before useAuthStore.logout() started clearing those.
function getStorageKey(): string {
  const userId = useAuthStore.getState().user?._id;
  return userId ? `${PREFIX}_${userId}` : `${PREFIX}_guest`;
}

export function addRecentlyViewed(productId: string) {
  if (typeof window === "undefined" || !productId) return;
  try {
    const existing = getRecentlyViewedIds();
    const next = [productId, ...existing.filter((id) => id !== productId)].slice(0, MAX);
    window.localStorage.setItem(getStorageKey(), JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — silently skip
  }
}

export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}
