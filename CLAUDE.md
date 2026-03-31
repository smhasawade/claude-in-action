# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**UIGen** — an AI-powered React component generator with live preview. Users describe components in a chat interface; Claude generates files into a virtual file system that renders in real-time.

## Commands

```bash
# First-time setup
npm run setup          # install deps, generate Prisma client, run migrations

# Development
npm run dev            # Next.js dev server with Turbopack
npm run dev:daemon     # same, but runs in background (logs → logs.txt)

# Linting / Testing
npm run lint           # ESLint via Next.js
npm test               # Vitest (jsdom environment)
npx vitest run src/lib/transform/jsx-transformer.test.ts  # run a single test file

# Database
npm run db:reset       # reset and re-run migrations

# Production
npm run build && npm start
```

## Architecture

### Data Flow

1. User types in `ChatInterface` → POST to `/api/chat`
2. API streams Claude responses with tool calls (`str_replace_editor`, `file_manager`)
3. Tools mutate the **virtual file system** (in-memory `Map`)
4. `FileSystemContext` propagates state changes to components
5. `PreviewFrame` (iframe) detects FS changes and re-renders the component
6. On completion, authenticated users' data is saved to SQLite via Prisma

### Virtual File System (`src/lib/file-system.ts`)

Central abstraction — an in-memory `Map<path, content>` with create/read/update/delete, path normalization, and serialization. All paths are normalized to a leading slash with no trailing slash. The AI tools (`src/lib/tools/`) operate on this FS, not the real filesystem.

### AI Integration (`src/app/api/chat/route.ts`)

Uses Vercel AI SDK (`streamText`) with Claude. The model is `claude-haiku-4-5` (configured in `src/lib/provider.ts`). Two tools are exposed:

- `str_replace_editor` — view, create, str_replace, or insert content in virtual files
- `file_manager` — rename or delete files/directories

When `ANTHROPIC_API_KEY` is absent, `MockLanguageModel` returns canned component examples across 4 steps (create component → add styling → create App.jsx wrapper → summary). Max steps: 40 (real), 4 (mock). Max tokens: 10,000. Max duration: 120s.

### Preview Transform Pipeline (`src/lib/transform/`)

Three-stage pipeline that converts virtual FS files into a runnable iframe:

1. **`transformJSX()`** — Babel standalone transforms JSX/TSX → JS, strips CSS imports, detects TypeScript, collects all import specifiers.
2. **`createImportMap()`** — builds a browser ES import map: local files become blob URLs; third-party packages resolve to `esm.sh` CDN; missing imports get placeholder stub modules.
3. **`createPreviewHTML()`** — assembles the final iframe `srcdoc`: import map, Tailwind CDN, an `ErrorBoundary`, and the entry component (`App.jsx` → `App.tsx` → `index.jsx/tsx`).

### State Management

Two React contexts:
- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) — virtual FS state, all file operations, and tool-call handlers for `str_replace_editor`/`file_manager`
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — messages, Vercel AI SDK `useChat` hook, serializes the virtual FS on each send

### Authentication (`src/lib/auth.ts`)

JWT sessions via `jose` (HS256), stored as httpOnly cookies (7-day expiry). Middleware (`src/middleware.ts`) only protects `/api/projects` and `/api/filesystem` — all other routes are public. Passwords hashed with `bcrypt`. Anonymous users work without signing in; their session data lives in localStorage.

### Database

Prisma + SQLite. Two models:
- `User` — email/password
- `Project` — `messages` and `data` (serialized VirtualFileSystem) stored as JSON strings; `userId` is nullable (anonymous projects)

Schema: `prisma/schema.prisma` — reference this file any time you need to understand the structure of data stored in the database. Generated client: `src/generated/`.

### Key Directories

| Path | Purpose |
|------|---------|
| `src/app/api/chat/` | Streaming chat endpoint |
| `src/actions/` | Server actions for auth and project CRUD |
| `src/lib/tools/` | AI tool definitions (str_replace_editor, file_manager) |
| `src/lib/prompts/` | System prompt (requires /App.jsx entry, Tailwind, @/ imports) |
| `src/lib/transform/` | JSX→HTML transform pipeline for preview iframe |
| `src/components/preview/` | PreviewFrame renders generated components |
| `src/components/editor/` | Monaco editor + file tree |
| `src/components/chat/` | Chat UI |

## Environment

Requires `.env` with:
```
ANTHROPIC_API_KEY=...   # omit to use mock responses
```

## Code Style

Use comments sparingly. Only comment complex code.

## Node Compatibility

`node-compat.cjs` is a shim loaded via `NODE_OPTIONS` in `dev`/`build` scripts. It patches Node.js APIs for Next.js edge/server compatibility — do not remove it from the npm scripts.
