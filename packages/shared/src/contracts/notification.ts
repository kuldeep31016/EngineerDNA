import { z } from "zod";

export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});
export type AppNotification = z.infer<typeof notificationSchema>;
