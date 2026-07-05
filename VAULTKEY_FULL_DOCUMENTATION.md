# VaultKey: Complete Master Documentation

This document serves as the absolute, start-to-finish master record of the entire VaultKey project. It covers the architecture, security model, database schema, user interface features, and the companion marketing website, detailing exactly how VaultKey was built to be a premium, secure, offline-first password manager.

---

## 1. Project Overview & Philosophy

**VaultKey** was engineered to solve a fundamental problem in modern password management: the reliance on cloud infrastructure. Cloud-based password managers are frequent targets for data breaches. VaultKey’s philosophy is **Zero-Trust, 100% Offline**. 

*   **No Network Calls:** The mobile application contains absolutely no telemetry, cloud sync, or external API dependencies (except for an optional update check that simply reads a static JSON file). 
*   **Total Data Ownership:** User data physically never leaves the device unless explicitly exported by the user as an encrypted `.pnb` backup.
*   **Premium Aesthetics:** Despite being a highly-secure offline utility, it boasts a modern, fluid, glassmorphic UI that matches the quality of enterprise-grade applications.

---

## 2. Security Architecture

The core of VaultKey is its robust cryptographic implementation, ensuring that even if a device is rooted or physically compromised, the SQLite database remains completely unreadable.

### 2.1. Master Key Derivation
*   **PBKDF2 Hashing:** When the user creates a Master Password, a unique cryptographic salt (`master_password_meta`) is generated. The password and salt are run through `PBKDF2` (Password-Based Key Derivation Function 2) to generate a robust AES-256 encryption key.
*   **Session State:** The derived key is **never** stored on disk. It is stored in a volatile JavaScript session variable (`crypto.ts`) during runtime and is wiped the moment the app is locked or closed.

### 2.2. Data Encryption
*   **AES-256-GCM:** Every sensitive field—including `username`, `encrypted_password`, `totp_secret`, `notes`, and `url`—is encrypted in memory using the Session Key *before* being written to the SQLite database.
*   **Zero-Knowledge DB:** Looking directly at the SQLite database yields only base64-encoded encrypted strings. Even the database schema is abstracted so that an attacker cannot deduce what sites the user has stored.

### 2.3. Biometrics & PIN Fallback
*   **Quick Unlock:** To prevent users from having to type a complex Master Password every time, the app supports a 4-digit PIN hash (stored locally) and Biometric Authentication (FaceID/Fingerprint). These mechanisms allow the app to securely retrieve the active session state without re-asking for the master password, provided the device has not been rebooted or the session hard-cleared.

---

## 3. Database Architecture (`expo-sqlite`)

The application utilizes a local SQLite database with an abstracted, dynamic schema.

### 3.1. Core Tables
1.  **`settings` Table:**
    *   Stores `master_password` (hashed for verification).
    *   Stores `master_password_meta` (the PBKDF2 salt).
    *   Stores `pin_hash`, `use_biometrics`, `auto_backup`, and `backup_uri`.
2.  **`vaults` Table:**
    *   The primary storage table. It contains rows for Passwords, Secure Notes, and Authenticator entries.
    *   **Fields:** `id`, `site_name` (plaintext, for searching/indexing), `username`, `encrypted_password`, `totp_secret`, `url`, `notes`, `is_note`, `is_favorite`, `created_at`, `updated_at`, `deleted_at`.
    *   *Note on Soft Deletes:* When a user deletes an entry, `deleted_at` is populated. This allows for potential trash-recovery and ensures clean merge-handling during backup imports.

---

## 4. Core Application Features

### 4.1. The Password Vault (Home)
*   Displays all encrypted credentials.
*   Features an intelligent **Password Strength Ring** (Red, Yellow, Green, Blue) based on length and complexity.
*   Integrates a custom `SiteIcon` component that intelligently fetches favicons for known domains or falls back to a sleek generated initial.
*   Allows sorting, filtering, and marking specific items as favorites.

### 4.2. Secure Notes
*   A dedicated section for storing freeform encrypted text (recovery phrases, banking details, private thoughts).
*   Uses a markdown-friendly display structure and the same AES-256 encryption pipeline as passwords.

### 4.3. TOTP Authenticator
*   A fully native built-in 2FA Authenticator.
*   Users can scan a QR code (using `expo-camera`) or manually enter a Base32 secret key.
*   The app calculates Time-based One-Time Passwords completely offline, rendering a 30-second countdown timer and a progress bar that flashes red when expiration is imminent.

