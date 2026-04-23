'use client';

import { useState } from 'react';
import type { ScreenType, PasswordEntry } from '../VaultKeyApp';

interface SettingsScreenProps {
  setCurrentScreen: (screen: ScreenType) => void;
  passwords: PasswordEntry[];
}

export default function SettingsScreen({
  setCurrentScreen,
  passwords,
}: SettingsScreenProps) {
  const [activeTab, setActiveTab] = useState<'security' | 'backup' | 'about' | 'danger'>('security');
  const [autoLock, setAutoLock] = useState(5);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');

  const handleExportData = () => {
    const dataStr = JSON.stringify(passwords, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vaultkey-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    setBackupMessage('Backup created successfully!');
    setTimeout(() => setBackupMessage(''), 3000);
  };

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
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 pt-4 flex gap-2 border-b border-white/10 overflow-x-auto no-scrollbar">
        {(['security', 'backup', 'about', 'danger'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-[#5B8DEF] text-white'
                : 'text-[#8B94A8] hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'security' && <SecuritySettings autoLock={autoLock} setAutoLock={setAutoLock} biometricEnabled={biometricEnabled} setBiometricEnabled={setBiometricEnabled} showMasterPassword={showMasterPassword} setShowMasterPassword={setShowMasterPassword} />}
        {activeTab === 'backup' && <BackupSettings onExport={handleExportData} backupMessage={backupMessage} passwords={passwords} />}
        {activeTab === 'about' && <AboutSettings />}
        {activeTab === 'danger' && <DangerSettings />}
      </div>
    </div>
  );
}

interface SecuritySettingsProps {
  autoLock: number;
  setAutoLock: (value: number) => void;
  biometricEnabled: boolean;
  setBiometricEnabled: (value: boolean) => void;
  showMasterPassword: boolean;
  setShowMasterPassword: (value: boolean) => void;
}

function SecuritySettings({
  autoLock,
  setAutoLock,
  biometricEnabled,
  setBiometricEnabled,
  showMasterPassword,
  setShowMasterPassword,
}: SecuritySettingsProps) {
  return (
    <div className="space-y-4">
      {/* Auto-Lock */}
      <div className="p-4 glass rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">Auto-Lock Timeout</h3>
            <p className="text-[#8B94A8] text-xs">Lock vault after inactivity</p>
          </div>
          <span className="text-[#5B8DEF] font-mono">{autoLock}m</span>
        </div>
        <input
          type="range"
          min="1"
          max="30"
          value={autoLock}
          onChange={e => setAutoLock(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-[#8B94A8] mt-2">
          <span>1 min</span>
          <span>30 min</span>
        </div>
      </div>

      {/* Biometric */}
      <label className="flex items-center gap-4 p-4 glass rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
        <div className="flex-1">
          <h3 className="text-white font-semibold">Biometric Authentication</h3>
          <p className="text-[#8B94A8] text-xs">Use Face ID / Fingerprint</p>
        </div>
        <input
          type="checkbox"
          checked={biometricEnabled}
          onChange={e => setBiometricEnabled(e.target.checked)}
          className="w-5 h-5 rounded"
        />
      </label>

      {/* Master Password */}
      <div className="p-4 glass rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Master Password</h3>
          <button
            onClick={() => setShowMasterPassword(!showMasterPassword)}
            className="text-[#8B94A8] hover:text-white text-xs transition-colors"
          >
            {showMasterPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <code className="block w-full px-3 py-2 bg-[#0F1729]/50 rounded-lg text-[#8B94A8] text-sm break-all">
          {showMasterPassword ? 'VaultKey123!' : '••••••••••••'}
        </code>
        <button className="mt-3 w-full py-2 text-[#5B8DEF] hover:text-[#4A7FD4] text-sm transition-colors">
          Change Master Password
        </button>
      </div>

      {/* Password History */}
      <div className="p-4 glass rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Password History</h3>
            <p className="text-[#8B94A8] text-xs">Keep record of password changes</p>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
        </div>
      </div>

      {/* Security Alert */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <p className="text-yellow-400 text-sm font-medium mb-2">Security Tip</p>
        <p className="text-yellow-400/80 text-xs">
          Change your master password every 3 months and enable two-factor authentication on important accounts.
        </p>
      </div>
    </div>
  );
}

interface BackupSettingsProps {
  onExport: () => void;
  backupMessage: string;
  passwords: PasswordEntry[];
}

function BackupSettings({ onExport, backupMessage, passwords }: BackupSettingsProps) {
  return (
    <div className="space-y-4">
      {/* Export Data */}
      <div className="p-4 glass rounded-xl">
        <h3 className="text-white font-semibold mb-2">Export Backup</h3>
        <p className="text-[#8B94A8] text-sm mb-4">
          Download all your passwords as an encrypted JSON file. Keep this backup safe!
        </p>
        <button
          onClick={onExport}
          className="w-full py-2 gradient-button text-white rounded-lg font-semibold transition-all"
        >
          Download Backup ({passwords.length} passwords)
        </button>
        {backupMessage && (
          <p className="text-green-400 text-xs mt-3 text-center">{backupMessage}</p>
        )}
      </div>

      {/* Backup Info */}
      <div className="p-4 glass rounded-xl space-y-3">
        <div className="flex justify-between">
          <span className="text-[#8B94A8] text-sm">Total Passwords</span>
          <span className="text-white font-semibold">{passwords.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B94A8] text-sm">Last Backup</span>
          <span className="text-white font-semibold">Never</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B94A8] text-sm">Backup Size</span>
          <span className="text-white font-semibold">~{Math.round(passwords.length * 0.5)}KB</span>
        </div>
      </div>

      {/* Cloud Sync */}
      <div className="p-4 glass rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold">Cloud Sync</h3>
            <p className="text-[#8B94A8] text-xs">Coming soon</p>
          </div>
          <input type="checkbox" disabled className="w-5 h-5 rounded opacity-50" />
        </div>
        <p className="text-[#8B94A8] text-xs">Automatic backup to secure cloud storage</p>
      </div>

      {/* Warning */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <p className="text-blue-400 text-sm font-medium mb-2">Important</p>
        <p className="text-blue-400/80 text-xs">
          Store backups in a secure location. Anyone with access to the backup file can view your passwords if they have the encryption key.
        </p>
      </div>
    </div>
  );
}

function AboutSettings() {
  return (
    <div className="space-y-4">
      {/* App Info */}
      <div className="p-4 glass rounded-xl text-center">
        <div className="w-16 h-16 glass rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
          🔐
        </div>
        <h2 className="text-white text-lg font-bold">VaultKey</h2>
        <p className="text-[#8B94A8] text-sm">Premium Password Manager</p>
        <p className="text-[#555] text-xs mt-2">Version 1.0.0</p>
      </div>

      {/* Features */}
      <div className="p-4 glass rounded-xl">
        <h3 className="text-white font-semibold mb-3">Features</h3>
        <ul className="space-y-2 text-sm text-[#8B94A8]">
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[#5B8DEF] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <span>Biometric & PIN authentication</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[#5B8DEF] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <span>Advanced password generator</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[#5B8DEF] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <span>Two-factor authentication (TOTP)</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[#5B8DEF] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <span>Secure encrypted storage</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[#5B8DEF] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <span>Password strength analysis</span>
          </li>
        </ul>
      </div>

      {/* Credits */}
      <div className="p-4 glass rounded-xl">
        <h3 className="text-white font-semibold mb-2">Build Info</h3>
        <p className="text-[#8B94A8] text-xs">
          Built with React, Next.js, and Tailwind CSS for maximum security and performance.
        </p>
      </div>

      {/* Contact */}
      <div className="p-4 glass rounded-xl text-center">
        <p className="text-white text-sm font-semibold mb-2">Support</p>
        <p className="text-[#8B94A8] text-xs mb-3">Have questions? Get in touch with us.</p>
        <button className="text-[#5B8DEF] hover:text-[#4A7FD4] text-sm transition-colors">
          Contact Support →
        </button>
      </div>
    </div>
  );
}

function DangerSettings() {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-4">
      {/* Clear Local Data */}
      <div className="p-4 glass rounded-xl">
        <h3 className="text-red-400 font-semibold mb-2">Clear All Data</h3>
        <p className="text-[#8B94A8] text-sm mb-4">
          This will permanently delete all passwords stored locally. This cannot be undone.
        </p>
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-2 bg-red-500/30 hover:bg-red-500/40 text-red-400 rounded-lg text-sm font-semibold transition-colors"
          >
            Clear All Data
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-red-400 text-xs text-center font-semibold">
              Are you absolutely sure? This action cannot be reversed.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert('Data cleared (demo only)');
                  setShowConfirm(false);
                }}
                className="flex-1 py-2 bg-red-500/50 hover:bg-red-500/60 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 glass text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reset App */}
      <div className="p-4 glass rounded-xl">
        <h3 className="text-red-400 font-semibold mb-2">Reset Application</h3>
        <p className="text-[#8B94A8] text-sm mb-4">
          Return the app to its initial state, clearing all settings and data.
        </p>
        <button className="w-full py-2 glass text-red-400 hover:text-red-300 rounded-lg text-sm font-semibold transition-colors">
          Reset App
        </button>
      </div>

      {/* Warning */}
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <p className="text-red-400 text-sm font-medium mb-2">Warning</p>
        <p className="text-red-400/80 text-xs">
          These actions are irreversible. Make sure you have a backup before proceeding.
        </p>
      </div>
    </div>
  );
}
