"use client";

import { useEffect, useState } from "react";
import { Search, Lock, UserRound, Store } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore, useToastStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination from "@/components/Pagination";
import { TableSkeleton } from "@/components/Skeleton";
import ConfirmDialog from "@/components/ConfirmDialog";

interface AdminRow {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  isProtected?: boolean;
}

type PendingAction = { type: "demote"; user: AdminRow; toRole: "buyer" | "supplier" } | null;

function AdminAdminsContent() {
  const currentUserId = useAuthStore((s) => s.user?._id);
  const toast = useToastStore((s) => s.show);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [pending, setPending] = useState<PendingAction>(null);
  const [working, setWorking] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/admin/admins", { params: { search: search || undefined, page, limit: 15 } })
      .then((res) => {
        setAdmins(res.data.data.users);
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

  async function confirmDemote() {
    if (!pending) return;
    setWorking(true);
    try {
      await api.put(`/admin/users/${pending.user._id}/role`, { role: pending.toRole });
      toast(`${pending.user.name} is now a ${pending.toRole}`, "success");
      setPending(null);
      load();
    } catch (err) {
      toast(apiErrorMessage(err), "error");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Admin Management</h1>
      <p className="text-gray-500 text-sm mb-4">
        Every admin account. The seeded demo admin is protected and can&apos;t be changed by
        anyone, including other admins, so it always stays available for a demo login.
      </p>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search_()}
            placeholder="Search by name or email"
            className="w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
          />
        </div>
        <button onClick={search_} className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50">
          Search
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : admins.length === 0 ? (
        <p className="text-gray-500">No admins found.</p>
      ) : (
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Joined</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {admins.map((a) => {
                const isSelf = a._id === currentUserId;
                const locked = a.isProtected || isSelf;
                return (
                  <tr key={a._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">
                      {a.name}
                      {a.isProtected && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 text-xs px-2 py-0.5">
                          <Lock size={11} /> Protected
                        </span>
                      )}
                      {isSelf && !a.isProtected && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5">
                          You
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">{a.email}</td>
                    <td className="p-3 text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      {locked ? (
                        <span className="block text-right text-xs text-gray-400">
                          {a.isProtected ? "Can't be changed" : "Can't change your own role"}
                        </span>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setPending({ type: "demote", user: a, toRole: "buyer" })}
                            title="Change to buyer"
                            className="p-1.5 rounded-md border hover:bg-amber-50 text-amber-700"
                          >
                            <UserRound size={15} />
                          </button>
                          <button
                            onClick={() => setPending({ type: "demote", user: a, toRole: "supplier" })}
                            title="Change to supplier"
                            className="p-1.5 rounded-md border hover:bg-amber-50 text-amber-700"
                          >
                            <Store size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />

      <ConfirmDialog
        open={pending !== null}
        title={pending ? `Change ${pending.user.name}'s role to ${pending.toRole}?` : ""}
        description={
          pending
            ? `They'll lose admin access immediately and become a ${pending.toRole} account.`
            : undefined
        }
        tone="danger"
        confirmLabel={pending ? `Make ${pending.toRole}` : "Confirm"}
        loading={working}
        onConfirm={confirmDemote}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

export default function AdminAdminsPage() {
  return (
    <ProtectedRoute role="admin">
      <DashboardLayout>
        <AdminAdminsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
