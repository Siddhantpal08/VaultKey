import React from 'react';
import { Shield, Key, Download, GitBranch, Lock } from 'lucide-react';

interface HeroProps {
  onDownloadClick: (e: React.MouseEvent) => void;
}

export default function Hero({ onDownloadClick }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] animate-blob-slow pointer-events-none opacity-50 blur-[100px] bg-gradient-to-tr from-[#3b0764] via-[#1e3a8a] to-[#0f172a]" />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] animate-blob pointer-events-none opacity-40 blur-[80px] bg-gradient-to-bl from-[#7c3aed] to-[#2563eb]" />

      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
        {/* Interactive 3D Spinning Security Element */}
        <div className="relative w-48 h-48 mb-12 [perspective:1000px] group cursor-pointer animate-float">
          <div className="w-full h-full relative [transform-style:preserve-3d] animate-spin-3d group-hover:[animation-play-state:paused] transition-transform duration-500">
            {/* Front Side: Shield */}
            <div className="absolute inset-0 glass-strong rounded-[2rem] flex items-center justify-center [backface-visibility:hidden] shadow-[0_0_40px_rgba(91,141,239,0.3)]">
              <Shield className="w-24 h-24 text-primary drop-shadow-[0_0_15px_rgba(91,141,239,0.5)]" strokeWidth={1.5} />
            </div>
            {/* Back Side: Key */}
            <div className="absolute inset-0 glass-strong rounded-[2rem] flex items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-[0_0_40px_rgba(245,158,11,0.3)] border-accent/20">
              <Key className="w-24 h-24 text-accent drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium text-primary mb-8 animate-fade-in-up border-primary/20 bg-primary/5">
          <Lock className="w-4 h-4" /> 100% Offline Vault
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 mb-6 max-w-5xl tracking-tight leading-[1.1] animate-fade-in-up [animation-delay:100ms] uppercase">
          protect your <br />
          <span className="gradient-text-blue">data.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed animate-fade-in-up [animation-delay:200ms] font-medium">
          Your Digital Life, Secured Offline. VaultKey is the ultimate, 100% FREE password manager. No ads, no subscriptions, no tracking.
        </p>



        <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center animate-fade-in-up [animation-delay:300ms]">
          <button onClick={onDownloadClick} id="download-btn" className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-[#060B17] hover:bg-slate-200 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            <Download className="w-5 h-5" />
            Download APK
          </button>
          <a href="https://github.com/Siddhantpal08/VaultKey" target="_blank" rel="noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-3 glass hover:bg-white/10 px-8 py-4 rounded-xl font-bold text-lg text-white transition-all hover:scale-105 border-white/10">
            <GitBranch className="w-5 h-5" />
            View Source
          </a>
        </div>
        
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 pt-8 animate-fade-in-up [animation-delay:400ms]">
          <div className="text-center">
            <h4 className="text-3xl font-bold text-white mb-1">AES-256</h4>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Encryption</p>
          </div>
          <div className="text-center">
            <h4 className="text-3xl font-bold text-white mb-1">0</h4>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Network Calls</p>
          </div>
          <div className="text-center">
            <h4 className="text-3xl font-bold text-white mb-1">100%</h4>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Free & Open</p>
          </div>
          <div className="text-center">
            <h4 className="text-3xl font-bold text-white mb-1">.pnb</h4>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Secure Backups</p>
          </div>
        </div>
      </div>
    </section>
  );
}
