export default function HowItWorks() {
  return (
    <section id="how-it-works" className="container mx-auto px-6 py-32 relative z-10">
      <div className="text-center mb-20">
        <span className="section-label">How It Works</span>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Simple, Secure, Local.</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Get started with VaultKey in minutes. No account creation required.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 relative">
        {/* Connecting line for desktop */}
        <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10" />
        
        <StepCard 
          number="01"
          title="Set Master Password"
          description="Install the app and create a strong Master Password. This acts as the sole key to encrypt and decrypt your entire vault. Don't forget it!"
          activeColor="from-blue-500/20 to-indigo-500/20"
          borderClass="border-blue-500/30"
          textClass="text-blue-400"
        />
        <StepCard 
          number="02"
          title="Add Your Credentials"
          description="Start adding passwords, secure notes, and scan TOTP QR codes. Everything you add is instantly encrypted in memory before saving."
          activeColor="from-purple-500/20 to-fuchsia-500/20"
          borderClass="border-purple-500/30"
          textClass="text-purple-400"
        />
        <StepCard 
          number="03"
          title="Enable Auto Backup"
          description="Select a local folder on your Android device (like Documents). VaultKey will automatically maintain an encrypted .pnb backup."
          activeColor="from-emerald-500/20 to-teal-500/20"
          borderClass="border-emerald-500/30"
          textClass="text-emerald-400"
        />
      </div>
    </section>
  );
}

function StepCard({ number, title, description, activeColor, borderClass, textClass }: { number: string, title: string, description: string, activeColor: string, borderClass: string, textClass: string }) {
  return (
    <div className="glass-card p-8 text-center relative group h-full">
      {/* Background glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${activeColor} opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none blur-xl`} />
      
      <div className={`w-20 h-20 mx-auto rounded-full bg-slate-900 border-2 ${borderClass} flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 transition-transform shadow-xl`}>
        <span className={`text-2xl font-black font-outfit ${textClass}`}>{number}</span>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-4 font-outfit relative z-10">{title}</h3>
      <p className="text-slate-400 leading-relaxed relative z-10">{description}</p>
    </div>
  );
}
