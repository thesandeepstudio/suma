# 📋 SUMA — Full Backlog

> **Source:** full codebase gap analysis (2026-09-10)
> **Rules:** ONE file — pick tasks from here into the Kanban board `08 - Tasks/TASKS.md` when you start them.
> Format: `- [ ] TASK` (checkbox). Categories = `## EPIC`.

---

## 🐞 1 — Critical Bugs & Incomplete Code

- [ ] **Fix `getDebt()` hardcoded stub** — `src/utils/storage.ts` returns `6000`; compute real debt from transactions (Borrow category) or remove
- [ ] **Fix unclickable transaction rows** — `src/app/transactions.tsx` `ExpenseCard onPress={() => {}}`; wire to `router.push(/expense/detail/[id])`
- [ ] **Remove `add.tsx` redirect stub** — make the + tab never navigable, or give it a real home (e.g. quick actions menu)
- [ ] **Add note input to ExpenseForm** — `Expense.note` exists in type + detail screen, but no TextInput in the form
- [ ] **Fix seed data category drift** — transactions reference categories not in seed list ("Trans", "Sports", "Receipt", "Telephone", "GLB", "Cash", "Prop.Mgmt.", "Beverages")
- [ ] Fix 1 seed transaction typed as income ("Food" record `s1-2`) that should be expense
- [ ] **Wallet delete leaves dangling `walletId`** — on `deleteWallet`, clean up or block when transactions reference it
- [ ] **Category delete/rename leaves dangling names** — transactions reference category by string name; handle renames/deletes
- [ ] **Seed resurrection bug** — `seedInitialData` re-adds deleted default categories on next launch (filter deleted ids)
- [ ] Wrap storage mutations in try/catch — no unhandled AsyncStorage write errors
- [ ] Guard app render until `seedInitialData()` finishes — prevent first-frame empty flash
- [ ] `BalanceCard` trend — label compares spending to last month but says "up/down"; clarify wording
- [ ] `pctChange` ±1% treated as flat — adjust threshold sensitivity
- [ ] "Report a bug" links to unrelated repo (`anomalyco/opencode/issues`) — point to SUMA repo issues
- [ ] `todayCount` counts ALL transactions incl. income/transfers — count expenses only
- [ ] Transfer rows show `-` prefix in ExpenseCard though net-neutral — mark arrow/transfer glyph instead
- [ ] Delete `TransactionType` "transfer" amounts from daily/weekly/monthly spending aggregates

---

## 🧱 2 — Core Features Missing

- [ ] **Budgets** — per-month spend limits per category, total cap, with `STORAGE_KEYS.BUDGET` (key already exists!)
- [ ] Budget progress bar on BalanceCard + category detail
- [ ] Budget overrun warning (progress color → red / alert)
- [ ] **Recurring / scheduled expenses** — allow "repeat monthly/weekly" on add, auto-create drafts
- [ ] Recurring scheduler service + due list
- [ ] **Search transactions** — by title/note/category/wallet
- [ ] **Filter transactions** — by type, category, wallet, date range, amount range
- [ ] **Sort transactions** — date, amount, category
- [ ] **Multiple currency support** — wire `get/setCurrency` into Settings + form
- [ ] Currency picker (NPR, USD, INR, EUR...) with symbol + formatting per currency
- [ ] **Onboarding / first-run tutorial** — 3-4 screens: welcome, add first expense, create wallet
- [ ] **Attachments / receipt photos** — camera + gallery picker, store local path/uri
- [ ] View/delete attachment in transaction detail
- [ ] **Tags system** — user-defined labels per transaction, filter by tag
- [ ] **Notes field** on transactions (see bugs)
- [ ] **Export to CSV** — transactions export
- [ ] **Export to PDF** — report/statement export
- [ ] **Dark mode** — full theme system + toggle (respects system or manual)
- [ ] **i18n / localization** — `expo-localization`, en + ne (Nepali) at minimum
- [ ] **Push/local notifications for reminders** (bill reminders, budget overrun)
- [ ] Manual date-range picker for reports
- [ ] Multiple profiles / household switch (data namespacing)

