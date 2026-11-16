import React from 'react';

export default function QuestionsTab({ unresolvedQuestions = [] }) {
  return (
    <div className="res-panel active">
      <div className="panel-header-row">
        <div>
          <h3>Unresolved Questions & Project Risks</h3>
          <p className="panel-sub">Items requiring clarification or investigation before next milestone.</p>
        </div>
      </div>

      <div className="questions-grid">
        {unresolvedQuestions.length === 0 ? (
          <p className="text-dim">All questions were resolved during the discussion.</p>
        ) : (
          unresolvedQuestions.map((q, idx) => (
            <div key={idx} className="question-card">
              <h4>❓ {q.question}</h4>
              {q.context && <p className="question-context">{q.context}</p>}
              <div className="question-owner">Follow-up: {q.owner || 'Team'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
