# SOP: Partner Onboarding

**Last updated:** 2026-03-23
**Owner:** Operations
**Applies to:** All new partner course signups

---

## Overview

Partner onboarding is a self-serve, 5-step flow that takes a course operator from signup to live listing. The entire process can be completed in under 10 minutes. Stripe Connect is the only optional step — partners can go live without it and connect their bank account later.

---

## Flow Summary

```
/partner/apply          → Marketing landing page (public)
/partner/apply/signup   → Account creation
/partner/onboarding/course   → Step 1: Course profile
/partner/onboarding/pricing  → Step 2: Discount rate setup
/partner/onboarding/payout   → Step 3: Stripe Connect (skippable)
/partner/onboarding/slots    → Step 4: Add first tee times
/partner/onboarding/live     → Step 5: Go live confirmation
```

---

## Step-by-Step

### Step 0: Account Creation (`/partner/apply/signup`)

**What the partner does:**
- Enters full name, email, and password
- Clicks "Create Partner Account"

**What the system does:**
- Creates Supabase Auth user with `role: partner` in metadata
- Inserts row in `users` table
- Inserts row in `partners` table with `onboarding_complete = false`
- Sends **Partner Welcome** email
- Redirects to Step 1

**Failure handling:**
- Duplicate email → inline error "Signup failed. Try a different email."
- Validation errors → inline below each field

---

### Step 1: Course Profile (`/partner/onboarding/course`)

**What the partner does:**
- Starts typing course name → Google Places autocomplete fills address, phone, website
- Selects course type (Municipal, Semi-Private, Private, Resort)
- Confirms holes (9/18/27/36) and par
- Writes 2–3 sentence description (280 char limit)
- Clicks "Save & Continue"

**What the system does:**
- Validates all required fields server-side (Zod)
- Inserts row in `courses` table with `status: pending`
- Generates URL slug from course name
- Redirects to Step 2

**Key details:**
- Google Places API key: stored in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Auto-fill reduces manual entry to ~2 minutes
- Course photos are NOT collected here (future enhancement)

---

### Step 2: Discount Rate Setup (`/partner/onboarding/pricing`)

**What the partner does:**
- Enters their standard walk-up rack rate (e.g. $85)
- Enters their Gimmelab rate (e.g. $60)
- Watches the commission tier unlock in real-time
- Reviews the earnings preview card
- Clicks "Lock In Rate"

**What the system does:**
- Calculates discount percentage: `(rack - gimmelab) / rack * 100`
- Determines commission tier:
  - **Starter** (10–19% off): partner keeps 85%, Gimmelab takes 15%
  - **Plus** (20–29% off): partner keeps 87%, Gimmelab takes 13%
  - **Pro** (30%+ off): partner keeps 90%, Gimmelab takes 10%
- Updates `courses` table: `rack_rate_cents`, `gimmelab_rate_cents`, `payout_rate`
- Flags for admin review if:
  - Gimmelab rate > $150 → `verification_queue` row with reason `gimmelab_rate_above_cap`
  - Rack rate < $30 → `verification_queue` row with reason `low_rack_rate`
- Redirects to Step 3

**Validation rules:**
- Discount must be ≥ 10% (enforced client + server)
- 1 credit = $1
- Rate can be changed anytime from partner dashboard after going live

**Admin action required if flagged:**
- Check `verification_queue` table for `status: open` rows
- Review the rates manually
- No automatic blocking — partner continues onboarding regardless

---

### Step 3: Stripe Connect (`/partner/onboarding/payout`)

**What the partner does (Option A — connect now):**
- Clicks "Connect Bank Account"
- Currently **stubbed** — redirects to Step 4 (Stripe Connect integration deferred to Phase 2)

**What the partner does (Option B — skip):**
- Clicks "Skip for now — I'll connect later"
- Redirects to Step 4

**What the system does:**
- Both buttons redirect to `/partner/onboarding/slots`
- No data is saved in this step (stubbed)

**Post-launch behavior (Phase 2):**
- "Connect Bank Account" will initiate Stripe Connect OAuth
- On return from Stripe, `stripe_connect_account_id` is saved on `partners` row
- Partner dashboard shows green "Connected" status

**If skipped:**
- Partner can still go live and receive bookings
- Amber banner appears on every dashboard page: "Payouts on hold — connect your bank account to start receiving payments."
- Partner can connect anytime from `/partner/settings`
- Bookings and earnings accumulate — payouts begin once Stripe is connected

---

### Step 4: Add First Tee Times (`/partner/onboarding/slots`)

