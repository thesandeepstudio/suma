# Tab Bar Redesign

**File:** `src/app/(tabs)/_layout.tsx`

A flat, edge-to-edge white tab bar with rounded top corners and a raised black center button.

## Container Styles

| Property | Value |
|---|---|
| Background | `#FFFFFF` |
| Top corners | `borderTopLeftRadius: 20`, `borderTopRightRadius: 20` |
| Padding | `paddingTop: 10`, `paddingBottom: 10`, `paddingHorizontal: 5` |
| Height | `64` |
| Position | `absolute` |
| Elevation | `12` |

## Tab Icons

| Tab | Icon name | Notes |
|---|---|---|
| Dashboard | `dashboard` | Animated on focus |
| Report | `timeline` | Animated on focus |
| **Add** | `add` | Black circle, white icon, `top: -14` float |
| Wallet | `wallet` | Animated on focus |
| Settings | `settings` | Animated on focus |

## Animated Tab Icon (`AnimatedTabIcon`)

- Scales between `0.9` and `1.0` on focus
- Translates Y between `2px` and `0px`
- Spring config: `{ damping: 20, stiffness: 250, mass: 0.5 }`

## Center "Add" Button

- Circle: `width: 52`, `height: 52`, `borderRadius: 26`, `backgroundColor: '#111111'`
- Pushes to `/expense` route on press
- Shadow: `shadowOpacity: 0.25`, `elevation: 10`
