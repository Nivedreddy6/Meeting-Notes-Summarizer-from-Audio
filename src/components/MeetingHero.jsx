import React, { useState } from 'react';
import { Copy, Download, Printer, FileCode, Check } from 'lucide-react';
import { generateMarkdown, downloadBlob } from '../utils/exportUtils';

export default function MeetingHero({ meetingData, onShowToast }) {
  const [copied, setCopied] = useState(false);

  if (!meetingData) return null;

  const handleCopyMarkdown = () => {
    const md = generateMarkdown(meetingData);
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      onShowToast('Markdown notes copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown(meetingData);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const filename = `${(meetingData.meetingTitle || 'meeting_notes').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.md`;
    downloadBlob(blob, filename);
    onShowToast(`Downloaded ${filename}`);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(meetingData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const filename = `${(meetingData.meetingTitle || 'meeting_data').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.json`;
    downloadBlob(blob, filename);
    onShowToast(`Downloaded ${filename}`);
  };

  return (
    <div className="meeting-hero-card">
      <div className="hero-top">
        <div className="hero-title-group">
          <span className="hero-badge">{meetingData.meetingType || 'Comprehensive Minutes'}</span>
          <h2>{meetingData.meetingTitle || 'Meeting Summary'}</h2>
          <div className="hero-meta">
            <span>📅 {meetingData.date || 'Today'}</span>
            <span>⏱️ {meetingData.duration || 'Session'}</span>
            <span>💡 {meetingData.sentiment || 'Constructive'}</span>
          </div>
        </div>

        <div className="hero-actions">
          <button className="btn-action" onClick={handleCopyMarkdown} title="Copy to Clipboard">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button className="btn-action" onClick={handleDownloadMarkdown} title="Download Markdown (.md)">
            <Download size={16} />
            <span>Markdown</span>
          </button>
          <button className="btn-action" onClick={() => window.print()} title="Print / PDF Export">
            <Printer size={16} />
            <span>PDF / Print</span>
          </button>
          <button className="btn-action" onClick={handleDownloadJson} title="Download JSON">
            <FileCode size={16} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      <div className="hero-exec-summary">
        <h4>🎯 Executive Summary</h4>
        <p>{meetingData.executiveSummary || 'No executive summary available.'}</p>
      </div>

      <div className="hero-participants">
        <span className="participants-label">Attendees:</span>
        <div className="participants-tags">
          {Array.isArray(meetingData.participants) && meetingData.participants.length > 0 ? (
            meetingData.participants.map((p, idx) => (
              <div key={idx} className="attendee-tag">
                <span>👤</span>
                <span>{p.name}</span>
                <span className="attendee-role">({p.role || 'Attendee'})</span>
              </div>
            ))
          ) : (
            <span className="attendee-tag">All Attendees</span>
          )}
        </div>
      </div>
    </div>
  );
}
