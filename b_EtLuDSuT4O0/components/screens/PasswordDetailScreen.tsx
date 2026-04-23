'use client';

import { useState } from 'react';
import type { ScreenType, PasswordEntry } from '../VaultKeyApp';

interface PasswordDetailScreenProps {
  setCurrentScreen: (screen: ScreenType) => void;
  selectedPassword: PasswordEntry | null;
  onUpdatePassword: (id: string, updated: Partial<PasswordEntry>) => void;
  onDeletePassword: (id: string) => void;
}

export default function PasswordDetailScreen({
  setCurrentScreen,
  selectedPassword,
  onUpdatePassword,
  onDeletePassword,
}: PasswordDetailScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [totpCountdown, setTotpCountdown] = useState(30);

  // TOTP countdown effect
  useState(() => {
    if (!selectedPassword?.totp) return;

    const interval = setInterval(() => {
      setTotpCountdown(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  });

  if (!selectedPassword) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[#8B94A8]">No password selected</p>
      </div>
    );
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDelete = () => {
    onDeletePassword(selectedPassword.id);
    setCurrentScreen('vault');
  };

  const daysSinceUpdate = Math.floor(
    (Date.now() - selectedPassword.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-[#0A0F1F] to-[#04091A]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('vault')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{selectedPassword.title}</h1>
            <p className="text-[#8B94A8] text-xs">{selectedPassword.category}</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 glass rounded-lg hover:bg-white/15 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isEditing ? (
          <EditPasswordForm
            password={selectedPassword}
            onSave={(updated) => {
              onUpdatePassword(selectedPassword.id, updated);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-4">
            {/* Password Field */}
            <DetailField
              label="Password"
              value={selectedPassword.password}
              isSensitive
              onCopy={() => handleCopy(selectedPassword.password, 'password')}
              copied={copiedField === 'password'}
            />

            {/* Username */}
            {selectedPassword.username && (
              <DetailField
                label="Username"
                value={selectedPassword.username}
                onCopy={() => handleCopy(selectedPassword.username, 'username')}
                copied={copiedField === 'username'}
              />
            )}

            {/* Email */}
            {selectedPassword.email && (
              <DetailField
                label="Email"
                value={selectedPassword.email}
                onCopy={() => handleCopy(selectedPassword.email!, 'email')}
                copied={copiedField === 'email'}
              />
            )}

            {/* Website */}
            {selectedPassword.website && (
              <DetailField
                label="Website"
                value={selectedPassword.website}
                isLink
                onCopy={() => handleCopy(selectedPassword.website!, 'website')}
                copied={copiedField === 'website'}
              />
            )}

            {/* TOTP if available */}
            {selectedPassword.totp && (
              <div className="p-4 glass rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white text-sm font-medium">Two-Factor Code</label>
                  <div className="w-6 h-6 rounded-full border-2 border-[#5B8DEF]" style={{ borderTopColor: 'transparent', animation: `spin ${totpCountdown}s linear infinite` }}></div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-[#0F1729]/50 rounded-lg text-[#5B8DEF] font-mono text-lg tracking-widest text-center">
                    {selectedPassword.totp}
                  </code>
                  <button
                    onClick={() => handleCopy(selectedPassword.totp!, 'totp')}
                    className="p-2 glass-sm hover:bg-white/15 rounded transition-colors flex-shrink-0"
                  >
                    {copiedField === 'totp' ? (
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[#8B94A8] text-xs mt-2">Expires in {totpCountdown}s</p>
              </div>
            )}

            {/* Notes */}
            {selectedPassword.notes && (
              <div className="p-4 glass rounded-xl">
                <label className="text-white text-sm font-medium block mb-2">Notes</label>
                <p className="text-[#8B94A8] text-sm">{selectedPassword.notes}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8B94A8]">Created</span>
                <span className="text-white">{selectedPassword.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#8B94A8]">Last Updated</span>
                <span className="text-white">
                  {daysSinceUpdate === 0
                    ? 'Today'
                    : daysSinceUpdate === 1
                    ? 'Yesterday'
                    : `${daysSinceUpdate} days ago`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-t from-[#04091A]/50 to-transparent space-y-2">
        {isEditing ? (
          <button
            onClick={() => setIsEditing(false)}
            className="w-full py-2 text-[#8B94A8] hover:text-white text-sm transition-colors"
          >
            Close Editor
          </button>
        ) : (
          <>
            <button
              onClick={() => setCurrentScreen('generator')}
              className="w-full py-2 glass text-white rounded-lg font-semibold hover:bg-white/15 transition-all"
            >
              Generate New Password
            </button>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2 text-red-400 text-sm hover:text-red-300 transition-colors"
              >
                Delete Password
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-red-400 text-xs text-center">Are you sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 bg-red-500/30 hover:bg-red-500/40 text-red-400 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 glass text-white rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

interface DetailFieldProps {
  label: string;
  value: string;
  isSensitive?: boolean;
  isLink?: boolean;
  onCopy: () => void;
  copied: boolean;
}

function DetailField({
  label,
  value,
  isSensitive,
  isLink,
  onCopy,
  copied,
}: DetailFieldProps) {
  const [showValue, setShowValue] = useState(!isSensitive);

  return (
    <div className="p-4 glass rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <label className="text-white text-sm font-medium">{label}</label>
        <button
          onClick={onCopy}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            copied
              ? 'bg-green-500/30 text-green-400'
              : 'text-[#8B94A8] hover:text-white'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="flex items-center gap-2">
        {isSensitive && (
          <button
            onClick={() => setShowValue(!showValue)}
            className="text-[#8B94A8] hover:text-white transition-colors flex-shrink-0"
          >
            {showValue ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5C7.58 5 3.29 8.3 1.46 13c1.83 4.7 6.12 8 10.54 8s8.71-3.3 10.54-8c-1.83-4.7-6.12-8-10.54-8zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
              </svg>
            )}
          </button>
        )}
        {isLink && showValue ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-[#5B8DEF] hover:text-[#4A7FD4] text-sm truncate"
          >
            {value}
          </a>
        ) : (
          <code className="flex-1 text-[#8B94A8] text-sm break-all font-mono">
            {showValue ? value : '•'.repeat(Math.min(value.length, 12))}
          </code>
        )}
      </div>
    </div>
  );
}

interface EditPasswordFormProps {
  password: PasswordEntry;
  onSave: (updated: Partial<PasswordEntry>) => void;
  onCancel: () => void;
}

function EditPasswordForm({ password, onSave, onCancel }: EditPasswordFormProps) {
  const [formData, setFormData] = useState({
    username: password.username,
    email: password.email || '',
    password: password.password,
    website: password.website || '',
    notes: password.notes || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <FormField label="Username">
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="w-full px-3 py-2 glass rounded-lg text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50"
        />
      </FormField>

      <FormField label="Email">
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 glass rounded-lg text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50"
        />
      </FormField>

      <FormField label="Password">
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-3 py-2 glass rounded-lg text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50"
        />
      </FormField>

      <FormField label="Website">
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className="w-full px-3 py-2 glass rounded-lg text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50"
        />
      </FormField>

      <FormField label="Notes">
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 glass rounded-lg text-white placeholder-[#8B94A8] focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]/50 bg-[#0F1729]/50 resize-none"
        />
      </FormField>

      <div className="flex gap-2 pt-4">
        <button
          onClick={handleSave}
          className="flex-1 py-2 gradient-button text-white rounded-lg font-semibold transition-all"
        >
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 glass text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-white text-sm font-medium mb-2">{label}</label>
      {children}
    </div>
  );
}
