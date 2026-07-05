import React from 'react';
import { Shield, SmartphoneNfc, Key, FileText, CloudUpload, Lock } from 'lucide-react';

export default function Features() {
  return (
    <section id="features" className="container mx-auto px-6 py-32 relative z-10">
      <div className="text-center mb-20">
        <span className="section-label">Our Benefits</span>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Building trust in digital safety</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Built from the ground up to ensure your data never leaves your control. No ads, no telemetry, no compromises.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard 
          icon={<Shield className="text-primary w-8 h-8" />}
          title="Military-Grade Encryption"
          description="Your master password is used to derive a secure AES-256 key via PBKDF2. Brute-forcing your vault is computationally infeasible."
          glowClass="icon-glow-blue"
        />
        <FeatureCard 
          icon={<SmartphoneNfc className="text-accent w-8 h-8" />}
          title="100% Offline Architecture"
          description="VaultKey has absolutely zero network dependencies. No APIs, no cloud sync. Your data physically never leaves your phone."
          glowClass="icon-glow-amber"
        />
        <FeatureCard 
          icon={<Key className="text-emerald-400 w-8 h-8" />}
          title="Built-in Authenticator"
          description="Store your 2FA TOTP secrets securely alongside your passwords. Generate codes instantly without relying on an external app."
          glowClass="icon-glow-green"
        />
        <FeatureCard 
          icon={<FileText className="text-purple-400 w-8 h-8" />}
          title="Encrypted Secure Notes"
          description="Write down private thoughts, recovery codes, or sensitive documents. Everything is encrypted just like your passwords."
          glowClass="icon-glow-purple"
        />
        <FeatureCard 
          icon={<CloudUpload className="text-blue-400 w-8 h-8" />}
          title="Automated SAF Backups"
          description="VaultKey automatically generates a highly-encrypted local .pnb backup file to protect your data from device loss."
          glowClass="icon-glow-blue"
        />
        <FeatureCard 
          icon={<Lock className="text-rose-400 w-8 h-8" />}
          title="Biometric Security"
          description="Lock your vault instantly when you leave the app, and unlock seamlessly using your native device Fingerprint or Face ID."
          glowClass="shadow-[0_0_20px_rgba(251,113,133,0.2)]"
        />
      </div>

      {/* Decorative center glowing orb for features section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
    </section>
  );
}

function FeatureCard({ icon, title, description, glowClass }: { icon: React.ReactNode, title: string, description: string, glowClass: string }) {
  return (
    <div className="glass-card p-8 text-left group">
      <div className={`w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-8 border border-slate-700/50 transition-transform group-hover:scale-110 group-hover:-rotate-3 ${glowClass}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 font-outfit tracking-wide">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
