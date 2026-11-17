# OmniNote AI: Meeting Notes Summarizer from Audio

[![React 19](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)

An intelligent, real-time meeting intelligence platform powered by **Google Gemini Multimodal GenAI** and **React 19**. It ingests meeting audio from files or live microphone recordings to extract structured executive summaries, consensus decisions, interactive action checklists, and full transcripts.

---

## ✨ Features

- **🎙️ Dual Audio Ingestion**: Record meetings live from your microphone or upload any audio file (`.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.webm`, `.flac`).
- **🧠 Direct Multimodal GenAI**: Powered by Gemini 2.5 Flash for simultaneous speech-to-text, speaker diarization, and structured reasoning in a single pass.
- **✅ Interactive Action Items**: Checklist with assignees, due dates, and priority badges (`High`, `Medium`, `Low`). Check off completed tasks with real-time progress tracking.
- **💡 Consensus Decision Log**: Formal records documenting decisions made, rationales, champions, and approval states.
- **📊 Topic Breakdown Timeline**: Segmented agenda flow with estimated duration and discussion summaries.
- **❓ Questions & Risks**: Flags unresolved questions and follow-ups.
- **📜 Searchable Transcript**: Accurate transcript with speaker names and timestamps.
- **💬 Meeting AI Copilot**: Grounded conversational assistant to ask natural language questions about the discussion.
- **📥 One-Click Export**: Export notes to Markdown (`.md`), print-ready PDF, or JSON.
- **⚡ Preloaded Sample Demos**: 3 built-in demo meetings to test the app instantly without uploading audio.

---

## 🔄 How It Works

```
1. CAPTURE         2. ENCODE          3. REASON (GenAI)      4. INTERACT
[Live Mic / File] ──> [Node.js Base64] ──> [Gemini 2.5 Flash] ──> [React 19 UI]
                      JSON Schema          Multimodal Audio       • Action Checklist
                                           Diarization + Logic    • Decision Logs
                                                                  • Meeting Copilot
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ (Node.js v24 recommended)
- **Gemini API Key**: Free from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nivedreddy6/Meeting-Notes-Summarizer-from-Audio.git
   cd Meeting-Notes-Summarizer-from-Audio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your API Key:**
   Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```
   *(You can also input your key directly in the web UI settings modal).*

4. **Start the application:**
   - **Windows 1-Click**: Double-click `start.bat`
   - **Production Mode**:
     ```bash
     npm run build
     node server.js
     ```
   - **Development Mode (HMR)**:
     ```bash
     npm run dev
     ```

5. Open **`http://localhost:3000`** in your browser.

---

## 🎯 Meeting Archetypes

Select specialized extraction personas tailored to your meeting:

| Archetype | Focus & Output |
|---|---|
| **📝 Comprehensive Minutes** | Balanced organizational record with all topics, actions, and decisions |
| **📌 Executive Briefing** | C-Suite TL;DR, financial metrics, ARR goals, and strategic milestones |
| **🏃 Agile / Daily Scrum** | Completed work, current items, blockers, and sprint commitments |
| **🛠️ Technical Architecture** | Architecture Decision Records (ADRs), trade-offs, database metrics |
| **🤝 Client Discovery** | Client pain points, current stack, security requirements, and timelines |

---

## 📁 Project Structure

```
├── src/
│   ├── main.jsx                     # React entrypoint
│   ├── App.jsx                      # Root application state & layout
│   ├── index.css                    # Responsive styling & themes
│   ├── components/
│   │   ├── Header.jsx               # Navigation & connectivity badge
│   │   ├── AudioUploader.jsx        # Drag-and-drop audio upload
│   │   ├── AudioRecorder.jsx        # Live microphone recording
│   │   ├── DemoSelector.jsx         # 1-click sample meeting cards
│   │   ├── AudioPlayerDeck.jsx      # Audio playback & speed bar (1x-2x)
│   │   ├── MeetingHero.jsx          # Executive summary & export bar
│   │   ├── ActionItemsTab.jsx       # Interactive task checklist
│   │   ├── DecisionsTab.jsx         # Consensus & decision logs
│   │   ├── TopicsTab.jsx            # Discussion agenda breakdown
│   │   ├── QuestionsTab.jsx         # Unresolved questions & risks
│   │   ├── TranscriptTab.jsx        # Searchable transcript
│   │   ├── ChatCopilotTab.jsx       # Conversational AI Q&A
│   │   └── SettingsModal.jsx        # API key & model manager
│   └── utils/
│       └── exportUtils.js           # Markdown & file export helpers
├── cli/
│   └── summarizer.py                # Standalone zero-dependency Python CLI
├── public/samples/                  # Preloaded sample meetings & audio
├── server.js                        # Node.js backend streaming server
├── start.bat                        # Windows 1-click launch script
└── package.json                     # Scripts & dependencies
```

---

## 🐍 Standalone Python CLI

For automated terminal or bash scripts without the web browser:

```bash
# Set your API key
set GEMINI_API_KEY=your_api_key_here

# Summarize audio to Markdown
python cli/summarizer.py meeting.mp3 --type "Engineering & Architecture" -o notes.md

# Output raw JSON
python cli/summarizer.py meeting.wav --json > meeting.json
```

---

## 🔒 Security & Privacy

- **Local Execution**: Runs entirely on your local machine (`localhost:3000`).
- **Encrypted Transport**: Audio data is transmitted directly to Google Gemini via encrypted HTTPS TLS 1.3.
- **In-Memory Processing**: Audio is processed in memory and not stored permanently on remote servers.
- **Credential Protection**: Keys in `.env` are excluded via `.gitignore`.

---

## 📄 License

Distributed under the [MIT License](./LICENSE).
