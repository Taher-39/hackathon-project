import { api, apiErrorMessage } from "@/lib/api";
import { useWishlistStore, useToastStore } from "@/lib/store";

export function useWishlistToggle(productId: string) {
  const wishlisted = useWishlistStore((s) => s.ids.includes(productId));
  const { add, remove } = useWishlistStore();
  const toast = useToastStore((s) => s.show);

  async function toggle() {
    const wasWishlisted = wishlisted;
    wasWishlisted ? remove(productId) : add(productId);
    try {
      const res = await api.post(`/users/wishlist/${productId}`);
      const { wishlisted: serverState } = res.data.data;
      if (serverState) add(productId);
      else remove(productId);
    } catch (err) {
      wasWishlisted ? add(productId) : remove(productId);
      toast(apiErrorMessage(err), "error");
    }
  }

  return { wishlisted, toggle };
}
