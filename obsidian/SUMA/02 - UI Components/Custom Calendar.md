# Custom Calendar

**File:** `src/components/CustomCalendar.tsx`

A self-contained, themed month-calendar that replaces the native date picker entirely.

## Features

| Feature | Detail |
|---|---|
| Weekday headers | `S M T W T F S` |
| Month navigation | `chevron-left` / `chevron-right` |
| Tap month title | Snaps back to current month |
| Max date constraint | `maximumDate` prop — days after it are disabled + greyed |
| Selected day | Black filled circle, white text |
| Today (not selected) | `borderWidth: 1.5`, `borderColor: COLORS.primary` |
| OK button | `borderRadius: 10`, black bg, white text |
| Remount trick | Parent passes `key={pickerKey}` so calendar resets on every open |

## Styles

```ts
container:      { borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card }
dayBtn:         { width: 30, height: 30, borderRadius: 10 }
dayBtnSelected: { backgroundColor: COLORS.primary }
dayText:        { fontSize: 13 }
closeBtn:       { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 10, backgroundColor: COLORS.primary }
```
