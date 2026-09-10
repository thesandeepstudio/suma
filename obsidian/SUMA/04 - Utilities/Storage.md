# Storage Helpers

**File:** `src/utils/storage.ts`

## Added in This Session

```ts
getUsername()          → Promise<string>       // default "user"
setUsername(name)      → Promise<void>
getCurrency()          → Promise<string>       // default "NPR"
setCurrency(currency)  → Promise<void>
getTransactionCount()  → Promise<number>
clearAllData()         → Promise<void>         // multiRemove all keys
```

## Storage Keys

```ts
// src/utils/constants.ts → STORAGE_KEYS
@suma_expenses
@suma_categories
@suma_wallets
@suma_budget
@suma_seed_version
@suma_username
@suma_currency
```
