# dreamVision — AI Coding Agent Master Prompt

> **Use this prompt with:** Claude Code, Cursor, Windsurf, Copilot Workspace, or any AI coding agent.
> **Paste this entire file** as the first message / system context. Do not summarize it.

---

## AGENT IDENTITY & RULES

You are a senior full-stack engineer building **dreamVision** — a production-ready industrial IoT dashboard for a hackathon. Your job is to build this project completely, step-by-step, with zero errors.

### Non-Negotiable Rules

1. **Build in strict phase order.** Never skip ahead. Complete and verify each phase before starting the next.
2. **Never hallucinate APIs.** If you are not 100% certain of a Convex, Next.js, or library API, state that clearly and use the documented pattern.
3. **Never use `any` in TypeScript.** Every type must be explicit.
4. **Never store base64 image strings in Convex documents.** Always use `ctx.storage.store()` and store the `storageId` reference.
5. **Always use server-side timestamps.** Never trust the ESP32 device clock. Stamp `Date.now()` in the Convex HTTP Action.
6. **After writing every file, state what you did and what comes next.** No silent jumps.
7. **If you encounter a type error, fix it before continuing.** Never suppress with `// @ts-ignore`.
8. **Read the architecture section fully before writing a single line of code.**
9. **All `"use client"` directives go on line 1** of client components — before any imports.
10. **Ask before making any architectural decision not covered in this prompt.**

---

## PROJECT OVERVIEW

**Name:** dreamVision
**Type:** Real-time industrial defect detection and thermal monitoring dashboard
**Hackathon context:** Must be visually impressive and demo-stable. Judges evaluate UI/UX, innovation, and live demo.

### Hardware (Edge Node)

| Component | Role |
|---|---|
| ESP32-S3 | Edge node — reads sensors, sends HTTP POST every 500ms |
| GY-906 (MLX90614) | Non-contact IR temperature sensor |
| OV3660 | Camera module — captures frame on defect detection |

### Three "Wow" Features (Must all work on demo day)

| # | Feature | What It Does |
|---|---|---|
| 1 | **Predictive Ghost Line** | Live temp chart + dashed forecasted trajectory. Pulses red if forecast crosses 45°C |
| 2 | **Digital Twin** | Rotating 3D machine part that glows yellow → red based on live temperature |
| 3 | **X-Ray Incident Cards** | CSS-filtered defect snapshot cards that appear live when ESP32 flags anomaly |

---

## TECH STACK (Do Not Deviate)

| Layer | Technology | Version |
|---|---|---|
| Meta-framework | Next.js App Router | 14.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Realtime DB + API | Convex | latest |
| Charts | Recharts | latest |
| 3D | @react-three/fiber + @react-three/drei | latest |
| Runtime | Node.js | 18+ |

---

## SYSTEM ARCHITECTURE

### Data Flow (Read This Carefully)

```
ESP32-S3
  │
  │  HTTP POST /ingest  every 500ms
  │  Header: x-device-secret: <secret>
  │  Body: { "temp": 38.5, "status": "OK" }
  │  Body (on defect): { "temp": 43.1, "status": "NOK", "imageBase64": "..." }
  ▼
Convex HTTP Action (convex/http.ts)
  │  1. Validate x-device-secret header → 401 if wrong
  │  2. Parse JSON body → 400 if malformed
  │  3. Validate types → 422 if invalid
  │  4. Stamp server-side timestamp (Date.now())
  │  5. Call insertReading mutation
  │  6. If status == "NOK" && imageBase64 exists:
  │       → ctx.storage.store(blob) → get storageId
  │       → call logDefect mutation with storageId
  ▼
Convex Database
  ├── telemetry table  (rolling window, max 100 rows — auto-pruned)
  └── defects table    (permanent log, storageId references only)
      └── _storage     (Convex File Storage — actual image bytes)
  │
  │  WebSocket push (automatic via Convex — no polling)
  ▼
Next.js Dashboard (Browser)
  ├── useQuery(api.telemetry.getLatest)  → ConnectionStatus, DigitalTwin
  ├── useQuery(api.telemetry.getLast20)  → GhostLineChart
  └── useQuery(api.defects.getAll)       → XRayCards
```

### Critical Architecture Decisions

| Decision | Reason |
|---|---|
| Server-side timestamp | ESP32 clocks drift — always stamp on Convex arrival |
| `storageId` not base64 | Convex documents have ~1MB limit — images overflow it |
| Rolling 100-row telemetry | Prevents unbounded growth without a separate cron job |
| Single `/ingest` endpoint | Simpler ESP32 firmware, Convex handles routing internally |
| No Pi 5, no intermediary | ESP32 → Convex directly for minimum latency |

---

## PROJECT STRUCTURE (Create Exactly This)

