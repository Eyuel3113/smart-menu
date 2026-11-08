# AGENT.md - Smart Menu Project Directives

## 1. Prime Directives (Non-Negotiable)
1. **Never Duplicate Existing Code:**
   - Always inspect existing files, utilities, and components before writing new ones.
   - Do NOT create duplicate helper functions, types, or API clients (e.g., check `src/lib/api.ts`, `src/config/db.ts`).
   - If refactoring or extending, modify the existing file in place instead of creating `utils2.ts` or `NewComponent.tsx`.

2. **Zero Hallucination & Exact Typing:**
   - Do NOT invent API endpoints, Prisma models, or field names that do not exist in `prisma/schema.prisma`.
   - Never mock database IDs, status enums, or table fields unless explicitly writing automated unit tests.
   - Always derive types directly from Prisma (`Prisma.OrderGetPayload`, `OrderStatus`, `TableStatus`) or shared Zod schemas.

3. **Strict Architecture & Structure Guardrails:**
   - Do not alter established directory boundaries or move folders without explicit user approval.
   - Server-only code belongs exclusively in `server/`.
   - Frontend components belong exclusively in `client/src/`.
   - Business and database logic MUST remain in `services/` — controllers only orchestrate requests, and routes only define endpoints.

4. **Always Read Before Execution:**
   - Before executing code changes or generating prompts, inspect the relevant schema, route handler, and socket listeners first.

---

## 2. Source of Truth Files
Whenever writing or modifying functionality, refer directly to these files:
- **Database Models & Enums:** `server/prisma/schema.prisma`
- **Socket Event Names & Contracts:** `server/src/sockets/index.ts`
- **Database Singleton:** `server/src/config/db.ts`
- **Frontend API Client:** `client/src/lib/api.ts`
- **Frontend Socket Client:** `client/src/hooks/useSocket.ts`

---

## 3. Real-Time Order Lifecycle Pipeline
Adhere strictly to this event lifecycle when editing backend or frontend handlers:
1. **Customer Places Order:** Emits `order:placed` $\rightarrow$ pushes to room `manager_dashboard`.
2. **Manager Accepts:** Status becomes `ACCEPTED` $\rightarrow$ emits `order:accepted` to `table_{tableId}` and pushes ticket to `kitchen_display`.
3. **Kitchen Cooks & Finishes:** Status becomes `READY` $\rightarrow$ emits `order:ready` to `table_{tableId}` and `manager_dashboard`.
4. **Order Closed:** Status becomes `COMPLETED` $\rightarrow$ Table resets to `AVAILABLE` or `CLEANING`.

---

## 4. Coding Standards & Performance Rules
- **Backend (Express + Prisma):**
  - Prices must never be accepted from client payloads. Always fetch item price from the database before calculating `totalAmount`.
  - Always use database transactions (`prisma.$transaction`) when creating an order and updating table status simultaneously.
- **Frontend (Next.js App Router):**
  - Customer routes (`/table/[tableId]`) must remain zero-login, light, and optimized for mobile devices.
  - Audio alerts must only trigger on state change events, never re-trigger on simple component re-renders.
  - Clean up socket event listeners in `useEffect` cleanup return functions to prevent memory leaks.