'use client';

import { useState } from 'react';
import type { ScreenType } from '../VaultKeyApp';

interface MasterPasswordScreenProps {
  setCurrentScreen: (screen: ScreenType) => void;
}

export default function MasterPasswordScreen({ setCurrentScreen }: MasterPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setIsVerifying(true);
    setError('');

    // Simulate verification (correct password: VaultKey123!)
    setTimeout(() => {
      if (password === 'VaultKey123!') {
        setCurrentScreen('vault');
      } else {
        setError('Incorrect master password. Try again.');
        setPassword('');
      }
      setIsVerifying(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password && !isVerifying) {
      handleVerify();
    }
  };

  const passwordStrength = {
    score: 0,
    label: 'Very Weak',
    color: '#EF5B5B',
  };

  if (password.length > 0) {
    const length = password.length;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);

    let score = 0;
    if (length >= 8) score++;
    if (length >= 12) score++;
    if (hasUppercase && hasLowercase) score++;
    if (hasNumbers) score++;
    if (hasSpecial) score++;

    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const strengthColors = ['#EF5B5B', '#FF9500', '#FFD700', '#90EE90', '#00D700', '#00A000'];

    passwordStrength.score = Math.min(score, 5);
    passwordStrength.label = strengthLabels[score] || 'Very Strong';
    passwordStrength.color = strengthColors[score] || '#00A000';
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-0 w-48 h-48 bg-[#5B8DEF]/30 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Verify Identity</h1>
          <p className="text-[#8B94A8] text-sm">Enter your master password to continue</p>
        </div>

        {/* Password Input */}
        <div className="mb-6">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter master password"
              className="w-full px-4 py-3 glass rounded-lg text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 transition-all bg-[#0F1729]/50"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8B94A8] hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-full transition-all"
                    style={{
                      backgroundColor:
                        i < passwordStrength.score ? passwordStrength.color : '#1B2D4D',
                    }}
                  ></div>
                ))}
              </div>
              <p className="text-xs" style={{ color: passwordStrength.color }}>
                {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-xs text-center">{error}</p>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={!password || isVerifying}
          className="w-full py-3 gradient-button text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Verifying...
            </>
          ) : (
            'Unlock Vault'
          )}
        </button>

        {/* Back Button */}
        <button
          onClick={() => setCurrentScreen('lock')}
          className="w-full py-2 text-[#8B94A8] hover:text-white text-sm transition-colors"
        >
          Back to Lock
        </button>

        {/* Demo hint */}
        <div className="mt-8 p-3 bg-[#5B8DEF]/10 border border-[#5B8DEF]/30 rounded-lg">
          <p className="text-[#8B94A8] text-xs text-center">
            Demo: Try <span className="text-[#5B8DEF] font-mono">VaultKey123!</span>
          </p>
        </div>
      </div>
    </div>
  );
}