```
dreamvision/
│
├── convex/
│   ├── schema.ts              ← PHASE 1, STEP 1
│   ├── telemetry.ts           ← PHASE 1, STEP 2
│   ├── defects.ts             ← PHASE 1, STEP 3
│   ├── http.ts                ← PHASE 1, STEP 4
│   └── _generated/            ← AUTO-GENERATED — never touch
│
├── app/
│   ├── layout.tsx             ← PHASE 2, STEP 1
│   ├── ConvexClientProvider.tsx ← PHASE 2, STEP 1
│   ├── page.tsx               ← PHASE 2, STEP 2 (scaffold) + PHASE 5 (final)
│   └── components/
│       ├── ConnectionStatus.tsx ← PHASE 2, STEP 3
│       ├── GhostLineChart.tsx   ← PHASE 3
│       ├── DigitalTwin.tsx      ← PHASE 4
│       └── XRayCards.tsx        ← PHASE 5
│
├── lib/
│   └── forecast.ts            ← PHASE 3, STEP 1
│
├── public/
│   └── models/
│       └── gear.gltf          ← PHASE 4, STEP 1 (source or generate)
│
├── .env.local                 ← PHASE 1 SETUP
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## PHASE 0 — PROJECT SCAFFOLDING

**Goal:** Create the Next.js project, install all dependencies, initialize Convex locally, set up environment variables.

### Step 0.1 — Scaffold Next.js

Run this command exactly:

```bash
npx create-next-app@latest dreamvision \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

Then:

```bash
cd dreamvision
```

### Step 0.2 — Install All Dependencies

Install everything upfront so there are no mid-build surprises:

```bash
npm install convex
npm install recharts
npm install @react-three/fiber @react-three/drei three
npm install @types/three --save-dev
```

### Step 0.3 — Initialize Convex Locally

```bash
npx convex dev
```

This opens a browser login. After login it creates:
- `convex/` directory
- `convex.json`
- Updates `.env.local` with `CONVEX_URL`

**Keep this terminal running.** Open a second terminal for all other commands.

### Step 0.4 — Configure `.env.local`

Open `.env.local` and ensure it contains:

```bash
# Added by Convex CLI — do not change this line
CONVEX_URL=http://127.0.0.1:3210

# Required for browser-side Convex client
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210

# Device authentication secret — never expose with NEXT_PUBLIC_ prefix
DEVICE_SECRET=dv_secret_2026
```

**IMPORTANT:** `DEVICE_SECRET` must NEVER have the `NEXT_PUBLIC_` prefix. It is only read by Convex server-side via `process.env.DEVICE_SECRET`.

### Step 0.5 — Configure `next.config.ts`

Replace the contents of `next.config.ts` with:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for @react-three/fiber
  transpilePackages: ["three"],
  // Silence Convex-related webpack warnings
  webpack: (config) => {
    config.externals = [...(config.externals || [])];
    return config;
  },
};

export default nextConfig;
```

### Phase 0 Completion Check

Before moving to Phase 1, verify:
- [ ] `node_modules/convex` exists
- [ ] `node_modules/recharts` exists
- [ ] `node_modules/@react-three` exists
- [ ] `convex/` directory exists (created by CLI)
- [ ] `.env.local` has all 3 variables
- [ ] `npx convex dev` terminal shows "Convex functions ready"

---

## PHASE 1 — CONVEX BACKEND

**Goal:** Define the database schema, all mutations, all queries, and the authenticated HTTP endpoint. No frontend code in this phase.

### Step 1.1 — `convex/schema.ts`

**Rules:**
- `telemetry` uses `v.number()` for `timestamp` — Unix milliseconds, set server-side
- `defects` uses `v.id("_storage")` for image reference — NEVER `v.string()` for base64
- No indexes needed at this scale

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  telemetry: defineTable({
    temp: v.number(),
    status: v.string(),    // strictly "OK" or "NOK"
    timestamp: v.number(), // Unix ms — always set server-side in HTTP action
  }),

  defects: defineTable({
    storageId: v.id("_storage"), // Convex File Storage ref — never base64
    heatSignature: v.number(),   // temp at time of defect
    timeDetected: v.string(),    // ISO 8601 e.g. "2026-03-18T10:30:00.000Z"
  }),
});
```

### Step 1.2 — `convex/telemetry.ts`

**Rules:**
- `insertReading` always prunes after insert — keep max 100 rows
- Pruning uses `.order("desc")` then `.slice(100)` — deletes oldest rows
- `getLast20` returns newest-first — frontend reverses for chronological chart display
- `getLatest` returns `null` if table is empty — frontend must handle this

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const insertReading = mutation({
  args: {
    temp: v.number(),
    status: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Insert new reading
    await ctx.db.insert("telemetry", {
      temp: args.temp,
      status: args.status,
      timestamp: args.timestamp,
    });

    // Auto-prune: keep only the latest 100 rows
    const all = await ctx.db
      .query("telemetry")
      .order("desc")
      .collect();

    if (all.length > 100) {
      const toDelete = all.slice(100);
      for (const row of toDelete) {
        await ctx.db.delete(row._id);
      }
    }
  },
});

export const getLast20 = query({
  args: {},
  handler: async (ctx) => {
    // Returns newest-first — reverse on frontend for chart ordering
    return await ctx.db
      .query("telemetry")
      .order("desc")
      .take(20);
  },
});

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    // Returns null if table is empty — frontend must handle null case
    return await ctx.db
      .query("telemetry")
      .order("desc")
      .first();
  },
});
```

### Step 1.3 — `convex/defects.ts`

**Rules:**
- `logDefect` only receives `storageId` — never the raw image bytes
- `getAll` resolves each `storageId` to a signed URL using `ctx.storage.getUrl()`
- `imageUrl` can be `null` if the file was deleted — frontend renders conditionally

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const logDefect = mutation({
  args: {
    storageId: v.id("_storage"),
    heatSignature: v.number(),
    timeDetected: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("defects", {
      storageId: args.storageId,
      heatSignature: args.heatSignature,
      timeDetected: args.timeDetected,
    });
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const defects = await ctx.db
      .query("defects")
      .order("desc")
      .collect();

    // Resolve storageId → signed URL for each defect
    // imageUrl is string | null — null means file was deleted
    return await Promise.all(
      defects.map(async (defect) => {
        const imageUrl = await ctx.storage.getUrl(defect.storageId);
        return { ...defect, imageUrl };
      })
    );
  },
});
```

