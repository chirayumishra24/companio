import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_BASE, authHeaders } from "../lib/config";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        
        // Mark all as read after rendering
        await fetch(`${API_BASE}/api/notifications/read`, {
          method: "PATCH",
          headers: authHeaders(),
        });
      } else {
        setError("Failed to fetch notifications");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-green flex items-center justify-center">
        <div className="neo-card bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] font-black uppercase text-2xl text-center">
          Loading Notifications... ✈️
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-green py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="neo-card bg-white border-4 border-black p-6 mb-8 shadow-[8px_8px_0px_0px_#000]">
          <h1 className="font-black text-3xl text-black uppercase tracking-tight">
            Activity Feed
          </h1>
          <p className="font-bold text-gray-700 mt-1 uppercase text-xs">
            Follows, likes, and comments from other travelers
          </p>
        </div>

        {error && (
          <div className="neo-card bg-brutal-pink text-black border-4 border-black p-4 mb-8 font-bold uppercase shadow-[4px_4px_0px_0px_#000]">
            ⚠️ {error}
          </div>
        )}

        <div className="neo-card bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          {notifications.length === 0 ? (
            <p className="text-gray-500 font-bold uppercase text-center py-12">
              No notifications yet. Keep sharing your travels!
            </p>
          ) : (
            <div className="divide-y-2 divide-black">
              {notifications.map((notif) => {
                const getIcon = () => {
                  switch (notif.type) {
                    case "like":
                      return "❤️";
                    case "comment":
                      return "💬";
                    case "follow":
                      return "✈️";
                    default:
                      return "🔔";
                  }
                };

                const getLink = () => {
                  if (notif.type === "like" || notif.type === "comment") {
                    return `/post/${notif.postId}`;
                  }
                  return `/u/${notif.fromEmail}`;
                };

                return (
                  <Link
                    key={notif._id}
                    to={getLink()}
                    className={`block p-4 transition-all hover:bg-yellow-50 flex items-start space-x-3 ${
                      !notif.read ? "bg-yellow-50" : ""
                    }`}
                  >
                    <span className="text-2xl">{getIcon()}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-black">
                        {notif.message}
                      </p>
                      <span className="text-xs text-gray-500 font-semibold block mt-1">
                        {new Date(notif.createdAt).toLocaleDateString()} at{" "}
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {!notif.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-brutal-pink border border-black self-center" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
