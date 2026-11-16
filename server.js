/**
 * OmniNote AI - Meeting Notes Summarizer from Audio (GENAI)
 * High-performance, zero-external-dependency Node.js server.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Port configuration
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : path.join(__dirname, 'public');
const ENV_PATH = path.join(__dirname, '.env');

// Simple .env parser (zero dependency)
function loadEnv() {
  if (fs.existsSync(ENV_PATH)) {
    try {
      const content = fs.readFileSync(ENV_PATH, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
      console.log('Loaded configuration from .env');
    } catch (err) {
      console.warn('Could not read .env file:', err.message);
    }
  }
}
loadEnv();

// Common MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.webm': 'audio/webm',
  '.ico': 'image/x-icon'
};

// Available Gemini Models
const SUPPORTED_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended - Fastest & High Quality)', default: true },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-Gen Multimodal)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Ultra Fast & Cost Effective)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Reasoning & Complex Nuance)' }
];

// Helper to send JSON responses
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Helper to parse JSON body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    // Support payloads up to 100MB for audio uploads
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100 * 1024 * 1024) {
        reject(new Error('Payload too large (limit: 100MB)'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON payload: ' + e.message));
      }
    });
    req.on('error', err => reject(err));
  });
}

// Construct detailed GenAI prompt based on template type
function getMeetingPrompt(meetingType, customPrompt) {
  const baseInstructions = `
You are an elite Executive Assistant and AI Meeting Intelligence Specialist.
Analyze the provided meeting audio with extreme precision. Extract every detail, identify distinct speakers, evaluate sentiment, and produce a high-value, structured meeting brief.

Format your entire output strictly as valid JSON matching this exact structure:
{
  "meetingTitle": "Descriptive, professional title of the meeting",
  "meetingType": "${meetingType || 'Comprehensive Minutes'}",
  "date": "Estimated or mentioned date (e.g. YYYY-MM-DD or 'Today')",
  "duration": "Estimated duration (e.g. '18 minutes')",
  "participants": [
    {"name": "Speaker Name / Role", "role": "Role / Title"}
  ],
  "sentiment": "Overall tone and team dynamic (e.g., 'Collaborative & High-Energy', 'Strategic & Rigorous')",
  "executiveSummary": "A concise, powerful executive summary paragraph capturing the meeting core purpose, key outcomes, and macro status.",
  "keyDecisions": [
    {
      "id": "dec-1",
      "decision": "Concrete decision made",
      "rationale": "Why this decision was made and context",
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
      "dueDate": "Mentioned deadline or 'Next sprint / EOW'",
      "completed": false
    }
  ],
  "unresolvedQuestions": [
    {
      "question": "Important question raised but not conclusively answered",
      "context": "Brief context surrounding the ambiguity",
      "owner": "Who is expected to investigate"
    }
  ],
  "topics": [
    {
      "topic": "Topic Heading",
      "duration": "Estimated time spent",
      "summary": "Detailed notes on what was discussed, arguments presented, and conclusion."
    }
  ],
  "transcript": [
    {
      "timestamp": "MM:SS",
      "speaker": "Speaker Name",
      "text": "Verbatim or clean transcribed speech segment"
    }
  ]
}

Ensure all action items have specific owners and priority levels.
Do not output markdown code blocks (\`\`\`json). Output raw, unescaped, valid JSON only.
`;

  let specificStyle = '';
  switch (meetingType) {
    case 'Executive Briefing':
      specificStyle = 'Focus heavily on business outcomes, financial/budget metrics, strategic blockers, and high-level milestones.';
      break;
    case 'Agile / Daily Scrum':
      specificStyle = 'Group topic updates into: Completed Tasks, Current Work in Progress, Impediments/Blockers, and Sprint Goal alignment.';
      break;
    case 'Engineering & Architecture':
      specificStyle = 'Capture technical design trade-offs, architecture decisions (ADRs), performance benchmarks, API specs, and technical debt items.';
      break;
    case 'Client Discovery & Sales':
      specificStyle = 'Highlight client pain points, current vendor tools, budget/timeline constraints, security/compliance inquiries, and qualification criteria.';
      break;
    default:
      specificStyle = 'Provide a balanced, thorough, professional record suitable for company-wide distribution.';
  }

  return `${baseInstructions}\n\nSpecialized focus: ${specificStyle}\n${customPrompt ? `Additional user instructions: ${customPrompt}` : ''}`;
}

// Call Google Gemini API
async function callGeminiAudioAPI({ audioBase64, mimeType, model, meetingType, customPrompt, apiKey }) {
  const selectedModel = model || 'gemini-2.5-flash';
  const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!resolvedApiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const promptText = getMeetingPrompt(meetingType, customPrompt);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${resolvedApiKey}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/mp3',
              data: audioBase64
            }
          },
          {
            text: promptText
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errMessage = `Gemini API returned status ${response.status}`;
    try {
      const errJson = JSON.parse(errorBody);
      if (errJson.error && errJson.error.message) {
        errMessage = errJson.error.message;
      }
    } catch (_) {}
    throw new Error(errMessage);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API returned an empty response. The audio may be silent or corrupted.');
  }

  // Sanitize text if wrapped in code fences
  let cleanJsonText = rawText.trim();
  if (cleanJsonText.startsWith('```json')) {
    cleanJsonText = cleanJsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanJsonText.startsWith('```')) {
    cleanJsonText = cleanJsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  return JSON.parse(cleanJsonText);
}

// Gemini Chat Q&A Copilot
async function callGeminiChatAPI({ meetingSummary, userQuestion, chatHistory, model, apiKey }) {
  const selectedModel = model || 'gemini-2.5-flash';
  const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!resolvedApiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const systemContext = `
You are the interactive Meeting AI Copilot. You have full access to the following meeting notes, transcript, and decisions:

--- MEETING SUMMARY ---
Title: ${meetingSummary.meetingTitle || 'Meeting'}
Type: ${meetingSummary.meetingType || 'General'}
Date: ${meetingSummary.date || ''}
Duration: ${meetingSummary.duration || ''}
Executive Summary: ${meetingSummary.executiveSummary || ''}

Key Decisions:
${JSON.stringify(meetingSummary.keyDecisions || [], null, 2)}

Action Items:
${JSON.stringify(meetingSummary.actionItems || [], null, 2)}

Unresolved Questions:
${JSON.stringify(meetingSummary.unresolvedQuestions || [], null, 2)}

Topics Discussed:
${JSON.stringify(meetingSummary.topics || [], null, 2)}

Transcript Excerpts:
${JSON.stringify((meetingSummary.transcript || []).slice(0, 50), null, 2)}
--- END MEETING SUMMARY ---

Answer the user's question directly, accurately, and politely based ONLY on the meeting facts above. If something wasn't mentioned or decided, clearly state that. Cite speaker names or timestamps where relevant.
`;

  const messages = [
    { role: 'user', parts: [{ text: systemContext }] },
    { role: 'model', parts: [{ text: "Understood. I have reviewed the entire meeting record. How can I assist you with this meeting?" }] }
  ];

  if (Array.isArray(chatHistory)) {
    for (const msg of chatHistory) {
      messages.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  }

  messages.push({
    role: 'user',
    parts: [{ text: userQuestion }]
  });

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${resolvedApiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: messages,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini Chat error: ${errorBody}`);
  }

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I could not generate an answer.";
  return { reply };
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // --- API Routes ---
  if (pathname === '/api/health' && req.method === 'GET') {
    return sendJSON(res, 200, {
      status: 'ok',
      uptime: process.uptime(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  }

  if (pathname === '/api/config' && req.method === 'GET') {
    const hasEnvKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    return sendJSON(res, 200, {
      hasEnvKey,
      supportedModels: SUPPORTED_MODELS,
      defaultModel: 'gemini-2.5-flash'
    });
  }

  if (pathname === '/api/save-key' && req.method === 'POST') {
    try {
      const { apiKey } = await parseRequestBody(req);
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
        return sendJSON(res, 400, { error: 'Please provide a valid Gemini API key.' });
      }
      const cleanKey = apiKey.trim();
      process.env.GEMINI_API_KEY = cleanKey;
      fs.writeFileSync(ENV_PATH, `GEMINI_API_KEY=${cleanKey}\n`, 'utf8');
      return sendJSON(res, 200, { success: true, message: 'API key successfully saved to .env' });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  if (pathname === '/api/summarize-audio' && req.method === 'POST') {
    try {
      const payload = await parseRequestBody(req);
      const { audioBase64, mimeType, model, meetingType, customPrompt, apiKey } = payload;

      if (!audioBase64) {
        return sendJSON(res, 400, { error: 'Missing audioBase64 data in payload.' });
      }

      // Check if we need to call real Gemini API or if user wants demo simulation
      const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!resolvedApiKey) {
        return sendJSON(res, 400, {
          error: 'MISSING_API_KEY',
          message: 'No Gemini API key provided. Please input your Gemini API Key or load a demo sample.'
        });
      }

      const summary = await callGeminiAudioAPI({
        audioBase64,
        mimeType,
        model,
        meetingType,
        customPrompt,
        apiKey: resolvedApiKey
      });

      return sendJSON(res, 200, { success: true, summary });
    } catch (err) {
      console.error('Audio summarization error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  if (pathname === '/api/chat' && req.method === 'POST') {
    try {
      const payload = await parseRequestBody(req);
      const { meetingSummary, userQuestion, chatHistory, model, apiKey } = payload;

      if (!meetingSummary || !userQuestion) {
        return sendJSON(res, 400, { error: 'meetingSummary and userQuestion are required.' });
      }

      const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!resolvedApiKey) {
        // Return realistic simulated answer for demo mode
        const qLower = userQuestion.toLowerCase();
        let demoReply = `Based on the meeting records: `;
        if (qLower.includes('decision') || qLower.includes('decide')) {
          demoReply += `The primary decisions approved were:\n` +
            (meetingSummary.keyDecisions || []).map(d => `• ${d.decision} (Owner: ${d.champion})`).join('\n');
        } else if (qLower.includes('action') || qLower.includes('task') || qLower.includes('who')) {
          demoReply += `The scheduled action items are:\n` +
            (meetingSummary.actionItems || []).map(a => `• [${a.priority}] ${a.task} → ${a.assignee} (Due: ${a.dueDate})`).join('\n');
        } else {
          demoReply += `"${userQuestion}" was discussed during the session. ${meetingSummary.executiveSummary}`;
        }
        return sendJSON(res, 200, { reply: demoReply });
      }

      const result = await callGeminiChatAPI({
        meetingSummary,
        userQuestion,
        chatHistory,
        model,
        apiKey: resolvedApiKey
      });

      return sendJSON(res, 200, result);
    } catch (err) {
      console.error('Chat error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // --- Static File Serving ---
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  // Security check: ensure path stays within public dir
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found: ' + pathname);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Support audio Range requests for seeking in audio player
    const range = req.headers.range;
    if (range && (ext === '.mp3' || ext === '.wav' || ext === '.ogg' || ext === '.m4a' || ext === '.webm')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });
      fileStream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 OmniNote AI - Meeting Notes Summarizer from Audio`);
  console.log(`📡 Server running at: http://localhost:${PORT}`);
  console.log(`📁 Serving web assets from: ${PUBLIC_DIR}`);
  console.log(`🔑 Gemini API Key configured: ${Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? 'YES' : 'NO (Can enter in web UI)'}`);
  console.log(`====================================================`);
});
