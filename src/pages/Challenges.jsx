import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import { api } from '../api';

export default function Challenges() {
  const [items, setItems] = useState([]);
  const [recs, setRecs] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/api/challenges').then((d) => setItems(d.challenges || [])).catch((e) => setErr(e.message));
    api('/api/recommendations').then((d) => setRecs(d.recommendations || [])).catch(() => {});
  }, []);

  return (
    <>
      <SectionHeader eyebrow="PRACTICE ARENA" title="Challenges" description="Complete role-relevant challenges and grow your readiness score." />
      {err && <div className="panel"><p>{err}</p></div>}
      <div className="company-grid">
        {items.map((c) => (
          <div className="company-card" key={c.id} style={{ background: '#fff', padding: 20 }}>
            <div className="company-head">
              <div className="company-logo">{c.points}</div>
              <div>
                <h3>{c.title}</h3>
                <p>{c.category} · {c.difficulty}</p>
              </div>
            </div>
            <div className="skill-tags">{(c.skills || []).map((s) => <span key={s}>{s}</span>)}</div>
          </div>
        ))}
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-title"><div><span className="eyebrow">RECOMMENDED NEXT</span><h2>From your skill gaps</h2></div></div>
        {recs.map((r) => (
          <div className="activity" key={r.id} style={{ marginBottom: 14 }}>
            <div>
              <b>{r.title}</b>
              <span>{r.reason} · {r.priority}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
