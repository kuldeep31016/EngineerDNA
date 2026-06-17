"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

export interface SectionField {
  key: string;
  label: string;
  type?: "text" | "textarea";
  placeholder?: string;
}

type Item = Record<string, string>;

/**
 * Generic, reusable editor for a list-style passport section (experience,
 * education, projects, ...). Add/edit via a dialog built from `fields`;
 * changes are pushed up via `onChange` so the page can persist them.
 */
export function EditableListSection({
  title,
  emptyHint,
  fields,
  primaryKey,
  secondaryKeys = [],
  bodyKey,
  items,
  onChange,
}: {
  title: string;
  emptyHint: string;
  fields: SectionField[];
  primaryKey: string;
  secondaryKeys?: string[];
  bodyKey?: string;
  items: Item[];
  onChange: (items: Item[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Item>({});

  const startAdd = () => {
    setEditingId(null);
    setDraft({});
    setOpen(true);
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id ?? null);
    setDraft({ ...item });
    setOpen(true);
  };

  const save = () => {
    if (!draft[primaryKey]?.trim()) return;
    if (editingId) {
      onChange(items.map((it) => (it.id === editingId ? { ...draft, id: editingId } : it)));
    } else {
      onChange([...items, { ...draft, id: crypto.randomUUID() }]);
    }
    setOpen(false);
  };

  const remove = (id: string) => onChange(items.filter((it) => it.id !== id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={startAdd}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyHint}</p>
        ) : (
          items.map((item) => {
            const itemId = item.id ?? "";
            const meta = secondaryKeys
              .map((k) => item[k])
              .filter((v) => v && v.trim())
              .join(" · ");
            return (
              <div
                key={itemId}
                className="group flex items-start justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item[primaryKey]}</p>
                  {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
                  {bodyKey && item[bodyKey] && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {item[bodyKey]}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(itemId)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog open={open} onClose={() => setOpen(false)} title={`${editingId ? "Edit" : "Add"} ${title}`}>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.key}
                  placeholder={field.placeholder}
                  value={draft[field.key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                />
              ) : (
                <Input
                  id={field.key}
                  placeholder={field.placeholder}
                  value={draft[field.key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}
