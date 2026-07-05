import React from 'react';
import { Mail, Coffee, Code, GitBranch, Smartphone } from 'lucide-react';

export default function Contact() {
  return (
    <section id="contact" className="container mx-auto px-6 py-32 relative z-10 border-t border-white/[0.04]">
      <div className="text-center mb-16">
        <span className="section-label">Connect</span>
        <h2 className="text-4xl font-bold text-white mb-4">Meet the Developer</h2>
      </div>

      <div className="glass-strong p-10 md:p-16 flex flex-col md:flex-row items-center gap-16 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex-1 relative z-10">
          <h3 className="text-3xl font-bold text-white mb-4 font-outfit">Need a Custom App?</h3>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            I'm Siddhant Pal, the creator of VaultKey. I build high-performance mobile apps, secure systems, and modern web platforms. Let's turn your idea into reality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="mailto:siddhant.pal.work@gmail.com" className="flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3.5 rounded-xl font-bold transition-all hover:bg-slate-200 hover:scale-105">
              <Mail className="w-5 h-5" />
              Hire Me
            </a>
            <a href="https://buymeacoffee.com/Siddhantpal" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-[#FFDD00]/10 text-[#FFDD00] border border-[#FFDD00]/20 px-6 py-3.5 rounded-xl font-bold transition-all hover:bg-[#FFDD00]/20 hover:scale-105">
              <Coffee className="w-5 h-5" />
              Support the Project
            </a>
          </div>
        </div>
        
        <div className="flex-1 w-full grid gap-4 relative z-10">
          <ContactLink 
            href="https://www.siddhantpal.me"
            icon={<Code className="w-6 h-6 text-accent" />}
            title="My Portfolio"
            subtitle="siddhantpal.me"
            bgClass="bg-accent/20"
          />
          <ContactLink 
            href="https://github.com/Siddhantpal08"
            icon={<GitBranch className="w-6 h-6 text-white" />}
            title="GitHub"
            subtitle="Check out my open source work"
            bgClass="bg-slate-700"
          />
          <ContactLink 
            href="https://instagram.com/siddhantpals"
            icon={<Smartphone className="w-6 h-6 text-pink-400" />}
            title="Instagram"
            subtitle="@siddhantpals"
            bgClass="bg-pink-500/20"
          />
        </div>
      </div>
    </section>
  );
}

function ContactLink({ href, icon, title, subtitle, bgClass }: { href: string, icon: React.ReactNode, title: string, subtitle: string, bgClass: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 rounded-2xl glass hover:bg-white/[0.04] transition-all hover:scale-[1.02] group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${bgClass}`}>
        {icon}
      </div>
      <div className="text-left">
        <h4 className="text-white font-bold">{title}</h4>
        <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
      </div>
    </a>
  );
}