### Step 1.4 — `convex/http.ts`

**Rules:**
- Secret is read from `process.env.DEVICE_SECRET` — returns 401 if missing or wrong
- Timestamp is ALWAYS `Date.now()` — never from the request body
- Image is only processed when `status === "NOK"` AND `imageBase64` is a non-empty string
- `ctx.storage.store()` takes a `Blob` — convert base64 string properly
- Always return `Content-Type: application/json` on 200 responses
- Handle JSON parse errors gracefully — return 400

```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/ingest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {

    // ── STEP 1: Authenticate ───────────────────────────────────────
    const secret = request.headers.get("x-device-secret");
    if (!secret || secret !== process.env.DEVICE_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    // ── STEP 2: Parse body ─────────────────────────────────────────
    let body: {
      temp: unknown;
      status: unknown;
      imageBase64?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    // ── STEP 3: Validate ───────────────────────────────────────────
    if (typeof body.temp !== "number" || isNaN(body.temp)) {
      return new Response("'temp' must be a valid number", { status: 422 });
    }

    if (body.status !== "OK" && body.status !== "NOK") {
      return new Response("'status' must be 'OK' or 'NOK'", { status: 422 });
    }

    // ── STEP 4: Write telemetry ─────────────────────────────────────
    // Timestamp is ALWAYS server-side — never trust the device clock
    const serverTimestamp = Date.now();

    await ctx.runMutation(api.telemetry.insertReading, {
      temp: body.temp,
      status: body.status,
      timestamp: serverTimestamp,
    });

    // ── STEP 5: Handle defect (NOK + image) ────────────────────────
    if (
      body.status === "NOK" &&
      typeof body.imageBase64 === "string" &&
      body.imageBase64.length > 0
    ) {
      try {
        // Convert base64 string to binary buffer
        const binaryString = atob(body.imageBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Store image in Convex File Storage
        const blob = new Blob([bytes], { type: "image/jpeg" });
        const storageId = await ctx.storage.store(blob);

        // Log defect with storage reference — not the image itself
        await ctx.runMutation(api.defects.logDefect, {
          storageId,
          heatSignature: body.temp,
          timeDetected: new Date(serverTimestamp).toISOString(),
        });
      } catch (imageError) {
        // Don't fail the whole request if image processing fails
        // The telemetry was already written successfully
        console.error("Image storage failed:", imageError);
      }
    }

    // ── STEP 6: Respond ────────────────────────────────────────────
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

### Phase 1 Verification

After writing all 4 files, the `npx convex dev` terminal should show no errors. Then run these curl tests:

```bash
# Test 1 — Valid OK reading → expect {"success":true}
curl -X POST http://127.0.0.1:3210/ingest \
  -H "Content-Type: application/json" \
  -H "x-device-secret: dv_secret_2026" \
  -d '{"temp": 36.5, "status": "OK"}'

# Test 2 — Wrong secret → expect 401
curl -X POST http://127.0.0.1:3210/ingest \
  -H "Content-Type: application/json" \
  -H "x-device-secret: wrongsecret" \
  -d '{"temp": 36.5, "status": "OK"}'

# Test 3 — Invalid status → expect 422
curl -X POST http://127.0.0.1:3210/ingest \
  -H "Content-Type: application/json" \
  -H "x-device-secret: dv_secret_2026" \
  -d '{"temp": 36.5, "status": "UNKNOWN"}'

# Test 4 — Non-number temp → expect 422
curl -X POST http://127.0.0.1:3210/ingest \
  -H "Content-Type: application/json" \
  -H "x-device-secret: dv_secret_2026" \
  -d '{"temp": "hot", "status": "OK"}'

# Test 5 — Simulate high-temp reading → expect {"success":true}
curl -X POST http://127.0.0.1:3210/ingest \
  -H "Content-Type: application/json" \
  -H "x-device-secret: dv_secret_2026" \
  -d '{"temp": 46.0, "status": "OK"}'
```

After Test 1 passes, check the Convex local dashboard at `http://localhost:6791` → Data tab → `telemetry` table → you should see one row.

**Phase 1 is complete when all 5 curl tests return exactly the expected responses.**

---

## PHASE 2 — FRONTEND FOUNDATION

**Goal:** Set up the Convex React provider, basic layout, dashboard page scaffold, and the ConnectionStatus component.

### Step 2.1 — `app/ConvexClientProvider.tsx`

**Rules:**
- Must have `"use client"` on line 1
- Reads URL from `NEXT_PUBLIC_CONVEX_URL` — this is safe for browser exposure
- Client is instantiated once outside the component to avoid re-creation on render

```typescript
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Instantiated once — not inside the component
const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

### Step 2.2 — `app/layout.tsx`

**Rules:**
- Import and wrap with `ConvexClientProvider`
- Keep the Tailwind dark background from root
- Font is your choice — use a distinctive one, not Inter

```typescript
import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "dreamVision — Industrial AI Monitor",
  description: "Real-time defect detection and thermal monitoring",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistMono.variable} bg-zinc-950 text-zinc-100 antialiased min-h-screen`}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
```

### Step 2.3 — `app/components/ConnectionStatus.tsx`

