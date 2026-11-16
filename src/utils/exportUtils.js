export function generateMarkdown(meetingData) {
  if (!meetingData) return '';
  const d = meetingData;

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

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
