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
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (role && user.role !== role) {
      router.replace(user.role === "buyer" ? "/dashboard/buyer" : "/dashboard/supplier");
      return;
    }
    setReady(true);
  }, [token, user, role, router]);

  if (!ready) return <div className="max-w-7xl mx-auto px-4 py-12 text-gray-500">Loading...</div>;

  return <>{children}</>;
}