**Rules:**
- `useQuery` returns `undefined` while loading — treat same as stale
- Stale threshold is 3000ms (3 seconds)
- Show green pulsing dot when live, red static dot with warning when stale

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ConnectionStatus() {
  const latest = useQuery(api.telemetry.getLatest);

  // undefined = still loading, null = no data, object = has data
  const isStale =
    latest === undefined ||
    latest === null ||
    Date.now() - latest.timestamp > 3000;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono tracking-wider transition-all duration-500 ${
        isStale
          ? "border-red-500/40 bg-red-950/30 text-red-400"
          : "border-green-500/40 bg-green-950/30 text-green-400"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isStale ? "bg-red-400" : "bg-green-400 animate-pulse"
        }`}
      />
      {isStale ? "SIGNAL LOST" : "LIVE"}
    </div>
  );
}
```

### Step 2.4 — `app/page.tsx` (Scaffold — will be expanded in Phase 5)

Create a minimal scaffold that imports and renders ConnectionStatus. This proves the Convex provider is wired correctly.

```typescript
import { ConnectionStatus } from "./components/ConnectionStatus";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-950 p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono font-bold text-zinc-100 tracking-tight">
            dream<span className="text-orange-400">Vision</span>
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Industrial Defect Detection System
          </p>
        </div>
        <ConnectionStatus />
      </header>

      {/* Placeholder grid — components added in later phases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 h-64 flex items-center justify-center">
          <span className="text-zinc-600 font-mono text-sm">
            Ghost Line Chart — Phase 3
          </span>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 h-64 flex items-center justify-center">
          <span className="text-zinc-600 font-mono text-sm">
            Digital Twin — Phase 4
          </span>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 h-64 flex items-center justify-center lg:col-span-2">
          <span className="text-zinc-600 font-mono text-sm">
            X-Ray Incident Cards — Phase 5
          </span>
        </div>
      </div>
    </main>
  );
}
```

### Phase 2 Verification

Run `npm run dev` in the second terminal. Open `http://localhost:3000`.

- [ ] Page loads without console errors
- [ ] Header shows "dreamVision" with orange accent
- [ ] `ConnectionStatus` shows "SIGNAL LOST" (no data yet)
- [ ] Send a curl POST from Phase 1 → status briefly shows "LIVE" → reverts after 3s
- [ ] No TypeScript errors in terminal

**Phase 2 is complete when the dashboard loads, ConnectionStatus toggles correctly, and there are zero console errors.**

---

## PHASE 3 — GHOST LINE CHART

**Goal:** Build the temperature chart with actual readings (solid line) and a linear regression forecast (dashed ghost line). Trigger a danger animation when forecast crosses 45°C.

### Step 3.1 — `lib/forecast.ts`

**Rules:**
- Pure function — no imports, no side effects
- Uses least-squares linear regression — NOT just dT/dt
- Returns empty array if fewer than 2 readings
- Handles denominator = 0 (flat line) without division errors

```typescript
/**
 * Projects future temperature values using least-squares linear regression.
 * Framing for demo: "Thermal trajectory forecasting via linear regression
 * over the last N sensor readings."
 *
 * @param readings  Temperature values in chronological order (oldest first)
 * @param stepsAhead  Number of future data points to project (default: 10)
 * @returns Projected temperature values
 */
export function projectTemperature(
  readings: number[],
  stepsAhead = 10
): number[] {
  const n = readings.length;
  if (n < 2) return [];

  // Calculate means
  const xMean = (n - 1) / 2;
  const yMean = readings.reduce((sum, val) => sum + val, 0) / n;

  // Calculate slope via least-squares
  let numerator = 0;
  let denominator = 0;

  for (let x = 0; x < n; x++) {
    numerator += (x - xMean) * (readings[x] - yMean);
    denominator += (x - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;

  // Project future values
  return Array.from({ length: stepsAhead }, (_, i) => {
    const futureX = n + i;
    return yMean + slope * (futureX - xMean);
  });
}
```

### Step 3.2 — `app/components/GhostLineChart.tsx`

**Rules:**
- `"use client"` on line 1
- `getLast20` returns newest-first — reverse before passing to chart
- Merge actual and ghost data into one array for `ComposedChart`
- Ghost data points only have `ghost` key, not `temp` key
- Actual data points only have `temp` key, not `ghost` key
- `willOverheat` drives the container animation
- `DANGER_THRESHOLD = 45` is a constant — not hardcoded inline

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { projectTemperature } from "@/lib/forecast";

const DANGER_THRESHOLD = 45;
const FORECAST_STEPS = 10;

interface ChartDataPoint {
  x: number;
  temp?: number;
  ghost?: number;
}

export function GhostLineChart() {
  const rawReadings = useQuery(api.telemetry.getLast20) ?? [];

  // getLast20 returns newest-first — reverse for chronological chart display
  const readings = [...rawReadings].reverse();

  // Build actual data points
  const actualData: ChartDataPoint[] = readings.map((r, i) => ({
    x: i,
    temp: r.temp,
  }));

  // Build ghost forecast data points
  const temps = readings.map((r) => r.temp);
  const projected = projectTemperature(temps, FORECAST_STEPS);

  const ghostData: ChartDataPoint[] = projected.map((ghost, i) => ({
    x: readings.length + i,
    ghost: parseFloat(ghost.toFixed(2)),
  }));

  // Merge: actual points get their ghost counterpart if index overlaps
  const mergedData: ChartDataPoint[] = [
    ...actualData,
    ...ghostData,
  ];

  // Trigger warning if any forecasted point exceeds threshold
  const willOverheat = projected.some((t) => t >= DANGER_THRESHOLD);

  return (
    <div
      className={`rounded-xl p-5 border transition-all duration-700 ${
        willOverheat
          ? "animate-pulse bg-red-950/20 border-red-500/50"
          : "bg-zinc-900 border-zinc-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">
          Thermal Trajectory
        </p>
        {willOverheat && (
          <span className="text-xs font-mono text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full">
            ⚠ CRITICAL FORECAST
          </span>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={mergedData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="x" hide />
          <YAxis
            domain={[20, 65]}
            tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              fontSize: "11px",
              fontFamily: "monospace",
            }}
            labelFormatter={() => ""}
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}°C`,
              name === "temp" ? "Actual" : "Forecast",
            ]}
          />
          {/* Danger threshold line */}
          <ReferenceLine
            y={DANGER_THRESHOLD}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeOpacity={0.7}
            label={{
              value: `${DANGER_THRESHOLD}°C`,
              fill: "#ef4444",
              fontSize: 9,
              fontFamily: "monospace",
            }}
          />
          {/* Actual temperature — solid orange */}
          <Line
            type="monotone"
            dataKey="temp"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#f97316" }}
            connectNulls={false}
            name="temp"
          />
          {/* Ghost forecast — dashed faded orange */}
          <Line
            type="monotone"
            dataKey="ghost"
            stroke="#f97316"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            strokeOpacity={0.35}
            dot={false}
            connectNulls={false}
            name="ghost"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-orange-500" />
          <span className="text-zinc-500 text-xs font-mono">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-orange-500 opacity-40" style={{ borderTop: "1.5px dashed #f97316" }} />
          <span className="text-zinc-500 text-xs font-mono">Forecast</span>
        </div>
      </div>
    </div>
  );
}
```

### Phase 3 Verification

Add `GhostLineChart` to `app/page.tsx` replacing the placeholder div.

Send a sequence of curl POSTs with rising temperatures to test forecast:

```bash
for temp in 30 31.5 33 34.8 36 37.5 39 41 42.5 44; do
  curl -s -X POST http://127.0.0.1:3210/ingest \
    -H "Content-Type: application/json" \
    -H "x-device-secret: dv_secret_2026" \
    -d "{\"temp\": $temp, \"status\": \"OK\"}"
  sleep 0.6