**What the partner does (Quick Add — default):**
- Selects available days (toggle chips: Mon–Sun)
- Sets start time and end time
- Chooses interval (10/15/20 min)
- Sets start date and duration (2/4/8/12 weeks)
- Reviews the live preview ("This will create 48 tee time slots")
- Clicks "Generate Slots"

**What the partner does (Manual Entry — alt tab):**
- Adds individual date + time rows
- Clicks "+ Add another time" for each slot

**What the partner does (Skip):**
- Clicks "Skip for now"
- Can add slots later from partner dashboard

**What the system does:**
- Creates a `tee_time_blocks` row (the recurring rule)
- Materializes individual `tee_time_slots` rows from the block
- Each slot gets `credit_cost` based on `gimmelab_rate_cents / 100`
- Each slot gets `release_at` = slot datetime minus 48 hours
- Inserts in batches of 500 for performance
- Redirects to Step 5

**Day-of-week mapping:**
- UI displays Mon=0 through Sun=6
- Converted to native JS `getDay()` values before saving (Sun=0, Mon=1, etc.)

---

### Step 5: Go Live (`/partner/onboarding/live`)

**What the partner sees:**
- Animated checkmark (Motion scale-in)
- "You're live." headline
- Summary card: course name, type, holes, location, rate, slots added, payout status
- "Open Dashboard" CTA
- Shareable listing link with copy button

**What the system does:**
- Sets `partners.onboarding_complete = true`
- Sends **Partner Goes Live** email with course summary
- Course is now discoverable by members

---

## Resumable Onboarding

If a partner abandons mid-process and logs in later:

1. `(partner)/layout.tsx` detects `onboarding_complete = false`
2. Calls `getNextOnboardingStep()` which checks:
   - No course row → redirect to Step 1
   - No `gimmelab_rate_cents` → redirect to Step 2
   - Stripe skipped → **not checked** (optional)
   - No `tee_time_slots` → redirect to Step 4
   - Not marked live → redirect to Step 5
3. Partner lands on exactly the step they left off
4. All previously completed steps are preserved

**The partner never loses progress.** Data is saved at each step, not at the end.

---

## Emails Sent

| Email | When | Template |
|-------|------|----------|
| Partner Welcome | Account created (Step 0) | `emails/partner-welcome.tsx` |
| Partner Goes Live | Step 5 completion | `emails/partner-live.tsx` |

---

## Fraud Prevention

The system does NOT block partners with suspicious rates. Instead:

1. **Low rack rate** (< $30) → flagged in `verification_queue`
2. **High Gimmelab rate** (> $150) → flagged in `verification_queue`
3. Admin reviews manually from the admin console
4. The system is self-correcting: members see both rates and will notice discrepancies; ratings surface bad actors

**Action for ops:** Check `verification_queue` daily for `status: open` rows. Reach out to flagged partners to verify rates before their first payout.

---

## Metrics to Track

| Metric | How to measure |
|--------|---------------|
| Signup → Live conversion | `partners` where `onboarding_complete = true` / total `partners` |
| Average time to complete | Timestamp diff between `partners.created_at` and `onboarding_complete` flip |
| Drop-off step | Count partners stuck at each step (no course, no rate, no slots) |
| Stripe skip rate | Partners live without `stripe_connect_account_id` |
| Flagged rate % | `verification_queue` rows / total courses |

---

## Troubleshooting

| Issue | Resolution |
|-------|-----------|
| Partner can't find their course in Google Places | They can type manually — autocomplete is a convenience, not required |
| Partner locked out after signup | Check Supabase Auth for the user. Verify `role: partner` in metadata |
| Partner stuck on "Creating account…" spinner | Check server logs for Supabase Auth errors (duplicate email, weak password) |
| Slots not generating | Check that days are selected and end time > start time |
| Amber Stripe banner won't go away | `stripe_connect_account_id` is still null — partner needs to complete Stripe Connect |
| Partner goes live but course doesn't appear | Check `courses.status` — it should be `pending` until admin approves (if verification required) |
| Rate flagged but partner went live | Expected behavior — flagging is async, doesn't block onboarding |

---

## Related Documents

- Design spec: `docs/superpowers/specs/2026-03-22-partner-onboarding-design.md`
- Prototype: `PARTNER_ONBOARDING_PROTOTYPE.html`
- Schema: `lib/db/schema.ts` (tables: `partners`, `courses`, `verification_queue`, `tee_time_blocks`, `tee_time_slots`)
- Actions: `actions/partner/` (create-partner, save-course, save-rate, connect-stripe, create-slots, set-live)