### 4.4. Password Generator
*   A highly customizable offline engine.
*   Users can toggle Uppercase, Lowercase, Numbers, and Symbols, and adjust length via a slider.
*   Generates a cryptographically secure random string using `expo-crypto`'s random bytes, ensuring it is safe for high-security environments.

---

## 5. The Backup & Restoration Engine (.pnb)

Because VaultKey has no cloud sync, the backup engine is its lifeline against device loss.

### 5.1. V2 JSON Architecture
*   Backups are serialized into a proprietary `.pnb` (Portable Network Backup) JSON format.
*   **Crucial Innovation:** The backup explicitly includes the `master_meta` salt.
*   **Why?** If a user switches to a new phone and installs VaultKey, their new phone generates a *new* salt. Without the original salt, their old Master Password would derive a completely different AES-256 key, permanently locking them out of their backup. By embedding the original salt into the `.pnb`, the app can successfully decrypt the backup as long as the user remembers their original Master Password.

### 5.2. Auto-Backup Flow
*   Utilizes Android's Storage Access Framework (SAF).
*   The user is prompted to grant permission to a specific local folder.
*   Every time the user modifies the database (adds, edits, or deletes a vault), the app automatically generates a new `.pnb` file in the background.
*   **Retention Polish:** To prevent storage bloat, the app actively scans the folder and deletes previous `VaultKey_AutoBackup` files, ensuring only the single latest state is retained.

### 5.3. Smart Import/Merge
*   When importing a `.pnb`, the app analyzes the entries.
*   **Merge Logic:** It automatically skips entries that are identical to those currently in the database, preventing duplicate clutter. It accurately identifies entries with blank usernames (such as standard Notes) and successfully processes them without false-positive errors.
*   **Re-Encryption:** If the user imports a backup from an old master password into an app with a new master password, the engine decrypts the payload with the old key and instantly re-encrypts it with the active session key.

---

## 6. UI/UX & Theming Engine

VaultKey was designed to feel like a flagship application.

### 6.1. Dynamic Theming
*   A custom `ThemeContext` provides live Light and Dark mode switching.
*   Uses a `useStyles()` hook architecture, allowing every single stylesheet to dynamically adapt to `ThemeColors` without requiring app restarts.
*   Dark Mode employs deep `bg-background` (#060B17) with glowing borders (`bg-surface`), while Light mode uses clean whites and soft grays.

### 6.2. Navigation & Layout
*   Powered by React Navigation v7.
*   Features a custom Native Bottom Tab Bar (`BottomTabBar.tsx`) with modern, pill-shaped active-glow states.
*   Floating Action Buttons (FABs) are meticulously placed across screens to respect system safe-areas and tab bars.
*   Modals (such as PIN setup, entry deletion, and manual TOTP entry) are rendered as custom, glassmorphic React Native overlays rather than default OS alerts, ensuring brand consistency.

---

## 7. The Marketing Website (`website/`)

To distribute the app and build trust, a companion landing page was built using React, Vite, and Tailwind CSS.

### 7.1. Visual Design
*   **Dark Cyber Aesthetic:** Deep space backgrounds accented with massive, multi-layered diffuse gradients (`indigo` and `accent/blue`).
*   **CSS Animations:** Features organic background breathing (`animate-pulse-glow`), floating elements (`animate-float`), and slide-in notifications.
*   **3D Hero Element:** At the top of the site sits a pure CSS 3D rotating card (using `perspective` and `preserve-3d`) that infinitely spins, showcasing a glowing security Shield on one side and an encryption Key on the other.
*   **Refined Logo:** The core logo is dynamically shaped with CSS (`rounded-[22%] overflow-hidden`) to remove harsh white artifacts, maintaining a perfect premium curve.

### 7.2. Smart Desktop-to-Mobile Flow
*   The website intelligently detects the user's platform.
*   **Mobile Users:** Clicking "Download APK" instantly triggers the download, accompanied by a sleek, glassmorphic toast notification sliding in to confirm the action.
*   **Desktop Users:** Clicking "Download APK" triggers a high-fidelity modal overlay displaying a QR Code. This prompts the user to scan the screen with their phone to install the APK directly where it belongs, while still providing a fallback text-link to download the `.apk` file to their PC.

---

## 8. Final Summary

VaultKey represents a masterclass in local-first mobile development. From managing complex PBKDF2 cryptography in a React Native environment to building a seamless, theme-aware UI and a highly optimized Web/Vite marketing presence, the project successfully balances **uncompromising security** with an **exceptional user experience.**
