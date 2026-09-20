import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Target, BookOpen, BriefcaseBusiness, Clock3, CheckCircle2, ChevronRight } from 'lucide-react';
import ScoreRing from '../components/ScoreRing';
import CompanyCard from '../components/CompanyCard';
import { api } from '../api';

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [roadmap, setRoadmap] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/api/dashboard').then(setD).catch((e) => setErr(e.message));
    api('/api/companies').then((r) => setCompanies(r.companies || [])).catch(() => {});
    api('/api/roadmap').then((r) => setRoadmap(r.weeks || [])).catch(() => {});
  }, []);

  if (err) return <div className="panel"><h2>Could not load dashboard</h2><p>{err}</p></div>;
  if (!d) return <div className="loading-screen">Loading your career data…</div>;

  const score = d.readiness.score;
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const first = (d.student.name || 'Student').split(' ')[0];

  return (
    <>
      <div className="welcome">
        <div>
          <span className="eyebrow">CARRER-X STUDENT WORKSPACE</span>
          <h1>{hello}, {first} <span>✦</span></h1>
          <p>Your live readiness data is connected to the CARRER-X backend.</p>
        </div>
        <Link className="primary-btn" to="/assessment"><Play size={16} fill="currentColor" /> Take AI Assessment</Link>
      </div>
      <section className="hero-grid">
        <div className="readiness-card">
          <div>
            <span className="eyebrow">OVERALL CAREER READINESS</span>
            <h2>{d.readiness.level}</h2>
            <p>Your current career-readiness score is <b>{score}%</b>. Keep improving your tracked skills and assessments.</p>
            <Link to="/skills" className="text-link">View skill gaps <ArrowRight size={15} /></Link>
          </div>
          <ScoreRing score={score} />
        </div>
        <div className="streak-card">
          <div className="streak-top"><div className="stat-icon purple"><Target /></div><span>LIVE ACCOUNT</span></div>
          <strong>{d.statistics.skillsTracked} <small>skills</small></strong>
          <p>{d.statistics.assessmentsCompleted} assessments · {d.statistics.totalProjects} projects</p>
          <div className="streak-dots">{[1, 1, 1, 1, 1, 1, 0].map((x, i) => <i className={x ? 'filled' : ''} key={i} />)}</div>
          <small>Build more verified evidence</small>
        </div>
      </section>
      <section className="stats-grid">
        <Stat icon={BriefcaseBusiness} label="Projects" value={d.statistics.totalProjects} change={`${d.statistics.projectsCompleted} completed`} />
        <Stat icon={BookOpen} label="Skills Tracked" value={d.statistics.skillsTracked} change="Live backend data" />
        <Stat icon={Clock3} label="Assessments" value={d.statistics.assessmentsCompleted} change="Completed" />
        <Stat icon={Target} label="Readiness" value={`${score}%`} change={d.readiness.level} />
      </section>
      <section className="content-grid">
        <div className="panel">
          <div className="panel-title">
            <div><span className="eyebrow">TARGET COMPANIES</span><h2>Company readiness</h2></div>
            <Link to="/companies">View all <ArrowRight size={15} /></Link>
          </div>
          <div className="company-list">{companies.slice(0, 3).map((c) => <CompanyCard key={c.name} company={c} />)}</div>
        </div>
        <div className="panel activity-panel">
          <div className="panel-title"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>What you’ve achieved</h2></div></div>
          <div className="activity-list">
            {d.recentActivity.length ? d.recentActivity.map((a) => (
              <div className="activity" key={a.id}>
                <div className="activity-icon"><CheckCircle2 size={16} /></div>
                <div><b>{a.title}</b><span>{a.score != null ? `Score ${a.score}%` : new Date(a.createdAt).toLocaleString()}</span></div>
              </div>
            )) : <p>No activity yet. Take your first assessment or add a project.</p>}
          </div>
          <Link className="panel-link" to="/progress">View progress <ChevronRight size={16} /></Link>
        </div>
      </section>
      <section className="panel roadmap-preview">
        <div className="panel-title">
          <div><span className="eyebrow">YOUR NEXT 30 DAYS</span><h2>Learning roadmap</h2></div>
          <Link to="/roadmap">Open roadmap <ArrowRight size={15} /></Link>
        </div>
        <div className="roadmap-row">
          {roadmap.map((r, i) => (
            <div className={`roadmap-step ${i === 0 ? 'current' : ''}`} key={r.week}>
              <span>{r.week}</span>
              <div className="step-dot">{i + 1}</div>
              <h3>{r.title}</h3>
              <p>{r.desc}</p>
              <div className="mini-progress"><i style={{ width: `${r.progress}%` }} /></div>
              <small>{r.progress}% complete</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Stat({ icon: Icon, label, value, change }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon size={18} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{change}</small>
    </div>
  );
}
