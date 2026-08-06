"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCartStore, useToastStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";

function CartContent() {
  const { items, updateQuantity, removeItem } = useCartStore();
  const toast = useToastStore((s) => s.show);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  function handleRemove(productId: string, name: string, size?: string) {
    removeItem(productId, size);
    toast(`Removed ${name}${size ? ` (${size})` : ""} from cart`, "info");
  }

  function handleQuantityChange(item: (typeof items)[number], value: number) {
    if (value > item.stock) {
      toast(`Only ${item.stock} units of ${item.name}${item.size ? ` (${item.size})` : ""} in stock`, "error");
      updateQuantity(item.productId, item.stock, item.size);
      return;
    }
    if (value < item.moq) {
      toast(`Minimum order quantity for ${item.name} is ${item.moq} units`, "error");
      updateQuantity(item.productId, item.moq, item.size);
      return;
    }
    updateQuantity(item.productId, value, item.size);
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty.</p>
        <Link href="/" className="text-indigo-700 font-medium">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.size || ""}`}
            className="flex flex-col sm:flex-row sm:items-center gap-4 border rounded-lg p-4 bg-white"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden shrink-0">
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              {item.size && <p className="text-xs text-gray-500">Size: {item.size}</p>}
              <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={item.moq}
                max={item.stock}
                value={item.quantity}
                onChange={(e) => handleQuantityChange(item, Number(e.target.value))}
                className="w-20 border rounded-md px-2 py-1"
              />
              <span className="font-semibold w-20 text-right">${(item.price * item.quantity).toFixed(2)}</span>
              <button
                onClick={() => handleRemove(item.productId, item.name, item.size)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between border-t pt-6 gap-4">
        <p className="text-lg font-bold">Total: ${total.toFixed(2)}</p>
        <Link href="/checkout" className="bg-indigo-600 text-white px-6 py-2 rounded-md text-center hover:bg-indigo-700">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <ProtectedRoute role="buyer">
      <CartContent />
    </ProtectedRoute>
  );
}
