# VaultKey — Complete & Polish Plan

VaultKey is a **local-first, offline password manager** built with Expo + React Native + SQLite. All data stays on-device. Encryption uses AES-256-GCM via `react-native-quick-crypto` with a PBKDF2-derived session key.

## Current State Assessment

The app is ~70% complete with solid foundations:
- ✅ SQLite DB schema, CRUD operations, WAL mode
- ✅ AES-256-GCM encryption / PBKDF2 key derivation
- ✅ Lock screen (PIN + biometric)
- ✅ Master password setup + verification + migration
- ✅ Home screen with search, category filter, sort
- ✅ Add password form with strength meter
- ✅ Password detail view/edit/delete
- ✅ Password generator with options
- ✅ Settings (biometrics, auto-lock, brute-force, clipboard, backup/import)
- ✅ Auto-lock on background timeout
- ✅ Clipboard auto-clear

## What's Missing / Broken / Needs Polish

### 🔴 Critical Gaps
1. **No bottom tab navigation** — Home, Generator, Settings are only reachable awkwardly
2. **TOTP (2FA) code generator is non-functional** — field exists, but no live OTP display
3. **PIN is hardcoded as `"1234"`** — user can't set a custom PIN
4. **No favicon/splash/icon** — app.json assets are default Expo

### 🟡 UX Problems
5. **HomeScreen has no empty-state CTA** — new users see nothing meaningful
6. **No `LinearGradient` or visual polish** — the blobs on LockScreen are the only decoration; all other screens are plain dark backgrounds
7. **Password cards have no favicon/icon placeholder** — plain list is hard to scan
8. **Generator result is not monospaced** — hard to read
9. **No feedback on copy** — just Alert dialogs instead of a toast/snackbar
10. **No strength color coding** — strength bars use only one accent color
11. **SettingsScreen has no section icons** — visually flat

### 🟢 Enhancements
12. **Add a `FavouriteScreen` / starred entries** — star toggle on cards
13. **Add `favourite` column to DB** — DB migration
14. **Password health dashboard** on HomeScreen (weak/reused/old)
15. **Animated entry transitions** — `Animated.spring` on card mount

---

## Proposed Changes

### Component Architecture

```
src/
├── components/
│   ├── BottomTabBar.tsx          [NEW] custom tab bar
│   ├── PasswordCard.tsx          [NEW] extracted card with icon & strength ring
│   ├── Toast.tsx                 [NEW] lightweight in-app feedback
│   ├── StrengthMeter.tsx         [NEW] reusable colored bars
│   └── SiteIcon.tsx              [NEW] letter-avatar favicon fallback
├── screens/
│   ├── LockScreen.tsx            [MODIFY] visual polish, animated ring pulse
│   ├── MasterPasswordScreen.tsx  [MODIFY] polish, centered card layout
│   ├── HomeScreen.tsx            [MODIFY] bottom tab, health dashboard, fav filter
│   ├── AddPasswordScreen.tsx     [MODIFY] strength colors, StrengthMeter reuse
│   ├── PasswordDetailScreen.tsx  [MODIFY] live TOTP display, copy toast, edit UX
│   ├── GeneratorScreen.tsx       [MODIFY] monospace output, slider for length
│   ├── SettingsScreen.tsx        [MODIFY] icon rows, PIN setup section
│   └── FavouritesScreen.tsx      [NEW] filtered view of starred entries
├── database/
│   └── db.ts                     [MODIFY] add favourite column migration, helpers
├── security/
│   ├── crypto.ts                 [MODIFY] no changes needed
│   └── totp.ts                   [NEW] RFC 6238 TOTP engine (pure JS, no native dep)
├── navigation/
│   └── AppNavigator.tsx          [MODIFY] add Favourites route, tab bar
└── theme/
    └── colors.ts                 [NEW] centralized design tokens
```

---

### Phase 1 — Design System & Theme
#### [NEW] `src/theme/colors.ts`
Centralize all color tokens: background layers, accent blues, strength colors (red → orange → yellow → lime → green), surface alpha values.

---

