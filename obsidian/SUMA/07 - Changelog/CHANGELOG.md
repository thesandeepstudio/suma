# CHANGELOG — SUMA

> **Format:** append-only. Newest entry on top.
> Each entry: `## YYYY-MM-DD` → short bullet description of what changed + which files.

---

## 2026-09-10 — Full app audit + Backlog created

**What changed:**
- Full codebase gap analysis (exhaustive exploration of all screens, components, utils, config)
- Created `09 - Backlog/BACKLOG.md` — **200+ tasks** across 18 epics: bugs, core features, reports, wallets, transactions, settings, UI polish, dark mode, i18n, notifications, performance, accessibility, testing, security, docs, platform/cloud, vision, housekeeping
- Kanban board `TASKS.md` updated: Pending split into "Next Up" (10 prioritized) + "Later"
- Added folder color for `09 - Backlog` (lime), linked in MOC + AGENT INSTRUCTION

**Key findings logged:**
- Critical: hardcoded `getDebt()` (6000), unclickable transaction rows, missing note input, seed data category drift, add-tab stub
- Dead code to wire up: `getReceivable`, `get/setCurrency`, budgets key
- Missing: budgets, recurring, search/filters, dark mode, i18n, notifications, tests, virtualization, accessibility

---

## 2026-09-10 — Task tracking added

**What changed:**
- Created `08 - Tasks/TASKS.md` — Pending / In Progress / Completed board
- Added folder color for `07 - Changelog` (indigo) and `08 - Tasks` (amber)
- Agents now check TASKS.md every session (wired into AGENT INSTRUCTION + MOC)

**Files:**
- `obsidian/SUMA/08 - Tasks/TASKS.md` (new)
- `MOC.md`, `AGENT INSTRUCTION.md`, `.obsidian/snippets/folder-colors.css`

---

## 2026-09-10 — Memory + Changelog system

**What changed:**
- Created `[[AGENT INSTRUCTION]]` — master memory/instruction note for agents
- Created `07 - Changelog/` with this CHANGELOG
- Reorganized vault notes into numbered folders 01–07
- Added folder colors via CSS snippet (`.obsidian/snippets/folder-colors.css`)
- Linked `AGENTS.md` (project root) → Obsidian memory so agents auto-read it

**Files:**
- `obsidian/*` (new structure)
- `AGENTS.md`

---

## 2026-09-10 — Keypad centering

**What changed:**
- `alignItems: 'center'` added to keypad container — rows center horizontally

**Files:**
- `src/components/ExpenseForm.tsx`

---

## 2026-09-10 — Custom keypad replaces system keyboard

**What changed:**
- Built 4-row custom keypad pinned at bottom of expense form
  - Row 1: `1 2 3 ⌫(span2)` · Row 2: `4 5 6 + ×` · Row 3: `7 8 9 − ÷` · Row 4: `. 0 Today ✓(span2)`
- Keys: `width 60`, `height 44`, `borderRadius 14`, `gap 8`, span keys `width 128`
- Amount hero: `showSoftInputOnFocus={false}` — no system keyboard
- `⌫` tap = backspace, long-press = clear all
- **Today** key sets date + opens calendar
- **✓** key saves (resolves expression → `handleSave()`)
- Removed Date picker row + Save Record button
- Added recursive-descent expression evaluator (`+ − × ÷`, operator precedence, `/0` guard)
- `×`/`÷` normalized to `*`/`/` internally

**Files:**
- `src/components/ExpenseForm.tsx`

---

## 2026-09-10 — Custom calendar replaces native picker

**What changed:**
- New `CustomCalendar.tsx`
  - Compact monochrome calendar in bottom-sheet modal
  - `maximumDate = today` — future days disabled/greyed
  - Remounts on open via `pickerKey`
  - "OK" text button (`borderRadius: 10`)

**Files:**
- `src/components/CustomCalendar.tsx` (new)
- `src/components/ExpenseForm.tsx`

---

## 2026-09-10 — New expense form UI

**What changed:**
- Animated segmented control (Expense / Income / Transfer) with sliding black capsule (`withSpring`)
- New hero amount area — large 46pt number, "NPR" currency label, hint caption
- Zero-balance transfer guard (`from === to` blocked)
- Wallet picker modal + category picker modal (2-level drill-down)
- Type instantly toggles wallet sign badge (`+` / `−`)

**Files:**
- `src/components/ExpenseForm.tsx`

---

## 2026-09-10 — Profile, backup, storage helpers

**What changed:**
- Settings screen (`me.tsx`): editable username, transaction count, wallet shortcut, clear-data, backup/restore JSON
- New storage helpers: `get/setUsername`, `get/setCurrency`, `getTransactionCount`, `clearAllData`

**Files:**
- `src/app/(tabs)/me.tsx`
- `src/utils/storage.ts`
- `src/utils/constants.ts`

---

## 2026-09-10 — Tab bar redesign

**What changed:**
- Edge-to-edge white tab bar, rounded top corners (20), `paddingTop/Bottom: 10`, `paddingHorizontal: 5`, height 64, absolute + elevation 12
- Icons: Dashboard `dashboard`, Report `timeline`, Add `add` (black circle `#111111`, white icon, `top: -14`), Wallet `wallet`, Settings `settings`
- Animated icon component: spring scale `0.9→1`, translateY `2→0`
- Dashboard ScrollView `paddingBottom: 100` clears the bar
- Push to `/expense` route from Add button

**Files:**
- `src/app/(tabs)/_layout.tsx`
- `src/app/(tabs)/index.tsx`
- `data/app-data.json` (Khalti icon)
- `src/types/index.ts` (`IconName`)

---

## 2026-09-10 — Vault setup

**What changed:**
- Obsidian vault created inside repo at `obsidian/SUMA`
- Added `AGENT INSTRUCTION.md`, `MOC.md`, numbered folders, CSS folder colors

---