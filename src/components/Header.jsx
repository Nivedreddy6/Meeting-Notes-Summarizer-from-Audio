import React from 'react';
import { Mic, Settings } from 'lucide-react';

export default function Header({ statusText, isLiveActive, onOpenSettings }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-icon">
          <Mic size={24} />
        </div>
        <div className="logo-text">
          <h1>
            OmniNote <span className="gradient-text">AI</span>
            <span className="react-badge">React</span>
          </h1>
          <p className="subtitle">Meeting Intelligence & Audio Summarizer</p>
        </div>
      </div>

      <div className="header-right">
        <div className={`status-badge ${isLiveActive ? 'live-active' : 'demo-active'}`}>
          <span className="status-dot"></span>
          <span>{statusText}</span>
        </div>
        <button
          onClick={onOpenSettings}
          className="btn-secondary"
          title="Configure Gemini API Key & Model"
        >
          <Settings size={18} />
          <span>API Settings</span>
        </button>
      </div>
    </header>
  );
}
