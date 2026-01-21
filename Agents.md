# Simple Agents Spec (Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + Supabase)

This document defines a lightweight “agent” workflow and coding rules for building production-ready features with:
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- shadcn/ui
- Supabase (Auth, Postgres, Storage, Realtime)

Primary goals:
- Clean architecture
- Readable code
- Best practices by default
- No code comments
- Minimal boilerplate
- Secure by default (RLS-first mindset)

---

## Global Rules

### Code Style
- No comments in code.
- Prefer self-documenting names: `fetchConversations`, `ConversationList`, `createServerSupabaseClient`.
- Keep functions small (≤ 30–50 lines when possible).
- Prefer early returns over nested conditionals.
- No `any`. Use explicit types or generics.
- Prefer `const` and immutable patterns.
- Keep UI pure and predictable (avoid hidden side effects).

### Next.js Best Practices
- Default to Server Components for pages/layouts.
- Use Client Components only when needed (state, effects, event handlers, browser APIs).
- Keep data access on the server when possible.
- Avoid leaking secrets into client code.

### Data Safety
- Supabase Row Level Security (RLS) is mandatory for user data.
- Server-side checks should complement RLS, not replace it.
- Never trust client input. Validate on server.

---

## Project Structure

Recommended structure:

app/
  (auth)/
    auth/
      page.tsx
  (app)/
    layout.tsx
    page.tsx
    c/
      [id]/
        page.tsx
    new/
      page.tsx
lib/
  supabase/
    client.ts
    server.ts
  db/
    types.ts
    queries/
      conversations.ts
      messages.ts
      profiles.ts
components/
  ui/              # shadcn
  chat/
    ChatShell.tsx
    ChatList.tsx
    ChatHeader.tsx
    MessageList.tsx
    MessageComposer.tsx
  search/
    UserSearch.tsx
styles/
  globals.css

Rules:
- `lib/db/queries/*` contains only data access functions.
- UI components never embed raw SQL or complex data logic.
- Server actions live close to pages or under `app/(app)/actions.ts` if shared.

---

## Supabase Usage Rules

### Client vs Server
- `lib/supabase/server.ts`: server client using cookies (SSR-safe)
- `lib/supabase/client.ts`: browser client for realtime subscriptions and client-only actions

### Data Access Pattern
- Server Components fetch initial data (fast, secure).
- Client Components handle realtime updates and local UI interactions.

### Auth & Protection
- Protect app routes in `app/(app)/layout.tsx`:
  - If no user -> `redirect("/auth")`
- Use onboarding gate if required (e.g., username missing).

### RLS Mindset
- Assume all tables are private by default.
- Use RLS policies to enforce:
  - Users can only read chats they are members of
  - Users can only insert messages in chats they belong to
  - Users can only update their own profile

---

## UI Rules (Tailwind v4 + shadcn/ui)
- Use shadcn/ui primitives for forms, dialogs, buttons, inputs.
- Tailwind classes should be short and reusable:
  - Prefer extracting to components over repeating long class strings.
- Prefer consistent spacing scale and typography:
  - Container padding: `px-4 md:px-6`
  - Card radius: `rounded-xl`
  - Borders: `border`, subtle backgrounds with `bg-muted/30` style tokens

---

## Validation & Types
- Use Zod for validating user input on server actions.
- Share types via `lib/db/types.ts`.
- Keep database return shapes typed and predictable.

---

## Realtime Rules
- Realtime for messages should be based on Postgres Changes:
  - Subscribe by conversation id
  - Append incoming messages to UI state
- Broadcast is allowed for ephemeral UX only:
  - typing indicators
  - presence

---

## Agent Workflow

Use these agents in sequence. Each agent outputs only what’s needed for the next step.

### Agent 1: Architect
Responsibilities:
- Decide data flow (server fetch vs client realtime)
- Define boundaries: server/client components
- Define DB query functions and required types
Output:
- File list to create/update
- Function signatures
- Component tree

Constraints:
- Keep it minimal and implementable
- Enforce RLS-first approach

Prompt template:
You are Architect. Define the cleanest implementation for the requested feature using Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + Supabase.
Return: file list, component tree, and function signatures. No comments.

---

### Agent 2: Data Layer
Responsibilities:
- Implement Supabase queries and server actions
- Add Zod validation
- Keep functions small and reusable
Output:
- `lib/db/queries/*` code
- server actions code if needed

Constraints:
- No comments
- Strict typing
- Use server client for privileged reads

Prompt template:
You are Data Layer. Implement the required query functions and server actions with strict typing and Zod validation.
Do not write UI. No comments.

---

### Agent 3: UI Builder
Responsibilities:
- Build UI with shadcn/ui + Tailwind v4
- Keep components readable and composable
- Ensure loading/empty/error states
Output:
- Components and pages code

Constraints:
- No comments
- Minimal state
- Client components only where required

Prompt template:
You are UI Builder. Implement the UI components and pages using shadcn/ui and Tailwind v4.
Keep code readable, no comments, add loading/empty/error states.

---

### Agent 4: QA Refiner
Responsibilities:
- Check edge cases (auth, permissions, empty lists)
- Remove duplication, improve naming
- Ensure no `any`, no dead code
Output:
- Small refactors only, keep behavior stable

Constraints:
- No comments
- No rewrites unless necessary

Prompt template:
You are QA Refiner. Review the code for correctness, edge cases, and readability.
Refactor lightly, keep behavior stable, no comments.

---

## Implementation Defaults (for chat-like features)

### Fetching
- Page server fetch:
  - current user
  - conversation header
  - initial message list (latest N)
- Client subscription:
  - new messages insert events
  - merge into list

### Messaging
- Insert messages through server action or direct client insert with RLS:
  - Prefer server action if you need extra validation logic
  - Prefer client insert for low-latency if RLS is strict and adequate

### Errors & States
- Always show:
  - loading skeleton
  - empty conversation state
  - send failure state

---

## Output Requirements for All Agents
- Use Next.js App Router conventions.
- Use React 19 patterns.
- Use Tailwind v4 and shadcn/ui components.
- Use Supabase best practices (server/client separation).
- Code must be readable with good naming.
- No comments in code.
- Provide complete, copy-paste-ready files when coding.

---
End.
