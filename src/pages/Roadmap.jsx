import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import { CheckCircle2, Lock, PlayCircle, BookOpen, ArrowRight } from 'lucide-react';
import { api } from '../api';

export default function Roadmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const load = () => api('/api/roadmap').then(setData).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  if (err) return <div className="panel"><h2>Could not load roadmap</h2><p>{err}</p></div>;
  if (!data) return <div className="loading-screen">Building your plan…</div>;

  return (
    <>
      <SectionHeader eyebrow="PERSONALIZED PLAN" title="Learning Roadmap" description="A 30-day plan generated from your skill gaps and target role." action={<button className="secondary-btn" onClick={load}>Regenerate plan</button>} />
      <div className="roadmap-header panel">
        <div>
          <span className="eyebrow">TARGET</span>
          <h2>{data.target}</h2>
          <p>Optimized for your current {data.readiness}% readiness score</p>
        </div>
        <div className="roadmap-total"><strong>{data.overall}%</strong><span>overall complete</span></div>
      </div>
      <div className="timeline">
        {(data.weeks || []).map((r, i) => (
          <div className={`timeline-item ${r.progress > 0 ? 'done' : ''}`} key={r.week}>
            <div className="timeline-marker">{r.progress === 100 ? <CheckCircle2 /> : i === 0 ? <PlayCircle /> : <Lock />}</div>
            <div className="panel timeline-card">
              <div className="timeline-top"><span className="week-tag">{r.week}</span><span>{r.progress}% complete</span></div>
              <h2>{r.title}</h2>
              <p>{r.desc}</p>
              <div className="bar"><i style={{ width: `${r.progress}%` }} /></div>
              <div className="lesson">
                <BookOpen size={16} />
                <span>{i === 0 ? '3 lessons · 1 assessment' : '4 lessons · 1 project'}</span>
                <button>{r.progress ? 'Continue' : 'Start'} <ArrowRight size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
