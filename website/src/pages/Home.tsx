import React from 'react';
import { Shield, Key, Download, Coffee, GitBranch, Mail, Smartphone, Code, Lock, SmartphoneNfc } from 'lucide-react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <Link to="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
            <Shield className="text-primary w-6 h-6" />
          </div>
          VaultKey
        </Link>
        <div className="flex gap-4">
          <a href="#features" className="text-slate-300 hover:text-white font-medium transition-colors hidden sm:block">Features</a>
          <a href="#contact" className="text-slate-300 hover:text-white font-medium transition-colors hidden sm:block">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center relative z-10 mt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm font-medium text-primary mb-8 animate-fade-in-up">
          <Lock className="w-4 h-4" /> 100% Offline & Zero-Trust
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-6 max-w-4xl tracking-tight leading-tight">
          Your Digital Life, <br className="hidden md:block" /> Secured Offline.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          VaultKey is the ultimate zero-trust password manager. No servers, no cloud sync, no tracking. Everything is encrypted locally on your device with military-grade AES-256.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <a href="/VaultKey.apk" download className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(91,141,239,0.3)] hover:shadow-[0_0_30px_rgba(91,141,239,0.5)] hover:-translate-y-1">
            <Download className="w-5 h-5" />
            Download APK
          </a>
          <a href="https://github.com/Siddhantpal08" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-surface hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all border border-slate-700/50 hover:border-slate-600">
            <GitBranch className="w-5 h-5" />
            View Source
          </a>

        </div>
        
        <p className="mt-6 text-sm text-slate-500">Requires Android 8.0 or higher.</p>
      </header>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Uncompromising Security</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Built from the ground up to ensure your data never leaves your control.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Shield className="text-primary w-8 h-8" />}
            title="PBKDF2 Encryption"
            description="Your master password is hashed thousands of times to derive a secure AES-256 key. Brute-forcing is computationally infeasible."
          />
          <FeatureCard 
            icon={<SmartphoneNfc className="text-accent w-8 h-8" />}
            title="100% Offline"
            description="VaultKey has zero network dependencies. No APIs, no cloud. Your data physically never leaves your phone's secure storage."
          />
          <FeatureCard 
            icon={<Key className="text-green-500 w-8 h-8" />}
            title="Built-in Authenticator"
            description="Store your 2FA TOTP secrets securely alongside your passwords. Generate codes instantly without relying on a third-party app."
          />
        </div>
      </section>

      {/* Developer/Consulting Section */}
      <section id="contact" className="container mx-auto px-6 py-24 relative z-10 border-t border-slate-800 flex-grow">
        <div className="glass-panel p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-4">Need a Custom App?</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              I'm Siddhant Pal, the creator of VaultKey. I build high-performance mobile apps and modern web platforms. Let's turn your idea into reality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a href="mailto:siddhantpal08@gmail.com" className="flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-bold transition-all hover:bg-slate-200">
                <Mail className="w-5 h-5" />
                Hire Me
              </a>
              <a href="https://buymeacoffee.com/siddhantpal" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-[#FFDD00] text-black px-6 py-3 rounded-lg font-bold transition-all hover:brightness-95">
                <Coffee className="w-5 h-5" />
                Buy Me A Coffee
              </a>
            </div>
          </div>
          
          <div className="flex-1 w-full flex flex-col gap-4">
            <a href="https://github.com/Siddhantpal08" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GitBranch className="w-6 h-6 text-white" />
              </div>

              <div className="text-left">
                <h4 className="text-white font-bold">GitHub</h4>
                <p className="text-slate-400 text-sm">Check out my open source work</p>
              </div>
            </a>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h4 className="text-white font-bold">App Development</h4>
                <p className="text-slate-400 text-sm">React Native, Expo, Android, iOS</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code className="w-6 h-6 text-accent" />
              </div>
              <div className="text-left">
                <h4 className="text-white font-bold">Web Development</h4>
                <p className="text-slate-400 text-sm">React, Next.js, Node.js, Tailwind</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-panel p-8 text-left hover:-translate-y-2 transition-transform duration-300">
      <div className="w-14 h-14 rounded-xl bg-slate-800/80 flex items-center justify-center mb-6 border border-slate-700">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

export default Home;
