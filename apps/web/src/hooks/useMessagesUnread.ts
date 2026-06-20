"use client";

import { useEffect, useState } from "react";
import { getMessagesUnreadCount } from "@/services/messaging";

/**
 * Unread message count for the Messages nav badge. Polls periodically AND
 * refetches instantly when a `messages:refresh` event fires (dispatched when a
 * conversation is opened/read), so the badge drops the moment you read — like
 * WhatsApp.
 */
export function useMessagesUnread(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const tick = () => getMessagesUnreadCount().then(setCount).catch(() => {});
    tick();
    const id = setInterval(tick, 10000);
    window.addEventListener("messages:refresh", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("messages:refresh", tick);
    };
  }, []);
  return count;
}
