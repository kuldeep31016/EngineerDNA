"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Copy, File, Folder, FolderOpen } from "lucide-react";

interface TreeNode {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  isFile: boolean;
}

/** Build a nested tree from flat "a/b/c.ts" paths. */
function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: "", path: "", children: new Map(), isFile: false };
  for (const path of paths) {
    const parts = path.split("/").filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      let child = node.children.get(part);
      if (!child) {
        child = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          children: new Map(),
          isFile: isLast,
        };
        node.children.set(part, child);
      }
      node = child;
    });
  }
  return root;
}

/** Folders first, then files; each alphabetical. */
function sortedChildren(node: TreeNode): TreeNode[] {
  return [...node.children.values()].sort((a, b) => {
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}

/** Render the whole tree as a copyable ASCII outline (├──, └──, │), like `tree`. */
function toAscii(root: TreeNode): string {
  const lines: string[] = [];
  const walk = (node: TreeNode, prefix: string) => {
    const children = sortedChildren(node);
    children.forEach((child, i) => {
      const last = i === children.length - 1;
      lines.push(`${prefix}${last ? "└── " : "├── "}${child.name}${child.isFile ? "" : "/"}`);
      if (!child.isFile) walk(child, `${prefix}${last ? "    " : "│   "}`);
    });
  };
  walk(root, "");
  return lines.join("\n");
}

function Row({ node, depth }: { node: TreeNode; depth: number }) {
  // Expand the top two levels by default; deeper folders start collapsed.
  const [open, setOpen] = useState(depth < 2);
  const children = sortedChildren(node);

  if (node.isFile) {
    return (
      <div
        className="flex items-center gap-1.5 rounded-md py-1 pr-2 text-sm text-muted-foreground"
        style={{ paddingLeft: depth * 16 + 8 }}
      >
        <File className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <span className="truncate">{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-sm font-medium transition-colors hover:bg-accent"
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
        {open ? (
          <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
        ) : (
          <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {open && children.map((c) => <Row key={c.path} node={c} depth={depth + 1} />)}
    </div>
  );
}

/** A VS Code–style expandable file tree, built from flat repository paths. */
export function FileTree({ paths, truncated }: { paths: string[]; truncated?: boolean }) {
  const root = useMemo(() => buildTree(paths), [paths]);
  const top = sortedChildren(root);
  const [copied, setCopied] = useState(false);

  async function copyAscii() {
    try {
      await navigator.clipboard.writeText(toAscii(root));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  if (paths.length === 0) {
    return <p className="text-sm text-muted-foreground">No files to show.</p>;
  }

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          onClick={copyAscii}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy as tree"}
        </button>
      </div>
      <div className="rounded-lg border border-border bg-background/40 p-2 font-mono">
        {top.map((c) => (
          <Row key={c.path} node={c} depth={0} />
        ))}
        {truncated && (
          <p className="px-2 pt-2 text-xs text-muted-foreground">
            Showing the first 1,500 files — larger folders are trimmed for performance.
          </p>
        )}
      </div>
    </div>
  );
}