done
```

- [ ] Solid orange line appears and updates in real-time
- [ ] Dashed ghost line extends beyond the actual data
- [ ] Container pulses red when forecast crosses 45°C
- [ ] CRITICAL FORECAST badge appears
- [ ] No console errors

---

## PHASE 4 — DIGITAL TWIN

**Goal:** A rotating 3D machine part that glows based on live temperature. Color transitions: gray → yellow (35°C) → red (40°C).

### Step 4.1 — Source the 3D Model

The Digital Twin requires a `.gltf` model file at `public/models/gear.gltf`.

**Option A — Download a free model:**
Get a gear or engine part from `https://market.pmnd.rs/` or `https://sketchfab.com/features/free-3d-models` (filter: gltf format).
Place the `.gltf` file and its associated assets in `public/models/`.

**Option B — Programmatic fallback (use if no model available):**
If no `.gltf` is available, use a `TorusKnot` geometry from Three.js — it looks technical and industrial.
The `DigitalTwin` component below handles both cases.

### Step 4.2 — `app/components/DigitalTwin.tsx`

**Rules:**
- `"use client"` on line 1
- Canvas must have an explicit height — use Tailwind `h-64` on the wrapper
- `emissive` and `emissiveIntensity` are updated each render via `useFrame` or directly — no mutation on the scene graph inside render
- `OrbitControls` with `autoRotate` — disable zoom so judges can't accidentally break the view
- Handle `null` from `getLatest` — default temp to 25 (ambient, no glow)
- Use `Suspense` around the Canvas for clean loading state

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useRef, useMemo } from "react";
import * as THREE from "three";

// ── Glow helpers ──────────────────────────────────────────────────────

function getEmissiveColor(temp: number): THREE.Color {
  if (temp > 40) return new THREE.Color("#ef4444"); // red
  if (temp > 35) return new THREE.Color("#eab308"); // yellow
  return new THREE.Color("#1e293b");                 // dark — no glow
}

function getEmissiveIntensity(temp: number): number {
  if (temp > 40) return 2.0;
  if (temp > 35) return 0.8;
  return 0.0;
}

// ── GLTF Model (used when gear.gltf is available) ────────────────────

function GearModel({ temp }: { temp: number }) {
  const { scene } = useGLTF("/models/gear.gltf");
  const color = useMemo(() => getEmissiveColor(temp), [temp]);
  const intensity = useMemo(() => getEmissiveIntensity(temp), [temp]);

  // Apply glow to all mesh materials in the scene
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        materials.forEach((mat) => {
          const stdMat = mat as THREE.MeshStandardMaterial;
          stdMat.emissive = color;
          stdMat.emissiveIntensity = intensity;
          stdMat.needsUpdate = true;
        });
      }
    });
  }, [scene, color, intensity]);

  return <primitive object={scene} scale={1.5} />;
}

// ── Fallback geometry (TorusKnot — no gltf needed) ──────────────────

