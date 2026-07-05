import React from 'react';
import { Shield, Key, Download, Coffee, GitBranch, Mail, Smartphone, Code, Lock, SmartphoneNfc, FileText, CloudUpload, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);

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

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isDesktop) {
      setShowModal(true);
    } else {
      triggerDownload();
    }
  };

  const triggerDownload = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4500);

    // Trigger download
    const link = document.createElement('a');
    link.href = '/VaultKey.apk';
    link.download = 'VaultKey.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-background">
      {/* Background gradients */}
      <div className="absolute top-[-15%] left-[-15%] w-[75%] h-[75%] bg-primary/25 blur-[160px] rounded-full pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[75%] h-[75%] bg-accent/15 blur-[160px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <Link to="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="VaultKey Logo" className="w-12 h-12 object-contain rounded-[22%] overflow-hidden" />
          VaultKey
        </Link>
        <div className="flex gap-4">
          <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="text-slate-300 hover:text-white font-medium transition-colors hidden sm:block">Features</a>
          <a href="#contact" onClick={(e) => handleScrollTo(e, 'contact')} className="text-slate-300 hover:text-white font-medium transition-colors hidden sm:block">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-6 pt-16 pb-32 flex flex-col items-center text-center relative z-10 mt-6">
        {/* Interactive 3D Spinning Security Element */}
        <div className="relative w-40 h-40 mb-10 [perspective:1000px]">
          <div className="w-full h-full relative [transform-style:preserve-3d] animate-spin-3d">
            {/* Front Side: Shield */}
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-md rounded-3xl border border-primary/40 flex items-center justify-center [backface-visibility:hidden]">
              <Shield className="w-20 h-20 text-primary drop-shadow-[0_0_15px_rgba(91,141,239,0.5)]" />
            </div>
            {/* Back Side: Key */}
            <div className="absolute inset-0 bg-accent/20 backdrop-blur-md rounded-3xl border border-accent/40 flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <Key className="w-20 h-20 text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            </div>
          </div>
        </div>

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
            <button onClick={handleDownloadClick} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(91,141,239,0.3)] hover:shadow-[0_0_30px_rgba(91,141,239,0.5)] hover:-translate-y-1">
              <Download className="w-5 h-5" />
              Download APK
            </button>
            <a href="https://github.com/Siddhantpal08/VaultKey" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-surface hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all border border-slate-700/50 hover:border-slate-600 hover:-translate-y-1">
              <GitBranch className="w-5 h-5" />
              View Source
            </a>
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

      {/* Download Alert Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel bg-slate-900 border-primary/50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in max-w-sm">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Download starting...</p>
            <p className="text-slate-400 text-xs mt-0.5">Your VaultKey APK download will start in a few seconds.</p>
          </div>
        </div>
      )}

      {/* Desktop QR Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-md p-8 glass-panel bg-slate-900 border-slate-800 shadow-3xl text-center rounded-2xl">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-850 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary border border-primary/20">
              <Smartphone className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Install on Mobile</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
              Scan this QR code with your phone's camera to download and install VaultKey directly on your Android device.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 w-fit mx-auto mb-6 shadow-inner">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://vault-key-app.vercel.app/VaultKey.apk&bgcolor=060B17&color=ffffff" 
                alt="VaultKey Download QR" 
                className="w-44 h-44 rounded-lg"
              />
            </div>

            <div className="border-t border-slate-800/80 pt-6">
              <p className="text-xs text-slate-500 mb-3">Or, download it to your computer anyway:</p>
              <button 
                onClick={() => {
                  setShowModal(false);
                  triggerDownload();
                }}
                className="text-primary hover:text-primary/80 font-bold text-sm transition-colors underline"
              >
                Download APK directly
              </button>
            </div>
          </div>
        </div>
      )}
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
