

export default function Terms() {
  return (
    <div className="flex-1 flex flex-col pt-32 pb-24 noise-overlay">
      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <div className="glass-strong p-10 md:p-16 rounded-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 font-outfit">Terms of Service</h1>
          <p className="text-slate-400 mb-10">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="space-y-10 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 font-outfit">1. Acceptance of Terms</h2>
              <p>
                By downloading, installing, or using the VaultKey application ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the App.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 font-outfit">2. Description of Service</h2>
              <p>
                VaultKey is a free, open-source, offline-first password manager for Android. It provides local encryption and storage of credentials, secure notes, and TOTP authenticators. The App is provided "as-is" without any cloud synchronization or remote backup services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 font-outfit">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Master Password:</strong> You are solely responsible for remembering your Master Password. Because VaultKey is zero-knowledge and offline, there is no "Forgot Password" functionality. If you lose your Master Password, your data is permanently unrecoverable.</li>
                <li><strong>Data Backups:</strong> You are responsible for maintaining backups of your encrypted `.pnb` files. The developer is not liable for any data loss due to device failure, uninstallation, or lost backup files.</li>
                <li><strong>Device Security:</strong> You are responsible for maintaining the general security of your mobile device, including keeping your operating system updated and securing physical access.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 font-outfit">4. Limitation of Liability</h2>
              <p>
                In no event shall the developer (Siddhant Pal) be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of, or inability to use, VaultKey. This includes, but is not loss of data, loss of access to accounts, or any damages resulting from device loss or compromised Master Passwords.
              </p>
              <p className="mt-4">
                The software is provided "AS IS", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 font-outfit">5. Modifications</h2>
              <p>
                We reserve the right to modify these Terms at any time. Continued use of the App following any changes constitutes your acceptance of the new Terms.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
