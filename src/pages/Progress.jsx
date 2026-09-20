import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CalendarDays, Flame, Target } from 'lucide-react';
import { api } from '../api';

export default function Progress() {
  const [a, setA] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/api/analytics').then(setA).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="panel"><h2>Could not load analytics</h2><p>{err}</p></div>;
  if (!a) return <div className="loading-screen">Loading analytics…</div>;

  const chart = (a.assessmentAnalytics || []).map((x) => ({
    name: x.date ? new Date(x.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Score',
    score: x.score
  }));
  const data = chart.length ? chart : [{ name: 'Start', score: a.readiness || 0 }];
  const avg = chart.length ? Math.round(chart.reduce((s, x) => s + x.score, 0) / chart.length) : 0;

  return (
    <>
      <SectionHeader eyebrow="YOUR GROWTH STORY" title="Progress & Analytics" description="Track the momentum behind your career-readiness score." />
      <div className="analytics-stats">
        <A icon={TrendingUp} title="Readiness" value={`${a.readiness}%`} note="Live backend score" />
        <A icon={Flame} title="Skills tracked" value={String((a.skillAnalytics || []).length)} note="From your profile" />
        <A icon={Target} title="Assessments" value={String((a.assessmentAnalytics || []).length)} note={avg ? `${avg}% avg. score` : 'No assessments yet'} />
        <A icon={CalendarDays} title="Projects" value={String(a.projectAnalytics?.total || 0)} note={`${a.projectAnalytics?.completed || 0} completed`} />
      </div>
      <div className="panel chart-panel">
        <div className="panel-title">
          <div><span className="eyebrow">READINESS TREND</span><h2>Your career score</h2></div>
          <span className="chart-period">Assessments</span>
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="score" strokeWidth={3} fillOpacity={0.12} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function A({ icon: Icon, title, value, note }) {
  return (
    <div className="stat-card analytics">
      <div className="stat-icon"><Icon size={18} /></div>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
