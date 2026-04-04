# Member Dashboard Redesign — "The Lab Report" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the member dashboard from a light card-based portal to a dark, typographic, data-as-art "lab report" interface.

**Architecture:** Single-page rewrite of `app/(member)/dashboard/page.tsx` plus dark-mode updates to the member layout and sidebar. Two new database queries (courses visited, next tee time). All styling via inline `<style>` tags matching existing codebase pattern. No new files except this plan.

**Tech Stack:** Next.js 16 Server Components, Drizzle ORM, Tailwind v4 (CSS vars only — inline styles for page-specific UI), Motion for animations, Inter/Nunito/Geist Mono fonts (already loaded in root layout).

**Spec:** `docs/superpowers/specs/2026-04-04-member-dashboard-redesign.md`

**Brand palette (exact hex, no substitutions):**
| Token | Hex |
|-------|-----|
| Midnight | `#0C0C0B` |
| Graphite | `#1E1D1B` |
| Amber | `#BF7B2E` |
| Linen | `#F4EEE3` |
| Stone | `#847C72` |
| Smoke | `#E5DDD3` |

**Tier credits (from `lib/stripe/client.ts`):**
| Tier | Credits/mo |
|------|-----------|
| casual | 100 |
| core | 150 |
| heavy | 210 |

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/(member)/layout.tsx` | Modify | Change background from `#FDFAF6` to `#0C0C0B` |
| `components/member-sidebar.tsx` | Modify | Restyle sidebar to dark theme (Midnight/Graphite) |
| `app/(member)/dashboard/page.tsx` | Rewrite | New dark dashboard with hero greeting, stats strip, activity feed, AI search |

One new file: `components/lab-animate.tsx` (thin Motion wrapper). No schema changes. No new dependencies.

---

### Task 1: Dark member layout background

**Files:**
- Modify: `app/(member)/layout.tsx:56`

- [ ] **Step 1: Update layout background color**

In `app/(member)/layout.tsx`, change the `div` wrapping style from Off-White to Midnight:

```tsx
// line 56 — change background
<div style={{ minHeight: '100vh', background: '#0C0C0B', display: 'flex' }}>
```

- [ ] **Step 2: Verify the change**

Run: `npx next dev` and navigate to `/dashboard`. The main content area background should now be dark (`#0C0C0B`). The sidebar will still be white (fixed in Task 2). The existing dashboard content will look broken on dark — that's expected.

- [ ] **Step 3: Commit**

```bash
git add app/\(member\)/layout.tsx
git commit -m "chore: switch member layout background to Midnight (#0C0C0B)"
```

---

### Task 2: Dark member sidebar

**Files:**
- Modify: `components/member-sidebar.tsx:119-242` (the `<style>` block)

- [ ] **Step 1: Update sidebar styles to dark theme**

Replace the entire `<style>` block in `components/member-sidebar.tsx` (lines 119–242) with the dark version. Every color reference changes:

