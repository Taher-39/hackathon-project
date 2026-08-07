"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, Role } from "@/lib/store";

export default function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const { user, token, hasHydrated } = useAuthStore();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Persisted auth state loads from localStorage a tick after mount; until
    // that finishes, user/token are null even for someone already logged in.
    // Deciding anything before hasHydrated would bounce a valid session to
    // /login on every page refresh.
    if (!hasHydrated) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (role && user.role !== role) {
      router.replace(user.role === "buyer" ? "/dashboard/buyer" : "/dashboard/supplier");
      return;
    }
    setReady(true);
  }, [hasHydrated, token, user, role, router]);

  if (!ready) return <div className="max-w-7xl mx-auto px-4 py-12 text-gray-500">Loading...</div>;

  return <>{children}</>;
}
