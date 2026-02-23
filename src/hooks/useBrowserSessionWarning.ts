import { useEffect, useMemo, useRef, useState } from "react";

const CHANNEL_NAME = "twitch-shoutout-web-session";
const HEARTBEAT_MS = 5000;
const SESSION_TTL_MS = 15000;

type SessionMessage = {
  type: "HELLO" | "PING" | "PONG" | "BYE";
  sessionId: string;
  userId: string;
};

const createSessionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const useBrowserSessionWarning = (userId: string) => {
  const [hasMultipleSessions, setHasMultipleSessions] = useState(false);
  const sessionId = useMemo(() => createSessionId(), []);
  const peerSessionMapRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!userId) {
      setHasMultipleSessions(false);
      return;
    }
    if (typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);

    const updateMultipleSessions = () => {
      const now = Date.now();
      for (const [peerId, seenAt] of peerSessionMapRef.current.entries()) {
        if (now - seenAt > SESSION_TTL_MS) {
          peerSessionMapRef.current.delete(peerId);
        }
      }
      setHasMultipleSessions(peerSessionMapRef.current.size > 0);
    };

    const markPeerSession = (peerSessionId: string) => {
      if (peerSessionId === sessionId) {
        return;
      }
      peerSessionMapRef.current.set(peerSessionId, Date.now());
      updateMultipleSessions();
    };

    const postMessage = (type: SessionMessage["type"]) => {
      const message: SessionMessage = {
        type,
        sessionId,
        userId,
      };
      channel.postMessage(message);
    };

    channel.onmessage = (event: MessageEvent<SessionMessage>) => {
      const message = event.data;
      if (!message || message.userId !== userId) {
        return;
      }
      if (message.type === "BYE") {
        peerSessionMapRef.current.delete(message.sessionId);
        updateMultipleSessions();
        return;
      }
      if (message.type === "HELLO" || message.type === "PING") {
        markPeerSession(message.sessionId);
        postMessage("PONG");
        return;
      }
      if (message.type === "PONG") {
        markPeerSession(message.sessionId);
      }
    };

    postMessage("HELLO");
    const heartbeatTimer = window.setInterval(() => {
      postMessage("PING");
      updateMultipleSessions();
    }, HEARTBEAT_MS);

    return () => {
      postMessage("BYE");
      window.clearInterval(heartbeatTimer);
      channel.close();
      peerSessionMapRef.current.clear();
      setHasMultipleSessions(false);
    };
  }, [sessionId, userId]);

  return { hasMultipleSessions };
};
