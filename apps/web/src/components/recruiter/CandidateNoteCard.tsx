"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Lock, NotebookPen, Star } from "lucide-react";
import { getCandidateNote, saveCandidateNote } from "@/services/recruiter";

/** A recruiter's PRIVATE notes + 1–5 rating on a candidate. Never shown to the
 *  candidate. Loads existing note, lets the recruiter edit and save. */
export function CandidateNoteCard({ candidateId }: { candidateId: string }) {
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getCandidateNote(candidateId)
      .then((n) => {
        if (!active || !n) return;
        setBody(n.body ?? "");
        setRating(n.rating);
        setSavedAt(n.updatedAt);
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [candidateId]);

  async function persist(nextRating: number | null, nextBody: string) {
    setSaving(true);
    try {
      const saved = await saveCandidateNote(candidateId, { body: nextBody, rating: nextRating });
      setSavedAt(saved.updatedAt);
      setDirty(false);
    } catch {
      /* keep dirty so the recruiter can retry */
    } finally {
      setSaving(false);
    }
  }

  function pickRating(v: number) {
    const next = rating === v ? null : v; // click the active star again to clear
    setRating(next);
    void persist(next, body); // rating saves immediately
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <NotebookPen className="h-4 w-4 text-primary" /> Your private notes
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" /> Only you can see this
        </span>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Rating */}
          <div className="mb-3 flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => {
              const active = (hover || rating || 0) >= v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => pickRating(v)}
                  onMouseEnter={() => setHover(v)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`Rate ${v} star${v === 1 ? "" : "s"}`}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`h-5 w-5 ${active ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </button>
              );
            })}
            <span className="ml-2 text-xs text-muted-foreground">
              {rating ? `${rating}/5` : "Not rated"}
            </span>
          </div>

          {/* Notes */}
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setDirty(true);
            }}
            rows={4}
            placeholder="Strengths, concerns, interview notes, follow-ups…"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {saving
                ? "Saving…"
                : savedAt
                  ? `Saved ${new Date(savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                  : "Not saved yet"}
            </span>
            <button
              onClick={() => persist(rating, body)}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {dirty ? "Save note" : "Saved"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