---

## 📊 3 — Reports & Analytics

- [ ] **Category breakdown donut chart** — top N categories this month
- [ ] Per-wallet breakdown chart
- [ ] Bar chart — daily expenses over month
- [ ] Month navigation (prev/next month) in report
- [ ] Touch/tooltip on chart data points
- [ ] Report empty state (no data) instead of empty axes
- [ ] Net balance trend line (income − expense running)
- [ ] **Top categories list with amounts + %** on report
- [ ] Average spend per day/week metric
- [ ] Compare with last period delta card
- [ ] **Export chart/statistics** as image or PDF
- [ ] Wallet-wise balance column on report
- [ ] Yearly summary view (12 month bar)
- [ ] Category drill-down — tap category → its transactions
- [ ] Statistics: highest expense day, most frequent category, biggest single expense
- [ ] Budget vs actual report for the month
- [ ] Cash-flow table for transfer transactions
- [ ] Refund/income breakdown by source wallet

---

## 💳 4 — Wallet & Accounts

- [ ] Wire `getReceivable()` (computed but never displayed) into Wallet tab
- [ ] Per-wallet transaction history drilldown (tap wallet → its transactions)
- [ ] **Balance adjustment flow** — explicit "adjust balance" vs editing absolute values
- [ ] **Recalculate balance from transactions** option (fix desync)
- [ ] Per-wallet currency
- [ ] Wallet transfer fee field
- [ ] Wallet grouping (Personal / Business / Cards)
- [ ] Wallet archive/hide (don't delete history)
- [ ] Wallet color / icon customization
- [ ] Net worth card — assets + liabilities split
- [ ] Credit card due date + statement tracking
- [ ] Debt/loan tracking with paid marker
- [ ] Wallet search if many wallets
- [ ] Tap wallet on dashboard → wallet detail screen

---

## 🗂️ 5 — Transactions & Categories

- [ ] Category reorder in management screen
- [ ] Category spend stats (in management screen)
- [ ] Budget per category link from management
- [ ] Multi-select delete transactions (swipe to delete)
- [ ] Swipe-to-delete on transaction rows (with undo)
- [ ] Undo toast on delete (transactions + wallets)
- [ ] Edit transaction from the full list (long-press)
- [ ] Duplicate transaction shortcut
- [ ] Split transactions (multi-category single expense)
- [ ] Copy transaction (same values, different date)
- [ ] Category emoji/icon from full MaterialIcons picker
- [ ] Custom category colors (full color wheel)
- [ ] Transaction note visible in list rows
- [ ] Transaction with multiple wallets (split payment)
- [ ] Merchant/party field (who you paid)
- [ ] Search within category

---

## ⚙️ 6 — Settings & Data Management

- [ ] Wire `get/setCurrency` — Language & Region section in Settings
- [ ] Show app version from `expo-constants` (not hardcoded)
- [ ] **Auto-backup to local file / cloud** on interval
- [ ] Restore confirm that shows backup summary before import
- [ ] Settings export button visible with last backup date
- [ ] **Reset app** option (full wipe + reseed)
- [ ] Privacy section (data is 100% local notice)
- [ ] Notification preferences screen
- [ ] Theme preference screen (light/dark/system)
- [ ] Language preference screen
- [ ] Connect "Report a bug" to SUMA GitHub
- [ ] About — acknowledgements/licenses link
- [ ] Rate the app link on stores
- [ ] Show data schema version in About
- [ ] Data migration runner UI status

---

## 🎨 7 — UI/UX Polish

- [ ] Enforce `COLORS` everywhere — replace hardcoded `#F1F1F4`, `#111111`, `#999999`, `#ECECEC`, `#5F5F5F` etc.
- [ ] Dashboard skeleton loading state (no empty flash)
- [ ] Transactions/wallet/categories loading states
- [ ] Empty states on wallet, transactions, report (illustrated)
- [ ] Success feedback toast after adding expense (instead of just navigating back)
- [ ] Haptic feedback on keypad taps + save
- [ ] Keypad keyboard-like active key press animation (darker bg on press)
- [ ] Animated number transition in BalanceCard on focus
- [ ] Add button press feedback (scale down)
- [ ] Tab bar icon badges (e.g. today's expense count)
- [ ] Report chart animation on focus
- [ ] Segmented control haptics
- [ ] Pull-to-refresh everywhere data loads
- [ ] Clamp/scale amount input — handle very large numbers
- [ ] Reduce motion accessibility option
- [ ] RTL support consideration

---

## 🌗 8 — Dark Mode / Theming

- [ ] Define dark palette from `COLORS` (swap black/white)
- [ ] Theme context provider + hook `useTheme()`
- [ ] `app.json` → `userInterfaceStyle: "automatic"`
- [ ] Convert all style files to theme-aware styles
- [ ] CustomCalendar dark support
- [ ] Keypad dark support
- [ ] Tab bar dark support
- [ ] Charts (SVG) dark support
- [ ] Modal bottom-sheets dark support
- [ ] StatusBar switch on theme
- [ ] System theme listener + manual override setting

---

## 🌐 9 — Localization

- [ ] Install `expo-localization`
- [ ] Extract all UI strings to locale JSONs (`en.json`, `ne.json`)
- [ ] Currency symbol localization
- [ ] Date formatting per locale (`formatDate`)
- [ ] CountString pluralization helper
- [ ] Locale switch in Settings
- [ ] Category presets localization
- [ ] ThemeAlert strings localization

---

## 🔔 10 — Notifications & Reminders

- [ ] Install `expo-notifications`
- [ ] Daily reminder (log your spending) setting
- [ ] Budget overrun local notification
- [ ] Recurring expense due notification
- [ ] Notification permission flow
- [ ] Local notifications settings screen

---

## ⚡ 11 — Performance & Architecture

- [ ] **Replace ScrollView+map with FlatList/SectionList** (transactions, dashboard, wallet, categories)
- [ ] Add `React.memo` to WalletPickerField, CategoryPickerField, RangeButton, ExpenseCard, WalletCard
- [ ] Memoize row `onPress` callbacks to stop re-renders
- [ ] **Shared data context** (Context + reducer or zustand) instead of re-reading AsyncStorage on every focus
- [ ] Cache parsed JSON reads (in-memory mirror + invalidation on write)
- [ ] Debounce searches/filters
- [ ] Lazy-import report chart heavy components
- [ ] Remove dead deps (`expo-glass-effect`, `@expo/ui`, `expo-symbols`, etc. if unused)
- [ ] Reconcile relative vs `@/` imports — pick one convention
- [ ] Move expression evaluator + keypad handlers out of giant ExpenseForm into modules
- [ ] Extract `_exprI` module mutable into closure-safe parse
- [ ] Index transactions by date for fast grouping
- [ ] Add `getLastModified` on data change for cache invalidation
- [ ] Virtualize category grid

---

## ♿ 12 — Accessibility

- [ ] `accessibilityRole` on all TouchableOpacity (button, tab)
- [ ] `accessibilityLabel` on icon-only buttons (keypad ⌫, ✓, Today, edit, chevrons, + tab)
- [ ] `accessibilityHint` on actions with context
- [ ] Accessibility state handled on tabs (expanded/selected)
- [ ] Contrast audit of muted colors vs white bg (textMuted #9E9E9E)
- [ ] Tap target size audit (44px minimum) — keypad keys are 44 ✓, chevrons/icons audit
- [ ] Screen-reader announcement on amount resolve/save
- [ ] Keyboard navigation focus order (web)
- [ ] Reduced-motion respect (reanimated) — settings toggle
- [ ] Chart accessibility labels (data summary text)

---

## 🧪 13 — Testing Infrastructure

- [ ] Add `npm test` script + Jest config for RN
- [ ] Unit tests for expression evaluator (resolveAmount cases)
- [ ] Unit tests for `formatCurrency`, `groupExpensesByDay`, `getCategoryLabel`
- [ ] Unit tests for storage CRUD + balance effects (`applyRecordEffect`)
- [ ] Unit tests for backup/restore roundtrip
- [ ] Component tests for CustomCalendar (selection, disabled days)
- [ ] Component tests for Keypad behaviors (operators, decimal, backspace, clear)
- [ ] Component tests for SegmentOption (animated)
- [ ] e2e smoke: add expense → appears on dashboard
- [ ] e2e: wallet → transfer → balances update
- [ ] Test seed consistency (transactions categories exist, no negative test data)
- [ ] CI with lint + tsc + tests (GitHub Actions)

---

## 🛡️ 14 — Security & Data Integrity

- [ ] Add "delete transaction" confirmation dialog (currently only detail menu)
- [ ] Storage write queues/serialization (avoid race on rapid saves)
- [ ] Schema version migration framework (replace blunt seedVersion)
- [ ] Sanitize imported backup JSON (validate shape before write)
- [ ] Amount rounding policy consistent (avoid float errors: store paisa/int)
- [ ] Backup file includes app version + schema version metadata
- [ ] Prevent duplicate concurrent balance applications on transfer

---

## 📚 15 — Documentation

- [ ] Rewrite README (real project overview, features, stack, dev scripts)
- [ ] Add screenshots/gifs to README
- [ ] CONTRIBUTING.md
- [ ] LICENSE correctness (exists but verify)
- [ ] Update Obsidian File Map note (new routes: expense/*, wallet/*, transactions, category; new components: ExpenseCard, WalletCard, WalletForm, CategoryCard, ThemeAlert)
- [ ] Architecture doc note (data flow, storage, balance effects)
- [ ] Changelog entries for prior sessions already done ✓ — keep appending

---

## ☁️ 16 — Platform Backend / Cloud (future)

- [ ] Cloud sync (Firebase/Supabase) with auth
- [ ] Optional end-to-end encryption for sync data
- [ ] Multi-device conflict resolution strategy
- [ ] Web deployment polish (react-native-web) — `dist/` exists already
- [ ] PWA manifest + offline
- [ ] Native app store assets (icon, splash on all densities)
- [ ] Release signing setup + EAS Build config
- [ ] App icon design (monochrome SUMA mark)
- [ ] Splash screen brand
- [ ] App store listing text + screenshots

---

## ✨ 17 — Vision / Stretch Game-Changers

- [ ] AI-powered categorization suggestions from note/title
- [ ] Bank SMS/notification auto-import (Nepal: eSewa/Khalti SMS parse)
- [ ] Weekly digest report push notification
- [ ] Annual "year in review" screen
- [ ] Widgets (iOS Home / Android widget) for balance
- [ ] Intent-based add expense via shortcut (iOS Shortcuts / Android intent)
- [ ] Voice input for expenses
- [ ] Bill splitting with friends
- [ ] Savings goals with progress rings
- [ ] Net-worth over-time chart
- [ ] Community categories packs
- [ ] NEPSE/stock tracking tie-in (Nepali niche)
- [ ] AR receipt scanning
- [ ] Passcode / biometric lock for app
- [ ] Confidential "hide balance" for screen peeking

---

## 🧹 Housekeeping / Quick Wins (do anytime)

- [ ] Add `tsc --noEmit` npm script + run in CI
- [ ] Delete orphan `CategoryCard.tsx` (or wire it up)
- [ ] Remove dead exports hint warnings
- [ ] Verify `dist/` is gitignored
- [ ] Align lint config with project (add `react-hooks` rules)
- [ ] Remove unused imports across files
- [ ] Consolidate repeated modal style blocks into shared `theme.ts`
- [ ] Add `.editorconfig`
- [ ] Add `lint-staged` + `husky` for pre-commit
- [ ] Check `react-native-svg` vs `expo-svg` duplication

---