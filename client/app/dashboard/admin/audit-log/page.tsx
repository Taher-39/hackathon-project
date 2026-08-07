"use client";

import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination from "@/components/Pagination";
import { TableSkeleton } from "@/components/Skeleton";

interface AuditEntry {
  _id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetLabel?: string;
  details?: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  "supplier.verify": "Verified supplier",
  "supplier.unverify": "Removed supplier verification",
  "user.suspend": "Suspended account",
  "user.reactivate": "Reactivated account",
  "user.promote_to_admin": "Promoted to admin",
  "user.role_change": "Changed role",
};

function AdminAuditLogContent() {
  const toast = useToastStore((s) => s.show);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/audit-log", { params: { page, limit: 25 } })
      .then((res) => {
        setEntries(res.data.data.entries);
        setPages(res.data.data.pages);
      })
      .catch((err) => toast(apiErrorMessage(err), "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <>
      <h1 className="text-2xl font-bold mb-1">Audit Log</h1>
      <p className="text-gray-500 text-sm mb-4">
        A record of every sensitive admin action — who did what, to whom, and when.
      </p>

      {loading ? (
        <TableSkeleton rows={10} />
      ) : entries.length === 0 ? (
        <p className="text-gray-500">No admin actions recorded yet.</p>
      ) : (
        <div className="border rounded-xl bg-white shadow-sm divide-y">
          {entries.map((e) => (
            <div key={e._id} className="p-3 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium">{e.actorName}</span>
              <span className="text-gray-500">{ACTION_LABELS[e.action] || e.action}</span>
              {e.targetLabel && <span className="text-gray-700">&ldquo;{e.targetLabel}&rdquo;</span>}
              {e.details && <span className="text-gray-400 text-xs">({e.details})</span>}
              <span className="ml-auto text-xs text-gray-400">{new Date(e.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />
    </>
  );
}

export default function AdminAuditLogPage() {
  return (
    <ProtectedRoute role="admin">
      <DashboardLayout>
        <AdminAuditLogContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
