'use client';

import { useState } from 'react';
import LockScreen from './screens/LockScreen';
import MasterPasswordScreen from './screens/MasterPasswordScreen';
import VaultScreen from './screens/VaultScreen';
import AddPasswordScreen from './screens/AddPasswordScreen';
import PasswordDetailScreen from './screens/PasswordDetailScreen';
import GeneratorScreen from './screens/GeneratorScreen';
import SettingsScreen from './screens/SettingsScreen';

export type ScreenType = 'lock' | 'masterPassword' | 'vault' | 'addPassword' | 'passwordDetail' | 'generator' | 'settings';

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  email?: string;
  password: string;
  website?: string;
  notes?: string;
  category: string;
  createdAt: Date;
  lastUpdated: Date;
  favicon?: string;
  totp?: string;
}

const mockPasswordEntries: PasswordEntry[] = [
  {
    id: '1',
    title: 'Google Account',
    username: 'john.doe',
    email: 'john.doe@gmail.com',
    password: 'SecurePass!@#123',
    website: 'google.com',
    notes: 'Primary personal account',
    category: 'Email & Cloud',
    createdAt: new Date('2024-01-15'),
    lastUpdated: new Date('2024-04-10'),
    favicon: '🔵',
    totp: '123456',
  },
  {
    id: '2',
    title: 'Instagram',
    username: 'johndoe.visual',
    password: 'InstagramPwd#2024',
    website: 'instagram.com',
    notes: 'Personal photography account',
    category: 'Social Media',
    createdAt: new Date('2023-06-20'),
    lastUpdated: new Date('2024-03-22'),
    favicon: '📷',
  },
  {
    id: '3',
    title: 'HDFC Bank',
    username: 'johndoe123',
    password: 'BankSecure@2024$',
    website: 'hdfcbank.com',
    notes: 'Savings account access',
    category: 'Banking',
    createdAt: new Date('2022-11-05'),
    lastUpdated: new Date('2024-04-05'),
    favicon: '🏦',
    totp: '654321',
  },
  {
    id: '4',
    title: 'GitHub',
    username: 'johndoe',
    email: 'john.doe@github.com',
    password: 'GitHubDev@2024#',
    website: 'github.com',
    notes: 'Primary development repository account',
    category: 'Development',
    createdAt: new Date('2021-03-10'),
    lastUpdated: new Date('2024-04-15'),
    favicon: '⚫',
  },
  {
    id: '5',
    title: 'Netflix',
    username: 'john.doe@gmail.com',
    password: 'NetflixPass123!@',
    website: 'netflix.com',
    notes: 'Family plan account',
    category: 'Entertainment',
    createdAt: new Date('2023-02-14'),
    lastUpdated: new Date('2024-02-01'),
    favicon: '🎬',
  },
  {
    id: '6',
    title: 'AWS Console',
    username: 'admin@company.com',
    password: 'AWSAdmin#Security2024',
    website: 'aws.amazon.com',
    notes: 'Production environment access',
    category: 'Development',
    createdAt: new Date('2023-07-18'),
    lastUpdated: new Date('2024-04-12'),
    favicon: '☁️',
    totp: '789012',
  },
  {
    id: '7',
    title: 'Apple ID',
    username: 'john.doe@icloud.com',
    password: 'AppleID@Secure2024',
    website: 'appleid.apple.com',
    notes: 'Main device ecosystem account',
    category: 'Personal',
    createdAt: new Date('2020-09-22'),
    lastUpdated: new Date('2024-04-08'),
    favicon: '🍎',
  },
];

export default function VaultKeyApp() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('lock');
  const [passwords, setPasswords] = useState<PasswordEntry[]>(mockPasswordEntries);
  const [selectedPassword, setSelectedPassword] = useState<PasswordEntry | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleAddPassword = (password: Omit<PasswordEntry, 'id' | 'createdAt' | 'lastUpdated'>) => {
    const newPassword: PasswordEntry = {
      ...password,
      id: String(passwords.length + 1),
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
    setPasswords([...passwords, newPassword]);
    setCurrentScreen('vault');
  };

  const handleUpdatePassword = (id: string, updated: Partial<PasswordEntry>) => {
    const updatedPasswords = passwords.map(p =>
      p.id === id ? { ...p, ...updated, lastUpdated: new Date() } : p
    );
    setPasswords(updatedPasswords);
    const updated_password = updatedPasswords.find(p => p.id === id);
    if (updated_password) {
      setSelectedPassword(updated_password);
    }
  };

  const handleDeletePassword = (id: string) => {
    setPasswords(passwords.filter(p => p.id !== id));
    setCurrentScreen('vault');
  };

  const screenProps = {
    currentScreen,
    setCurrentScreen,
    isUnlocked,
    setIsUnlocked,
    passwords,
    selectedPassword,
    setSelectedPassword,
    onAddPassword: handleAddPassword,
    onUpdatePassword: handleUpdatePassword,
    onDeletePassword: handleDeletePassword,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#04091A] via-[#0A0F1F] to-[#04091A] flex items-center justify-center p-4">
      {/* Mobile phone frame for better visualization */}
      <div className="w-full max-w-md aspect-[9/16] bg-black rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-900 relative">
        {/* Phone bezels and status bar effect */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none">
          {/* Top notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-3xl z-50"></div>
        </div>

        {/* Main content area */}
        <div className="h-full w-full overflow-hidden flex flex-col bg-gradient-to-br from-[#04091A] via-[#0A0F1F] to-[#04091A]">
          {currentScreen === 'lock' && <LockScreen {...screenProps} />}
          {currentScreen === 'masterPassword' && <MasterPasswordScreen {...screenProps} />}
          {currentScreen === 'vault' && <VaultScreen {...screenProps} />}
          {currentScreen === 'addPassword' && <AddPasswordScreen {...screenProps} />}
          {currentScreen === 'passwordDetail' && <PasswordDetailScreen {...screenProps} />}
          {currentScreen === 'generator' && <GeneratorScreen {...screenProps} />}
          {currentScreen === 'settings' && <SettingsScreen {...screenProps} />}
        </div>
      </div>
    </div>
  );
}
