'use client';

import { useState, useEffect } from 'react';
import type { ScreenType } from '../VaultKeyApp';

interface GeneratorScreenProps {
  setCurrentScreen: (screen: ScreenType) => void;
}

export default function GeneratorScreen({ setCurrentScreen }: GeneratorScreenProps) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [entropy, setEntropy] = useState(0);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let chars = '';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const ambiguous = 'il1Lo0O';

    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    if (excludeAmbiguous) {
      chars = chars.split('').filter(c => !ambiguous.includes(c)).join('');
    }

    let generated = '';
    for (let i = 0; i < length; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setPassword(generated);
    calculateEntropy(chars, length);
  };

  const calculateEntropy = (charSet: string, len: number) => {
    if (charSet.length === 0) {
      setEntropy(0);
      return;
    }
    const ent = len * Math.log2(charSet.length);
    setEntropy(Math.round(ent));
  };

  useEffect(() => {
    generatePassword();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrengthInfo = () => {
    if (entropy < 50) return { label: 'Weak', color: '#EF5B5B' };
    if (entropy < 75) return { label: 'Fair', color: '#FFD700' };
    if (entropy < 100) return { label: 'Good', color: '#90EE90' };
    if (entropy < 128) return { label: 'Strong', color: '#00D700' };
    return { label: 'Very Strong', color: '#00A000' };
  };

  const strength = getStrengthInfo();

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#0A0F1F] to-[#04091A]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <button
          onClick={() => setCurrentScreen('vault')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">Password Generator</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Generated Password Display */}
        <div className="p-4 glass rounded-xl">
          <label className="text-[#8B94A8] text-xs uppercase tracking-wider block mb-3">Generated Password</label>
          <div className="flex items-center gap-2 mb-4">
            <code className="flex-1 px-4 py-3 bg-[#0F1729]/50 rounded-lg text-[#5B8DEF] font-mono text-lg tracking-wider break-all">
              {password}
            </code>
            <button
              onClick={handleCopy}
              className={`p-2 glass-sm rounded transition-colors flex-shrink-0 ${
                copied ? 'bg-green-500/30' : 'hover:bg-white/15'
              }`}
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
              )}
            </button>
          </div>

          {/* Strength Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-semibold">Security Strength</p>
              <p className="text-xs font-mono" style={{ color: strength.color }}>
                {entropy} bits
              </p>
            </div>
            <div className="flex gap-1">
              {[0, 32, 64, 96, 128].map((threshold, i) => (
                <div
                  key={i}
                  className="flex-1 h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: entropy > threshold ? strength.color : '#1B2D4D',
                  }}
                ></div>
              ))}
            </div>
            <p className="text-xs" style={{ color: strength.color }}>
              {strength.label}
            </p>
          </div>
        </div>

        {/* Length Slider */}
        <div className="p-4 glass rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <label className="text-white text-sm font-medium">Password Length</label>
            <span className="text-[#5B8DEF] text-lg font-bold">{length}</span>
          </div>
          <input
            type="range"
            min="8"
            max="32"
            value={length}
            onChange={e => setLength(parseInt(e.target.value))}
            className="w-full h-2 bg-[#1B2D4D] rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #5B8DEF 0%, #5B8DEF ${((length - 8) / 24) * 100}%, #1B2D4D ${((length - 8) / 24) * 100}%, #1B2D4D 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-[#8B94A8] mt-2">
            <span>8</span>
            <span>32</span>
          </div>
        </div>

        {/* Character Sets */}
        <div className="p-4 glass rounded-xl space-y-3">
          <label className="text-white text-sm font-medium block">Include Characters</label>

          <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={e => setIncludeUppercase(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <div>
              <span className="text-white text-sm">Uppercase (A-Z)</span>
              <span className="text-[#8B94A8] text-xs block">26 characters</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors">
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={e => setIncludeLowercase(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <div>
              <span className="text-white text-sm">Lowercase (a-z)</span>
              <span className="text-[#8B94A8] text-xs block">26 characters</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={e => setIncludeNumbers(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <div>
              <span className="text-white text-sm">Numbers (0-9)</span>
              <span className="text-[#8B94A8] text-xs block">10 characters</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={e => setIncludeSymbols(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <div>
              <span className="text-white text-sm">Symbols (!@#$%^&*)</span>
              <span className="text-[#8B94A8] text-xs block">~30 characters</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded transition-colors pt-2 border-t border-white/10">
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={e => setExcludeAmbiguous(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <div>
              <span className="text-white text-sm">Exclude Ambiguous (il1Lo0O)</span>
              <span className="text-[#8B94A8] text-xs block">Easier to read</span>
            </div>
          </label>
        </div>

        {/* Quick Presets */}
        <div className="p-4 glass rounded-xl">
          <label className="text-white text-sm font-medium block mb-3">Quick Presets</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setLength(12);
                setIncludeUppercase(true);
                setIncludeLowercase(true);
                setIncludeNumbers(true);
                setIncludeSymbols(false);
              }}
              className="p-2 glass-sm rounded text-sm text-white hover:bg-white/15 transition-colors"
            >
              Simple (12)
            </button>
            <button
              onClick={() => {
                setLength(16);
                setIncludeUppercase(true);
                setIncludeLowercase(true);
                setIncludeNumbers(true);
                setIncludeSymbols(true);
              }}
              className="p-2 glass-sm rounded text-sm text-white hover:bg-white/15 transition-colors"
            >
              Strong (16)
            </button>
            <button
              onClick={() => {
                setLength(24);
                setIncludeUppercase(true);
                setIncludeLowercase(true);
                setIncludeNumbers(true);
                setIncludeSymbols(true);
                setExcludeAmbiguous(true);
              }}
              className="p-2 glass-sm rounded text-sm text-white hover:bg-white/15 transition-colors"
            >
              Secure (24)
            </button>
            <button
              onClick={() => {
                setLength(32);
                setIncludeUppercase(true);
                setIncludeLowercase(true);
                setIncludeNumbers(true);
                setIncludeSymbols(true);
              }}
              className="p-2 glass-sm rounded text-sm text-white hover:bg-white/15 transition-colors"
            >
              Maximum (32)
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-t from-[#04091A]/50 to-transparent space-y-2">
        <button
          onClick={generatePassword}
          className="w-full py-3 gradient-button text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 4v6h6M23 20v-6h-6M20.54 9.54a9 9 0 11-12.77-12.77" />
          </svg>
          Generate New
        </button>
        <button
          onClick={() => setCurrentScreen('vault')}
          className="w-full py-2 text-[#8B94A8] hover:text-white text-sm transition-colors"
        >
          Back to Vault
        </button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #5B8DEF;
          cursor: pointer;
          border: 3px solid #04091A;
          box-shadow: 0 0 10px rgba(91, 141, 239, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #5B8DEF;
          cursor: pointer;
          border: 3px solid #04091A;
          box-shadow: 0 0 10px rgba(91, 141, 239, 0.5);
        }
      `}</style>
    </div>
  );
}
