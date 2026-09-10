# Tech Stack

| Layer | Tech |
|---|---|
| Framework | Expo ~57.0.21 |
| Routing | `expo-router` (file-based) |
| Animations | `react-native-reanimated` |
| Icons | `@expo/vector-icons` (`MaterialIcons`) |
| UI primitives | `@expo/ui ~57.0.17` |
| Storage | `@react-native-async-storage/async-storage` |
| State | React `useState` / `useRef` / `useCallback` / `useEffect` |

---

**Theme:** Monochrome — all-black accents on white background

```ts
// src/utils/constants.ts
COLORS = {
  primary:    "#000000",
  secondary:  "#000000",
  background: "#FFFFFF",
  card:       "#FAFAFA",
  text:       "#000000",
  textLight:  "#555555",
  textMuted:  "#9E9E9E",
  border:     "#E0E0E0",
  success:    "#6B7280",
  danger:     "#111111",
  warning:    "#9E9E9E",
  white:      "#FFFFFF",
}
```
