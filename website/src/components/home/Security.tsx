import { ShieldCheck, Fingerprint, Code, ServerOff } from 'lucide-react';

export default function Security() {
  return (
    <section id="security" className="container mx-auto px-6 py-32 relative z-10 border-t border-white/[0.04]">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 w-full relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="glass-strong p-8 md:p-12 rounded-3xl relative z-10 overflow-hidden group border-primary/20 shadow-[0_0_50px_rgba(91,141,239,0.1)]">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
            
            <div className="relative z-10">
              <ShieldCheck className="w-16 h-16 text-primary mb-6 animate-pulse-glow" />
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 font-outfit">
                Zero-Knowledge Architecture
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Your data is encrypted using military-grade <strong className="text-white">AES-256-GCM</strong>. 
                The key is dynamically derived from your Master Password using <strong className="text-white">PBKDF2</strong>. 
                Because VaultKey is entirely offline, your key never leaves the device.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-slate-300 bg-white/[0.03] p-4 rounded-xl border border-white/[0.05]">
                  <ServerOff className="w-6 h-6 text-rose-400 shrink-0" />
                  <span>No servers, no cloud sync, no tracking.</span>
                </li>
                <li className="flex items-center gap-4 text-slate-300 bg-white/[0.03] p-4 rounded-xl border border-white/[0.05]">
                  <Code className="w-6 h-6 text-emerald-400 shrink-0" />
                  <span>Open source and fully auditable code.</span>
                </li>
                <li className="flex items-center gap-4 text-slate-300 bg-white/[0.03] p-4 rounded-xl border border-white/[0.05]">
                  <Fingerprint className="w-6 h-6 text-purple-400 shrink-0" />
                  <span>Biometric fallback without storing passwords.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full lg:pl-10 text-center lg:text-left">
          <span className="section-label">Architecture</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Built for Paranoia.</h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Most password managers are honey-pots. By storing thousands of users' data on central servers, they become massive targets for hackers. 
          </p>
          <p className="text-slate-400 text-lg leading-relaxed">
            VaultKey turns that model upside down. By operating 100% locally on your smartphone, the only way someone can access your data is if they have physical access to your device, bypass your OS security, and guess your Master Password.
          </p>
        </div>
      </div>
    </section>
  );
}
