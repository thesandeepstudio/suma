# Expense Form

**File:** `src/components/ExpenseForm.tsx`

---

## Segmented Type Selector (Expense / Income / Transfer)

| Property | Value |
|---|---|
| Container | `marginHorizontal: 16`, `marginTop: 20`, `borderRadius: 18`, `padding: 4`, bg `#F1F1F4` |
| Animated capsule | `position: 'absolute'`, `borderRadius: 14`, `backgroundColor: COLORS.primary` |
| Spring config | `{ damping: 24, stiffness: 260, mass: 0.7 }` |
| Icon + label color | Animates between `COLORS.textMuted` → `COLORS.white` on focus |

---

## Amount Hero Area

```ts
hero:         { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 }
heroCaption:  { fontSize: 14, color: COLORS.textMuted, marginBottom: 10 }
heroCurrency: { fontSize: 20, fontWeight: '700', marginRight: 8 }   // "NPR"
heroInput:    { fontSize: 46, fontWeight: '800', minWidth: 120, textAlign: 'center' }
```

- `showSoftInputOnFocus={false}` — suppresses system keyboard
- Focus triggers custom keypad

---

## List Card (wallet / category pickers)

```ts
listCard: { marginHorizontal: 16, borderRadius: 20, backgroundColor: COLORS.card, paddingHorizontal: 6, paddingVertical: 4 }
listRow:  { paddingVertical: 14, paddingHorizontal: 8 }
```

- `WalletPickerField` — modal sheet, shows balance + sign badge (+/−)
- `CategoryPickerField` — grid modal, 2-level drill (parent → child), "Use parent" option at top
