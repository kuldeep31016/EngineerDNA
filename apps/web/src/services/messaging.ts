import {
  conversationDetailSchema,
  conversationSchema,
  chatMessageSchema,
  type ChatMessage,
  type Conversation,
  type ConversationDetail,
  type SendMessageRequest,
} from "@engineerdna/shared";
import { apiFetch, API_BASE_URL, ApiError } from "@/lib/api";

/** Recruiter opens a conversation with a candidate (invitation). */
export async function inviteCandidate(candidateId: string, message: string): Promise<Conversation> {
  return conversationSchema.parse(
    await apiFetch<unknown>("/messages/invite", {
      method: "POST",
      body: JSON.stringify({ candidateId, message }),
    }),
  );
}

export async function getConversations(): Promise<Conversation[]> {
  const data = await apiFetch<unknown[]>("/messages");
  return (data ?? []).map((c) => conversationSchema.parse(c));
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  return conversationDetailSchema.parse(await apiFetch<unknown>(`/messages/${id}`));
}

export async function respondInvite(id: string, action: "accept" | "decline"): Promise<Conversation> {
  return conversationSchema.parse(
    await apiFetch<unknown>(`/messages/${id}/respond`, { method: "PATCH", body: JSON.stringify({ action }) }),
  );
}

export async function sendMessage(id: string, input: SendMessageRequest): Promise<ChatMessage> {
  return chatMessageSchema.parse(
    await apiFetch<unknown>(`/messages/${id}/messages`, { method: "POST", body: JSON.stringify(input) }),
  );
}

export async function getMessagesUnreadCount(): Promise<number> {
  const r = await apiFetch<{ count: number }>("/messages/unread-count");
  return r.count;
}

/** Upload a file to a conversation (multipart — bypasses the JSON fetch wrapper). */
export async function uploadAttachment(id: string, file: File): Promise<ChatMessage> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE_URL}/messages/${id}/attachment`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) throw new ApiError(res.status, "Upload failed");
  return chatMessageSchema.parse(await res.json());
}
