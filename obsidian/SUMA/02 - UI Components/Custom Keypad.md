# Custom Keypad

**File:** `src/components/ExpenseForm.tsx` (inline)

Pinned at the bottom of the screen, **always visible by default** (`showKeypad` initialized to `true`).

---

## Layout

```
Row 1:  [ 1 ] [ 2 ] [ 3 ] [  ⌫ (span 2)  ]
Row 2:  [ 4 ] [ 5 ] [ 6 ] [ + ] [ × ]
Row 3:  [ 7 ] [ 8 ] [ 9 ] [ − ] [ ÷ ]
Row 4:  [ . ] [ 0 ] [ Today ] [ ✓ (span 2) ]
```

---

## Styles

| Element | Properties |
|---|---|
| `keypad` | `paddingTop: 10`, `paddingHorizontal: 16`, `paddingBottom: 24`, `alignItems: 'center'`, `borderTopWidth: 1`, `borderTopColor: COLORS.border` |
| `keypadRow` | `flexDirection: 'row'`, `gap: 8`, `marginTop: 8` |
| `keypadKey` | `width: 60`, `height: 44`, `borderRadius: 14`, bg `COLORS.card`, border `COLORS.border` |
| `keypadKeySpan` | `width: 128`, `height: 44`, `borderRadius: 14` (same as above) |
| `keypadKeyText` | `fontSize: 14`, `fontWeight: '600'` |
| `keypadKeyOpText` | `color: COLORS.primary` (bold black for `+ − × ÷`) |
| `keypadTodayText` | `fontSize: 14`, `fontWeight: '700'`, `color: COLORS.primary` |
| `keypadTick` | bg + border `COLORS.primary` (solid black) |

**Total row width:** 3 × 60 + 3 × 8 = 204 (rows 1–3), 3 × 60 + 2 × 8 + 128 = 332 (rows with spans) — centered via `alignItems: 'center'`.

---

## Key Behaviors

| Key | Action |
|---|---|
| `0–9`, `.` | Appends to amount string via `handleKeypadKey()` |
| `+`, `−`, `×`, `÷` | Appends operator; consecutive ops replaced |
| `⌫` (tap) | Removes last character |
| `⌫` (long press) | Clears entire amount |
| **Today** | Sets date to now + opens calendar modal (`setPickerKey` to remount) |
| **✓** | Calls `resolveAmount()` to evaluate expression, then `handleSave()` |

---

## Expression Evaluator

Recursive-descent parser supporting `+`, `-`, `*`, `/` with standard operator precedence.

```ts
resolveAmount("100+50×2")  → "200"     // multiplication first
resolveAmount("10÷0")      → "10÷0"    // /0 guard, raw string returned
resolveAmount("50×3-10÷2") → "145"
```

Internally normalizes `×` → `*`, `÷` → `/` before parsing.
