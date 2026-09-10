# Project File Map

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
│   ├── ExpenseForm.tsx        ← Add expense form + custom keypad + evaluator
│   ├── CustomCalendar.tsx     ← Custom themed calendar (replaces native picker)
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
