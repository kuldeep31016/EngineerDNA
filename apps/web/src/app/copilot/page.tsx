"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Loader2, Sparkles } from "lucide-react";
import { COPILOT_STARTERS, type CopilotMessage } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { askCopilot } from "@/services/copilot";

function CopilotContent() {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setFollowups([]);
    setError(null);
    const history = messages;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setBusy(true);
    try {
      const res = await askCopilot({ question: q, history });
      setMessages((m) => [...m, { role: "assistant", content: res.answer }]);
      setFollowups(res.followups.slice(0, 3));
    } catch {
      setError("Couldn't reach your mentor. Make sure the model is configured, then try again.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <main className="mx-auto flex h-[calc(100vh-0px)] max-w-3xl flex-col px-6 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bot className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Career Copilot</h1>
          <p className="text-sm text-muted-foreground">A senior mentor who knows your verified profile.</p>
        </div>
      </div>

      {/* Conversation */}
      <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
        {empty ? (
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="mt-3 font-medium">Ask me anything about your engineering career.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Every answer is grounded in your verified DNA, reputation, evidence and career data — never generic.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {COPILOT_STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <Bubble key={i} message={m} />)
        )}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Your mentor is thinking…
          </div>
        )}

        {!busy && followups.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {followups.map((f) => (
              <button
                key={f}
                onClick={() => ask(f)}
                className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-rose-300">{error}</p>}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className="mt-4 flex items-end gap-2 rounded-2xl border border-border bg-card p-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void ask(input);
            }
          }}
          rows={1}
          placeholder="Ask your career mentor…"
          className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          aria-label="Send"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </form>
    </main>
  );
}

function Bubble({ message }: { message: CopilotMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Bot className="h-4 w-4" />
      </span>
      <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 text-sm leading-relaxed">
        {message.content}
      </div>
    </div>
  );
}

export default function CopilotPage() {
  return (
    <ProtectedRoute>
      <CopilotContent />
    </ProtectedRoute>
  );
}