```tsx
<style>{`
  .member-sidebar {
    width: 228px;
    flex-shrink: 0;
    background: #0C0C0B;
    border-right: 1px solid rgba(244,238,227,0.07);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 100;
    font-family: 'Inter', sans-serif;
  }
  .sidebar-top {
    padding: 26px 24px 22px;
    border-bottom: 1px solid rgba(244,238,227,0.07);
    flex-shrink: 0;
  }
  .sidebar-wordmark {
    font-family: var(--font-nunito), 'Nunito', sans-serif;
    font-weight: 900;
    font-size: 26px;
    letter-spacing: -0.02em;
    color: #F4EEE3;
    text-decoration: none;
    display: block;
    line-height: 1;
  }
  .sidebar-nav {
    flex: 1;
    padding: 18px 0;
    overflow-y: auto;
  }
  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 24px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: #847C72;
    text-decoration: none;
    text-transform: uppercase;
    transition: color 0.15s, background 0.15s;
    position: relative;
  }
  .sidebar-link:hover { color: #F4EEE3; background: #1E1D1B; }
  .sidebar-link.active { color: #F4EEE3; }
  .sidebar-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 18px;
    background: #BF7B2E;
    border-radius: 0 1px 1px 0;
  }
  .sidebar-link-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    opacity: 0.5;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sidebar-link.active .sidebar-link-icon { opacity: 1; }
  .sidebar-bottom {
    padding: 18px 24px;
    border-top: 1px solid rgba(244,238,227,0.07);
    flex-shrink: 0;
  }
  .tier-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(191,123,46,0.10);
    border: 1px solid rgba(191,123,46,0.22);
    border-radius: 2px;
    padding: 4px 9px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #BF7B2E;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .member-name {
    font-size: 13px;
    font-weight: 700;
    color: #F4EEE3;
    margin-bottom: 1px;
  }
  .member-email {
    font-size: 11px;
    color: #847C72;
    margin-bottom: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .signout-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: #847C72;
    text-transform: uppercase;
    font-family: 'Inter', sans-serif;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0;
    transition: color 0.15s;
  }
  .signout-btn:hover { color: #F4EEE3; }
`}</style>
```

**Changes summary:**
- `.member-sidebar` background: `#fff` → `#0C0C0B`
- All borders: `rgba(12,12,11,0.09)` → `rgba(244,238,227,0.07)` (Linen at 7%)
- `.sidebar-wordmark` color: `#0C0C0B` → `#F4EEE3`
- `.sidebar-link:hover` color: `#0C0C0B` → `#F4EEE3`, background: `#FDFAF6` → `#1E1D1B`
- `.sidebar-link.active` color: `#0C0C0B` → `#F4EEE3`
- `.member-name` color: `#0C0C0B` → `#F4EEE3`
- `.signout-btn:hover` color: `#0C0C0B` → `#F4EEE3`

- [ ] **Step 2: Verify the sidebar**

Run dev server, navigate to `/dashboard`. Sidebar should now be dark with Linen text, Amber active indicator, Stone inactive links. Wordmark should be Linen. The overall feel should be seamless dark from sidebar to content area.

- [ ] **Step 3: Commit**

```bash
git add components/member-sidebar.tsx
git commit -m "style: dark theme for member sidebar — Midnight bg, Linen text"
```

---

### Task 3: Dashboard data queries

**Files:**
- Modify: `app/(member)/dashboard/page.tsx:67-121` (the data fetching section)

This task adds the two new queries and restructures the data fetching. We rewrite the `DashboardPage` function's data section only — the JSX comes in Task 4.

- [ ] **Step 1: Add new imports**

At the top of `app/(member)/dashboard/page.tsx`, ensure these imports exist (some already do):

```tsx
import { redirect } from 'next/navigation'
import { getCreditBalance } from '@/lib/credits/ledger'
import { db } from '@/lib/db'
import { users, bookings, teeTimeSlots, courses, creditLedger } from '@/lib/db/schema'
import { and, eq, gt, gte, count, countDistinct, desc, sql, asc } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TIER_CREDITS } from '@/lib/stripe/client'
```

Note: `courses` and `countDistinct` and `gte` and `asc` are new imports. `TIER_CREDITS` is new.

- [ ] **Step 2: Rewrite the data fetching block**

Replace the entire data fetching section inside `DashboardPage` (from `const supabase` through the variable assignments before `return`) with:

```tsx
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  firstOfMonth.setHours(0, 0, 0, 0)
  const firstOfMonthStr = firstOfMonth.toISOString().split('T')[0]

  const [dbUser, balance, monthRoundsResult, coursesVisitedResult, nextTeeTimeResult, recentLedger] = await Promise.all([
    db.select().from(users).where(eq(users.id, user.id)).then(r => r[0] ?? null),
    getCreditBalance(user.id),
    db
      .select({ count: count() })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
      .where(
        and(
          eq(bookings.userId, user.id),
          sql`${bookings.status} IN ('CONFIRMED', 'BOOKED', 'COMPLETED')`,
          gte(teeTimeSlots.date, firstOfMonthStr)
        )
      )
      .then(r => r[0]),
    // NEW: courses visited this month
    db
      .select({ count: countDistinct(bookings.courseId) })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, user.id),
          sql`${bookings.status} IN ('CONFIRMED', 'BOOKED', 'COMPLETED')`,
          gte(bookings.createdAt, firstOfMonth)
        )
      )
      .then(r => r[0]),
    // NEW: next upcoming tee time with course name
    db
      .select({
        date: teeTimeSlots.date,
        startTime: teeTimeSlots.startTime,
        courseName: courses.name,
      })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
      .innerJoin(courses, eq(bookings.courseId, courses.id))
      .where(
        and(
          eq(bookings.userId, user.id),
          sql`${bookings.status} IN ('CONFIRMED', 'BOOKED')`,
          gte(teeTimeSlots.date, today)
        )
      )
      .orderBy(asc(teeTimeSlots.date), asc(teeTimeSlots.startTime))
      .limit(1)
      .then(r => r[0] ?? null),
    db
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.userId, user.id))
      .orderBy(desc(creditLedger.createdAt))
      .limit(5),
  ])

  // Derived values
  const firstName = dbUser?.fullName?.split(' ')[0] ?? 'there'
  const tierKey = (dbUser?.subscriptionTier ?? 'casual') as keyof typeof TIER_CREDITS
  const tierMax = TIER_CREDITS[tierKey] ?? 100
  const roundsThisMonth = monthRoundsResult?.count ?? 0
  const coursesVisited = coursesVisitedResult?.count ?? 0

  // Greeting
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const greeting = `Good ${timeOfDay}, ${firstName}.`

  // Date
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase()

  // Credit reset date
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const creditResetLabel = `resets ${nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  // Next tee time countdown
  let nextTeeCountdown = '—'
  let nextTeeDetails = 'No rounds booked'
  let nextTeeCourse = ''
  if (nextTeeTimeResult) {
    const slotDate = new Date(`${nextTeeTimeResult.date}T${nextTeeTimeResult.startTime}`)
    const diffMs = slotDate.getTime() - Date.now()
    if (diffMs > 0) {
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      nextTeeCountdown = diffDays > 0 ? `${diffDays}d ${diffHours}h` : `${diffHours}h`
      nextTeeDetails = slotDate.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
      nextTeeCourse = nextTeeTimeResult.courseName
    }
  }

  // ... JSX return follows in Task 4
```

- [ ] **Step 3: Verify queries compile**

Run: `npx next build --no-lint 2>&1 | head -30` — should not show type errors related to the new imports or queries. (The page won't fully compile yet since JSX is incomplete — but imports and query logic should be clean.)

- [ ] **Step 4: Commit**

```bash
git add app/\(member\)/dashboard/page.tsx
git commit -m "feat: add courses-visited and next-tee-time queries to dashboard"
```

---

### Task 4: Dashboard JSX — Hero greeting + Stats strip

**Files:**
- Modify: `app/(member)/dashboard/page.tsx` (the `return` statement)

- [ ] **Step 1: Replace the entire return block**

Remove all existing JSX and the `<style>` block. Replace with the new dark dashboard. This is the full return statement including the hero zone and stats strip:

```tsx
  return (
    <>
      {/* ── Hero: Greeting ── */}
      <div className="lab-hero">
        <div className="lab-date">{formattedDate}</div>
        <h1 className="lab-greeting">{greeting}</h1>
      </div>

      {/* ── Stats Strip ── */}
      <div className="lab-stats">
        <div className="lab-stat">
          <div className="lab-stat-label">Credits</div>
          <div className="lab-stat-value lab-amber">{balance}</div>
          <div className="lab-stat-sub">/ {tierMax}</div>
          <div className="lab-stat-sub">{creditResetLabel}</div>
        </div>
        <div className="lab-stat">
          <div className="lab-stat-label">Rounds</div>
          <div className="lab-stat-value">{roundsThisMonth}</div>
          <div className="lab-stat-sub">this month</div>
        </div>
        <div className="lab-stat">
          <div className="lab-stat-label">Courses</div>
          <div className="lab-stat-value">{coursesVisited}</div>
          <div className="lab-stat-sub">visited</div>
        </div>
        <div className="lab-stat">
          <div className="lab-stat-label">Next Tee Time</div>
          <div className="lab-stat-value lab-amber lab-stat-sm">{nextTeeCountdown}</div>
          <div className="lab-stat-sub">{nextTeeDetails}</div>
          {nextTeeCourse && <div className="lab-stat-sub">{nextTeeCourse}</div>}
        </div>
      </div>

      <div className="lab-divider" />

      {/* ── Activity Feed ── */}
      <div className="lab-section">
        <div className="lab-section-hd">
          <span className="lab-section-title">Recent Activity</span>
          <Link href="/rounds" className="lab-section-link">View all →</Link>
        </div>
        <div className="lab-activity-card">
          {recentLedger.length === 0 ? (
            <div className="lab-activity-empty">No activity yet.</div>
          ) : (
            recentLedger.map((entry, i) => {
              const isCredit = entry.amount > 0
              const { title, sub } = getLedgerLabel({ type: entry.type, notes: entry.notes, referenceId: entry.referenceId })
              const dateLabel = new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <div key={entry.id}>
                  <div className="lab-activity-row">
                    <div className="lab-activity-main">
                      <div className="lab-activity-title">{title}</div>
                      <div className="lab-activity-sub">{sub}</div>
                    </div>
                    <div className={`lab-activity-amount ${isCredit ? 'lab-amt-credit' : 'lab-amt-debit'}`}>
                      {isCredit ? '+' : ''}{entry.amount} cr.
                    </div>
                    <div className="lab-activity-date">{dateLabel}</div>
                  </div>
                  {i < recentLedger.length - 1 && <div className="lab-activity-divider" />}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── AI Search ── */}
      <div className="lab-section">
        <div className="lab-section-hd">
          <span className="lab-section-title">Find a Tee Time</span>
          <span className="lab-ai-badge">Beta</span>
        </div>
        <div className="lab-search-row">
          <input
            className="lab-search-input"
            type="text"
            placeholder='e.g. "Saturday morning at Torrey Pines, 2 players"'
            readOnly
          />
          <button className="lab-search-btn">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="9" r="6" />
              <line x1="14" y1="14" x2="18" y2="18" />
            </svg>
            Search
          </button>
        </div>
        <div className="lab-search-hints">
          <span className="lab-hint-chip">Tomorrow, 8am</span>
          <span className="lab-hint-chip">Within 20 miles</span>
          <span className="lab-hint-chip">2 players</span>
        </div>
      </div>

      {/* ── Styles ── */}
      <style>{`
        /* Hero */
        .lab-hero {
          padding: 80px 36px 48px;
        }
        .lab-date {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #847C72;
          margin-bottom: 12px;
          font-family: 'Inter', sans-serif;
        }
        .lab-greeting {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-weight: 900;
          font-size: 48px;
          letter-spacing: -0.025em;
          color: #F4EEE3;
          line-height: 1.05;
          margin: 0;
        }

        /* Stats Strip */
        .lab-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          padding: 0 36px 48px;
        }
        .lab-stat {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .lab-stat-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #847C72;
          margin-bottom: 8px;
          font-family: 'Inter', sans-serif;
        }
        .lab-stat-value {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-weight: 900;
          font-size: 64px;
          letter-spacing: -0.03em;
          color: #F4EEE3;
          line-height: 1;
          margin-bottom: 6px;
        }
        .lab-stat-value.lab-amber { color: #BF7B2E; }
        .lab-stat-value.lab-stat-sm { font-size: 48px; }
        .lab-stat-sub {
          font-size: 12px;
          color: #847C72;
          font-family: 'Inter', sans-serif;
          line-height: 1.5;
        }

        /* Divider */
        .lab-divider {
          height: 1px;
          background: rgba(229,221,211,0.06);
          margin: 0 36px;
        }

        /* Sections */
        .lab-section {
          padding: 28px 36px 0;
        }
        .lab-section-hd {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .lab-section-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #847C72;
          font-family: 'Inter', sans-serif;
        }
        .lab-section-link {
          font-size: 11px;
          font-weight: 600;
          color: #847C72;
          text-decoration: none;
          transition: color 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .lab-section-link:hover { color: #BF7B2E; }

        /* Activity Feed */
        .lab-activity-card {
          background: #1E1D1B;
          border: 1px solid rgba(244,238,227,0.06);
        }
        .lab-activity-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          transition: background 0.12s;
        }
        .lab-activity-row:hover { background: rgba(244,238,227,0.03); }
        .lab-activity-main { flex: 1; }
        .lab-activity-title {
          font-size: 13px;
          font-weight: 600;
          color: #F4EEE3;
          margin-bottom: 2px;
          font-family: 'Inter', sans-serif;
        }
        .lab-activity-sub {
          font-size: 11px;
          color: #847C72;
          font-family: 'Inter', sans-serif;
        }
        .lab-activity-amount {
          font-size: 13px;
          font-weight: 700;
          font-family: var(--font-geist-mono), 'Geist Mono', monospace;
        }
        .lab-amt-credit { color: #BF7B2E; }
        .lab-amt-debit { color: #847C72; }
        .lab-activity-date {
          font-size: 11px;
          color: #847C72;
          width: 56px;
          text-align: right;
          flex-shrink: 0;
          font-family: 'Inter', sans-serif;
        }
        .lab-activity-divider {
          height: 1px;
          background: rgba(244,238,227,0.06);
          margin: 0 18px;
        }
        .lab-activity-empty {
          padding: 20px 18px;
          font-size: 13px;
          color: #847C72;
          text-align: center;
          font-family: 'Inter', sans-serif;
        }

        /* AI Search */
        .lab-ai-badge {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #BF7B2E;
          background: rgba(191,123,46,0.10);
          border: 1px solid rgba(191,123,46,0.18);
          border-radius: 2px;
          padding: 2px 7px;
          text-transform: uppercase;
          font-family: 'Inter', sans-serif;
        }
        .lab-search-row {
          display: flex;
          gap: 8px;
        }
        .lab-search-input {
          flex: 1;
          background: #1E1D1B;
          border: 1px solid rgba(229,221,211,0.06);
          border-radius: 2px;
          padding: 12px 16px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #F4EEE3;
          outline: none;
        }
        .lab-search-input::placeholder { color: #847C72; }
        .lab-search-btn {
          background: #BF7B2E;
          border: none;
          border-radius: 2px;
          padding: 0 20px;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #0C0C0B;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: background 0.15s;
        }
        .lab-search-btn:hover { background: #d48c37; }
        .lab-search-hints {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
          padding-bottom: 48px;
        }
        .lab-hint-chip {
          font-size: 10px;
          font-weight: 500;
          color: #847C72;
          background: #1E1D1B;
          border: 1px solid rgba(244,238,227,0.08);
          border-radius: 2px;
          padding: 1px 6px;
          font-family: 'Inter', sans-serif;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .lab-hero { padding: 40px 24px 32px; }
          .lab-greeting { font-size: 36px; }
          .lab-stats { grid-template-columns: repeat(2, 1fr); gap: 32px; padding: 0 24px 32px; }
          .lab-stat-value { font-size: 48px; }
          .lab-stat-value.lab-stat-sm { font-size: 40px; }
          .lab-divider { margin: 0 24px; }
          .lab-section { padding: 20px 24px 0; }
        }
        @media (max-width: 640px) {
          .lab-hero { padding: 32px 20px 24px; }
          .lab-greeting { font-size: 32px; }
          .lab-stats { grid-template-columns: repeat(2, 1fr); gap: 24px; padding: 0 20px 24px; }
          .lab-stat-value { font-size: 48px; }
          .lab-stat-value.lab-stat-sm { font-size: 36px; }
          .lab-divider { margin: 0 20px; }
          .lab-section { padding: 16px 20px 0; }
        }
      `}</style>
    </>
  )
}
```

- [ ] **Step 2: Keep the helper functions**

Make sure `getLedgerLabel` function (lines 46-65 of the original file) is preserved at the top of the file. The `getGreeting`, `getFormattedDate`, `getCreditResetDate`, `getMemberSinceLabel`, and `getMemberMonths` helper functions can be removed — their logic is now inline in the component.

The final file structure should be:
1. Imports
2. `getLedgerLabel` function
3. `DashboardPage` component (data fetching + JSX)

- [ ] **Step 3: Remove old topbar from dashboard**

The old dashboard had its own `dash-topbar` with greeting, credits, and "Book Tee Time" button. This is now removed — the member sidebar (already updated in Task 2) handles navigation and credits. The greeting is now the hero zone.

Verify: the dashboard page should NOT have any element with class `dash-topbar`, `topbar-greeting`, `credit-chip`, or `book-btn`. These are all deleted.

- [ ] **Step 4: Verify in browser**

Run: `npx next dev` and navigate to `/dashboard`.

Expected:
- Midnight background everywhere (sidebar + content)
- Large uppercase date in Stone
- Large "Good [time], [name]." greeting in Linen
- 4 stat columns with oversized numbers (Credits and Next Tee Time in Amber, Rounds and Courses in Linen)
- Thin divider line
- Activity feed on Graphite card
- AI search with Graphite input and Amber button
- No Quick Actions grid
- No white backgrounds anywhere

- [ ] **Step 5: Commit**

```bash
git add app/\(member\)/dashboard/page.tsx
git commit -m "feat: redesign member dashboard — dark lab report with hero stats"
```

---

### Task 5: Motion animations

**Files:**
- Modify: `app/(member)/dashboard/page.tsx`

This task adds the `'use client'` directive is NOT needed — we wrap animated elements in a thin client component. However, since the dashboard is a Server Component (it does async data fetching), we need a client wrapper for Motion.

- [ ] **Step 1: Create an animated stats wrapper**

Add a new client component at the bottom of the dashboard file (before the closing of the module), or extract as a separate file. Since the spec says "no new files," we'll add it inline.

Actually — the simplest approach: create a tiny client component file for the animated wrapper.

Create `components/lab-animate.tsx`:

```tsx
'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export function CountUp({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {value}
    </motion.span>
  )
}
```

- [ ] **Step 2: Use FadeIn in the dashboard**

In `app/(member)/dashboard/page.tsx`, add the import:

```tsx
import { FadeIn } from '@/components/lab-animate'
```

Wrap the hero zone:

```tsx
<FadeIn>
  <div className="lab-hero">
    <div className="lab-date">{formattedDate}</div>
    <h1 className="lab-greeting">{greeting}</h1>
  </div>
</FadeIn>
```

Wrap each stat column with staggered delay:

```tsx
<div className="lab-stats">
  <FadeIn delay={0.1}>
    <div className="lab-stat">
      {/* Credits stat */}
    </div>
  </FadeIn>
  <FadeIn delay={0.2}>
    <div className="lab-stat">
      {/* Rounds stat */}
    </div>
  </FadeIn>
  <FadeIn delay={0.3}>
    <div className="lab-stat">
      {/* Courses stat */}
    </div>
  </FadeIn>
  <FadeIn delay={0.4}>
    <div className="lab-stat">
      {/* Next Tee Time stat */}
    </div>
  </FadeIn>
</div>
```

Wrap activity rows with stagger:

```tsx
{recentLedger.map((entry, i) => {
  // ... existing logic
  return (
    <FadeIn key={entry.id} delay={0.05 * i}>
      <div>
        <div className="lab-activity-row">
          {/* ... row content */}
        </div>
        {i < recentLedger.length - 1 && <div className="lab-activity-divider" />}
      </div>
    </FadeIn>
  )
})}
```

- [ ] **Step 3: Fix stats grid with FadeIn wrappers**

The `FadeIn` wrapper adds a `<div>` around each stat, which breaks `grid-template-columns: repeat(4, 1fr)`. Fix by adding `style={{ display: 'contents' }}` won't work with motion.div. Instead, change the stats layout:

Replace `.lab-stats` grid approach — use the `FadeIn` as the grid child by adding a style:

```tsx
<div className="lab-stats">
  {[
    { label: 'Credits', value: String(balance), amber: true, sub: [`/ ${tierMax}`, creditResetLabel] },
    { label: 'Rounds', value: String(roundsThisMonth), amber: false, sub: ['this month'] },
    { label: 'Courses', value: String(coursesVisited), amber: false, sub: ['visited'] },
    { label: 'Next Tee Time', value: nextTeeCountdown, amber: true, sm: true, sub: [nextTeeDetails, nextTeeCourse].filter(Boolean) },
  ].map((stat, i) => (
    <FadeIn key={stat.label} delay={0.1 + i * 0.1}>
      <div className="lab-stat-label">{stat.label}</div>
      <div className={`lab-stat-value${stat.amber ? ' lab-amber' : ''}${stat.sm ? ' lab-stat-sm' : ''}`}>
        {stat.value}
      </div>
      {stat.sub.map((s, j) => (
        <div key={j} className="lab-stat-sub">{s}</div>
      ))}
    </FadeIn>
  ))}
</div>
```

This way each `FadeIn` IS the grid cell (motion.div becomes the grid item).

- [ ] **Step 4: Verify animations**

Run dev server, navigate to `/dashboard`. On page load:
- Greeting fades in first
- Stats fade in left-to-right with 100ms stagger
- Activity rows fade in with 50ms stagger
- No janky layout shifts

- [ ] **Step 5: Commit**

```bash
git add components/lab-animate.tsx app/\(member\)/dashboard/page.tsx
git commit -m "feat: add staggered fade-in animations to dashboard stats and activity"
```

---

### Task 6: Visual QA and polish

**Files:**
- Modify: `app/(member)/dashboard/page.tsx` (minor tweaks)
- Modify: `components/member-sidebar.tsx` (if needed)

- [ ] **Step 1: Check mobile responsiveness**

Open browser dev tools, test at:
- 375px (iPhone SE)
- 640px (tablet breakpoint)
- 900px (desktop breakpoint)
- 1200px+ (wide desktop)

Verify:
- Stats go 2x2 on mobile/tablet
- Greeting font shrinks correctly
- Activity card doesn't overflow
- Search input is usable on mobile
- Sidebar behavior on mobile (sidebar may need a mobile toggle — but that's out of scope for this task, existing sidebar behavior is preserved)

- [ ] **Step 2: Check font rendering**

Verify in browser:
- Greeting uses Nunito 900 (check computed styles in dev tools — should show `var(--font-nunito)`)
- Stat numbers use Nunito 900
- Activity amounts use Geist Mono (check `var(--font-geist-mono)`)
- All labels use Inter
- No fallback fonts visible (no FOUT on initial load)

- [ ] **Step 3: Check color accuracy**

Use browser color picker to verify:
- Page background is exactly `#0C0C0B`
- Activity card is exactly `#1E1D1B`
- Amber elements are exactly `#BF7B2E`
- No pure white (`#ffffff`) or pure black (`#000000`) anywhere

- [ ] **Step 4: Fix any issues found**

Apply fixes directly to the affected files. Common issues:
- Font family fallbacks not matching CSS var names
- Padding inconsistencies on mobile
- Grid gap too tight on 2x2 mobile layout

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: visual QA polish for dashboard redesign"
```

Only commit if there were actual changes. If everything looked good, skip this commit.

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Dark layout background | `layout.tsx` |
| 2 | Dark sidebar | `member-sidebar.tsx` |
| 3 | New data queries | `dashboard/page.tsx` |
| 4 | Full JSX rewrite | `dashboard/page.tsx` |
| 5 | Motion animations | `lab-animate.tsx` + `dashboard/page.tsx` |
| 6 | Visual QA | All modified files |

**Total: 6 tasks, ~3 files modified, 1 new file, 0 schema changes.**
