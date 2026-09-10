# 📜 AGENT INSTRUCTION — SUMA Project Memory

> **What this is:** The persistent memory + operating manual for any AI agent working on the SUMA project.
> **Rule:** If you touch any code, update this file and the CHANGELOG before finishing the task.
> **Sandha: Review and maintain this. Agents: Read this at the start of every session.**

---

## 🧠 HOW AGENTS USE THIS (Read Me First)

1. **Always read this file** at the start of a session before writing code.
2. Read `08 - Tasks/TASKS.md` — see what's pending / in progress / completed. Start with the current in-progress task.
3. For new ideas / long-term features, read `09 - Backlog/BACKLOG.md`. Pull tasks from there into the Kanban board when starting work.
4. Read the latest entries at the top of `07 - Changelog/CHANGELOG.md`.
5. **After ANY code change** — add a new entry to the CHANGELOG and update the relevant sections in this file (file map, "current state", versions).
6. **Keep TASKS.md accurate** — move finished tasks to Completed, blocks to In Progress.
4. Never delete history. The changelog is append-only — newest entry on top.

---

## 🎯 Project Overview

| | |
|---|---|
| App | **SUMA** — personal expense tracker |
| Platform | iOS / Android (Expo) |
| Framework | [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) |
| Language | TypeScript |
| Routing | `expo-router` |
| Animations | `react-native-reanimated` |
| Icons | `@expo/vector-icons` (`MaterialIcons`) |
| Storage | `@react-native-async-storage/async-storage` |

**Design language:** Monochrome. Pure black (`#000000`) accents on white. No colored UI. (`src/utils/constants.ts`)

---

## 📁 File Map (CURRENT)

```
src/
├── app/
│   └── (tabs)/
│       ├── _layout.tsx        ← Tab bar config + animated icons
│       ├── index.tsx          ← Dashboard screen
│       ├── report.tsx         ← Report screen
│       ├── wallet.tsx         ← Wallets screen
│       └── me.tsx             ← Settings / Profile screen
├── components/
│   ├── ExpenseForm.tsx        ← Add expense form + custom keypad + expr evaluator
│   ├── CustomCalendar.tsx     ← Custom themed calendar
│   └── BalanceCard.tsx        ← Dashboard total balance card
├── utils/
│   ├── constants.ts           ← COLORS, STORAGE_KEYS, DEFAULT_CATEGORIES
│   ├── storage.ts             ← All AsyncStorage helpers
│   └── helpers.ts             ← Formatting, ID generation, category labels
└── types/
    └── index.ts               ← TypeScript types (IconName, etc.)

data/
└── app-data.json              ← Seed data: wallets, categories, expenses
```

---

## ✅ Current State (keep updated)

| Component | Status | Notes |
|---|---|---|
| Tab bar | ✅ Done | Flat white bar, rounded top, raised black + button |
| Dashboard greeting | ✅ Done | `paddingLeft: 20`, `paddingTop: 16` |
| BalanceCard | ✅ Done | `marginHorizontal: 16` |
| Settings / Profile | ✅ Done | Editable username, backup/restore, clear data |
| Wallet tab | ✅ Done | Khalti icon → `account-balance-wallet` |
| Custom calendar | ✅ Done | Max date = today, remount via `pickerKey` |
| Custom keypad | ✅ Done | 4-row, expression evaluator, Today + ✓ |
| Date picker row | ✅ Removed | Handled by keypad Today key |
| Save Record button | ✅ Removed | Tick key saves via `handleSave()` |

---

## 🔑 Key Conventions (Agent Rules)

- **Theme can't change** — always use `COLORS` from `src/utils/constants.ts`. No hardcoded colors.
- **Lint + typecheck before done:** run `npx tsc --noEmit` and `npm run lint` after every change.
- **Comments:** Do NOT add comments to code unless asked.
- **Versioned Expo docs:** Expo SDK has changed significantly — always read the v57 docs (`https://docs.expo.dev/versions/v57.0.0/`) before writing Expo code.
- **Update these notes on every change** — this file + CHANGELOG.
- **Git:** Only commit/push when the user explicitly asks.

---

## 🗺️ Entry Points

- `MOC.md` — map of content linking all notes
- `08 - Tasks/TASKS.md` — pending/in-progress/completed task board (check first)
- `09 - Backlog/BACKLOG.md` — full feature backlog (200+ tasks, 18 categories)
- `07 - Changelog/CHANGELOG.md` — full history of every change
- `06 - Git/History.md` — git log + current state summary

---