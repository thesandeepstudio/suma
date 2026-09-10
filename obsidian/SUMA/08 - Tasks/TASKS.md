---
kanban-plugin: board
---

## 🔄 In Progress

- [ ] Verify centered keypad compiles (run `npx tsc --noEmit` + `npm run lint`) 📅 2026-09-10
- [ ] Visually check keyboard rows are centered 📅 2026-09-10
- [ ] Commit + push remaining work 📅 2026-09-10

## ⏳ Pending — Next Up

- [ ] Review full backlog → [[BACKLOG]] (200+ tasks across 18 categories) 📅 2026-09-10
- [ ] Fix `getDebt()` hardcoded stub (compute real value) 🔴
- [ ] Fix unclickable transaction rows in `transactions.tsx` 🔴
- [ ] Add note input to ExpenseForm (field exists in type, no UI) 🔴
- [ ] Wire `getReceivable()` into Wallet tab 🔴
- [ ] Implement budgets (key `STORAGE_KEYS.BUDGET` already exists) 🔴
- [ ] Wire `get/setCurrency` into Settings (dead code → real setting) 🟠
- [ ] Fix seed data category drift 🔴
- [ ] Replace ScrollView+map with FlatList (performance) 🟠
- [ ] Fix `add.tsx` redirect stub 🟠
- [ ] Category delete/rename should update transactions 🟠

## ⏳ Pending — Later

- [ ] Dark mode theme system 🌗
- [ ] i18n (en/ne) 🌐
- [ ] Search + filters 🔍
- [ ] Recurring expenses 🔁
- [ ] Attachments / receipts 📎
- [ ] Report category breakdown chart 📊
- [ ] Local notifications 🔔
- [ ] Accessibility pass ♿
- [ ] Test infrastructure 🧪
- [ ] Auto-backup 💾

## ✅ Completed

- [x] Tab bar redesign (flat white bar, rounded top, raised + button) ✅ 2026-09-10
- [x] Dashboard greeting layout (`paddingLeft: 20`, `paddingTop: 16`) ✅ 2026-09-10
- [x] BalanceCard styling (`marginHorizontal: 16`) ✅ 2026-09-10
- [x] Settings / Profile screen (username, backup/restore, clear data) ✅ 2026-09-10
- [x] Wallet tab icon fix (Khalti → `account-balance-wallet`) ✅ 2026-09-10
- [x] Custom calendar (max date = today, remount-on-open) ✅ 2026-09-10
- [x] Custom keypad + expression evaluator (4 rows, `+ − × ÷`, Today + ✓) ✅ 2026-09-10
- [x] Remove date picker row + Save button (handled by Today / ✓) ✅ 2026-09-10
- [x] Vault setup + folder colors ✅ 2026-09-10
- [x] Memory + Changelog system (`AGENT INSTRUCTION` + CHANGELOG) ✅ 2026-09-10
- [x] Task tracking added (`TASKS.md` converted to Kanban) ✅ 2026-09-10
- [x] Full app audit + gap analysis (BACKLOG created) ✅ 2026-09-10


%% kanban:settings
```
{"kanban-plugin":"board","list-heading-label":"Column","new-note-template":"","show-checkboxes":true}
```
%%