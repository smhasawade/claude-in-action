import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "partial-call" | "result" = "result",
  result: unknown = "ok"
): ToolInvocation {
  if (state === "result") {
    return { toolCallId: "test", toolName, args, state, result } as ToolInvocation;
  }
  return { toolCallId: "test", toolName, args, state } as ToolInvocation;
}

// str_replace_editor labels
test("create command shows 'Creating {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/Card.tsx" })} />);
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

test("str_replace command shows 'Editing {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/App.tsx" })} />);
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("insert command shows 'Editing {filename}' and strips directory", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "/utils/helpers.ts" })} />);
  expect(screen.getByText("Editing helpers.ts")).toBeDefined();
});

test("view command shows 'Reading {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/index.tsx" })} />);
  expect(screen.getByText("Reading index.tsx")).toBeDefined();
});

test("undo_edit command shows 'Editing {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "undo_edit", path: "/Button.tsx" })} />);
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

// file_manager labels
test("rename command shows 'Renaming {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "rename", path: "/old.tsx" })} />);
  expect(screen.getByText("Renaming old.tsx")).toBeDefined();
});

test("delete command shows 'Deleting {filename}'", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/old.tsx" })} />);
  expect(screen.getByText("Deleting old.tsx")).toBeDefined();
});

// Fallback
test("unknown tool name renders raw toolName", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("some_unknown_tool", { command: "create", path: "/foo.tsx" })} />);
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

test("known tool with unknown command falls back to raw toolName", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", {})} />);
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

// Visual state
test("state 'call' shows spinner, no green dot", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/A.tsx" }, "call")} />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("state 'result' with truthy result shows green dot, no spinner", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/A.tsx" }, "result", "ok")} />
  );
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("state 'result' with null result shows spinner (not done)", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/A.tsx" }, "result", null)} />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

// Basename edge cases
test("path with no leading slash renders correctly", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "Card.tsx" })} />);
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

test("deeply nested path shows only the filename", () => {
  render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/a/b/c/Component.tsx" })} />);
  expect(screen.getByText("Creating Component.tsx")).toBeDefined();
});
