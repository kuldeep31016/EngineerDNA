import { z } from "zod";

/**
 * Recruiter↔student messaging. A recruiter opens a conversation with an
 * INVITATION (PENDING); the student must accept before either side can chat.
 * This gating is the anti-spam guarantee — recruiters can't message everyone.
 */

export const conversationStatusSchema = z.enum(["PENDING", "ACCEPTED", "DECLINED"]);
export type ConversationStatus = z.infer<typeof conversationStatusSchema>;

/** The other participant, from the current user's perspective. */
export const chatPartySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  profileImage: z.string().nullable(),
  subtitle: z.string().nullable(), // headline (student) or company (recruiter)
});
export type ChatParty = z.infer<typeof chatPartySchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  body: z.string(),
  attachmentUrl: z.string().nullable(),
  attachmentLabel: z.string().nullable(),
  createdAt: z.string(),
  mine: z.boolean(), // sent by the current user
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** A conversation row for the list view. */
export const conversationSchema = z.object({
  id: z.string(),
  status: conversationStatusSchema,
  role: z.enum(["recruiter", "student"]), // the CURRENT user's role in it
  party: chatPartySchema,
  lastMessage: z.string().nullable(),
  lastMessageAt: z.string().nullable(),
  unread: z.number(),
  updatedAt: z.string(),
});
export type Conversation = z.infer<typeof conversationSchema>;

/** Full conversation with its messages (for the open chat). */
export const conversationDetailSchema = conversationSchema.extend({
  messages: z.array(chatMessageSchema),
});
export type ConversationDetail = z.infer<typeof conversationDetailSchema>;

export const inviteRequestSchema = z.object({
  candidateId: z.string(),
  message: z.string().trim().min(1).max(2000),
});
export type InviteRequest = z.infer<typeof inviteRequestSchema>;

export const sendMessageRequestSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  attachmentUrl: z.string().trim().url().max(2000).optional(),
  attachmentLabel: z.string().trim().max(120).optional(),
});
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export const respondInviteRequestSchema = z.object({
  action: z.enum(["accept", "decline"]),
});
export type RespondInviteRequest = z.infer<typeof respondInviteRequestSchema>;
