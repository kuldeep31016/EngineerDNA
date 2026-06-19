import { notificationSchema, type AppNotification } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

export async function getNotifications(): Promise<AppNotification[]> {
  const data = await apiFetch<unknown[]>("/notifications");
  return (data ?? []).map((d) => notificationSchema.parse(d));
}

export async function getUnreadCount(): Promise<number> {
  const r = await apiFetch<{ count: number }>("/notifications/unread-count");
  return r.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/notifications/read-all", { method: "PATCH" });
}
