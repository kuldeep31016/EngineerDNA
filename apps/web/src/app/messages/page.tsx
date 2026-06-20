"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, MessagesSquare, Paperclip, Send } from "lucide-react";
import type { ChatMessage, Conversation, ConversationDetail } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { API_ORIGIN } from "@/lib/api";
import {
  getConversation,
  getConversations,
  respondInvite,
  sendMessage,
  uploadAttachment,
} from "@/services/messaging";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
const initial = (n: string | null) => (n ?? "?").charAt(0).toUpperCase();

function MessagesContent() {
  const [convos, setConvos] = useState<Conversation[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getConversations()
      .then((list) => {
        setConvos(list);
        setActiveId((cur) => cur ?? list[0]?.id ?? null);
      })
      .catch(() => setConvos([]));
  }, []);

  useEffect(() => {
    refresh();
    // Poll the list so new conversations / last messages / unread stay current.
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [refresh]);

  function open(convoId: string) {
    setActiveId(convoId);
    // Clear this conversation's unread immediately in the list (WhatsApp-style).
    setConvos((prev) => (prev ? prev.map((c) => (c.id === convoId ? { ...c, unread: 0 } : c)) : prev));
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessagesSquare className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">Connect after an invitation is accepted.</p>
        </div>
      </div>

      {!convos ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : convos.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <MessagesSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 font-medium">No conversations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When a recruiter sends you a connection request, it shows up here.
          </p>
        </div>
      ) : (
        <div className="grid h-[72vh] min-h-0 grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[300px_1fr]">
          {/* Conversation list */}
          <div className="min-h-0 overflow-y-auto border-b border-border md:border-b-0 md:border-r">
            {convos.map((c) => (
              <button
                key={c.id}
                onClick={() => open(c.id)}
                className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent ${
                  activeId === c.id ? "bg-primary/5" : ""
                }`}
              >
                <Avatar name={c.party.name} image={c.party.profileImage} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{c.party.name ?? "User"}</span>
                    {c.lastMessageAt && <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.lastMessageAt)}</span>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.status === "PENDING"
                      ? c.role === "student"
                        ? "Invitation — respond to chat"
                        : "Invitation sent"
                      : c.status === "DECLINED"
                        ? "Declined"
                        : (c.lastMessage ?? "")}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active chat */}
          {activeId ? (
            <ChatPanel id={activeId} onChanged={refresh} />
          ) : (
            <div className="hidden items-center justify-center text-sm text-muted-foreground md:flex">
              Select a conversation
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function Avatar({ name, image }: { name: string | null; image: string | null }) {
  if (image) return <img src={image} alt={name ?? ""} className="h-10 w-10 shrink-0 rounded-full object-cover" />;
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
      {initial(name)}
    </span>
  );
}

function ChatPanel({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [convo, setConvo] = useState<ConversationDetail | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0 || uploading) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const msg = await uploadAttachment(id, file);
        setConvo((c) => (c ? { ...c, messages: [...c.messages, msg] } : c));
      }
      onChanged();
    } catch {
      // ignore — surfaced as no new bubble
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Fetch the conversation; opening/polling marks the other side's messages read
  // on the server, so we tell the nav badge to refresh immediately (WhatsApp-style).
  const load = useCallback(() => {
    getConversation(id)
      .then((fresh) => {
        setConvo((prev) => {
          // Skip the state update when nothing changed — avoids re-render/scroll jank.
          if (
            prev &&
            prev.messages.length === fresh.messages.length &&
            prev.messages.at(-1)?.id === fresh.messages.at(-1)?.id &&
            prev.status === fresh.status
          ) {
            return prev;
          }
          return fresh;
        });
        window.dispatchEvent(new Event("messages:refresh"));
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setConvo(null);
    load();
    // Poll for real-time delivery (a few seconds feels instant).
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convo?.messages.length]);

  async function respond(action: "accept" | "decline") {
    setResponding(true);
    try {
      await respondInvite(id, action);
      load();
      onChanged();
    } finally {
      setResponding(false);
    }
  }

  async function submit() {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(id, { body: body.trim() });
      setConvo((c) => (c ? { ...c, messages: [...c.messages, msg] } : c));
      setBody("");
      onChanged();
    } finally {
      setSending(false);
    }
  }

  if (!convo) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const pendingForStudent = convo.status === "PENDING" && convo.role === "student";
  const pendingForRecruiter = convo.status === "PENDING" && convo.role === "recruiter";
  const declined = convo.status === "DECLINED";
  const canChat = convo.status === "ACCEPTED";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header (sticky — never scrolls away) */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Avatar name={convo.party.name} image={convo.party.profileImage} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{convo.party.name ?? "User"}</p>
          {convo.party.subtitle && <p className="truncate text-xs text-muted-foreground">{convo.party.subtitle}</p>}
        </div>
      </div>

      {/* Messages — the only scrollable region */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {convo.messages.map((m) => (
          <Bubble key={m.id} m={m} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Footer — accept/decline, declined notice, or composer */}
      {pendingForStudent ? (
        <div className="flex items-center gap-2 shrink-0 border-t border-border p-3">
          <p className="flex-1 text-sm text-muted-foreground">Accept to start chatting with this recruiter.</p>
          <button
            onClick={() => respond("decline")}
            disabled={responding}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            Decline
          </button>
          <button
            onClick={() => respond("accept")}
            disabled={responding}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Check className="h-4 w-4" /> Accept
          </button>
        </div>
      ) : pendingForRecruiter ? (
        <div className="shrink-0 border-t border-border p-3 text-center text-sm text-muted-foreground">
          Waiting for {convo.party.name ?? "the candidate"} to accept your invitation.
        </div>
      ) : declined ? (
        <div className="shrink-0 border-t border-border p-3 text-center text-sm text-muted-foreground">
          This invitation was declined.
        </div>
      ) : canChat ? (
        <div className="shrink-0 border-t border-border p-3">
          {uploading && (
            <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
            </p>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Attach files"
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              rows={1}
              placeholder="Write a message…"
              className="max-h-28 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            <button
              onClick={submit}
              disabled={sending || !body.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp)$/i;

function Bubble({ m }: { m: ChatMessage }) {
  // Uploaded files live at the API origin under /uploads; links are absolute.
  const isUpload = m.attachmentUrl?.startsWith("/uploads/");
  const href = m.attachmentUrl ? (isUpload ? `${API_ORIGIN}${m.attachmentUrl}` : m.attachmentUrl) : null;
  const isImage = href ? IMAGE_EXT.test(m.attachmentLabel ?? m.attachmentUrl ?? "") : false;

  return (
    <div className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
          m.mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm border border-border bg-background"
        }`}
      >
        {href && isImage ? (
          <a href={href} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={href} alt={m.attachmentLabel ?? "image"} className="mb-1 max-h-60 rounded-lg" />
          </a>
        ) : href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            download={isUpload ? m.attachmentLabel ?? true : undefined}
            className={`mb-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs ${
              m.mine ? "bg-white/15 text-white" : "bg-secondary text-foreground"
            }`}
          >
            <Paperclip className="h-3.5 w-3.5" /> {m.attachmentLabel ?? "Open file"}
          </a>
        ) : null}
        {(!href || !isImage) && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
        <p className={`mt-0.5 text-[10px] ${m.mine ? "text-white/70" : "text-muted-foreground"}`}>{timeAgo(m.createdAt)}</p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <MessagesContent />
    </ProtectedRoute>
  );
}
