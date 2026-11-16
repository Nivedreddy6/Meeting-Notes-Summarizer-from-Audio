/**
 * OmniNote AI - Client Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- State ---
  const state = {
    apiKey: localStorage.getItem('omninote_api_key') || '',
    model: localStorage.getItem('omninote_model') || 'gemini-2.5-flash',
    demoMode: localStorage.getItem('omninote_demo_mode') === 'true',
    activeAudioBlob: null,
    activeAudioUrl: null,
    activeAudioName: '',
    meetingData: null,
    chatHistory: [],
    mediaRecorder: null,
    audioChunks: [],
    recordStartTime: 0,
    recordTimerInterval: null,
    audioContext: null,
    analyser: null,
    animFrameId: null
  };

  // --- DOM Elements ---
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const modelSelect = document.getElementById('modelSelect');
  const demoModeToggle = document.getElementById('demoModeToggle');
  const saveKeyLocallyBtn = document.getElementById('saveKeyLocallyBtn');
  const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');

  // Input tabs
  const tabTriggers = document.querySelectorAll('.tab-trigger');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // File Upload
  const dropZone = document.getElementById('dropZone');
  const audioFileInput = document.getElementById('audioFileInput');
  const browseFileBtn = document.getElementById('browseFileBtn');
  const selectedFileInfo = document.getElementById('selectedFileInfo');
  const selectedFileName = document.getElementById('selectedFileName');
  const selectedFileSize = document.getElementById('selectedFileSize');
  const removeFileBtn = document.getElementById('removeFileBtn');

  // Recording
  const startRecordBtn = document.getElementById('startRecordBtn');
  const pauseRecordBtn = document.getElementById('pauseRecordBtn');
  const stopRecordBtn = document.getElementById('stopRecordBtn');
  const recordingTimer = document.getElementById('recordingTimer');
  const recordVisualizer = document.getElementById('recordVisualizer');
  const recordHelpText = document.getElementById('recordHelpText');

  // Demos
  const loadSampleBtns = document.querySelectorAll('.btn-load-sample');

  // Generation
  const meetingTypeSelect = document.getElementById('meetingTypeSelect');
  const customPromptInput = document.getElementById('customPromptInput');
  const summarizeBtn = document.getElementById('summarizeBtn');

  // Audio Player Deck
  const audioPlayerDeck = document.getElementById('audioPlayerDeck');
  const mainAudioElement = document.getElementById('mainAudioElement');
  const deckPlayBtn = document.getElementById('deckPlayBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const deckTrackTitle = document.getElementById('deckTrackTitle');
  const deckTimeDisplay = document.getElementById('deckTimeDisplay');
  const deckSeekBar = document.getElementById('deckSeekBar');
  const speedBtns = document.querySelectorAll('.speed-btn');

  // Processing & Results
  const processingCard = document.getElementById('processingCard');
  const processingStepTitle = document.getElementById('processingStepTitle');
  const processingStepSubtitle = document.getElementById('processingStepSubtitle');
  const resultsSection = document.getElementById('resultsSection');

  // Results Hero Elements
  const badgeMeetingType = document.getElementById('badgeMeetingType');
  const displayMeetingTitle = document.getElementById('displayMeetingTitle');
  const displayDate = document.getElementById('displayDate');
  const displayDuration = document.getElementById('displayDuration');
  const displaySentiment = document.getElementById('displaySentiment');
  const displayExecutiveSummary = document.getElementById('displayExecutiveSummary');
  const displayParticipantsList = document.getElementById('displayParticipantsList');

  // Counts & Panels
  const countActionItems = document.getElementById('countActionItems');
  const countDecisions = document.getElementById('countDecisions');
  const countQuestions = document.getElementById('countQuestions');
  const resTabBtns = document.querySelectorAll('.res-tab-btn');
  const resPanels = document.querySelectorAll('.res-panel');

  // Content Containers
  const actionItemsList = document.getElementById('actionItemsList');
  const decisionsList = document.getElementById('decisionsList');
  const topicsList = document.getElementById('topicsList');
  const questionsList = document.getElementById('questionsList');
  const transcriptContainer = document.getElementById('transcriptContainer');
  const transcriptSearchInput = document.getElementById('transcriptSearchInput');
  const filterPills = document.querySelectorAll('.filter-pill');

  // Chat Copilot
  const chatMessagesBox = document.getElementById('chatMessagesBox');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const quickChips = document.querySelectorAll('.quick-chip');

  // Actions
  const copyMarkdownBtn = document.getElementById('copyMarkdownBtn');
  const downloadMarkdownBtn = document.getElementById('downloadMarkdownBtn');
  const printReportBtn = document.getElementById('printReportBtn');
  const downloadJsonBtn = document.getElementById('downloadJsonBtn');
  const toastNotification = document.getElementById('toastNotification');

  // --- Initial Setup ---
  init();

  async function init() {
    apiKeyInput.value = state.apiKey;
    modelSelect.value = state.model;
    demoModeToggle.checked = state.demoMode;

    // Fetch server config to check if .env has a key
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const config = await res.json();
        if (config.hasEnvKey && !state.apiKey) {
          state.hasServerEnvKey = true;
        }
      }
    } catch (_) {}

    updateStatusUI();
    setupEventListeners();
  }

  function updateStatusUI() {
    if (state.apiKey || state.hasServerEnvKey) {
      statusBadge.className = 'status-badge live-active';
      statusText.textContent = `${state.model} Active`;
    } else {
      statusBadge.className = 'status-badge demo-active';
      statusText.textContent = 'Demo Mode (No API key)';
    }
  }

  function showToast(message) {
    toastNotification.textContent = message;
    toastNotification.classList.remove('hidden');
    setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 3000);
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Settings modal
    openSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) settingsModal.classList.add('hidden');
    });

    toggleKeyVisibility.addEventListener('click', () => {
      apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
    });

    saveKeyLocallyBtn.addEventListener('click', async () => {
      state.apiKey = apiKeyInput.value.trim();
      state.model = modelSelect.value;
      state.demoMode = demoModeToggle.checked;
      localStorage.setItem('omninote_api_key', state.apiKey);
      localStorage.setItem('omninote_model', state.model);
      localStorage.setItem('omninote_demo_mode', state.demoMode ? 'true' : 'false');

      // Also persist to server .env if possible
      if (state.apiKey) {
        try {
          await fetch('/api/save-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: state.apiKey })
          });
        } catch (_) {}
      }

      updateStatusUI();
      settingsModal.classList.add('hidden');
      showToast('Settings saved successfully!');
    });

    // Input Tabs
    tabTriggers.forEach(btn => {
      btn.addEventListener('click', () => {
        tabTriggers.forEach(t => t.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetPanel = document.getElementById(btn.dataset.tab);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // File Upload / Dropzone
    browseFileBtn.addEventListener('click', () => audioFileInput.click());
    audioFileInput.addEventListener('change', handleFileSelect);

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        handleAudioFile(e.dataTransfer.files[0]);
      }
    });

    removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearActiveAudio();
    });

    // Audio Recorder
    startRecordBtn.addEventListener('click', startRecording);
    pauseRecordBtn.addEventListener('click', togglePauseRecording);
    stopRecordBtn.addEventListener('click', stopRecording);

    // Load Sample Demos
    loadSampleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sampleKey = e.currentTarget.dataset.sample;
        loadSampleMeeting(sampleKey);
      });
    });

    // Audio Deck Playback Controls
    deckPlayBtn.addEventListener('click', toggleAudioPlay);
    mainAudioElement.addEventListener('timeupdate', updateAudioProgress);
    mainAudioElement.addEventListener('ended', () => {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    });
    deckSeekBar.addEventListener('input', (e) => {
      if (mainAudioElement.duration) {
        mainAudioElement.currentTime = (e.target.value / 100) * mainAudioElement.duration;
      }
    });
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mainAudioElement.playbackRate = parseFloat(btn.dataset.speed);
      });
    });

    // Summarize Action
    summarizeBtn.addEventListener('click', executeSummarization);

    // Results Tab Switching
    resTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        resTabBtns.forEach(b => b.classList.remove('active'));
        resPanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetPanel = document.getElementById(btn.dataset.target);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // Task Filter Pills
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        filterTasks(pill.dataset.filter);
      });
    });

    // Search Transcript
    transcriptSearchInput.addEventListener('input', (e) => {
      filterTranscript(e.target.value.toLowerCase());
    });

    // Chat Copilot
    chatForm.addEventListener('submit', handleChatSubmit);
    quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        chatInput.value = chip.dataset.q;
        handleChatSubmit(new Event('submit'));
      });
    });

    // Export Options
    copyMarkdownBtn.addEventListener('click', copyMarkdownToClipboard);
    downloadMarkdownBtn.addEventListener('click', downloadMarkdownFile);
    printReportBtn.addEventListener('click', () => window.print());
    downloadJsonBtn.addEventListener('click', downloadJsonFile);
  }

  // --- Audio Handling ---
  function handleFileSelect(e) {
    if (e.target.files.length) {
      handleAudioFile(e.target.files[0]);
    }
  }

  function handleAudioFile(file) {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i)) {
      alert('Please upload a valid audio file (MP3, WAV, M4A, AAC, OGG, WEBM, FLAC).');
      return;
    }

    state.activeAudioBlob = file;
    state.activeAudioName = file.name;
    const url = URL.createObjectURL(file);
    state.activeAudioUrl = url;

    // Update UI
    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = formatBytes(file.size);
    selectedFileInfo.classList.remove('hidden');

    setupAudioPlayer(url, file.name);
    showToast(`Loaded ${file.name}`);
  }

  function clearActiveAudio() {
    state.activeAudioBlob = null;
    state.activeAudioUrl = null;
    state.activeAudioName = '';
    audioFileInput.value = '';
    selectedFileInfo.classList.add('hidden');
    audioPlayerDeck.classList.add('hidden');
    mainAudioElement.src = '';
  }

  function setupAudioPlayer(src, title) {
    mainAudioElement.src = src;
    deckTrackTitle.textContent = title || 'Audio Recording';
    audioPlayerDeck.classList.remove('hidden');
    deckSeekBar.value = 0;
    deckTimeDisplay.textContent = '00:00 / 00:00';
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
  }

  function toggleAudioPlay() {
    if (mainAudioElement.paused) {
      mainAudioElement.play();
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    } else {
      mainAudioElement.pause();
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    }
  }

  function updateAudioProgress() {
    if (mainAudioElement.duration) {
      const current = mainAudioElement.currentTime;
      const total = mainAudioElement.duration;
      deckSeekBar.value = (current / total) * 100;
      deckTimeDisplay.textContent = `${formatTime(current)} / ${formatTime(total)}`;
    }
  }

  // --- Microphone Recording ---
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.audioChunks = [];

      state.mediaRecorder = new MediaRecorder(stream);
      state.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) state.audioChunks.push(e.data);
      };

      state.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
        state.activeAudioBlob = audioBlob;
        state.activeAudioName = `Meeting_Recording_${new Date().toISOString().slice(0, 10)}.webm`;
        const audioUrl = URL.createObjectURL(audioBlob);
        state.activeAudioUrl = audioUrl;

        setupAudioPlayer(audioUrl, state.activeAudioName);
        stream.getTracks().forEach(track => track.stop());
        cancelAnimationFrame(state.animFrameId);
        showToast('Meeting recorded successfully!');
      };

      state.mediaRecorder.start(250);
      state.recordStartTime = Date.now();

      // Setup Web Audio Analyser for canvas animation
      setupVisualizer(stream);

      // UI state
      startRecordBtn.classList.add('recording');
      startRecordBtn.classList.add('hidden');
      pauseRecordBtn.classList.remove('hidden');
      stopRecordBtn.classList.remove('hidden');
      recordHelpText.textContent = 'Recording in progress... Speak clearly into your microphone.';

      state.recordTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.recordStartTime) / 1000);
        recordingTimer.textContent = formatTime(elapsed);
      }, 500);

    } catch (err) {
      alert('Microphone access denied or unavailable: ' + err.message);
    }
  }

  function togglePauseRecording() {
    if (!state.mediaRecorder) return;
    if (state.mediaRecorder.state === 'recording') {
      state.mediaRecorder.pause();
      pauseRecordBtn.textContent = 'Resume';
      recordHelpText.textContent = 'Recording paused.';
    } else if (state.mediaRecorder.state === 'paused') {
      state.mediaRecorder.resume();
      pauseRecordBtn.textContent = 'Pause';
      recordHelpText.textContent = 'Recording resumed.';
    }
  }

  function stopRecording() {
    if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
      state.mediaRecorder.stop();
      clearInterval(state.recordTimerInterval);

      startRecordBtn.classList.remove('recording');
      startRecordBtn.classList.remove('hidden');
      pauseRecordBtn.classList.add('hidden');
      stopRecordBtn.classList.add('hidden');
      recordHelpText.textContent = 'Recording captured. Click "Summarize with GenAI" below.';
    }
  }

  function setupVisualizer(stream) {
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const source = state.audioContext.createMediaStreamSource(stream);
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 128;
    source.connect(state.analyser);

    const canvas = recordVisualizer;
    const ctx = canvas.getContext('2d');
    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      state.animFrameId = requestAnimationFrame(draw);
      state.analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#38bdf8');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    }
    draw();
  }

  // --- Load Preloaded Sample Meeting Demos ---
  async function loadSampleMeeting(sampleKey) {
    try {
      showProcessing('Loading Pre-analyzed Sample Meeting...', 'Fetching transcript and intelligence data.');
      // Use relative path for compatibility with both HTTP server and file:// protocol
      const res = await fetch(`./samples/${sampleKey}.json`);
      if (!res.ok) throw new Error('Could not load sample file');
      const data = await res.json();

      // Set sample audio if available
      state.activeAudioUrl = './samples/sample_meeting_clip.wav';
      state.activeAudioName = `${data.meetingTitle}.wav`;
      setupAudioPlayer(state.activeAudioUrl, state.activeAudioName);

      setTimeout(() => {
        hideProcessing();
        renderMeetingIntelligence(data);
        showToast(`Loaded "${data.meetingTitle}"`);
      }, 500);
    } catch (err) {
      hideProcessing();
      alert('Error loading sample: ' + err.message);
    }
  }

  // --- Execute GenAI Summarization ---
  async function executeSummarization() {
    const meetingType = meetingTypeSelect.value;
    const customPrompt = customPromptInput.value.trim();

    // Check if audio is present
    if (!state.activeAudioBlob) {
      // Suggest loading a demo if no audio uploaded
      const confirmDemo = confirm('No audio file or recording found. Would you like to load the "Q4 Sprint Planning & Architecture" sample meeting?');
      if (confirmDemo) {
        loadSampleMeeting('sprint_sync');
      }
      return;
    }

    showProcessing('Encoding audio stream...', 'Preparing audio payload for Gemini Multimodal Audio analysis.');

    try {
      // Convert audio blob to base64
      const base64Audio = await blobToBase64(state.activeAudioBlob);
      const mimeType = state.activeAudioBlob.type || 'audio/mp3';

      processingStepTitle.textContent = 'Analyzing with Gemini Multimodal AI...';
      processingStepSubtitle.textContent = 'Transcribing speech, identifying speakers, and generating structured notes.';

      const apiKeyToUse = state.apiKey;
      const selectedModel = state.model || 'gemini-2.5-flash';

      let resJson = null;

      // Try server proxy first; if not on server or proxy fails, fallback to direct browser client call
      try {
        const response = await fetch('/api/summarize-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: mimeType,
            model: selectedModel,
            meetingType: meetingType,
            customPrompt: customPrompt,
            apiKey: apiKeyToUse
          })
        });

        if (response.ok) {
          resJson = await response.json();
        } else {
          const errData = await response.json().catch(() => ({}));
          if (errData.error === 'MISSING_API_KEY') {
            const proceedWithDemo = confirm(
              'No Gemini API Key was found.\n\nWould you like to experience the full app using our rich demonstration meeting intelligence model?'
            );
            if (proceedWithDemo) {
              loadSampleMeeting('sprint_sync');
              return;
            } else {
              settingsModal.classList.remove('hidden');
              hideProcessing();
              return;
            }
          }
          throw new Error(errData.message || errData.error || 'Server error');
        }
      } catch (serverErr) {
        // Fallback: Direct Gemini API Call from Browser
        if (apiKeyToUse) {
          console.log('Using direct client-side Gemini API call...');
          const prompt = constructPrompt(meetingType, customPrompt);
          const directEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKeyToUse}`;
          const directResp = await fetch(directEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [
                  { inlineData: { mimeType: mimeType, data: base64Audio } },
                  { text: prompt }
                ]
              }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json'
              }
            })
          });

          if (!directResp.ok) {
            const errTxt = await directResp.text();
            throw new Error(`Gemini API error: ${errTxt}`);
          }

          const rawData = await directResp.json();
          let text = rawData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            text = text.trim();
            if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
            resJson = { summary: JSON.parse(text) };
          }
        } else {
          throw serverErr;
        }
      }

      hideProcessing();

      if (resJson && resJson.summary) {
        renderMeetingIntelligence(resJson.summary);
        showToast('Meeting intelligence generated successfully!');
      } else {
        throw new Error('Received invalid meeting response from AI model.');
      }

    } catch (err) {
      hideProcessing();
      console.error('Summarization failed:', err);
      alert('Error during AI summarization: ' + err.message);
    }
  }

  function constructPrompt(meetingType, customPrompt) {
    return `
You are an elite Executive Assistant and AI Meeting Intelligence Specialist.
Analyze the provided meeting audio with extreme precision. Extract every detail, identify distinct speakers, evaluate sentiment, and produce a high-value, structured meeting brief.

Format your entire output strictly as valid JSON matching this exact structure:
{
  "meetingTitle": "Descriptive title of the meeting",
  "meetingType": "${meetingType || 'Comprehensive Minutes'}",
  "date": "Estimated date",
  "duration": "Estimated duration",
  "participants": [
    {"name": "Speaker Name / Role", "role": "Role / Title"}
  ],
  "sentiment": "Overall tone and team dynamic",
  "executiveSummary": "A concise executive summary paragraph capturing core purpose, key outcomes, and macro status.",
  "keyDecisions": [
    {
      "id": "dec-1",
      "decision": "Concrete decision made",
      "rationale": "Why this decision was made",
      "champion": "Key proponent or owner",
      "status": "Approved / Deferred / Proposed"
    }
  ],
  "actionItems": [
    {
      "id": "act-1",
      "task": "Specific actionable task description",
      "assignee": "Full Name or Role",
      "priority": "High / Medium / Low",
      "dueDate": "Mentioned deadline",
      "completed": false
    }
  ],
  "unresolvedQuestions": [
    {
      "question": "Important question raised but not conclusively answered",
      "context": "Context",
      "owner": "Who is expected to investigate"
    }
  ],
  "topics": [
    {
      "topic": "Topic Heading",
      "duration": "Estimated time",
      "summary": "Detailed notes on what was discussed."
    }
  ],
  "transcript": [
    {
      "timestamp": "MM:SS",
      "speaker": "Speaker Name",
      "text": "Transcribed speech segment"
    }
  ]
}

Ensure all action items have specific owners and priority levels. Output raw JSON only.
${customPrompt ? `Additional user instructions: ${customPrompt}` : ''}
    `;
  }

  // --- Render Meeting Intelligence View ---
  function renderMeetingIntelligence(data) {
    state.meetingData = data;
    state.chatHistory = []; // Reset chat history for new meeting

    // Reset Chat Messages box
    chatMessagesBox.innerHTML = `
      <div class="chat-bubble bot">
        <p>Hello! I have fully processed the meeting "<strong>${escapeHtml(data.meetingTitle || 'Meeting')}</strong>". Ask me any questions about decisions, deadlines, or participant viewpoints.</p>
      </div>
    `;

    // Hero Overview
    badgeMeetingType.textContent = data.meetingType || 'Comprehensive Minutes';
    displayMeetingTitle.textContent = data.meetingTitle || 'Meeting Summary';
    displayDate.textContent = `📅 ${data.date || 'Today'}`;
    displayDuration.textContent = `⏱️ ${data.duration || 'Session'}`;
    displaySentiment.textContent = `💡 ${data.sentiment || 'Constructive'}`;
    displayExecutiveSummary.textContent = data.executiveSummary || 'No executive summary available.';

    // Participants
    displayParticipantsList.innerHTML = '';
    if (Array.isArray(data.participants) && data.participants.length) {
      data.participants.forEach(p => {
        const tag = document.createElement('div');
        tag.className = 'attendee-tag';
        tag.innerHTML = `👤 <span>${escapeHtml(p.name)}</span> <span class="attendee-role">(${escapeHtml(p.role || 'Attendee')})</span>`;
        displayParticipantsList.appendChild(tag);
      });
    } else {
      displayParticipantsList.innerHTML = '<span class="attendee-tag">All Attendees</span>';
    }

    // Counts
    countActionItems.textContent = (data.actionItems || []).length;
    countDecisions.textContent = (data.keyDecisions || []).length;
    countQuestions.textContent = (data.unresolvedQuestions || []).length;

    // Render Panels
    renderActionItems(data.actionItems || []);
    renderDecisions(data.keyDecisions || []);
    renderTopics(data.topics || []);
    renderQuestions(data.unresolvedQuestions || []);
    renderTranscript(data.transcript || []);

    // Show Results Section
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderActionItems(items) {
    actionItemsList.innerHTML = '';
    if (!items.length) {
      actionItemsList.innerHTML = '<p class="text-dim">No specific action items detected.</p>';
      return;
    }

    items.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = `task-item-card ${item.completed ? 'completed' : ''}`;
      card.dataset.id = item.id || `task-${idx}`;
      card.dataset.priority = item.priority || 'Medium';

      const priorityClass = `priority-${(item.priority || 'medium').toLowerCase()}`;

      card.innerHTML = `
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${item.completed ? 'checked' : ''}>
          <span class="task-text">${escapeHtml(item.task)}</span>
        </div>
        <div class="task-right">
          <span class="task-assignee">👤 ${escapeHtml(item.assignee || 'Unassigned')}</span>
          <span class="task-due">📅 ${escapeHtml(item.dueDate || 'Pending')}</span>
          <span class="priority-badge ${priorityClass}">${escapeHtml(item.priority || 'Medium')}</span>
        </div>
      `;

      const checkbox = card.querySelector('.task-checkbox');
      checkbox.addEventListener('change', (e) => {
        item.completed = e.target.checked;
        card.classList.toggle('completed', item.completed);
      });

      actionItemsList.appendChild(card);
    });
  }

  function filterTasks(filter) {
    const cards = actionItemsList.querySelectorAll('.task-item-card');
    cards.forEach(card => {
      const isCompleted = card.classList.contains('completed');
      const priority = card.dataset.priority;

      if (filter === 'all') {
        card.style.display = 'flex';
      } else if (filter === 'pending') {
        card.style.display = isCompleted ? 'none' : 'flex';
      } else if (filter === 'completed') {
        card.style.display = isCompleted ? 'flex' : 'none';
      } else if (filter === 'High') {
        card.style.display = priority === 'High' ? 'flex' : 'none';
      }
    });
  }

  function renderDecisions(decisions) {
    decisionsList.innerHTML = '';
    if (!decisions.length) {
      decisionsList.innerHTML = '<p class="text-dim">No formal decisions logged in this meeting.</p>';
      return;
    }

    decisions.forEach(dec => {
      const card = document.createElement('div');
      card.className = 'decision-card';
      const statusClass = dec.status?.toLowerCase().includes('deferred') ? 'status-deferred' : 'status-approved';

      card.innerHTML = `
        <h4>💡 ${escapeHtml(dec.decision)}</h4>
        <p class="decision-rationale">${escapeHtml(dec.rationale || '')}</p>
        <div class="decision-footer">
          <span class="decision-champion">Owner: <strong>${escapeHtml(dec.champion || 'Consensus')}</strong></span>
          <span class="decision-status ${statusClass}">${escapeHtml(dec.status || 'Approved')}</span>
        </div>
      `;
      decisionsList.appendChild(card);
    });
  }

  function renderTopics(topics) {
    topicsList.innerHTML = '';
    if (!topics.length) {
      topicsList.innerHTML = '<p class="text-dim">No topic breakdown available.</p>';
      return;
    }

    topics.forEach((topic, i) => {
      const card = document.createElement('div');
      card.className = 'topic-card';
      card.innerHTML = `
        <div class="topic-header">
          <h4>${i + 1}. ${escapeHtml(topic.topic)}</h4>
          <span class="topic-time">${escapeHtml(topic.duration || '')}</span>
        </div>
        <p class="topic-summary">${escapeHtml(topic.summary)}</p>
      `;
      topicsList.appendChild(card);
    });
  }

  function renderQuestions(questions) {
    questionsList.innerHTML = '';
    if (!questions.length) {
      questionsList.innerHTML = '<p class="text-dim">All questions were resolved during the discussion.</p>';
      return;
    }

    questions.forEach(q => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.innerHTML = `
        <h4>❓ ${escapeHtml(q.question)}</h4>
        <p class="question-context">${escapeHtml(q.context || '')}</p>
        <div class="question-owner">Follow-up: ${escapeHtml(q.owner || 'Team')}</div>
      `;
      questionsList.appendChild(card);
    });
  }

  function renderTranscript(transcript) {
    transcriptContainer.innerHTML = '';
    if (!transcript.length) {
      transcriptContainer.innerHTML = '<p class="text-dim">Transcript not generated.</p>';
      return;
    }

    transcript.forEach(line => {
      const row = document.createElement('div');
      row.className = 'transcript-row';
      row.innerHTML = `
        <span class="transcript-time">${escapeHtml(line.timestamp || '00:00')}</span>
        <div class="transcript-content">
          <div class="transcript-speaker">${escapeHtml(line.speaker || 'Speaker')}</div>
          <div class="transcript-text">${escapeHtml(line.text)}</div>
        </div>
      `;
      transcriptContainer.appendChild(row);
    });
  }

  function filterTranscript(query) {
    const rows = transcriptContainer.querySelectorAll('.transcript-row');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? 'flex' : 'none';
    });
  }

  // --- Interactive Chat Copilot ---
  async function handleChatSubmit(e) {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;

    chatInput.value = '';

    // Append user message
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.textContent = query;
    chatMessagesBox.appendChild(userBubble);

    // Append loading bot message
    const botBubble = document.createElement('div');
    botBubble.className = 'chat-bubble bot';
    botBubble.innerHTML = '<em>Consulting meeting notes...</em>';
    chatMessagesBox.appendChild(botBubble);
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingSummary: state.meetingData,
          userQuestion: query,
          chatHistory: state.chatHistory,
          model: state.model,
          apiKey: state.apiKey
        })
      });

      if (!res.ok) throw new Error('Chat API failed');
      const data = await res.json();
      botBubble.textContent = data.reply;

      state.chatHistory.push({ role: 'user', content: query });
      state.chatHistory.push({ role: 'assistant', content: data.reply });
    } catch (err) {
      botBubble.textContent = 'Sorry, I encountered an error answering your question. Please verify your connection or API key.';
    }

    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
  }

  // --- Export Functions ---
  function generateMarkdownString() {
    if (!state.meetingData) return '';
    const d = state.meetingData;

    let md = `# ${d.meetingTitle || 'Meeting Minutes'}\n\n`;
    md += `**Meeting Type:** ${d.meetingType || 'General'}\n`;
    md += `**Date:** ${d.date || 'N/A'} | **Duration:** ${d.duration || 'N/A'}\n`;
    md += `**Sentiment:** ${d.sentiment || 'N/A'}\n\n`;

    md += `### Attendees\n`;
    (d.participants || []).forEach(p => {
      md += `- **${p.name}** (${p.role || 'Attendee'})\n`;
    });
    md += `\n`;

    md += `## 🎯 Executive Summary\n${d.executiveSummary || ''}\n\n`;

    md += `## ✅ Action Items & Tasks\n`;
    (d.actionItems || []).forEach(a => {
      const check = a.completed ? '[x]' : '[ ]';
      md += `- ${check} **${a.task}** — Assignee: *${a.assignee}* | Priority: *${a.priority}* | Due: *${a.dueDate}*\n`;
    });
    md += `\n`;

    md += `## 💡 Key Decisions\n`;
    (d.keyDecisions || []).forEach(dec => {
      md += `### ${dec.decision}\n`;
      md += `- **Rationale:** ${dec.rationale}\n`;
      md += `- **Champion / Owner:** ${dec.champion} | **Status:** ${dec.status}\n\n`;
    });

    md += `## 📊 Topics & Agenda Breakdown\n`;
    (d.topics || []).forEach(t => {
      md += `### ${t.topic} (${t.duration || ''})\n${t.summary}\n\n`;
    });

    if (d.unresolvedQuestions && d.unresolvedQuestions.length) {
      md += `## ❓ Unresolved Questions & Risks\n`;
      d.unresolvedQuestions.forEach(q => {
        md += `- **${q.question}**\n  *Context:* ${q.context} (Owner: ${q.owner})\n`;
      });
      md += `\n`;
    }

    if (d.transcript && d.transcript.length) {
      md += `## 📜 Full Transcript\n`;
      d.transcript.forEach(line => {
        md += `**[${line.timestamp}] ${line.speaker}:** ${line.text}\n\n`;
      });
    }

    return md;
  }

  function copyMarkdownToClipboard() {
    const md = generateMarkdownString();
    if (!md) return;
    navigator.clipboard.writeText(md).then(() => {
      showToast('Markdown notes copied to clipboard!');
    });
  }

  function downloadMarkdownFile() {
    const md = generateMarkdownString();
    if (!md) return;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const filename = `${(state.meetingData?.meetingTitle || 'meeting_notes').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.md`;
    downloadBlob(blob, filename);
  }

  function downloadJsonFile() {
    if (!state.meetingData) return;
    const jsonStr = JSON.stringify(state.meetingData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const filename = `${(state.meetingData?.meetingTitle || 'meeting_data').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.json`;
    downloadBlob(blob, filename);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  }

  // --- Utilities ---
  function showProcessing(title, subtitle) {
    processingStepTitle.textContent = title;
    processingStepSubtitle.textContent = subtitle;
    processingCard.classList.remove('hidden');
    resultsSection.classList.add('hidden');
  }

  function hideProcessing() {
    processingCard.classList.add('hidden');
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        // Strip data:audio/xyz;base64, prefix
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
