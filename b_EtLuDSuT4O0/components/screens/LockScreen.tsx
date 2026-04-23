'use client';

import { useState, useEffect } from 'react';
import type { ScreenType } from '../VaultKeyApp';

interface LockScreenProps {
  setCurrentScreen: (screen: ScreenType) => void;
  setIsUnlocked: (unlocked: boolean) => void;
}

export default function LockScreen({ setCurrentScreen, setIsUnlocked }: LockScreenProps) {
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(true);

  useEffect(() => {
    // Simulate biometric availability check
    setIsBiometricAvailable(typeof navigator !== 'undefined' && 'biometric' in navigator);
  }, []);

  const handleBiometricUnlock = () => {
    // Simulate biometric unlock
    setTimeout(() => {
      setIsUnlocked(true);
      setCurrentScreen('masterPassword');
    }, 800);
  };

  const handlePINUnlock = (pin: string) => {
    // Simple PIN verification (demo PIN: 1234)
    if (pin === '1234') {
      setIsUnlocked(true);
      setCurrentScreen('masterPassword');
    } else {
      setAttemptsLeft(Math.max(0, attemptsLeft - 1));
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#5B8DEF]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-10 w-40 h-40 bg-[#5B8DEF]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Lock Icon */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 bg-gradient-to-br from-[#5B8DEF]/50 to-[#3A71BA]/50 rounded-full flex items-center justify-center glass glow-blue">
            <svg className="w-12 h-12 text-[#5B8DEF]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-[#5B8DEF]/30 animate-spin" style={{ animationDuration: '3s' }}></div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2 text-center">VaultKey</h1>
        <p className="text-[#8B94A8] text-sm text-center mb-8">Premium Password Manager</p>

        {/* Attempt counter */}
        {attemptsLeft < 5 && (
          <div className="mb-4 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-yellow-400 text-xs text-center">
              Attempts remaining: <span className="font-bold">{Math.max(0, attemptsLeft)}</span>
            </p>
          </div>
        )}

        {attemptsLeft <= 0 ? (
          <div className="w-full">
            <div className="px-4 py-3 bg-red-500/20 border border-red-500/50 rounded-lg mb-6">
              <p className="text-red-400 text-sm text-center">Too many attempts. Please try again later.</p>
            </div>
            <button
              onClick={() => {
                setAttemptsLeft(5);
              }}
              className="w-full py-3 bg-[#5B8DEF] hover:bg-[#4A7FD4] text-white rounded-lg font-semibold transition-colors"
            >
              Reset
            </button>
          </div>
        ) : (
          <>
            {/* Biometric unlock button */}
            {isBiometricAvailable && (
              <button
                onClick={handleBiometricUnlock}
                className="w-full mb-4 py-3 glass hover:bg-white/10 text-white rounded-lg font-semibold transition-all border border-white/20 flex items-center justify-center gap-2 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
                Unlock with Face ID
              </button>
            )}

            {/* PIN Input */}
            <div className="w-full">
              <p className="text-[#8B94A8] text-xs mb-3 text-center">Or enter your PIN (1234)</p>
              <PINInput onComplete={handlePINUnlock} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface PINInputProps {
  onComplete: (pin: string) => void;
}

function PINInput({ onComplete }: PINInputProps) {
  const [pin, setPin] = useState('');

  const handleKeypadClick = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          onComplete(newPin);
          setPin('');
        }, 300);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const keypadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  return (
    <div className="space-y-4">
      {/* PIN Display */}
      <div className="flex justify-center gap-3 mb-6">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < pin.length ? 'bg-[#5B8DEF] scale-100' : 'bg-[#1B2D4D] scale-75'
            }`}
          ></div>
        ))}
      </div>

      {/* Keypad */}
      <div className="space-y-3">
        {keypadNumbers.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-3 justify-center">
            {row.map(digit => (
              <button
                key={digit}
                onClick={() => {
                  if (digit === '*' || digit === '#') return;
                  handleKeypadClick(digit);
                }}
                disabled={digit === '*' || digit === '#'}
                className={`w-14 h-14 rounded-full font-semibold text-lg transition-all ${
                  digit === '*' || digit === '#'
                    ? 'text-[#1B2D4D] cursor-default'
                    : 'glass hover:bg-white/15 text-white hover:scale-105 active:scale-95'
                }`}
              >
                {digit}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Backspace button */}
      {pin.length > 0 && (
        <button
          onClick={handleBackspace}
          className="w-full mt-4 py-2 text-[#8B94A8] hover:text-white text-sm transition-colors"
        >
          ← Delete
        </button>
      )}
    </div>
  );
}