function FallbackModel({ temp }: { temp: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => getEmissiveColor(temp), [temp]);
  const intensity = useMemo(() => getEmissiveIntensity(temp), [temp]);

  // Gentle rotation animation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[0.8, 0.25, 128, 32]} />
      <meshStandardMaterial
        color="#374151"
        emissive={color}
        emissiveIntensity={intensity}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

// ── Scene (tries GLTF, falls back to geometry) ───────────────────────

function Scene({ temp }: { temp: number }) {
  // Use GLTF if available, otherwise use fallback
  // Comment out GearModel and uncomment FallbackModel if no gltf file
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} />
      {/* Switch between GearModel and FallbackModel based on availability */}
      {/* <GearModel temp={temp} /> */}
      <FallbackModel temp={temp} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={2}
      />
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────

export function DigitalTwin() {
  const latest = useQuery(api.telemetry.getLatest);
  const temp = latest?.temp ?? 25; // Default: ambient, no glow

  const tempLabel = temp.toFixed(1);
  const status =
    temp > 40 ? "CRITICAL" : temp > 35 ? "WARNING" : "NOMINAL";
  const statusColor =
    temp > 40 ? "text-red-400" : temp > 35 ? "text-yellow-400" : "text-green-400";

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">
          Digital Twin
        </p>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono font-bold ${statusColor}`}>
            {status}
          </span>
          <span className="text-orange-400 text-sm font-mono font-bold">
            {tempLabel}°C
          </span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="h-56 rounded-lg overflow-hidden bg-zinc-950">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <Suspense fallback={null}>
            <Scene temp={temp} />
          </Suspense>
        </Canvas>
      </div>

      {/* Temperature scale */}
      <div className="flex justify-between mt-3 text-xs font-mono text-zinc-600">
        <span>25°C</span>
        <span className="text-yellow-600">35°C warn</span>
        <span className="text-red-600">40°C critical</span>
      </div>
    </div>
  );
}
```

### Phase 4 Verification

Add `DigitalTwin` to `app/page.tsx` replacing the placeholder div.

```bash
# Test yellow glow
curl -s -X POST http://127.0.0.1:3210/ingest \
  -H "Content-Type: application/json" \
  -H "x-device-secret: dv_secret_2026" \
  -d '{"temp": 37.0, "status": "OK"}'

# Test red glow
curl -s -X POST http://127.0.0.1:3210/ingest \
  -H "Content-Type: application/json" \
  -H "x-device-secret: dv_secret_2026" \
  -d '{"temp": 42.5, "status": "OK"}'
```

- [ ] 3D model renders and rotates
- [ ] No glow below 35°C
- [ ] Yellow glow between 35–40°C
- [ ] Red glow above 40°C
- [ ] Status badge updates in real-time
- [ ] No WebGL errors in console

---

## PHASE 5 — X-RAY INCIDENT CARDS

**Goal:** When ESP32 sends `status: "NOK"` with an image, a defect card appears live on the dashboard with an industrial X-Ray CSS filter applied.

### Step 5.1 — `app/components/XRayCards.tsx`

**Rules:**
- `"use client"` on line 1
- `imageUrl` from `getAll` is `string | null` — always render conditionally
- CSS filter is applied via `style` prop, not Tailwind (Tailwind can't compose these filters)
- Show empty state when no defects logged
- Cards are ordered newest-first (already handled by `getAll` query)

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Industrial X-Ray effect — applied via inline style
const XRAY_FILTER =
  "invert(1) contrast(1.5) grayscale(1) sepia(1) hue-rotate(180deg) brightness(1.1)";

export function XRayCards() {
  const defects = useQuery(api.defects.getAll) ?? [];

  if (defects.length === 0) {
    return (
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 text-center">
        <div className="text-zinc-600 font-mono text-sm mb-1">
          NO INCIDENTS LOGGED
        </div>
        <div className="text-zinc-700 font-mono text-xs">
          System nominal — monitoring active
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">
        Defect Audit Trail — {defects.length} Incident{defects.length !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {defects.map((defect) => (
          <div
            key={defect._id}
            className="rounded-xl bg-zinc-900 border border-red-900/50 p-4 transition-all hover:border-red-500/50"
          >
            {/* Card header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
                  Defect Detected
                </span>
              </div>
              <span className="text-zinc-600 text-xs font-mono">
                {new Date(defect.timeDetected).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>

            {/* X-Ray image */}
            {defect.imageUrl ? (
              <div className="rounded-lg overflow-hidden mb-3 bg-zinc-950">
                <img
                  src={defect.imageUrl}
                  alt={`Defect frame — ${defect.timeDetected}`}
                  className="w-full object-cover"
                  style={{ filter: XRAY_FILTER }}
                />
              </div>
            ) : (
              <div className="rounded-lg bg-zinc-950 h-32 mb-3 flex items-center justify-center">
                <span className="text-zinc-700 font-mono text-xs">
                  Image unavailable
                </span>
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs font-mono">Heat Signature</span>
                <span className="text-orange-400 text-xs font-mono font-bold">
                  {defect.heatSignature.toFixed(1)}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs font-mono">Timestamp</span>
                <span className="text-zinc-400 text-xs font-mono">
                  {new Date(defect.timeDetected).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 5.2 — `app/page.tsx` (Final Version)

Replace the scaffold with the complete dashboard:

```typescript
import { ConnectionStatus } from "./components/ConnectionStatus";
import { GhostLineChart } from "./components/GhostLineChart";
import { DigitalTwin } from "./components/DigitalTwin";
import { XRayCards } from "./components/XRayCards";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-950 p-6 max-w-7xl mx-auto">

      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono font-bold text-zinc-100 tracking-tight">
            dream<span className="text-orange-400">Vision</span>
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5 tracking-wider">
            INDUSTRIAL DEFECT DETECTION SYSTEM
          </p>
        </div>
        <ConnectionStatus />
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ghost Line Chart */}
        <GhostLineChart />

        {/* Digital Twin */}
        <DigitalTwin />
      </div>

      {/* X-Ray Incident Cards — full width */}
      <XRayCards />

    </main>
  );
}
```

### Phase 5 Verification — Full End-to-End Test

Test the complete pipeline with a simulated NOK event:

```bash
# Generate a small test image as base64
# On Mac/Linux: use a 1x1 pixel JPEG
TINY_JPEG="$(printf '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f'"'"'9=82<.342\x1eC\x02\t\t\t\x0c\x0b\x0c\x18\r\r\x181\x1a\x1c\x1a111111111111111111111111111111111111111111111111111111111111\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\t\n\x16\x17\x18\x19\x1a%&'"'"'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb\xff\xd9' | base64)"

curl -X POST http://127.0.0.1:3210/ingest \
  -H "Content-Type: application/json" \
  -H "x-device-secret: dv_secret_2026" \
  -d "{\"temp\": 44.2, \"status\": \"NOK\", \"imageBase64\": \"/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=\"}"
```

- [ ] X-Ray card appears on dashboard without page refresh
- [ ] Image renders with industrial X-Ray filter
- [ ] Heat signature shows 44.2°C
- [ ] Timestamp is formatted correctly
- [ ] defects table has a row in Convex local dashboard

---

## PHASE 6 — PRODUCTION POLISH

**Goal:** Ensure the project is demo-stable, handles edge cases, and looks finished.

### Step 6.1 — Loading States

Add loading skeletons for when `useQuery` returns `undefined` (initial load):

In `GhostLineChart.tsx`:
```typescript
const rawReadings = useQuery(api.telemetry.getLast20);
if (rawReadings === undefined) {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 h-64 animate-pulse">
      <div className="h-4 w-32 bg-zinc-800 rounded mb-4" />
      <div className="h-48 bg-zinc-800 rounded" />
    </div>
  );
}
```

Apply the same pattern to `DigitalTwin.tsx` and `XRayCards.tsx`.

### Step 6.2 — Error Boundary

Wrap the `DigitalTwin` Canvas in an error boundary to prevent 3D errors from crashing the whole dashboard:

```typescript
// app/components/ErrorBoundary.tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

Wrap `<DigitalTwin />` in `page.tsx`:
```typescript
<ErrorBoundary fallback={<div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 h-64 flex items-center justify-center text-zinc-600 font-mono text-sm">3D renderer unavailable</div>}>
  <DigitalTwin />
</ErrorBoundary>
```

### Step 6.3 — Final `tailwind.config.ts`

Ensure `animate-pulse` timing is right for the danger state:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
```

### Phase 6 Verification — Full System Check

Run all tests from Phase 1 curl suite. Then:

```bash
# Simulate a rapid sequence (like real ESP32 at 500ms)
for i in $(seq 1 20); do
  TEMP=$(echo "scale=1; 30 + $i * 0.8" | bc)
  curl -s -X POST http://127.0.0.1:3210/ingest \
    -H "Content-Type: application/json" \
    -H "x-device-secret: dv_secret_2026" \
    -d "{\"temp\": $TEMP, \"status\": \"OK\"}" > /dev/null
  sleep 0.5
done
```

Final checklist:
- [ ] All 3 "Wow" features work simultaneously
- [ ] No console errors in browser devtools
- [ ] No TypeScript errors in terminal
- [ ] Dashboard updates without page refresh throughout test
- [ ] ConnectionStatus goes stale when curl stops, live when it resumes
- [ ] Loading skeletons appear on first load
- [ ] 3D model rotates and glows correctly

---

## ESP32 FIRMWARE INTEGRATION

**Only start this after Phase 6 is complete and verified.**

### Network Setup

```bash
# Find your laptop's local IP (ESP32 will POST to this)
# macOS / Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
# Look for IPv4 Address under your WiFi adapter
```

### Arduino Firmware

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_MLX90614.h>  // GY-906 library

// ── Configuration ───────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Replace with your laptop's local IP from ifconfig/ipconfig
const char* SERVER_URL    = "http://192.168.1.XX:3210/ingest";
const char* DEVICE_SECRET = "dv_secret_2026";

const int   POST_INTERVAL_MS = 500;
const float DEFECT_THRESHOLD = 40.0; // °C — above this = NOK

// ── Sensor ─────────────────────────────────────────────────────────
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

// ── Setup ───────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Wire.begin();

  // Initialize GY-906
  if (!mlx.begin()) {
    Serial.println("ERROR: GY-906 not found");
    while (1);
  }

  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nConnected — IP: %s\n", WiFi.localIP().toString().c_str());
}

// ── Main loop ───────────────────────────────────────────────────────
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected — reconnecting...");
    WiFi.reconnect();
    delay(1000);
    return;
  }

  // Read temperature from GY-906
  float temp = mlx.readObjectTempC();

  // Determine status
  bool isDefect = (temp > DEFECT_THRESHOLD);
  const char* status = isDefect ? "NOK" : "OK";

  // Build JSON payload
  StaticJsonDocument<8192> doc;
  doc["temp"]   = temp;
  doc["status"] = status;

  // If defect, capture frame from OV3660 and attach as base64
  if (isDefect) {
    String base64Frame = captureOV3660Frame(); // Implement per your OV3660 library
    if (base64Frame.length() > 0) {
      doc["imageBase64"] = base64Frame;
    }
  }

  String payload;
  serializeJson(doc, payload);

  // Send HTTP POST
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-secret", DEVICE_SECRET);
  http.setTimeout(3000); // 3s timeout — don't block loop

  int responseCode = http.POST(payload);
  Serial.printf("Temp: %.1f°C | Status: %s | HTTP: %d\n",
    temp, status, responseCode);
  http.end();

  delay(POST_INTERVAL_MS);
}

// ── OV3660 frame capture (implement with your camera library) ────────
// This function should:
// 1. Capture a QVGA (320x240) JPEG frame
// 2. Compress aggressively (quality 10-20 is enough for X-Ray effect)
// 3. Base64-encode the bytes
// 4. Return as Arduino String
// Target output size: under 20KB after base64
String captureOV3660Frame() {
  // TODO: implement with ESP32-CAM or esp32-camera library
  // Example: camera_fb_t *fb = esp_camera_fb_get();
  // Then base64 encode fb->buf using base64 library
  return ""; // Return empty string if capture fails — Convex handles gracefully
}
```

---

## COMMON ERRORS & FIXES

| Error | Cause | Fix |
|---|---|---|
| `Cannot find module '@/convex/_generated/api'` | `npx convex dev` not running | Start it in Terminal 1 and keep it running |
| `useQuery` returns `undefined` forever | `ConvexClientProvider` not wrapping app | Check `app/layout.tsx` wraps children with provider |
| HTTP Action returns 500 on NOK POST | `atob` not available in Convex runtime | Use the `Uint8Array` loop from `http.ts` above, not `Buffer.from` |
| 3D canvas is black | `ambientLight` missing or intensity too low | Add `<ambientLight intensity={0.4} />` to Scene |
| `storageId` type error | Passing `v.string()` where `v.id("_storage")` expected | The mutation arg must be `v.id("_storage")` — fix schema and mutation |
| `Cannot read property 'temp' of null` | `getLatest` returns null, frontend not guarding | Use `latest?.temp ?? 25` optional chaining |
| Ghost line not appearing | Chart data arrays not merged correctly | Ensure `actualData` and `ghostData` share the `x` key space sequentially |
| Tailwind classes not applying | Content paths in `tailwind.config.ts` wrong | Ensure `./app/**/*.{ts,tsx}` is in the `content` array |
| ESP32 gets 401 | `DEVICE_SECRET` not set in Convex env | For local: verify `.env.local` has `DEVICE_SECRET=dv_secret_2026` |
| ESP32 can't reach server | Using `127.0.0.1` in firmware | Use laptop's LAN IP (e.g. `192.168.1.10`), not localhost |

---

## FINAL DELIVERABLE CHECKLIST

Before declaring the project done, every item below must be checked:

### Backend
- [ ] `convex/schema.ts` — two tables, correct types, `storageId` not base64
- [ ] `convex/telemetry.ts` — `insertReading` auto-prunes, `getLast20`, `getLatest`
- [ ] `convex/defects.ts` — `logDefect`, `getAll` with URL resolution
- [ ] `convex/http.ts` — auth, validation, server timestamp, image storage pipeline
- [ ] All 5 curl tests pass with expected responses

### Frontend
- [ ] `ConvexClientProvider` wraps layout
- [ ] `ConnectionStatus` — green/live and red/stale states work
- [ ] `GhostLineChart` — solid + dashed lines, red pulse at 45°C
- [ ] `DigitalTwin` — rotates, glows yellow at 35°C, red at 40°C
- [ ] `XRayCards` — appear live on NOK, X-Ray filter applied, empty state shown
- [ ] Loading skeletons on initial load
- [ ] Error boundary on DigitalTwin
- [ ] Zero console errors

### Integration
- [ ] ESP32 WiFi connected and posting successfully
- [ ] Telemetry updates visible on dashboard in real-time
- [ ] NOK event creates defect card without page refresh
- [ ] Connection status goes stale when ESP32 is powered off

### Demo Readiness
- [ ] `npx convex dev` running in Terminal 1
- [ ] `npm run dev` running in Terminal 2
- [ ] Rehearsed the demo flow once end-to-end
- [ ] curl NOK test ready to run as backup if ESP32 fails

---

## DEMO SCRIPT (Memorize This)

> **"dreamVision is an edge-to-cloud industrial monitoring system. The ESP32-S3 reads thermal data 120 times per minute and pushes it to our Convex backend via HTTP POST — no polling, no intermediary server.**
>
> **The moment the database changes, WebSocket sync propagates to every connected client. What you're seeing is sub-100ms latency from sensor to screen.**
>
> **The Ghost Line is a least-squares linear regression over the last 20 thermal readings — if the projected trajectory crosses 45 degrees Celsius, the system flags a critical forecast before the threshold is actually reached.**
>
> **The Digital Twin binds its emissive glow directly to the live temperature value — this is not a simulation, it's the actual sensor reading driving the material shader in real time.**
>
> **And when our anomaly detection fires, the raw camera frame is stored in Convex File Storage, and the X-Ray incident card appears live on every dashboard instance simultaneously — full audit trail, zero manual logging."**

---

*dreamVision Agent Prompt v1.0 — March 2026*
*Built for: Claude Code / Cursor / Windsurf / Copilot Workspace*