"use client";

import { useEffect, useState } from "react";
import { Search, ShieldBan, ShieldCheck, ShieldPlus, BadgeCheck, BadgeX } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination from "@/components/Pagination";
import { TableSkeleton } from "@/components/Skeleton";
import ConfirmDialog from "@/components/ConfirmDialog";

interface AdminSupplierRow {
  _id: string;
  name: string;
  email: string;
  status: "active" | "suspended";
  suspendedReason?: string;
  createdAt: string;
  supplierProfile?: { businessName?: string; isVerified?: boolean };
}

type PendingAction =
  | { type: "suspend"; user: AdminSupplierRow }
  | { type: "reactivate"; user: AdminSupplierRow }
  | { type: "promote"; user: AdminSupplierRow }
  | { type: "verify"; user: AdminSupplierRow }
  | { type: "unverify"; user: AdminSupplierRow }
  | null;

function StatusBadge({ status }: { status: "active" | "suspended" }) {
  return status === "suspended" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 text-xs px-2 py-0.5">
      Suspended
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 text-xs px-2 py-0.5">
      Active
    </span>
  );
}

function businessLabel(user: { name: string; supplierProfile?: { businessName?: string } }) {
  return user.supplierProfile?.businessName || user.name;
}

function AdminSuppliersContent() {
  const toast = useToastStore((s) => s.show);
  const [users, setUsers] = useState<AdminSupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [pending, setPending] = useState<PendingAction>(null);
  const [working, setWorking] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/admin/suppliers", { params: { search: search || undefined, page, limit: 15 } })
      .then((res) => {
        setUsers(res.data.data.users);
        setPages(res.data.data.pages);
      })
      .catch((err) => toast(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function search_() {
    setPage(1);
    load();
  }

  async function runPendingAction(reason: string) {
    if (!pending) return;
    const { type, user } = pending;
    setWorking(true);
    try {
      if (type === "suspend") {
        await api.put(`/admin/users/${user._id}/suspend`, { reason });
        toast(`${businessLabel(user)} suspended`, "success");
      } else if (type === "reactivate") {
        await api.put(`/admin/users/${user._id}/reactivate`);
        toast(`${businessLabel(user)} reactivated`, "success");
      } else if (type === "promote") {
        await api.put(`/admin/users/${user._id}/role`, { role: "admin" });
        toast(`${user.name} is now an admin`, "success");
      } else if (type === "verify" || type === "unverify") {
        await api.put(`/admin/suppliers/${user._id}/verification`, { verified: type === "verify" });
        toast(type === "verify" ? `${businessLabel(user)} verified` : `${businessLabel(user)} unverified`, "success");
      }
      setPending(null);
      load();
    } catch (err) {
      toast(apiErrorMessage(err), "error");
    } finally {
      setWorking(false);
    }
  }

  const dialogCopy = (() => {
    if (!pending) return null;
    const label = businessLabel(pending.user);
    switch (pending.type) {
      case "suspend":
        return {
          title: `Suspend ${label}?`,
          description: "They won't be able to log in or use an existing session until reactivated.",
          confirmLabel: "Suspend",
          tone: "danger" as const,
          withReason: true,
        };
      case "reactivate":
        return {
          title: `Reactivate ${label}?`,
          description: "They'll be able to log in again immediately.",
          confirmLabel: "Reactivate",
          tone: "default" as const,
          withReason: false,
        };
      case "promote":
        return {
          title: `Make ${pending.user.name} an admin?`,
          description: `${pending.user.email} will get full admin access. This can't be undone from here.`,
          confirmLabel: "Promote",
          tone: "danger" as const,
          withReason: false,
        };
      case "verify":
        return {
          title: `Verify ${label}?`,
          description: "A verified badge will show on their storefront and product pages.",
          confirmLabel: "Verify",
          tone: "default" as const,
          withReason: false,
        };
      case "unverify":
        return {
          title: `Remove verification from ${label}?`,
          description: "Their verified badge will be removed from the storefront and product pages.",
          confirmLabel: "Remove verification",
          tone: "danger" as const,
          withReason: false,
        };
    }
  })();

  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Suppliers</h1>
      <p className="text-gray-500 text-sm mb-4">Verify, moderate, and manage supplier accounts.</p>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search_()}
            placeholder="Search by name, business, or email"
            className="w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
          />
        </div>
        <button onClick={search_} className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50">
          Search
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : users.length === 0 ? (
        <p className="text-gray-500">No suppliers found.</p>
      ) : (
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="p-3 font-medium">Business</th>
                <th className="p-3 font-medium">Contact</th>
                <th className="p-3 font-medium">Verified</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Joined</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{businessLabel(u)}</td>
                  <td className="p-3 text-gray-600">
                    {u.name}
                    <br />
                    <span className="text-xs text-gray-400">{u.email}</span>
                  </td>
                  <td className="p-3">
                    {u.supplierProfile?.isVerified ? (
                      <BadgeCheck size={16} className="text-teal-600" />
                    ) : (
                      <BadgeX size={16} className="text-gray-300" />
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={u.status} />
                    {u.status === "suspended" && u.suspendedReason && (
                      <p className="text-xs text-gray-400 mt-0.5">{u.suspendedReason}</p>
                    )}
                  </td>
                  <td className="p-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() =>
                          setPending({ type: u.supplierProfile?.isVerified ? "unverify" : "verify", user: u })
                        }
                        title={u.supplierProfile?.isVerified ? "Remove verification" : "Verify supplier"}
                        className="p-1.5 rounded-md border hover:bg-teal-50 text-teal-600"
                      >
                        {u.supplierProfile?.isVerified ? <BadgeX size={15} /> : <BadgeCheck size={15} />}
                      </button>
                      {u.status === "active" ? (
                        <button
                          onClick={() => setPending({ type: "suspend", user: u })}
                          title="Suspend"
                          className="p-1.5 rounded-md border hover:bg-red-50 text-red-600"
                        >
                          <ShieldBan size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setPending({ type: "reactivate", user: u })}
                          title="Reactivate"
                          className="p-1.5 rounded-md border hover:bg-green-50 text-green-600"
                        >
                          <ShieldCheck size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => setPending({ type: "promote", user: u })}
                        title="Promote to admin"
                        className="p-1.5 rounded-md border hover:bg-indigo-50 text-indigo-600"
                      >
                        <ShieldPlus size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />

      <ConfirmDialog
        open={pending !== null}
        title={dialogCopy?.title || ""}
        description={dialogCopy?.description}
        confirmLabel={dialogCopy?.confirmLabel}
        tone={dialogCopy?.tone}
        withReason={dialogCopy?.withReason}
        reasonLabel="Reason (optional, shown to the user)"
        reasonPlaceholder="e.g. Repeated policy violations"
        loading={working}
        onConfirm={runPendingAction}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

export default function AdminSuppliersPage() {
  return (
    <ProtectedRoute role="admin">
      <DashboardLayout>
        <AdminSuppliersContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
