import React from 'react';

export default function DecisionsTab({ keyDecisions = [] }) {
  return (
    <div className="res-panel active">
      <div className="panel-header-row">
        <div>
          <h3>Decisions Log & Architecture Records</h3>
          <p className="panel-sub">Formal consensus points agreed upon during the discussion.</p>
        </div>
      </div>

      <div className="decisions-grid">
        {keyDecisions.length === 0 ? (
          <p className="text-dim">No formal decisions logged in this meeting.</p>
        ) : (
          keyDecisions.map((dec, idx) => {
            const statusClass = dec.status?.toLowerCase().includes('deferred')
              ? 'status-deferred'
              : 'status-approved';
            return (
              <div key={dec.id || idx} className="decision-card">
                <h4>💡 {dec.decision}</h4>
                <p className="decision-rationale">{dec.rationale}</p>
                <div className="decision-footer">
                  <span className="decision-champion">
                    Owner: <strong>{dec.champion || 'Consensus'}</strong>
                  </span>
                  <span className={`decision-status ${statusClass}`}>{dec.status || 'Approved'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
