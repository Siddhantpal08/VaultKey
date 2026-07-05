

export default function Privacy() {
  return (
    <div className="container mx-auto px-6 py-24 relative z-10 max-w-4xl min-h-screen">
      <div className="glass-panel p-10 md:p-16">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-slate-400 mb-6 text-sm">Last Updated: July 5, 2026</p>
        
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">The Short Version</h2>
            <p className="text-xl font-medium text-primary">VaultKey does not collect, store, or transmit any of your personal data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. Data Collection & Storage</h2>
            <p>VaultKey is a 100% offline application. We do not have servers, databases, or analytics engines connected to the app. All of your data (passwords, secure notes, TOTP secrets, settings, and master password) is stored locally on your device.</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>We do not collect usage statistics.</li>
              <li>We do not use tracking cookies or SDKs.</li>
              <li>We do not transmit crash reports.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. Encryption</h2>
            <p>Your data is encrypted using AES-256-GCM before it is written to your device's storage. The encryption key is derived from your Master Password using PBKDF2. Because your Master Password never leaves your device and is not stored anywhere, we have absolutely no way to access or decrypt your data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. Backups</h2>
            <p>If you choose to use the Auto-Backup feature, the app creates a fully encrypted `.pnb` file and saves it to a local folder on your device that you select. This file remains on your device (or wherever you choose to sync it personally, like your own Google Drive). We do not have access to these backups.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">4. Camera Permissions</h2>
            <p>The app requests Camera permissions strictly for scanning QR codes to set up 2FA (TOTP). The QR code processing happens entirely offline on your device, and no image data is saved or transmitted.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">5. Updates</h2>
            <p>The app may periodically check our static website (this site) to see if a new APK version is available. This is a simple HTTP GET request that does not include any of your personal data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">6. Changes to This Policy</h2>
            <p>Because VaultKey is fundamentally offline and serverless, this Privacy Policy is unlikely to change significantly. However, if we do make updates, they will be posted here.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
