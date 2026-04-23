'use client';

import { useState } from 'react';
import type { ScreenType, PasswordEntry } from '../VaultKeyApp';

interface AddPasswordScreenProps {
  setCurrentScreen: (screen: ScreenType) => void;
  onAddPassword: (password: Omit<PasswordEntry, 'id' | 'createdAt' | 'lastUpdated'>) => void;
}

const CATEGORIES = [
  'Email & Cloud',
  'Social Media',
  'Banking',
  'Development',
  'Entertainment',
  'Personal',
  'Work',
  'Shopping',
  'Other',
];

export default function AddPasswordScreen({
  setCurrentScreen,
  onAddPassword,
}: AddPasswordScreenProps) {
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    email: '',
    password: '',
    website: '',
    notes: '',
    category: 'Personal',
    favicon: '🔐',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*]/.test(pwd)) score++;
    setPasswordStrength(Math.min(score, 5));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'password') {
      calculatePasswordStrength(value);
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.username.trim() && !formData.email.trim()) {
      newErrors.username = 'Username or email is required';
    }
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onAddPassword({
        title: formData.title,
        username: formData.username || formData.email || '',
        email: formData.email,
        password: formData.password,
        website: formData.website,
        notes: formData.notes,
        category: formData.category,
        favicon: formData.favicon,
      });
    }
  };

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['#EF5B5B', '#FF9500', '#FFD700', '#90EE90', '#00D700', '#00A000'];

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
        <h1 className="text-xl font-bold text-white">Add Password</h1>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <FormField
          label="Service/Website Name"
          error={errors.title}
        >
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Gmail, Twitter, Bank..."
            className={`w-full px-3 py-2.5 glass rounded-lg text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50 ${
              errors.title ? 'ring-2 ring-red-500' : ''
            }`}
          />
        </FormField>

        {/* Username & Email */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Username" error={errors.username}>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="username"
              className="w-full px-3 py-2.5 glass rounded-lg text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50"
            />
          </FormField>
          <FormField label="Email">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className="w-full px-3 py-2.5 glass rounded-lg text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50"
            />
          </FormField>
        </div>

        {/* Password */}
        <FormField label="Password" error={errors.password}>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter strong password"
              className={`w-full px-3 py-2.5 glass rounded-lg text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50 pr-10 ${
                errors.password ? 'ring-2 ring-red-500' : ''
              }`}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8B94A8] hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5C7.58 5 3.29 8.3 1.46 13c1.83 4.7 6.12 8 10.54 8s8.71-3.3 10.54-8c-1.83-4.7-6.12-8-10.54-8zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Strength indicator */}
          {formData.password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-full transition-all"
                    style={{
                      backgroundColor:
                        i < passwordStrength ? strengthColors[passwordStrength] : '#1B2D4D',
                    }}
                  ></div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: strengthColors[passwordStrength] }}>
                  {strengthLabels[passwordStrength] || 'Very Strong'}
                </p>
                <button
                  onClick={() => setCurrentScreen('generator')}
                  className="text-xs text-[#5B8DEF] hover:text-[#4A7FD4] transition-colors"
                >
                  Generate →
                </button>
              </div>
            </div>
          )}
        </FormField>

        {/* Website */}
        <FormField label="Website (optional)">
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://example.com"
            className="w-full px-3 py-2.5 glass rounded-lg text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50"
          />
        </FormField>

        {/* Category */}
        <FormField label="Category">
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2.5 glass rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat} className="bg-[#0F1729] text-white">
                {cat}
              </option>
            ))}
          </select>
        </FormField>

        {/* Notes */}
        <FormField label="Notes (optional)">
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any notes or additional info..."
            rows={3}
            className="w-full px-3 py-2.5 glass rounded-lg text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50 resize-none"
          />
        </FormField>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-t from-[#04091A]/50 to-transparent space-y-2">
        <button
          onClick={handleSubmit}
          className="w-full py-3 gradient-button text-white rounded-lg font-semibold transition-all"
        >
          Save Password
        </button>
        <button
          onClick={() => setCurrentScreen('vault')}
          className="w-full py-2 text-[#8B94A8] hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-white text-sm font-medium mb-2">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
