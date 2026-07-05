

export default function Terms() {
  return (
    <div className="container mx-auto px-6 py-24 relative z-10 max-w-4xl min-h-screen">
      <div className="glass-panel p-10 md:p-16">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="text-slate-400 mb-6 text-sm">Last Updated: July 5, 2026</p>
        
        <div className="space-y-6 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">1. Introduction</h2>
            <p>Welcome to VaultKey. By downloading, accessing, or using the VaultKey application ("App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the App.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">2. 100% Offline Nature & Zero-Trust</h2>
            <p>VaultKey is designed as a completely offline, zero-trust password manager. We do not operate any backend servers, we do not sync your data to any cloud, and we do not have access to your passwords, notes, or master password. All data is encrypted locally on your device using AES-256-GCM.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">3. User Responsibility & Data Loss</h2>
            <p><strong>CRITICAL:</strong> Because VaultKey is 100% offline, <strong>YOU ARE SOLELY RESPONSIBLE FOR YOUR DATA.</strong></p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>If you forget your master password, your data cannot be recovered. There is no password reset mechanism.</li>
              <li>If you uninstall the app or lose your phone without creating and safely storing a backup (.pnb file), your data is permanently lost.</li>
              <li>We cannot restore your data under any circumstances.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">4. Security</h2>
            <p>While VaultKey uses industry-standard encryption (PBKDF2 and AES-256), the ultimate security of your vault depends on the strength of your master password and the physical security of your device. You agree that VaultKey (and its developer) cannot be held liable for unauthorized access to your device or data breaches resulting from weak master passwords or compromised devices.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">5. Open Source</h2>
            <p>VaultKey is open-source software provided "as is". You are free to inspect the code to verify its security claims.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">6. Limitation of Liability</h2>
            <p>In no event shall the developer of VaultKey be liable for any indirect, incidental, special, or consequential damages, or damages for loss of profits, revenue, data, or data use, incurred by you or any third party, whether in an action in contract or tort, arising from your access to, or use of, the App.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
