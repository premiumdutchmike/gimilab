# Login + Signup Pages Redesign — Design Spec

**Date:** 2026-03-20
**Status:** Draft
**Phase:** 3

---

## 1. Scope

Redesign `app/(public)/login/page.tsx` and `app/(public)/signup/page.tsx` from the old `#090f1a` dark style to the B&W editorial aesthetic. Form components (`<LoginForm>`, `<SignupForm>`) are untouched — only the page layout shells change.

**In scope:**
- `app/(public)/login/page.tsx` — layout rewrite
- `app/(public)/signup/page.tsx` — layout rewrite, remove rounded green badge, add plan context line

**Out of scope:** `<LoginForm>`, `<SignupForm>` internals, auth logic, Supabase Auth, Stripe.

---

## 2. Design Language

This page uses the **B&W editorial design system** — not the legacy dark theme defined in `CLAUDE.md` (which applies to member/partner/admin portals only).

- Background: `#000`, foreground: `#fff`
- No border-radius anywhere (including form inputs — the form components handle their own styling, but no wrapper radius)
- `1px solid #1a1a1a` for divider rules
- Typography: **Geist Sans**, uppercase, tight letter-spacing, weight contrast (900 headlines vs 10px small-caps labels)
- No icons, no gradients, no shadows, no card wrappers

---

## 3. Shared Layout Shell

Both pages share the same outer structure.

**Page wrapper:**
```
min-h-screen bg-black
flex flex-col items-center justify-center
```

**Inner container:**
```
w-full max-w-[360px] px-6
```

**Sections top to bottom:**
1. Wordmark bar
2. Form block (label → optional plan note → headline → form component)
3. Switch link bar

---

## 4. Wordmark Bar

```
Content: "ONEGOLF" — Next.js Link to /
Styling:
  font-size: 12px
  font-weight: 900
  letter-spacing: 4px
  text-transform: uppercase
  color: #fff

Container:
  padding-bottom: 20px
  margin-bottom: 32px
  border-bottom: 1px solid #1a1a1a
```

Anchors the page to the brand. Clicking navigates back to `/`.

---

## 5. Form Block

### 5a. Section Label

```
Login:   "SIGN IN"
Signup:  "CREATE ACCOUNT"

font-size: 10px
font-weight: 600
letter-spacing: 2px
text-transform: uppercase
color: #444
margin-bottom: 16px
```

### 5b. Plan Context Line (signup only)

Shown only when `?plan=` query param is present. Omitted entirely if param is absent.

```
Format: "JOINING · {PLAN NAME} · ${PRICE}/MO"
Examples:
  ?plan=casual  →  "JOINING · CASUAL · $99/MO"
  ?plan=core    →  "JOINING · CORE · $149/MO"
  ?plan=heavy   →  "JOINING · HEAVY · $199/MO"

font-size: 10px
font-weight: 600
letter-spacing: 2px
text-transform: uppercase
color: #555
margin-bottom: 12px
```

**Tier data (hardcoded — no DB fetch on auth pages):**
```ts
const PLAN_LABELS: Record<string, { name: string; price: string }> = {
  casual: { name: 'CASUAL', price: '$99' },
  core:   { name: 'CORE',   price: '$149' },
  heavy:  { name: 'HEAVY',  price: '$199' },
}
```

If `?plan=` value is not in `PLAN_LABELS` (unknown tier), the plan context line is omitted.

### 5c. Headline

```
Login:   "WELCOME" / "BACK"   (two lines)
Signup:  "JOIN" / "ONEGOLF"   (two lines)

font-size: clamp(40px, 8vw, 56px)
font-weight: 900
text-transform: uppercase
color: #fff
letter-spacing: -1px
line-height: 1
margin-bottom: 32px
```

### 5d. Form Component

`<LoginForm />` or `<SignupForm />` — rendered below the headline with no wrapper card, no border, no border-radius on the container div.

The `<SignupForm>` already reads `?plan=` internally (existing behavior) — the page does not need to pass it as a prop.

---

## 6. Switch Link Bar

```
Container:
  border-top: 1px solid #1a1a1a
  padding-top: 24px
  margin-top: 32px
  display: flex
  gap: 4px (or inline text)
```

**Login page:**
```
"No account?"  →  "GET STARTED →"  links to /pricing
Label: 11px, color: #444, uppercase, letter-spacing: 1px
Link:  11px, color: #fff, uppercase, letter-spacing: 1px
```

**Signup page:**
```
"Already a member?"  →  "SIGN IN →"  links to /login
Label: 11px, color: #444, uppercase, letter-spacing: 1px
Link:  11px, color: #fff, uppercase, letter-spacing: 1px
```

---

## 7. Signup `searchParams` Handling

`app/(public)/signup/page.tsx` is an async Server Component. `searchParams` is a Promise in Next.js 16:

```ts
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan } = await searchParams
  const planData = plan ? PLAN_LABELS[plan] : undefined
  // planData is undefined → plan context line is omitted
}
```

This follows the Next.js 16 async Request APIs pattern (per CLAUDE.md: "All request APIs are async: `await searchParams`").

---

## 8. No New Components

Both pages are self-contained. No new shared components needed — the layout is simple enough to inline in each page file.

---

## 9. Removed / Replaced

| Old | New |
|-----|-----|
| `bg: #090f1a` | `bg: #000` |
| Rounded green badge (`rounded-full border border-green-400/30 bg-green-400/10 text-green-400`) | Plain `10px` uppercase plan context line, `color: #555` |
| `text-2xl font-bold text-white` headline | `clamp(40px, 8vw, 56px)` font-weight 900 headline |
| `text-white/50 text-sm` subtitle | Removed — plan context line replaces it on signup; login has no subtitle |

---

## 10. File Order

1. Rewrite `app/(public)/login/page.tsx`
2. Rewrite `app/(public)/signup/page.tsx`

---

## 11. Verification

```
npm run dev
```

**Login — `http://localhost:3000/login`:**
- Black background
- `ONEGOLF` wordmark at top with `border-bottom` divider, links to `/`
- `SIGN IN` label in small-caps, `#444`
- `WELCOME / BACK` headline in large bold type
- `<LoginForm>` renders below
- `border-top` divider separates switch link
- "No account? GET STARTED →" — GET STARTED links to `/pricing`

**Signup — `http://localhost:3000/signup?plan=core`:**
- `CREATE ACCOUNT` label
- Plan context line: `JOINING · CORE · $149/MO` in small-caps, `#555`
- `JOIN / ONEGOLF` headline
- `<SignupForm>` renders below
- "Already a member? SIGN IN →" — SIGN IN links to `/login`

**Signup — `http://localhost:3000/signup` (no plan param):**
- Plan context line is absent — label goes directly to headline

**Signup — `http://localhost:3000/signup?plan=casual`:**
- Plan context line: `JOINING · CASUAL · $99/MO`

**Signup — `http://localhost:3000/signup?plan=heavy`:**
- Plan context line: `JOINING · HEAVY · $199/MO`
