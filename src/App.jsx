import React, { useState, useEffect } from 'react';
import { UploadCloud, Mic, Play, Sparkles } from 'lucide-react';

import Header from './components/Header';
import AudioUploader from './components/AudioUploader';
import AudioRecorder from './components/AudioRecorder';
import DemoSelector from './components/DemoSelector';
import AudioPlayerDeck from './components/AudioPlayerDeck';
import MeetingHero from './components/MeetingHero';
import ActionItemsTab from './components/ActionItemsTab';
import DecisionsTab from './components/DecisionsTab';
import TopicsTab from './components/TopicsTab';
import QuestionsTab from './components/QuestionsTab';
import TranscriptTab from './components/TranscriptTab';
import ChatCopilotTab from './components/ChatCopilotTab';
import SettingsModal from './components/SettingsModal';

export default function App() {
  // Config & Auth State
  const [apiKey, setApiKey] = useState(localStorage.getItem('omninote_api_key') || '');
  const [model, setModel] = useState(localStorage.getItem('omninote_model') || 'gemini-2.5-flash');
  const [demoMode, setDemoMode] = useState(localStorage.getItem('omninote_demo_mode') === 'true');
  const [hasServerEnvKey, setHasServerEnvKey] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Audio Input State
  const [activeInputTab, setActiveInputTab] = useState('upload'); // 'upload' | 'record' | 'demos'
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioName, setAudioName] = useState('');

  // Generation Controls
  const [meetingType, setMeetingType] = useState('Comprehensive Minutes');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTitle, setProcessingTitle] = useState('Analyzing Audio with Gemini...');
  const [processingSubtitle, setProcessingSubtitle] = useState('Extracting speech acoustics, identifying speakers, and extracting intelligence.');

  // Results State
  const [meetingData, setMeetingData] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('actionItems');
  const [toastMessage, setToastMessage] = useState(null);

  // Initial load: check server config
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasEnvKey) {
          setHasServerEnvKey(true);
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle File Selection
  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setAudioBlob(file);
    setAudioName(file.name);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    showToast(`Loaded ${file.name}`);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioName('');
  };

  // Handle Recording Complete
  const handleRecordingComplete = (blob, filename) => {
    setSelectedFile(null);
    setAudioBlob(blob);
    setAudioName(filename);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    showToast('Meeting recorded successfully!');
  };

  // Handle Load Pre-analyzed Sample Demo
  const handleLoadSample = async (sampleKey) => {
    try {
      setIsProcessing(true);
      setProcessingTitle('Loading Pre-analyzed Sample Meeting...');
      setProcessingSubtitle('Fetching transcript, decision records, and action items.');

      const res = await fetch(`./samples/${sampleKey}.json`);
      if (!res.ok) throw new Error('Could not load sample file');
      const data = await res.json();

      setAudioUrl('./samples/sample_meeting_clip.wav');
      setAudioName(`${data.meetingTitle}.wav`);

      setTimeout(() => {
        setIsProcessing(false);
        setMeetingData(data);
        showToast(`Loaded "${data.meetingTitle}"`);
      }, 500);
    } catch (err) {
      setIsProcessing(false);
      alert('Error loading sample: ' + err.message);
    }
  };

  // Execute GenAI Summarization
  const handleSummarize = async () => {
    if (!audioBlob) {
      const confirmDemo = confirm(
        'No audio recording or file found.\n\nWould you like to load the "Q4 Sprint Planning & Architecture" sample meeting?'
      );
      if (confirmDemo) {
        handleLoadSample('sprint_sync');
      }
      return;
    }

    setIsProcessing(true);
    setProcessingTitle('Encoding audio stream...');
    setProcessingSubtitle('Preparing audio payload for Gemini Multimodal Audio analysis.');

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const mimeType = audioBlob.type || 'audio/mp3';

      setProcessingTitle('Analyzing with Gemini Multimodal AI...');
      setProcessingSubtitle('Transcribing speech, identifying speakers, and generating structured notes.');

      const response = await fetch('/api/summarize-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType,
          model,
          meetingType,
          customPrompt,
          apiKey
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.error === 'MISSING_API_KEY') {
          const proceedWithDemo = confirm(
            'No Gemini API Key was found.\n\nWould you like to experience the full app using our rich demonstration meeting intelligence model?'
          );
          if (proceedWithDemo) {
            handleLoadSample('sprint_sync');
            return;
          } else {
            setIsSettingsOpen(true);
            setIsProcessing(false);
            return;
          }
        }
        throw new Error(errData.message || errData.error || 'Summarization request failed');
      }

      const resJson = await response.json();
      setIsProcessing(false);

      if (resJson.summary) {
        setMeetingData(resJson.summary);
        showToast('Meeting intelligence generated successfully!');
      } else {
        throw new Error('Received invalid meeting response from AI model.');
      }
    } catch (err) {
      setIsProcessing(false);
      alert('Error during AI summarization: ' + err.message);
    }
  };

  const handleToggleTask = (taskId) => {
    if (!meetingData || !meetingData.actionItems) return;
    const updated = meetingData.actionItems.map((item, idx) => {
      if ((item.id || idx) === taskId) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    setMeetingData({ ...meetingData, actionItems: updated });
  };

  const handleSaveSettings = (newSettings) => {
    setApiKey(newSettings.apiKey);
    setModel(newSettings.model);
    setDemoMode(newSettings.demoMode);
    localStorage.setItem('omninote_api_key', newSettings.apiKey);
    localStorage.setItem('omninote_model', newSettings.model);
    localStorage.setItem('omninote_demo_mode', newSettings.demoMode ? 'true' : 'false');

    // Also persist to server .env
    if (newSettings.apiKey) {
      fetch('/api/save-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newSettings.apiKey })
      }).catch(() => {});
    }

    setIsSettingsOpen(false);
    showToast('Settings saved successfully!');
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        resolve(dataUrl.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const isLiveActive = Boolean(apiKey || hasServerEnvKey);
  const statusText = isLiveActive ? `${model} Active` : 'Demo Mode (No API key)';

  return (
    <>
      <Header
        statusText={statusText}
        isLiveActive={isLiveActive}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="main-container">
        {/* Top Workflow Section */}
        <section className="input-section">
          <div className="tabs-header">
            <button
              className={`tab-trigger ${activeInputTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveInputTab('upload')}
            >
              <UploadCloud size={18} />
              Upload Audio File
            </button>
            <button
              className={`tab-trigger ${activeInputTab === 'record' ? 'active' : ''}`}
              onClick={() => setActiveInputTab('record')}
            >
              <Mic size={18} />
              Record Live Meeting
            </button>
            <button
              className={`tab-trigger ${activeInputTab === 'demos' ? 'active' : ''}`}
              onClick={() => setActiveInputTab('demos')}
            >
              <Play size={18} />
              Sample Meeting Demos
            </button>
          </div>

          {activeInputTab === 'upload' && (
            <AudioUploader
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
            />
          )}

          {activeInputTab === 'record' && (
            <AudioRecorder onRecordingComplete={handleRecordingComplete} />
          )}

          {activeInputTab === 'demos' && (
            <DemoSelector onLoadSample={handleLoadSample} />
          )}

          {/* Archetype & Prompt Options */}
          <div className="generation-bar">
            <div className="archetype-selector">
              <label>Meeting Archetype:</label>
              <select
                className="custom-select"
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
              >
                <option value="Comprehensive Minutes">📝 Comprehensive Meeting Minutes</option>
                <option value="Executive Briefing">📌 Executive Briefing (High-Level C-Suite)</option>
                <option value="Agile / Daily Scrum">🏃 Agile / Daily Scrum Standup</option>
                <option value="Engineering & Architecture">🛠️ Technical Architecture Review</option>
                <option value="Client Discovery & Sales">🤝 Client Discovery & Enterprise Sales</option>
              </select>
            </div>

            <div className="custom-prompt-wrapper">
              <input
                type="text"
                placeholder="Optional: Custom focus prompt (e.g. Focus on budget limits or timeline risks)..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="custom-input"
              />
            </div>

            <button className="btn-generate" onClick={handleSummarize} disabled={isProcessing}>
              <Sparkles size={20} />
              <span>Summarize with GenAI</span>
            </button>
          </div>

          {/* Audio Player Deck */}
          {audioUrl && (
            <AudioPlayerDeck audioUrl={audioUrl} trackTitle={audioName} />
          )}
        </section>

        {/* Processing Indicator */}
        {isProcessing && (
          <section className="processing-card">
            <div className="spinner-ring"></div>
            <h3>{processingTitle}</h3>
            <p>{processingSubtitle}</p>
            <div className="progress-steps">
              <div className="step-dot active">1. Ingest Audio</div>
              <div className="step-dot active">2. Multimodal AI Analysis</div>
              <div className="step-dot active">3. Structure Decisions & Tasks</div>
            </div>
          </section>
        )}

        {/* Results Section */}
        {meetingData && !isProcessing && (
          <section className="results-section">
            <MeetingHero meetingData={meetingData} onShowToast={showToast} />

            {/* Results Navigation Tabs */}
            <div className="results-tabs-nav">
              <button
                className={`res-tab-btn ${activeResultTab === 'actionItems' ? 'active' : ''}`}
                onClick={() => setActiveResultTab('actionItems')}
              >
                ✅ Action Items ({meetingData.actionItems?.length || 0})
              </button>
              <button
                className={`res-tab-btn ${activeResultTab === 'decisions' ? 'active' : ''}`}
                onClick={() => setActiveResultTab('decisions')}
              >
                💡 Key Decisions ({meetingData.keyDecisions?.length || 0})
              </button>
              <button
                className={`res-tab-btn ${activeResultTab === 'topics' ? 'active' : ''}`}
                onClick={() => setActiveResultTab('topics')}
              >
                📊 Agenda & Topics
              </button>
              <button
                className={`res-tab-btn ${activeResultTab === 'questions' ? 'active' : ''}`}
                onClick={() => setActiveResultTab('questions')}
              >
                ❓ Questions & Risks ({meetingData.unresolvedQuestions?.length || 0})
              </button>
              <button
                className={`res-tab-btn ${activeResultTab === 'transcript' ? 'active' : ''}`}
                onClick={() => setActiveResultTab('transcript')}
              >
                📜 Full Transcript
              </button>
              <button
                className={`res-tab-btn highlight ${activeResultTab === 'aiChat' ? 'active' : ''}`}
                onClick={() => setActiveResultTab('aiChat')}
              >
                💬 Ask Meeting AI
              </button>
            </div>

            {/* Tab Contents */}
            <div className="results-tab-content">
              {activeResultTab === 'actionItems' && (
                <ActionItemsTab
                  actionItems={meetingData.actionItems}
                  onToggleTask={handleToggleTask}
                />
              )}
              {activeResultTab === 'decisions' && (
                <DecisionsTab keyDecisions={meetingData.keyDecisions} />
              )}
              {activeResultTab === 'topics' && (
                <TopicsTab topics={meetingData.topics} />
              )}
              {activeResultTab === 'questions' && (
                <QuestionsTab unresolvedQuestions={meetingData.unresolvedQuestions} />
              )}
              {activeResultTab === 'transcript' && (
                <TranscriptTab transcript={meetingData.transcript} />
              )}
              {activeResultTab === 'aiChat' && (
                <ChatCopilotTab
                  meetingData={meetingData}
                  apiKey={apiKey}
                  model={model}
                />
              )}
            </div>
          </section>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        apiKey={apiKey}
        model={model}
        demoMode={demoMode}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      {toastMessage && (
        <div className="toast">{toastMessage}</div>
      )}
    </>
  );
}
