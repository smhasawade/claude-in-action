"use client";

import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function basename(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? path;
}

function getLabel(toolName: string, args: Record<string, unknown>): string {
  const command = args.command as string | undefined;
  const path = typeof args.path === "string" ? basename(args.path) : "";

  if (toolName === "str_replace_editor") {
    if (command === "create") return `Creating ${path}`;
    if (command === "str_replace" || command === "insert" || command === "undo_edit") return `Editing ${path}`;
    if (command === "view") return `Reading ${path}`;
  }
  if (toolName === "file_manager") {
    if (command === "rename") return `Renaming ${path}`;
    if (command === "delete") return `Deleting ${path}`;
  }
  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const label = getLabel(toolInvocation.toolName, toolInvocation.args as Record<string, unknown>);
  const isDone = toolInvocation.state === "result" && toolInvocation.result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
