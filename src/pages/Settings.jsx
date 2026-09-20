import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import { User, Shield, SlidersHorizontal, Bell, ChevronRight } from 'lucide-react';
import { api } from '../api';

export default function Settings({ user }) {
  const [privacy, setPrivacy] = useState(true);
  const [msg, setMsg] = useState('');

  async function exportData() {
    const me = await api('/api/auth/me');
    const skills = await api('/api/skills');
    const blob = new Blob([JSON.stringify({ user: me.user, skills: skills.skills }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carrer-x-export.json';
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Career data exported.');
  }

  return (
    <>
      <SectionHeader eyebrow="PREFERENCES" title="Settings" description="Control your account, privacy and learning experience." />
      {msg && <div className="info-banner" style={{ marginBottom: 16 }}><span>✓</span><div><b>{msg}</b></div></div>}
      <div className="settings-list">
        <Link className="setting-row" to="/profile">
          <div className="setting-icon"><User /></div>
          <div className="setting-copy"><b>Account & profile</b><span>{user?.email || 'Personal details, email and profile visibility'}</span></div>
          <ChevronRight />
        </Link>
        <Link className="setting-row" to="/roadmap">
          <div className="setting-icon"><SlidersHorizontal /></div>
          <div className="setting-copy"><b>Learning preferences</b><span>Target role, difficulty and recommendation settings</span></div>
          <ChevronRight />
        </Link>
        <Link className="setting-row" to="/notifications">
          <div className="setting-icon"><Bell /></div>
          <div className="setting-copy"><b>Notifications</b><span>Assessment reminders, progress updates and alerts</span></div>
          <ChevronRight />
        </Link>
        <div className="setting-row">
          <div className="setting-icon"><Shield /></div>
          <div className="setting-copy"><b>Profile visibility</b><span>Allow recruiters to discover your verified profile</span></div>
          <button className={`toggle ${privacy ? 'on' : ''}`} onClick={() => setPrivacy(!privacy)}><i /></button>
        </div>
      </div>
      <div className="danger-zone">
        <b>Account actions</b>
        <p>Export your career data from this device.</p>
        <button className="secondary-btn" onClick={exportData}>Export data</button>
      </div>
    </>
  );
}
