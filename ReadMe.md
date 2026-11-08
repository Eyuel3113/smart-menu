1. High-Level System ArchitectureTo make this real-time and lag-free without authentication overhead for diners:Customer Session (Ephemeral & Secure):Table QR / NFC contains a signed link: [https://your-domain.com/table/:tableId?token=SIGNATURE](https://your-domain.com/table/:tableId?token=SIGNATURE) (or table code).On scan, the backend issues an ephemeral short-lived JWT stored in sessionStorage containing { tableId, sessionToken }. No signup or login required.Requests from that tab are automatically pinned to that specific table session.Real-Time State Machine (WebSockets via Socket.io):Customer Rooms: table:<tableId> (receives status updates: Accepted, Cooking, Ready, Served, Paid).Staff Rooms: staff:dashboard (manager view for new orders, call waiter, bill requests, table status) and kitchen:display (KDS view for accepted food tickets).Event Pipeline:Customer places order $\rightarrow$ emits order:placed $\rightarrow$ Manager dashboard rings/updates instantly.Manager clicks "Accept" $\rightarrow$ emits order:accepted $\rightarrow$ pushes ticket to Kitchen KDS $\rightarrow$ Customer UI switches to "Order Confirmed / In Kitchen".Kitchen clicks "Ready" $\rightarrow$ Manager & Waiter notified $\rightarrow$ Customer notified.Customer clicks "Call Waiter" / "Request Bill" $\rightarrow$ Real-time notification to Manager/Staff dashboard.Performance & Low Latency Strategy:Use connection pooling via @prisma/client.In-memory caching (or Redis adapter if running multi-instance) for active table states and real-time socket events.Optimistic UI updates with client-side state caching (React Query / SWR).

2. Database Schema (Prisma Schema)

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum TableStatus {
  AVAILABLE
  OCCUPIED
  BILL_REQUESTED
  CLEANING
}

enum OrderStatus {
  PENDING      // Sent by customer, awaiting manager acceptance
  ACCEPTED     // Accepted by manager, sent to kitchen
  PREPARING    // Kitchen is cooking
  READY        // Food ready to serve
  SERVED       // Delivered to table
  REJECTED     // Rejected by manager
  COMPLETED    // Paid and closed
}

enum StaffRole {
  ADMIN
  MANAGER
  KITCHEN
  WAITER
}

enum ServiceRequestType {
  CALL_WAITER
  REQUEST_BILL
}

enum ServiceRequestStatus {
  PENDING
  ACKNOWLEDGED
  RESOLVED
}

model Restaurant {
  id          String       @id @default(uuid())
  name        String
  currency    String       @default("ETB")
  tables      Table[]
  categories  Category[]
  menuItems   MenuItem[]
  orders      Order[]
  staff       Staff[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Staff {
  id           String      @id @default(uuid())
  restaurantId String
  restaurant   Restaurant  @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  email        String      @unique
  passwordHash String
  name         String
  role         StaffRole   @default(WAITER)
  createdAt    DateTime    @default(now())
}

model Table {
  id              String            @id @default(uuid())
  restaurantId    String
  restaurant      Restaurant        @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  tableNumber     Int
  qrCodeUrl       String?
  secretToken     String            @default(uuid()) // Validates QR authenticity
  status          TableStatus       @default(AVAILABLE)
  orders          Order[]
  serviceRequests ServiceRequest[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([restaurantId, tableNumber])
}

model Category {
  id           String      @id @default(uuid())
  restaurantId String
  restaurant   Restaurant  @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  name         String
  sortOrder    Int         @default(0)
  items        MenuItem[]
}

model MenuItem {
  id           String      @id @default(uuid())
  restaurantId String
  restaurant   Restaurant  @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  categoryId   String
  category     Category    @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  name         String
  description  String?
  price        Decimal     @db.Decimal(10, 2)
  imageUrl     String?
  isAvailable  Boolean     @default(true)
  orderItems   OrderItem[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model Order {
  id           String         @id @default(uuid())
  restaurantId String
  restaurant   Restaurant     @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  tableId      String
  table        Table          @relation(fields: [tableId], references: [id], onDelete: Cascade)
  status       OrderStatus    @default(PENDING)
  totalAmount  Decimal        @db.Decimal(10, 2)
  notes        String?
  items        OrderItem[]
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
}

model OrderItem {
  id         String    @id @default(uuid())
  orderId    String
  order      Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItemId String
  menuItem   MenuItem  @relation(fields: [menuItemId], references: [id])
  quantity   Int       @default(1)
  unitPrice  Decimal   @db.Decimal(10, 2)
  notes      String?
}

model ServiceRequest {
  id           String               @id @default(uuid())
  tableId      String
  table        Table                @relation(fields: [tableId], references: [id], onDelete: Cascade)
  type         ServiceRequestType
  status       ServiceRequestStatus @default(PENDING)
  createdAt    DateTime             @default(now())
  resolvedAt   DateTime?
}

3. Clean Monorepo / Split Folder Structure

smart-menu/
├── server/                          # Node.js / Express Backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── config/                  # DB, env, cors, socket settings
│   │   ├── controllers/             # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── table.controller.ts
│   │   │   ├── menu.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── service.controller.ts
│   │   │   └── analytics.controller.ts
│   │   ├── middlewares/             # Error handlers, staff auth, table validation
│   │   ├── routes/                  # Express routes
│   │   ├── services/                # Business logic & DB transactions
│   │   ├── sockets/                 # Socket.io handlers & room events
│   │   │   ├── index.ts
│   │   │   ├── orderEvents.ts
│   │   │   └── serviceEvents.ts
│   │   ├── utils/                   # QR generator, token signers
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── client/                          # Next.js / React Frontend
│   ├── public/                      # Audio alerts (bell ding for manager/kitchen)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (customer)/          # Zero-login customer ordering portal
│   │   │   │   └── table/[tableId]/
│   │   │   │       ├── page.tsx     # Menu browsing, cart drawer, call waiter
│   │   │   │       └── track/page.tsx # Live order tracker
│   │   │   ├── (dashboard)/         # Staff & Kitchen interfaces (Protected)
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── manager/
│   │   │   │   │   ├── page.tsx     # Live order cards, table grid, call alerts
│   │   │   │   │   ├── tables/page.tsx # Manage QR codes & table statuses
│   │   │   │   │   ├── menu/page.tsx   # Item management & availability toggles
│   │   │   │   │   └── analytics/page.tsx # Daily revenue, top dishes, sales trends
│   │   │   │   └── kitchen/
│   │   │   │       └── page.tsx     # Big ticket KDS (Kitchen Display System)
│   │   ├── components/
│   │   │   ├── customer/            # MenuCard, CartSheet, FloatingActionBar
│   │   │   ├── dashboard/           # OrderActionModal, TableBadge, StatCards
│   │   │   └── ui/                  # Tailwind buttons, dialogs, badges
│   │   ├── hooks/
│   │   │   ├── useSocket.ts         # Persistent real-time hook
│   │   │   └── useCart.ts           # Local storage cart management
│   │   └── lib/
│   │       ├── api.ts
│   │       └── sound.ts             # Audio trigger on new order
│   ├── package.json
│   └── tailwind.config.ts
```

## 4. Step-by-Step Implementation Roadmap

### ✅ Step 1: Backend Scaffolding & Database Setup
- [x] Initialized Express with TypeScript, Prisma ORM, and PostgreSQL connection.
- [x] Implemented database schema in `server/prisma/schema.prisma` with `Restaurant`, `Staff`, `Table`, `Category`, `MenuItem`, `Order`, `OrderItem`, and `ServiceRequest`.
- [x] Executed database migrations and schema sync.
- [x] Created database seed script `server/prisma/seed.ts` populating restaurant data, hashed staff accounts, categorized menu items, and 10 tables with unique QR tokens and Base64 data URLs.

### ✅ Step 2: Socket.io Real-Time Event Architecture
- [x] Bound Socket.io engine with Express HTTP server in `server/src/server.ts`.
- [x] Implemented dedicated real-time room separation:
  - Customer table rooms: `table_{tableId}` & `table:{tableId}`
  - Staff / Manager dashboard room: `manager_dashboard` & `staff:dashboard`
  - Kitchen KDS display room: `kitchen_display` & `kitchen:display`
- [x] Built event broadcasters in `server/src/sockets/orderEvents.ts` and `server/src/sockets/serviceEvents.ts`:
  - `order:placed`, `order:accepted`, `order:preparing`, `order:ready`, `order:served`, `order:rejected`, `order:completed`
  - `table:status_updated`, `service:requested`, `service:status_updated`

### ✅ Step 3: Core API Endpoints
- [x] **Public Customer APIs:**
  - `GET /api/tables/:id/validate?token=...` & `POST /api/tables/validate`: Authenticates QR token and issues ephemeral short-lived JWT session.
  - `GET /api/menu/public`: Fetches categories and menu items with real-time availability.
  - `POST /api/orders`: Validates dish availability, calculates total securely from DB prices (no client tampering), uses `prisma.$transaction` to atomically create order and mark table as `OCCUPIED`, emits `order:placed` to manager dashboard.
  - `GET /api/orders/table/:tableId`: Live active order status for the table.
  - `POST /api/service`: Customer calls waiter or requests bill (`CALL_WAITER` / `REQUEST_BILL`), updates table status to `BILL_REQUESTED`, emits real-time alert to staff.
- [x] **Manager Protected APIs (JWT Auth & Role Enforcement):**
  - `POST /api/auth/login` & `GET /api/auth/me`: Staff authentication and role claims.
  - `PATCH /api/orders/:id/accept` & `PATCH /api/orders/:id/reject`: Transitions orders; emits `order:accepted` to table and pushes ticket to kitchen KDS.
  - `GET /api/tables` & `PATCH /api/tables/:id/status`: Table matrix monitoring and live status updates (`AVAILABLE`, `OCCUPIED`, `BILL_REQUESTED`, `CLEANING`).
  - `GET /api/analytics/dashboard`: Gross daily revenue, completed order volume, average order value, table occupancy distribution, top-selling dishes, and 7-day revenue trend.
- [x] **Kitchen APIs (KDS):**
  - `GET /api/orders/kitchen`: Live queue of active kitchen orders (`ACCEPTED`, `PREPARING`).
  - `PATCH /api/orders/:id/prepare`: Marks order as actively cooking.
  - `PATCH /api/orders/:id/ready`: Marks order ready for table delivery; emits `order:ready` to customer table and manager.
  - `PATCH /api/orders/:id/complete`: Marks order completed and resets table to `AVAILABLE`.

### ✅ Step 4: Customer Mobile-First PWA UI (Next.js)
- [x] Initialized Next.js App Router with Tailwind CSS v4 and Lucide icons in `/client`.
- [x] Implemented customer dining portal at `client/src/app/(customer)/table/[tableId]/page.tsx`:
  - Token validation on mount via `GET /api/tables/:id/validate`, storing session in `sessionStorage`.
  - Prominent top sticky status header with restaurant info and instant "Call Waiter" / "Request Bill" actions.
  - Horizontal scrollable category pill bar with smooth anchoring.
  - Dish cards with images, pricing, and cart quantity toggles.
  - Sticky bottom cart bar opening a slide-over Cart Sheet with notes and checkout handler.
- [x] Implemented live order tracking at `client/src/app/(customer)/table/[tableId]/track/page.tsx`:
  - Persistent real-time WebSocket connection to `table_{tableId}` room.
  - Multi-step visual progress stepper (`PENDING` -> `ACCEPTED`/`PREPARING` -> `READY` -> `SERVED`/`COMPLETED`).
  - Real-time audible ding on order status transitions and ticket itemized breakdown.

### ✅ Step 5: Manager Dashboard & Kitchen KDS
- [x] Implemented staff authentication at `client/src/app/(dashboard)/login/page.tsx`:
  - Form validation with JWT storage in `localStorage` and role-based redirect.
  - One-click demo credentials chips for Manager and Kitchen roles.
- [x] Implemented Manager Operations Station at `client/src/app/(dashboard)/manager/page.tsx`:
  - Real-time subscription to `manager_dashboard` room with Web Audio API chime synthesis.
  - Tab 1: Live Orders Queue with one-click "Accept &rarr; Kitchen" and "Reject" workflow buttons.
  - Tab 2: 10-Table Live Matrix with color-coded status badges and instant status dropdown updates.
  - Tab 3: Service Requests feed for waiter calls and bill requests with "Mark Resolved" action.
- [x] Implemented Manager Analytics at `client/src/app/(dashboard)/manager/analytics/page.tsx`:
  - Summary KPI cards: Gross Sales, Order Volume, AOV, and Table Occupancy rate.
  - 7-day revenue trend bar chart and Top 5 best sellers list.
- [x] Implemented Kitchen Display System (KDS) at `client/src/app/(dashboard)/kitchen/page.tsx`:
  - Real-time subscription to `kitchen_display` room.
  - Large ticket grid filtering for `ACCEPTED` and `PREPARING` dishes.
  - Live ticking elapsed timer with color warnings (Amber at >10 mins, Red at >15 mins).
  - One-touch "Start Cooking" and "Mark as Ready" state transitions.
