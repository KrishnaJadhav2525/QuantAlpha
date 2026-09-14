'use client';

import React, { useState } from 'react';
import { X, Key, Check } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (newApiKey: string) => void;
  forceFallback?: boolean;
  onToggleForceFallback?: (shouldForce: boolean) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey
}) => {
  const [enteredApiKeyText, setEnteredApiKeyText] = useState(apiKey);
  const [isSaveConfirmationVisible, setIsSaveConfirmationVisible] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSaveConfiguration = () => {
    const trimmedKey = enteredApiKeyText.trim();
    onSaveApiKey(trimmedKey);
    setIsSaveConfirmationVisible(true);

    const closeTimer = setTimeout(() => {
      setIsSaveConfirmationVisible(false);
      onClose();
    }, 800);

    return () => clearTimeout(closeTimer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-zinc-300 rounded-sm max-w-md w-full shadow-2xl relative text-zinc-900 overflow-hidden">
        <div className="flex items-center justify-between bg-zinc-950 p-4 text-white">
          <div>
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider">
              LLM Engine Settings
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Groq openai/gpt-oss-120b
            </p>
          </div>

          <button
            onClick={onClose}
            className="elevated-button-dark p-1 rounded-sm text-zinc-400 hover:text-white"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 font-mono">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700">
              Custom Groq API Key (Optional)
            </label>
            <div className="relative">
              <Key className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="password"
                placeholder="gsk_..."
                value={enteredApiKeyText}
                onChange={(changeEvent) =>
                  setEnteredApiKeyText(changeEvent.target.value)
                }
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-sm text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Leave blank to use the server environment key (<code className="bg-zinc-100 px-1 py-0.5 rounded">GROQ_API_KEY</code>).
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-200">
            <button
              onClick={onClose}
              className="elevated-button-default px-3 py-1.5 rounded-sm text-xs text-zinc-600 hover:text-black"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfiguration}
              className="elevated-button-primary px-3.5 py-1.5 rounded-sm text-xs font-semibold flex items-center space-x-1"
            >
              {isSaveConfirmationVisible ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
