import React from 'react';

const SAMPLES = [
  {
    key: 'sprint_sync',
    emoji: '🏃',
    typeClass: 'sprint',
    title: 'Q4 Architecture & Sprint Modernization',
    desc: 'Alex Rivera, Priya Sharma & Marcus Vance align on Redis Sentinel caching and Postgres sharding cutover.',
    tags: ['Architecture', '42 min', '4 Speakers']
  },
  {
    key: 'executive_review',
    emoji: '📊',
    typeClass: 'executive',
    title: 'Executive Leadership & Q3 ARR Review',
    desc: 'CEO Victoria Sterling & CFO David Chen review $48.2M ARR, AI capital expenditure, and 2027 guidance.',
    tags: ['Executive', '55 min', 'Financials']
  },
  {
    key: 'client_discovery',
    emoji: '🤝',
    typeClass: 'sales',
    title: 'FinCorp Global Enterprise Discovery',
    desc: 'CISO Arthur Pendelton and Solutions team evaluate SOC2, Zurich residency, and 1,200 advisor rollout.',
    tags: ['Enterprise Sales', '35 min', 'Security']
  }
];

export default function DemoSelector({ onLoadSample }) {
  return (
    <div className="input-card tab-panel active">
      <div className="demos-grid">
        {SAMPLES.map((sample) => (
          <div key={sample.key} className="demo-card">
            <div className={`demo-icon ${sample.typeClass}`}>{sample.emoji}</div>
            <div className="demo-content">
              <h4>{sample.title}</h4>
              <p>{sample.desc}</p>
              <div className="demo-tags">
                {sample.tags.map((t, idx) => (
                  <span key={idx}>{t}</span>
                ))}
              </div>
            </div>
            <button className="btn-load-sample" onClick={() => onLoadSample(sample.key)}>
              Load Demo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
