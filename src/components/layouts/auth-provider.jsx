"use client";
import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/contexts/socket-context";

export default function AuthProvider({ children, session }) {
  return (
    <SessionProvider session={session}>
      <SocketProvider>{children}</SocketProvider>
    </SessionProvider>
  );
}
