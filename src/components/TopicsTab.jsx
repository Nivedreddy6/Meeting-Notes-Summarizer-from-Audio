import React from 'react';

export default function TopicsTab({ topics = [] }) {
  return (
    <div className="res-panel active">
      <div className="panel-header-row">
        <div>
          <h3>Discussion Topics & Meeting Flow</h3>
          <p className="panel-sub">Segmented breakdown of arguments, topics, and outcomes.</p>
        </div>
      </div>

      <div className="topics-timeline">
        {topics.length === 0 ? (
          <p className="text-dim">No topic breakdown available.</p>
        ) : (
          topics.map((t, idx) => (
            <div key={idx} className="topic-card">
              <div className="topic-header">
                <h4>
                  {idx + 1}. {t.topic}
                </h4>
                {t.duration && <span className="topic-time">{t.duration}</span>}
              </div>
              <p className="topic-summary">{t.summary}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
