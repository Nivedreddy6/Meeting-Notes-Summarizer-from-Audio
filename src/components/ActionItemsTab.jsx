import React, { useState } from 'react';

export default function ActionItemsTab({ actionItems = [], onToggleTask }) {
  const [filter, setFilter] = useState('all');

  const filteredItems = actionItems.filter((item) => {
    if (filter === 'pending') return !item.completed;
    if (filter === 'completed') return item.completed;
    if (filter === 'High') return item.priority === 'High';
    return true;
  });

  return (
    <div className="res-panel active">
      <div className="panel-header-row">
        <div>
          <h3>Action Items & Deliverables</h3>
          <p className="panel-sub">Track assigned commitments, deadlines, and execution progress.</p>
        </div>
        <div className="task-filter-group">
          {['all', 'pending', 'completed', 'High'].map((f) => (
            <button
              key={f}
              className={`filter-pill ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'High' ? 'High Priority' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="action-items-grid">
        {filteredItems.length === 0 ? (
          <p className="text-dim">No action items matching this filter.</p>
        ) : (
          filteredItems.map((item, idx) => {
            const priorityClass = `priority-${(item.priority || 'medium').toLowerCase()}`;
            return (
              <div
                key={item.id || idx}
                className={`task-item-card ${item.completed ? 'completed' : ''}`}
              >
                <div className="task-left">
                  <input
                    type="checkbox"
                    className="task-checkbox"
                    checked={Boolean(item.completed)}
                    onChange={() => onToggleTask(item.id || idx)}
                  />
                  <span className="task-text">{item.task}</span>
                </div>
                <div className="task-right">
                  <span className="task-assignee">👤 {item.assignee || 'Unassigned'}</span>
                  <span className="task-due">📅 {item.dueDate || 'Pending'}</span>
                  <span className={`priority-badge ${priorityClass}`}>
                    {item.priority || 'Medium'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
