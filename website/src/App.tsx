import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const isHome = location.pathname === '/';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'py-3 bg-[#060B17]/80 backdrop-blur-xl'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center max-w-7xl">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 blur-md rounded-[22%] group-hover:blur-lg transition-all duration-300" />
            <img
              src="/logo.png"
              alt="VaultKey Logo"
              className="relative w-9 h-9 object-contain rounded-[22%] overflow-hidden"
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-outfit">VaultKey</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {isHome ? (
            <>
              <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="nav-link text-sm">Features</a>
              <a href="#security" onClick={(e) => handleScrollTo(e, 'security')} className="nav-link text-sm">Security</a>
              <a href="#how-it-works" onClick={(e) => handleScrollTo(e, 'how-it-works')} className="nav-link text-sm">How It Works</a>
              <a href="#contact" onClick={(e) => handleScrollTo(e, 'contact')} className="nav-link text-sm">Contact</a>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link text-sm">Home</Link>
              <Link to="/privacy" className="nav-link text-sm">Privacy</Link>
              <Link to="/terms" className="nav-link text-sm">Terms</Link>
            </>
          )}
        </div>

        {/* CTA */}
        <a
          href="/VaultKey.apk"
          onClick={(e) => {
            if (isHome) {
              e.preventDefault();
              document.getElementById('download-btn')?.click();
            }
          }}
          className="btn-primary text-sm py-2.5 px-5 hidden sm:flex"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Get App
        </a>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-[#04080F]">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="VaultKey" className="w-8 h-8 rounded-[22%] object-contain" />
              <span className="font-bold text-white font-outfit">VaultKey</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              The privacy-first, 100% offline password manager for Android. No cloud. No tracking. Just security.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Navigation</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-slate-500 hover:text-white text-sm transition-colors">Home</Link></li>
              <li><Link to="/privacy" className="text-slate-500 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-slate-500 hover:text-white text-sm transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:siddhant.pal.work@gmail.com" className="text-slate-500 hover:text-white text-sm transition-colors flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  siddhant.pal.work@gmail.com
                </a>
              </li>
              <li>
                <a href="https://github.com/Siddhantpal08/VaultKey" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white text-sm transition-colors flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://www.siddhantpal.me" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white text-sm transition-colors flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                  Portfolio
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="sep-line mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} VaultKey by Siddhant Pal. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
