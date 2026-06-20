"use client";

import { useEffect, useState } from "react";
import { getMessagesUnreadCount } from "@/services/messaging";

/** Poll the unread message count for the Messages nav badge (like the bell). */
export function useMessagesUnread(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const tick = () => getMessagesUnreadCount().then(setCount).catch(() => {});
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return count;
}
