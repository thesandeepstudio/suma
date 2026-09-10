# Settings Screen

**File:** `src/app/(tabs)/me.tsx`

## Features

| Feature | Detail |
|---|---|
| Editable username | Inline `TextInput` with edit icon, saves on blur |
| Account info | Displays transaction count |
| Wallet shortcut | Navigates to wallet tab |
| Clear all data | Calls `clearAllData()`, wipes all AsyncStorage keys |
| About section | App version, credits |
| Backup / Restore | JSON export via `expo-file-system` + `expo-sharing`, import via `expo-document-picker` |
