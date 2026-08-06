"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";

interface Notification {
  _id: string;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 30000;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  function load() {
    api
      .get("/notifications")
      .then((res) => {
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.unreadCount);
      })
      .catch(() => {});
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    setUnreadCount(0);
    await api.patch("/notifications/read-all").catch(() => {});
  }

  async function markRead(id: string) {
    setNotifications((n) => n.map((x) => (x._id === id ? { ...x, read: true } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await api.patch(`/notifications/${id}/read`).catch(() => {});
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative text-gray-700 hover:text-indigo-700 p-1"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 min-w-[1rem] text-center leading-4">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 p-4 text-center">No notifications yet.</p>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n._id}>
                  <Link
                    href={n.link || "#"}
                    onClick={() => {
                      if (!n.read) markRead(n._id);
                      setOpen(false);
                    }}
                    className={`block px-3 py-2.5 text-sm hover:bg-gray-50 ${!n.read ? "bg-indigo-50/60" : ""}`}
                  >
                    <p className={!n.read ? "font-medium text-gray-900" : "text-gray-600"}>{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
