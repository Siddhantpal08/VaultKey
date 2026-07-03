# VaultKey — Self-Service Guide
> Everything on this list you do yourself, without needing AI sessions.
> Each section has exact steps, links, and files to touch.

---

## 1. Landing Page on Crevio Website

**You'll add VaultKey as a project/product page on your existing Crevio site.**

### Steps
1. Create a new route/page on the Crevio site, e.g. `/vaultkey` or `/projects/vaultkey`
2. Include these elements:
   - Hero: App name, tagline ("Your vault. On your device. Nowhere else."), screenshot
   - Feature cards: Vault, Notes, Generator, Authenticator, Encrypted Backup
   - Download button: Links to GitHub Releases APK (see Section 2)
   - "100% Free & Open Source" badge
   - Crevio Studio credit in footer
3. Use the dark navy (`#060B17`) brand color to match the app's aesthetic
4. Optional: Add a QR code linking to the APK download for easy phone scanning

### Screenshot tip
- Run the app on an emulator or phone
- Take a screenshot via Android Studio (camera icon in the device panel) or `adb exec-out screencap -p > screen.png`
- Use https://mockuphone.com to wrap it in a clean phone frame

---

## 2. GitHub Repo Setup + APK Hosting

### Create a GitHub Repo
1. Go to https://github.com/new
2. Name: `VaultKey` | Visibility: **Public** (required for F-Droid later)
3. Push existing code:
   ```bash
   git remote add origin https://github.com/Siddhantpal08/VaultKey.git
   git branch -M main
   git push -u origin main
   ```
4. Add a `README.md` with:
   - App description
   - Feature list
   - Screenshots
   - Download link
   - Build instructions
   - License (recommend MIT or GPL-3.0)

