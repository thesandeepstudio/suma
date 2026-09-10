# Git History

**Remote:** `https://github.com/thesandeepstudio/suma.git`

```
d39a5a1 feat: redesign tab bar, add user profile and data management  ← HEAD (pushed)
9b9d95b Add dashboard daily summary, main/subcategories, and JSON backup
d2885ed Initial commit
```

---

## Current State

| Component | Status |
|---|---|
| Tab bar | ✅ Done |
| Dashboard greeting | ✅ Done |
| BalanceCard | ✅ Done |
| Settings / Profile | ✅ Done |
| Wallet tab | ✅ Done — Khalti icon fixed |
| Custom calendar | ✅ Done |
| Custom keypad | ✅ Done |
| Date picker row | ✅ Removed |
| Save Record button | ✅ Removed |
| Lint / typecheck | ⚠️ `alignItems: 'center'` just added — needs verify |

---

## Next Steps

1. Run `npx tsc --noEmit` + `npm run lint` — verify `alignItems: 'center'` addition compiles cleanly
2. Visually verify centered keyboard rows in the app
3. Commit + push remaining work
