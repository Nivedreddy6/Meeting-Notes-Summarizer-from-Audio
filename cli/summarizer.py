#!/usr/bin/env python3
"""
OmniNote AI - Standalone CLI Meeting Notes Summarizer
Generates structured meeting notes from audio using Google Gemini Multimodal Audio.
Zero external dependencies (uses standard Python libraries: urllib, json, base64).
"""

import os
import sys
import json
import base64
import argparse
from pathlib import Path
import urllib.request
import urllib.error

SUPPORTED_MIME = {
    '.mp3': 'audio/mp3',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.webm': 'audio/webm',
    '.flac': 'audio/flac'
}

def load_env_file():
    """Loads GEMINI_API_KEY from a local .env file if present."""
    env_path = Path(__file__).resolve().parent.parent / '.env'
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    k, v = k.strip(), v.strip().strip("'\"")
                    if k not in os.environ:
                        os.environ[k] = v

def get_meeting_prompt(meeting_type: str, custom_prompt: str = "") -> str:
    return f"""
You are an elite Executive Assistant and AI Meeting Intelligence Specialist.
Analyze the provided meeting audio with extreme precision. Extract every detail, identify distinct speakers, evaluate sentiment, and produce a high-value, structured meeting brief.

Format your entire output strictly as valid JSON matching this exact structure:
{{
  "meetingTitle": "Descriptive, professional title of the meeting",
  "meetingType": "{meeting_type}",
  "date": "Estimated or mentioned date",
  "duration": "Estimated duration",
  "participants": [
    {{"name": "Speaker Name / Role", "role": "Role / Title"}}
  ],
  "sentiment": "Overall tone and team dynamic",
  "executiveSummary": "A concise executive summary paragraph capturing core purpose, key outcomes, and macro status.",
  "keyDecisions": [
    {{
      "id": "dec-1",
      "decision": "Concrete decision made",
      "rationale": "Why this decision was made and context",
      "champion": "Key proponent or owner",
      "status": "Approved / Deferred / Proposed"
    }}
  ],
  "actionItems": [
    {{
      "id": "act-1",
      "task": "Specific actionable task description",
      "assignee": "Full Name or Role",
      "priority": "High / Medium / Low",
      "dueDate": "Mentioned deadline",
      "completed": false
    }}
  ],
  "unresolvedQuestions": [
    {{
      "question": "Important question raised but not conclusively answered",
      "context": "Brief context surrounding the ambiguity",
      "owner": "Who is expected to investigate"
    }}
  ],
  "topics": [
    {{
      "topic": "Topic Heading",
      "duration": "Estimated time spent",
      "summary": "Detailed notes on what was discussed, arguments presented, and conclusion."
    }}
  ],
  "transcript": [
    {{
      "timestamp": "MM:SS",
      "speaker": "Speaker Name",
      "text": "Transcribed speech segment"
    }}
  ]
}}

Ensure all action items have specific owners and priority levels.
Do not output markdown code blocks. Output raw, valid JSON only.
{f'Additional user instructions: {custom_prompt}' if custom_prompt else ''}
"""

def summarize_audio(file_path: Path, api_key: str, model: str = "gemini-2.5-flash", meeting_type: str = "Comprehensive Minutes", custom_prompt: str = ""):
    if not file_path.exists():
        print(f"Error: Audio file not found at {file_path}", file=sys.stderr)
        sys.exit(1)

    ext = file_path.suffix.lower()
    mime_type = SUPPORTED_MIME.get(ext, 'audio/mp3')

    print(f"[*] Reading audio file: {file_path.name} ({file_path.stat().st_size / 1024:.1f} KB)...")
    with open(file_path, 'rb') as f:
        audio_bytes = f.read()

    base64_audio = base64.b64encode(audio_bytes).decode('utf-8')

    prompt = get_meeting_prompt(meeting_type, custom_prompt)
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": base64_audio
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    print(f"[*] Dispatching to Gemini GenAI ({model})...")
    req_data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(endpoint, data=req_data, headers={'Content-Type': 'application/json'})

    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode('utf-8')
            data = json.loads(resp_body)
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8', errors='ignore')
        print(f"Gemini API HTTP Error {e.code}: {err_msg}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Network error: {e}", file=sys.stderr)
        sys.exit(1)

    raw_text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
    if not raw_text:
        print("Error: Empty response from Gemini API.", file=sys.stderr)
        sys.exit(1)

    # Sanitize markdown code block if present
    clean_text = raw_text.strip()
    if clean_text.startswith('```json'):
        clean_text = clean_text[7:]
    elif clean_text.startswith('```'):
        clean_text = clean_text[3:]
    if clean_text.endswith('```'):
        clean_text = clean_text[:-3]

    try:
        summary_json = json.loads(clean_text.strip())
        return summary_json
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON from Gemini: {e}\nRaw output:\n{raw_text}", file=sys.stderr)
        sys.exit(1)