### Host APK on GitHub Releases
1. Go to your repo → **Releases** → **Draft a new release**
2. Tag version: `v1.0.3` (match your `app.json` version)
3. Title: `VaultKey v1.0.3`
4. Drag and drop your signed `.apk` file from `android/app/build/outputs/apk/release/`
5. Write release notes (what's new)
6. Publish release
7. Copy the direct APK download link — format:
   `https://github.com/Siddhantpal08/VaultKey/releases/download/v1.0.3/VaultKey.apk`
   Use this as your "Download" button URL everywhere.

---

## 3. Google Play Store Submission

**Cost: $25 one-time developer fee**

### Steps
1. Sign up at https://play.google.com/console → pay $25
2. Create a new app → select **Android** → enter app name "VaultKey"
3. Fill in **App content** section:
   - Category: Productivity > Tools
   - Content rating questionnaire (select "No user-generated content", "No ads", etc.)
   - Privacy policy URL (required) — write a simple one at https://app.termly.io/dashboard/website/privacy-policy (free) or on your Crevio site
   - Target audience: Everyone (13+)
4. Fill in **Store listing**:
   - Short description (80 chars): "Offline encrypted password manager & authenticator"
   - Full description: 4000 chars max — describe all features, emphasize "100% on-device, no cloud sync"
   - Screenshots: Minimum 2, recommended 8 (phone + feature screenshots)
   - Feature graphic: 1024×500 px banner
   - App icon: 512×512 px (already have it)
5. Upload your **signed AAB** (Android App Bundle):
   ```bash
   cd android && ./gradlew bundleRelease
   ```
   File is at: `android/app/build/outputs/bundle/release/app-release.aab`
6. Submit for review — typically 1–3 business days for first submission

### Privacy Policy (minimum required content)
```
VaultKey does not collect, transmit, or store any personal data on external servers.
All passwords and notes are encrypted on your device using XChaCha20-Poly1305 encryption.
No analytics, no ads, no third-party data sharing.
```

---

## 4. F-Droid Submission (Open Source App Store)

**Requires: public GitHub repo with open-source license**

### Steps
1. Fork the F-Droid data repo: https://gitlab.com/fdroid/fdroiddata
2. Create a new metadata file: `metadata/com.siddhantpal.VaultKey.yml`
3. Minimum content:
   ```yaml
   Categories:
     - Security
   License: MIT
   AuthorName: Siddhant Pal
   AuthorWebSite: https://crevio.studio
   Name: VaultKey
   Summary: Offline encrypted password manager & authenticator
   Description: |
     VaultKey is a fully offline, encrypted password manager built with React Native.
     All data stays on your device, encrypted with XChaCha20-Poly1305.
     Features: Password vault, Secure Notes, Password Generator, TOTP Authenticator, Encrypted Backups.
   RepoType: git
   Repo: https://github.com/Siddhantpal08/VaultKey
   Builds:
     - versionName: 1.0.3
       versionCode: 4
       commit: v1.0.3
       gradle:
         - release
   AutoUpdateMode: Version
   UpdateCheckMode: Tags
   CurrentVersion: 1.0.3
   CurrentVersionCode: 4
   ```
4. Submit a Merge Request to fdroiddata with your file
5. F-Droid maintainers will review and build it — can take 2–4 weeks

> **Note:** F-Droid builds the APK from source, so reproducible builds must work cleanly from `./gradlew assembleRelease`.

---

## 5. Reddit Launch Posts

Post in these subreddits on the same day (Monday works best for visibility):

### r/androidapps
```
Title: I built VaultKey - a fully offline encrypted password manager + TOTP authenticator for Android [Free, No Cloud, No Accounts]

Body:
Hey r/androidapps! I've been building VaultKey for the past few months and finally feel it's ready to share.

**What it does:**
- 🔐 Encrypted password vault (XChaCha20-Poly1305)
- 📝 Secure encrypted notes
- 🔑 Strong password generator
- 📱 Built-in TOTP authenticator (scan QR codes like Google Authenticator)
- 💾 Encrypted .pnb backup files you can store anywhere
- 🚫 Zero telemetry, zero cloud sync, zero accounts

Everything stays on your device. No servers. No subscriptions. No ads.

Download: [GitHub Releases link]
Source: [GitHub repo link]

Would love any feedback!
```

### r/privacy (similar post, emphasize the privacy angle)
### r/fossdroid (emphasize open-source, F-Droid availability)
### r/selfhosted (emphasize offline/local-first nature)

---

## 6. Product Hunt Launch

1. Create account at https://producthunt.com
2. Go to **Ship** → **Upcoming** (collect upvotes before launch)
3. Schedule launch for a **Tuesday–Thursday** (best engagement)
4. When ready, go to **Submit a Product**:
   - Name: VaultKey
   - Tagline: "Offline encrypted password manager & TOTP authenticator for Android"
   - Link: Your GitHub or landing page
   - Screenshots: At least 3
   - Topics: Android, Security, Privacy, Open Source
5. **Day of launch**: Post in maker comment at 12:01 AM PST
6. Ask friends to upvote (don't post fake accounts — PH detects it)

---

## 7. "Share VaultKey" Button (In-App)

Add this to the Profile/Settings screen to let users spread the word.

### Code to add in `ProfileScreen.tsx` (or `SettingsScreen.tsx`):
```tsx
import { Share } from 'react-native';

const shareApp = async (): Promise<void> => {
  await Share.share({
    title: 'VaultKey — Encrypted Password Manager',
    message:
      'Check out VaultKey — a free, offline password manager for Android with TOTP support.\n\n' +
      'Download: https://github.com/Siddhantpal08/VaultKey/releases/latest',
  });
};

// In JSX:
<Pressable style={styles.secondaryButton} onPress={() => void shareApp()}>
  <Text style={styles.secondaryButtonText}>📢 Share VaultKey with a Friend</Text>
</Pressable>
```

---

## 8. Android AutofillService (V2.0 — Long-Term)

**This lets VaultKey fill passwords INTO other apps, like 1Password does.**

### What's needed
- Write an Android `AutofillService` in Kotlin (a separate `.kt` file in the Android native layer)
- Register it in `AndroidManifest.xml` as `<service android:name=".VaultKeyAutofillService" android:permission="android.permission.BIND_AUTOFILL_SERVICE">`
- Implement `onFillRequest()` — reads the focused field, looks up matching credentials, returns a `FillResponse`
- Implement `onSaveRequest()` — captures typed credentials and offers to save

### Timeline estimate
- 3–6 weeks of dedicated Android-native work
- Requires Kotlin knowledge and Android Accessibility/Autofill API familiarity
- Reference: https://developer.android.com/guide/topics/text/autofill-services

### How to bridge to React Native
- Use an Expo Module (write in Kotlin, expose JS interface)
- The Kotlin service runs independently as a background service
- JS side calls a module method to "push" new credentials to a local cache the Kotlin service reads

---

## 9. iOS Build (Future)

If you ever want an iOS build:
- You need a **Mac** (mandatory — Xcode requires macOS)
- Or use **EAS Build** (cloud build service, free tier available)
- Cost: **$99/year** Apple Developer account for App Store distribution
- TestFlight allows beta distribution to up to 10,000 testers without App Store review

Steps:
```bash
# Install iOS dependencies (on Mac only)
cd ios && pod install

# Or use EAS cloud build (from any OS):
npx eas build --platform ios --profile preview
```

---

## 10. Version Bumping Checklist

Every time you release a new version, update these:

| File | Field | Example |
|------|-------|---------|
| `app.json` | `version` | `"1.0.4"` |
| `app.json` | `android.versionCode` | `5` (increment by 1) |
| `package.json` | `version` | `"1.0.4"` |

Then:
1. `npx expo prebuild --platform android --clean` (only if native changes)
2. `cd android && ./gradlew assembleRelease`
3. Create new GitHub Release with tag `v1.0.4`
4. Upload new APK to release
