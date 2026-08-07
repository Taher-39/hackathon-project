"use client";

import { useEffect, useState } from "react";
import { Search, ShieldBan, ShieldCheck, ShieldPlus, Mail } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination from "@/components/Pagination";
import { TableSkeleton } from "@/components/Skeleton";
import ConfirmDialog from "@/components/ConfirmDialog";

interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  status: "active" | "suspended";
  suspendedReason?: string;
  createdAt: string;
}

type PendingAction =
  | { type: "suspend"; user: AdminUserRow }
  | { type: "reactivate"; user: AdminUserRow }
  | { type: "promote"; user: AdminUserRow }
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

function AdminBuyersContent() {
  const toast = useToastStore((s) => s.show);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [pending, setPending] = useState<PendingAction>(null);
  const [working, setWorking] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/admin/buyers", { params: { search: search || undefined, page, limit: 15 } })
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
        toast(`${user.name} suspended`, "success");
      } else if (type === "reactivate") {
        await api.put(`/admin/users/${user._id}/reactivate`);
        toast(`${user.name} reactivated`, "success");
      } else if (type === "promote") {
        await api.put(`/admin/users/${user._id}/role`, { role: "admin" });
        toast(`${user.name} is now an admin`, "success");
      }
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
      <h1 className="text-2xl font-bold mb-1">Buyers</h1>
      <p className="text-gray-500 text-sm mb-4">Search, moderate, and manage buyer accounts.</p>

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
        <TableSkeleton rows={8} />
      ) : users.length === 0 ? (
        <p className="text-gray-500">No buyers found.</p>
      ) : (
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Verified</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Joined</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-gray-600">{u.email}</td>
                  <td className="p-3">
                    {u.isEmailVerified ? (
                      <Mail size={15} className="text-green-600" />
                    ) : (
                      <Mail size={15} className="text-gray-300" />
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
        title={
          pending?.type === "suspend"
            ? `Suspend ${pending.user.name}?`
            : pending?.type === "reactivate"
              ? `Reactivate ${pending.user.name}?`
              : pending?.type === "promote"
                ? `Make ${pending.user.name} an admin?`
                : ""
        }
        description={
          pending?.type === "suspend"
            ? "They won't be able to log in or use an existing session until reactivated."
            : pending?.type === "reactivate"
              ? "They'll be able to log in again immediately."
              : pending?.type === "promote"
                ? `${pending?.user.email} will get full admin access. This can't be undone from here.`
                : undefined
        }
        tone={pending?.type === "suspend" || pending?.type === "promote" ? "danger" : "default"}
        confirmLabel={
          pending?.type === "suspend" ? "Suspend" : pending?.type === "reactivate" ? "Reactivate" : "Promote"
        }
        withReason={pending?.type === "suspend"}
        reasonLabel="Reason (optional, shown to the user)"
        reasonPlaceholder="e.g. Repeated policy violations"
        loading={working}
        onConfirm={runPendingAction}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

export default function AdminBuyersPage() {
  return (
    <ProtectedRoute role="admin">
      <DashboardLayout>
        <AdminBuyersContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