def format_markdown(data: dict) -> str:
    md = []
    md.append(f"# {data.get('meetingTitle', 'Meeting Notes')}\n")
    md.append(f"**Meeting Type:** {data.get('meetingType', 'General')} | **Date:** {data.get('date', 'N/A')} | **Duration:** {data.get('duration', 'N/A')}\n")
    md.append(f"**Sentiment & Dynamic:** {data.get('sentiment', 'N/A')}\n")

    md.append("### Attendees")
    for p in data.get('participants', []):
        md.append(f"- **{p.get('name')}** ({p.get('role', 'Attendee')})")
    md.append("")

    md.append(f"## 🎯 Executive Summary\n{data.get('executiveSummary', '')}\n")

    md.append("## ✅ Action Items & Commitments")
    for a in data.get('actionItems', []):
        check = "[x]" if a.get('completed') else "[ ]"
        md.append(f"- {check} **{a.get('task')}** — Assignee: *{a.get('assignee')}* | Priority: *{a.get('priority')}* | Due: *{a.get('dueDate')}*")
    md.append("")

    md.append("## 💡 Key Decisions")
    for d in data.get('keyDecisions', []):
        md.append(f"### {d.get('decision')}")
        md.append(f"- **Rationale:** {d.get('rationale')}")
        md.append(f"- **Owner:** {d.get('champion')} | **Status:** {d.get('status')}\n")

    md.append("## 📊 Topics & Detailed Discussion")
    for t in data.get('topics', []):
        md.append(f"### {t.get('topic')} ({t.get('duration', '')})")
        md.append(f"{t.get('summary')}\n")

    if data.get('unresolvedQuestions'):
        md.append("## ❓ Unresolved Questions & Risks")
        for q in data.get('unresolvedQuestions', []):
            md.append(f"- **{q.get('question')}**\n  *Context:* {q.get('context')} (Owner: {q.get('owner')})")
        md.append("")

    if data.get('transcript'):
        md.append("## 📜 Full Transcript")
        for line in data.get('transcript', []):
            md.append(f"**[{line.get('timestamp')}] {line.get('speaker')}:** {line.get('text')}\n")

    return "\n".join(md)

def main():
    load_env_file()

    parser = argparse.ArgumentParser(description="OmniNote AI - Meeting Notes Summarizer from Audio using Gemini GenAI")
    parser.add_argument("audio_file", help="Path to meeting audio file (MP3, WAV, M4A, AAC, etc.)")
    parser.add_argument("--model", default="gemini-2.5-flash", choices=["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"], help="Gemini GenAI model")
    parser.add_argument("--type", default="Comprehensive Minutes", choices=["Comprehensive Minutes", "Executive Briefing", "Agile / Daily Scrum", "Engineering & Architecture", "Client Discovery & Sales"], help="Meeting archetype")
    parser.add_argument("--prompt", default="", help="Custom focus instruction for the summarization")
    parser.add_argument("--api-key", default="", help="Gemini API key (or set GEMINI_API_KEY environment variable)")
    parser.add_argument("--output", "-o", default="", help="Output markdown file path (defaults to stdout / meeting_title.md)")
    parser.add_argument("--json", action="store_true", help="Output raw JSON instead of Markdown")

    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: No Gemini API Key provided. Set GEMINI_API_KEY in your environment, pass --api-key, or create a .env file.", file=sys.stderr)
        sys.exit(1)

    audio_path = Path(args.audio_file)
    summary_data = summarize_audio(audio_path, api_key, model=args.model, meeting_type=args.type, custom_prompt=args.prompt)

    if args.json:
        output_str = json.dumps(summary_data, indent=2)
    else:
        output_str = format_markdown(summary_data)

    if args.output:
        out_path = Path(args.output)
        out_path.write_text(output_str, encoding='utf-8')
        print(f"[✓] Saved notes to: {out_path.resolve()}")
    else:
        print("\n" + "="*60)
        print(output_str)
        print("="*60 + "\n")

if __name__ == "__main__":
    main()
