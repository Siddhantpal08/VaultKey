# VaultKey Brain 🧠

This file serves as the context repository for the AI assistant to understand the VaultKey project architecture without needing to analyze the entire codebase every time.

## 🛠 Tech Stack
- **Framework:** React Native + Expo (Managed Workflow, SDK ~54.0)
- **Language:** TypeScript
- **Navigation:** `@react-navigation/native` & `@react-navigation/stack`
- **Database:** `expo-sqlite` (Local SQLite Database)
- **Encryption:** `@noble/ciphers` (XChaCha20-Poly1305) and `@noble/hashes` (SHA-256)
- **Security:** `expo-secure-store`, `expo-local-authentication`, `expo-screen-capture`

## 📁 Project Structure
- `/src/components`: Reusable UI components (BottomTabBar, Toast, VKLogo, etc.)
- `/src/database`: SQLite database schema, migrations, and query functions (`db.ts`)
- `/src/navigation`: App navigation stack (`AppNavigator.tsx`)
- `/src/screens`: Main UI screens (Home, Notes, Settings, LockScreen, Generator, etc.)
- `/src/security`: Cryptography utilities (`crypto.ts`) and TOTP generation (`totp.ts`)
- `/src/theme`: Color palette (`colors.ts`) - Dark themed by default.

## 🔒 Security Architecture
- **Master Password:** The core key to decrypt data. Not stored directly; only a hash/metadata is stored in settings to verify.
- **Session Key:** Kept in memory (JS closure) while the app is unlocked. Lost when app is killed.
- **Lock Screen:** App auto-locks (or PIN/Biometric locks) when sent to the background or closed. Uses BlurView for app switcher protection.
- **Database Storage:** All sensitive fields (`encrypted_password`) are stored as encrypted Base64 strings. Other metadata (site name, username, notes) is stored in plaintext for searchability.

## 🎨 Theme & Styling
- **Backgrounds:** Very dark blue/black (`#060B17`, `#0B1020`)
- **Accent Color:** Blue (`#5B8DEF`)
- **Card Backgrounds:** `#111827`
- Uses custom styles (no external styling libraries like Tailwind).

## 🚀 Features
- **Vault:** Stores passwords (site, username, password, TOTP, notes).
- **Secure Notes:** Stores text-only secure notes (identified in DB via `is_note = 1`).
- **Generator:** Strong password generation.
- **Security Settings:** Auto-lock timeout, PIN, Biometrics, Clipboard auto-clear, Backup/Restore.
- **Auto Backup:** Silently exports an encrypted `.pnb` backup using the Storage Access Framework (SAF) upon every data modification.
- **Auto Updates (OTA):** Uses `expo-updates` to check and prompt for minor over-the-air updates.
- **Share Intent & .pnb Support:** Intercepts shared files/text from other apps and saves them into VaultKey.
- **Audit Dashboard:** Checks password strength, duplicates, and breaches.
- **Trash / Recycle Bin:** Soft-deleted items can be restored.

## 💾 Database Schema (`vaults` table)
- `id` (INTEGER PK)
- `site_name` (TEXT)
- `url` (TEXT)
- `username` (TEXT)
- `encrypted_password` (TEXT)
- `category` (TEXT)
- `notes` (TEXT)
- `tags` (TEXT)
- `strength_score` (INTEGER)
- `totp_secret` (TEXT)
- `favourite` (INTEGER 0|1)
- `is_note` (INTEGER 0|1)
- `deleted_at` (TEXT) - Used for soft delete (Trash feature)
- `created_at` (TEXT)
- `updated_at` (TEXT)

## 🏗 Build Environment (CRITICAL)
- **Java Version:** AGP requires Java 17+. System has Java 11 installed.
  - **Fix:** `gradle.properties` has `org.gradle.java.home=D:\\Android Studio\\jbr` (OpenJDK 21 from Android Studio).
  - This is the **key fix** — without it, the build fails with "AGP requires Java 17".
- **local.properties:** NOT in Git (gitignored). Must be recreated after `expo prebuild --clean`.
  - Content: `sdk.dir=C\:\\Users\\Siddhant Pal\\AppData\\Local\\Android\\Sdk`
- **Assets:** `icon.png`, `splash-icon.png`, `adaptive-icon.png` must be real PNGs (not JPEGs). Use `sharp` to convert if needed.
- **Gradle Cache Issues:** If corrupted metadata.bin errors occur, stop daemons (`gradlew --stop`) and delete `%USERPROFILE%\.gradle\caches\8.14.3`.
- **Prebuild Command:** `npx expo prebuild --platform android --clean` (wipes and regenerates `/android`)

## 🔧 Workflow Rules
- Always use `SafeAreaView` from `react-native-safe-area-context`.
- Handle state properly to prevent memory leaks with session keys.
- Don't expose passwords directly in UI without explicit user action (Show/Hide).
