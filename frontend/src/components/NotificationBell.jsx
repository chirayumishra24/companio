import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authHeaders, API_BASE } from "../lib/config";
import { getSocket } from "../lib/socket";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: authHeaders()
      });
      if (res.ok) {
        const notifications = await res.json();
        const unread = notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Fetch notifications count error:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const socket = getSocket();
    if (socket) {
      const handleNewNotif = () => {
        setUnreadCount(prev => prev + 1);
      };
      socket.on("newNotification", handleNewNotif);
      return () => {
        socket.off("newNotification", handleNewNotif);
      };
    }
  }, []);

  return (
    <Link
      to="/notifications"
      className="relative flex items-center justify-center bg-white hover:bg-brutal-yellow border-2 border-black p-2 font-bold shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
      title="Notifications"
    >
      <span className="text-xl">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-brutal-pink text-black border-2 border-black text-xxs font-black px-1.5 rounded-full min-w-5 h-5 flex items-center justify-center animate-pulse">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
