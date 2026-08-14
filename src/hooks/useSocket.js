"use client";

/**
 * Socket.IO hook – uses the global socket from SocketProvider.
 * Socket connects when user is authenticated (any page). In DevTools Network tab:
 * filter by "WS" or search "socket.io" to see the connection.
 */
export {
  useSocket,
  WHATSAPP_NEW_MESSAGE,
  WHATSAPP_JOIN_CONVERSATION,
  WHATSAPP_LEAVE_CONVERSATION,
  WHATSAPP_JOIN_LIST,
} from "@/contexts/socket-context";
