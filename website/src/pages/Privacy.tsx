

export default function Privacy() {
  return (
    <div className="flex-1 flex flex-col pt-32 pb-24 noise-overlay">
      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <div className="glass-strong p-10 md:p-16 rounded-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 font-outfit">Privacy Policy</h1>
          <p className="text-slate-400 mb-10">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="space-y-10 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 font-outfit">1. The "Zero Data" Philosophy</h2>
              <p>
                VaultKey is designed from the ground up as an offline-first, local-only application. 
                We believe that the only way to truly secure your data is to never have access to it. 
                Therefore, <strong>VaultKey collects absolutely no personal information, telemetry, analytics, or crash reports.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 font-outfit">2. Data Storage & Encryption</h2>
              <p>
                All data entered into VaultKey—including passwords, usernames, secure notes, and TOTP secrets—is encrypted locally on your device using military-grade AES-256 encryption. The encryption key is derived dynamically from your Master Password using PBKDF2.
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Your Master Password is never saved to the device storage in plaintext.</li>
                <li>Your Master Password never leaves your device.</li>
                <li>Without your Master Password, your encrypted vault database is mathematically unreadable.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 font-outfit">3. Network Access & Permissions</h2>
              <p>
                VaultKey does not contain any code to transmit data to the internet. The only network request made by the application is an optional check to a static JSON file on our GitHub repository to notify you if a newer version of the APK is available. This check transmits no identifying information.
              </p>
              <p className="mt-4">
                The app requests camera permissions strictly for scanning local TOTP (Time-based One-Time Password) QR codes. These images are processed locally and never transmitted.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 font-outfit">4. Backups (.pnb files)</h2>
              <p>
                If you choose to use the automated or manual backup features, VaultKey will generate a `.pnb` file on your device's local storage. This file contains your fully encrypted database. It is your responsibility to secure this file. We cannot recover your data if you lose your device and do not have a backup, nor can we decrypt your backup if you forget your Master Password.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 font-outfit">5. Contact</h2>
              <p>
                If you have any questions about this Privacy Policy or the security architecture of VaultKey, you can inspect the open-source codebase on GitHub or contact the developer at <a href="mailto:siddhant.pal.work@gmail.com" className="text-primary hover:underline">siddhant.pal.work@gmail.com</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
