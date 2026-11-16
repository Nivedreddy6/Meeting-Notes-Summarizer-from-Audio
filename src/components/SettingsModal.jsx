import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended - Fastest & High Quality)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-Gen Multimodal)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Ultra Fast & Cost Effective)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Reasoning & Complex Nuance)' }
];

export default function SettingsModal({
  isOpen,
  apiKey,
  model,
  demoMode,
  onClose,
  onSave
}) {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [modelInput, setModelInput] = useState(model);
  const [demoInput, setDemoInput] = useState(demoMode);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      apiKey: keyInput.trim(),
      model: modelInput,
      demoMode: demoInput
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Gemini API & Model Settings</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Google Gemini API Key:</label>
            <div className="input-with-toggle">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy... or AQ.Ab8..."
                className="custom-input"
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide Key' : 'Show Key'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="field-hint">
              Get your free API key at{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
                Google AI Studio
              </a>
              . Key is automatically preserved in your local <code>.env</code>.
            </p>
          </div>

          <div className="form-group">
            <label>GenAI Model:</label>
            <select
              className="custom-select"
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={demoInput}
                onChange={(e) => setDemoInput(e.target.checked)}
              />
              <span>Enable Interactive Demo Mode (Simulate without API key)</span>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
