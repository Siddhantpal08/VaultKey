import React from 'react';
import { Shield, Key, Download, Coffee, GitBranch, Mail, Smartphone, Code, Lock, SmartphoneNfc, FileText, CloudUpload } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  // Smooth scroll handler for anchor links
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/30 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/20 blur-[150px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <Link to="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <img src="/logo.png" alt="VaultKey Logo" className="w-12 h-12 object-contain" />
          VaultKey
        </Link>
        <div className="flex gap-4">
          <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="text-slate-300 hover:text-white font-medium transition-colors hidden sm:block">Features</a>
          <a href="#contact" onClick={(e) => handleScrollTo(e, 'contact')} className="text-slate-300 hover:text-white font-medium transition-colors hidden sm:block">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center relative z-10 mt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm font-medium text-primary mb-8 animate-fade-in-up border border-primary/30 bg-primary/10">
          <Lock className="w-4 h-4" /> Complete Trust in VaultKey & Fully Protected
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-6 max-w-4xl tracking-tight leading-tight">
          Your Digital Life, <br className="hidden md:block" /> Secured Offline.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-300 mb-6 max-w-2xl leading-relaxed font-medium">
          VaultKey is the ultimate, <span className="text-white font-bold">100% FREE</span> password manager. No ads, no subscriptions, no tracking.
        </p>

        <p className="text-base md:text-lg text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Everything is encrypted locally on your device with military-grade AES-256. Take back control of your data without relying on the cloud.
        </p>

        <div className="flex flex-col md:flex-row items-center gap-8 w-full justify-center">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a href="/VaultKey.apk" download className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(91,141,239,0.3)] hover:shadow-[0_0_30px_rgba(91,141,239,0.5)] hover:-translate-y-1">
              <Download className="w-5 h-5" />
              Download APK
            </a>
            <a href="https://github.com/Siddhantpal08/VaultKey" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-surface hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all border border-slate-700/50 hover:border-slate-600">
              <GitBranch className="w-5 h-5" />
              View Source
            </a>
          </div>

          <div className="hidden md:flex flex-col items-center gap-2 bg-surface p-3 rounded-xl border border-slate-800">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://vaultkey.vercel.app/VaultKey.apk&bgcolor=060B17&color=ffffff" alt="Download QR" className="w-24 h-24 rounded-lg" />
            <span className="text-xs font-semibold text-slate-400">Scan to Download</span>
          </div>
        </div>
        
        <p className="mt-6 text-sm text-slate-500">Requires Android 8.0 or higher.</p>
      </header>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Uncompromising Security</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Built from the ground up to ensure your data never leaves your control.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Shield className="text-primary w-8 h-8" />}
            title="Military-Grade Encryption"
            description="Your master password is used to derive a secure AES-256 key via PBKDF2. Brute-forcing your vault is computationally infeasible."
          />
          <FeatureCard 
            icon={<SmartphoneNfc className="text-accent w-8 h-8" />}
            title="100% Offline"
            description="VaultKey has absolutely zero network dependencies. No APIs, no cloud sync. Your data physically never leaves your phone."
          />
          <FeatureCard 
            icon={<Key className="text-green-500 w-8 h-8" />}
            title="Built-in Authenticator"
            description="Store your 2FA TOTP secrets securely alongside your passwords. Generate codes instantly without relying on an external app."
          />
          <FeatureCard 
            icon={<FileText className="text-amber-500 w-8 h-8" />}
            title="Encrypted Secure Notes"
            description="Write down private thoughts, recovery codes, or sensitive documents. Everything is encrypted just like your passwords."
          />
          <FeatureCard 
            icon={<CloudUpload className="text-purple-500 w-8 h-8" />}
            title="Automated Backups"
            description="Since there's no cloud, VaultKey can automatically generate a highly-encrypted local .pnb backup file to protect your data."
          />
          <FeatureCard 
            icon={<Lock className="text-rose-500 w-8 h-8" />}
            title="Biometric Security"
            description="Lock your vault instantly when you leave the app, and unlock seamlessly using your fingerprint or Face ID."
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
              <a href="mailto:siddhant.pal.work@gmail.com" className="flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-bold transition-all hover:bg-slate-200">
                <Mail className="w-5 h-5" />
                Hire Me
              </a>
              <a href="https://buymeacoffee.com/Siddhantpal" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-[#FFDD00] text-black px-6 py-3 rounded-lg font-bold transition-all hover:brightness-95">
                <Coffee className="w-5 h-5" />
                Buy Me A Coffee
              </a>
            </div>
          </div>
          
          <div className="flex-1 w-full flex flex-col gap-4">
            <a href="https://www.siddhantpal.me" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code className="w-6 h-6 text-accent" />
              </div>
              <div className="text-left">
                <h4 className="text-white font-bold">My Portfolio</h4>
                <p className="text-slate-400 text-sm">siddhantpal.me</p>
              </div>
            </a>
            
            <a href="https://github.com/Siddhantpal08" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GitBranch className="w-6 h-6 text-white" />
              </div>

              <div className="text-left">
                <h4 className="text-white font-bold">GitHub</h4>
                <p className="text-slate-400 text-sm">Check out my open source work</p>
              </div>
            </a>
            <a href="https://instagram.com/siddhantpals" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6 text-pink-400" />
              </div>
              <div className="text-left">
                <h4 className="text-white font-bold">Instagram</h4>
                <p className="text-slate-400 text-sm">@siddhantpals</p>
              </div>
            </a>
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
