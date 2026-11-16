import React, { useState } from 'react';

export default function TranscriptTab({ transcript = [] }) {
  const [query, setQuery] = useState('');

  const filteredLines = transcript.filter((line) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (line.speaker && line.speaker.toLowerCase().includes(q)) ||
      (line.text && line.text.toLowerCase().includes(q))
    );
  });

  return (
    <div className="res-panel active">
      <div className="panel-header-row">
        <div>
          <h3>Verbatim / Polished Transcript</h3>
          <p className="panel-sub">Accurate acoustic transcription with identified speaker tags.</p>
        </div>
        <div className="transcript-search-box">
          <input
            type="text"
            placeholder="Search transcript..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="custom-input"
          />
        </div>
      </div>

      <div className="transcript-dialogue">
        {filteredLines.length === 0 ? (
          <p className="text-dim">No transcript lines found.</p>
        ) : (
          filteredLines.map((line, idx) => (
            <div key={idx} className="transcript-row">
              <span className="transcript-time">{line.timestamp || '00:00'}</span>
              <div className="transcript-content">
                <div className="transcript-speaker">{line.speaker || 'Speaker'}</div>
                <div className="transcript-text">{line.text}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