### Phase 2 — Database Improvements
#### [MODIFY] `src/database/db.ts`
- Add `favourite INTEGER NOT NULL DEFAULT 0` column via `ALTER TABLE IF NOT EXISTS` (idempotent migration on `initializeDatabase`)
- Add `toggleFavourite(id, value)` and `getFavourites()` helpers
- Add `getPINHash()` / `setPINHash()` helpers using secure settings

---

### Phase 3 — Security: TOTP & Custom PIN
#### [NEW] `src/security/totp.ts`
- Pure TypeScript HOTP/TOTP implementation (RFC 6238) using `react-native-quick-crypto` HMAC-SHA1
- `generateTOTP(secret: string): { code: string; secondsLeft: number }` — 30-second window

#### [MODIFY] `src/screens/SettingsScreen.tsx`
- Add PIN Setup section: enter + confirm a 4-digit PIN, hash with SHA-256 and store in settings

#### [MODIFY] `src/screens/LockScreen.tsx`
- Remove hardcoded `DEMO_PIN = "1234"` — verify against stored PIN hash

---

### Phase 4 — Navigation Overhaul
#### [NEW] `src/components/BottomTabBar.tsx`
- Custom tab bar with 3 tabs: **Vault** (🔐), **Generator** (⚡), **Settings** (⚙)
- Animated indicator pill slides under active tab
- Floating **+** FAB button between Vault and Generator

#### [MODIFY] `src/navigation/AppNavigator.tsx`
- Add `Favourites` route
- Pass custom `tabBar` prop to inner stack

---

### Phase 5 — Component Library
#### [NEW] `src/components/SiteIcon.tsx`
Letter-avatar component: takes `siteName`, renders a colored circle with the first letter (color derived from site name hash).

#### [NEW] `src/components/StrengthMeter.tsx`
Reusable 5-segment bar with color gradient: red (1) → orange (2) → yellow (3) → lime (4) → green (5).

#### [NEW] `src/components/Toast.tsx`
Context-based toast provider for non-blocking feedback ("Copied!", "Saved!", "Deleted").

---

### Phase 6 — Screen-by-Screen Polish

#### [MODIFY] `src/screens/HomeScreen.tsx`
- Replace ⚙ icon button with bottom tab navigation (Settings accessible via tab)
- Health Dashboard card: animated progress ring showing % of strong passwords
- Favourite star toggle on each card
- Empty state with illustration and CTA button
- `PasswordCard` component with `SiteIcon`, strength ring, copy gesture

#### [MODIFY] `src/screens/PasswordDetailScreen.tsx`
- Live TOTP countdown timer with circular progress ring
- Copy actions trigger `Toast` instead of `Alert`
- Edit mode: inline category picker, strength meter with colors

#### [MODIFY] `src/screens/GeneratorScreen.tsx`
- Monospace font for generated password output
- Slider for password length (8–64)
- Visual entropy score / time-to-crack estimate
- History of last 5 generated passwords (in-memory)

#### [NEW] `src/screens/FavouritesScreen.tsx`
- Same card UI as HomeScreen, filtered to `favourite = 1`
- Empty state: "Star entries from your vault to quick-access them here"

---

## Verification Plan

### Manual Testing
1. Run `npx expo start --android` or `--ios`
2. First launch → MasterPassword setup flow
3. Set a custom PIN in Settings → Lock → verify PIN works
4. Add entry with TOTP secret → detail screen shows live TOTP
5. Toggle favourite → appears in Favourites tab
6. Export → import backup (merge & replace both modes)
7. Background the app > timeout → verify auto-lock

### Code Quality
- TypeScript strict mode — no `any` escapes
- No new `eslint-disable` comments

## Open Questions

> [!IMPORTANT]
> **Do you want the Favourites feature as a bottom tab, or as a filter on the Home screen?**
> I'm leaning toward a dedicated bottom tab (Vault | Favourites | Generator | Settings) — 4 tabs total.

> [!IMPORTANT]
> **TOTP — pure JS or native?** `react-native-quick-crypto` can do HMAC-SHA1 natively, which I'll use. Alternatively I could add `otplib` for a battle-tested implementation. Preference?

> [!NOTE]
> The existing export format stores `encrypted_password` as cipher text — imports only work correctly if the master password is the same across devices (same key). I'll add a warning label to the export UI.
