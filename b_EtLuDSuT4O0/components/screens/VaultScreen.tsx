'use client';

import { useState } from 'react';
import type { ScreenType, PasswordEntry } from '../VaultKeyApp';

interface VaultScreenProps {
  setCurrentScreen: (screen: ScreenType) => void;
  passwords: PasswordEntry[];
  setSelectedPassword: (password: PasswordEntry) => void;
}

export default function VaultScreen({
  setCurrentScreen,
  passwords,
  setSelectedPassword,
}: VaultScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(passwords.map(p => p.category))).sort();

  const filteredPasswords = passwords.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSelectPassword = (password: PasswordEntry) => {
    setSelectedPassword(password);
    setCurrentScreen('passwordDetail');
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-gradient-to-b from-[#0A0F1F] to-[#04091A]">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">My Vault</h1>
          <button
            onClick={() => setCurrentScreen('settings')}
            className="p-2 glass rounded-lg hover:bg-white/15 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search passwords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 glass rounded-lg text-sm text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50"
          />
          <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8B94A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="px-4 pt-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-[#5B8DEF] text-white'
                : 'glass text-[#8B94A8] hover:text-white'
            }`}
          >
            All ({passwords.length})
          </button>
          {categories.map(cat => {
            const count = passwords.filter(p => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#5B8DEF] text-white'
                    : 'glass text-[#8B94A8] hover:text-white'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Password List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredPasswords.length > 0 ? (
          filteredPasswords.map(password => (
            <PasswordCard
              key={password.id}
              password={password}
              onSelect={() => handleSelectPassword(password)}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-[#8B94A8] text-sm">No passwords found</p>
              <p className="text-[#555] text-xs mt-1">Try a different search</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Password Button */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-t from-[#04091A]/50 to-transparent">
        <button
          onClick={() => setCurrentScreen('addPassword')}
          className="w-full py-3 gradient-button text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6V5a1 1 0 011-1z" />
          </svg>
          Add Password
        </button>
      </div>
    </div>
  );
}

interface PasswordCardProps {
  password: PasswordEntry;
  onSelect: () => void;
}

function PasswordCard({ password, onSelect }: PasswordCardProps) {
  const isRecentlyUpdated = () => {
    const daysSinceUpdate = Math.floor(
      (Date.now() - password.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceUpdate < 7;
  };

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 glass rounded-xl hover:bg-white/10 transition-all group relative overflow-hidden"
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#5B8DEF]/0 via-[#5B8DEF]/5 to-[#5B8DEF]/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative z-10 flex items-start gap-3">
        {/* Favicon/Icon */}
        <div className="w-10 h-10 glass-sm rounded-lg flex items-center justify-center text-lg flex-shrink-0">
          {password.favicon || '🔐'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold truncate group-hover:text-[#5B8DEF] transition-colors">
              {password.title}
            </h3>
            {password.totp && (
              <div className="flex-shrink-0 px-2 py-0.5 bg-[#5B8DEF]/30 rounded text-[#5B8DEF] text-xs font-mono">
                2FA
              </div>
            )}
            {isRecentlyUpdated() && (
              <div className="flex-shrink-0 px-2 py-0.5 bg-yellow-500/20 rounded text-yellow-400 text-xs">
                NEW
              </div>
            )}
          </div>
          <p className="text-[#8B94A8] text-xs truncate">{password.username}</p>
        </div>

        {/* Arrow */}
        <svg className="w-5 h-5 text-[#5B8DEF]/60 group-hover:text-[#5B8DEF] transition-colors transform group-hover:translate-x-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
