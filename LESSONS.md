# LESSONS.md — MegDB incidents and rules

Claude and humans should append here after significant mistakes.

Format:

## [date] — short title

**What happened:** description  
**Why:** root cause  
**Fix:** what we changed  
**Rule:** NEVER do X because Y

---

## Required categories (when applicable)

- Security incident / near miss
- Cache / revalidation bug
- SEO regression
- Data leak / secret exposure
- Migration / rollback issue
- Observability gap (incident with no signal)
- Dependency / supply-chain issue

---

## Process

- Add an entry the same day as the incident or right after the fix.
- Each “rule” line must be testable or observable.
- Production outages: note detection path, duration, and what tests/alerts were added.
- Security issues: note secret rotation and session handling.

---

## Examples (template)

## 2026-04-01 — `use client` on a media card broke ISR

**What happened:** A card was marked client-only; ISR stopped matching expectations.  
**Why:** `onClick` was added without extracting a tiny client child.  
**Fix:** Moved the interactive bit to its own client component.  
**Rule:** Do not mark full cards as client components — only interactive islands.

## 2026-04-02 — movie updated in admin but public page stayed stale

**What happened:** Admin saved new data; public movie page showed old HTML.  
**Why:** Mutation did not call `revalidatePath` / `revalidateTag`.  
**Fix:** Documented invalidation map + test for content updates.  
**Rule:** Do not merge content mutations without an explicit revalidation strategy.

---

_MegDB — lessons log (English only)._
