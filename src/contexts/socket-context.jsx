"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";

const SocketContext = createContext({ socket: null, connected: false });

const getSocketUrl = () => {
  return ""; // DISABLE SOCKETS FOR NOW
  if (typeof window === "undefined") return "";
  // 1) Explicit socket URL
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (socketUrl && typeof socketUrl === "string" && !socketUrl.includes("${")) {
    try {
      new URL(socketUrl);
      return socketUrl.replace(/\/+$/, "");
    } catch (_) {}
  }
  // 2) Derive from API URL (only if it looks like a real URL, not unexpanded ${VAR})
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (api && typeof api === "string" && !api.includes("${")) {
    try {
      const u = new URL(api);
      return `${u.protocol}//${u.host}`;
    } catch (_) {}
  }
  // 3) When app is on localhost, assume backend on 8000 (very common)
  if (typeof window !== "undefined" && window.location?.hostname === "localhost") {
    return "http://localhost:8000";
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8000";
  }
  return window.location.origin;
};

export function SocketProvider({ children }) {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log("[Socket] Session status=" + status + " hasAccessToken=" + Boolean(session?.accessToken));
  }, [status, session?.accessToken]);

  useEffect(() => {
    const hasToken = Boolean(session?.accessToken);
    if (status !== "authenticated" || !hasToken) {
      if (socketRef.current) {
        console.log("[Socket] Disconnecting: status=" + status + " hasToken=" + hasToken);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
      return;
    }

    const url = getSocketUrl();
    if (!url) {
      console.warn("[Socket] No URL – set NEXT_PUBLIC_SOCKET_URL or NEXT_PUBLIC_API_URL");
      return;
    }

    console.log("[Socket] Connecting to", url, "path=/socket.io");

    const s = io(url, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      auth: {
        token: session.accessToken,
      },
    });

    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      setConnected(true);
      console.log("[Socket] Connected id=" + s.id);
    });
    s.on("disconnect", (reason) => {
      setConnected(false);
      console.log("[Socket] Disconnected reason=" + reason);
    });
    s.on("connect_error", (err) => {
      setConnected(false);
      console.warn("[Socket] connect_error:", err?.message || err);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [status, session?.accessToken]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

/** Event names (must match backend) */
export const WHATSAPP_NEW_MESSAGE = "whatsapp:new_message";
export const WHATSAPP_JOIN_CONVERSATION = "whatsapp:join_conversation";
export const WHATSAPP_LEAVE_CONVERSATION = "whatsapp:leave_conversation";
export const WHATSAPP_JOIN_LIST = "whatsapp:join_list";