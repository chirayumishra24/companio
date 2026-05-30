import { io } from "socket.io-client";
import { API_BASE, getToken } from "./config";

let socket = null;

export function getSocket() {
  if (socket && socket.connected) return socket;

  const token = getToken();
  if (!token) return null;

  // If socket exists but disconnected, reconnect
  if (socket) {
    socket.connect();
    return socket;
  }

  socket = io(API_BASE, {
    auth: {
      token
    },
    transports: ["websocket", "polling"],
    withCredentials: true
  });

  socket.on("connect", () => {
    console.log("🔌 Connected to Socket.IO backend");
  });

  socket.on("disconnect", () => {
    console.log("🔌 Disconnected from Socket.IO backend");
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
