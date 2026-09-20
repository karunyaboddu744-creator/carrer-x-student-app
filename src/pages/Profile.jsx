import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import { Camera, MapPin, Mail, GraduationCap, Edit3, ShieldCheck, Plus } from 'lucide-react';
import { api } from '../api';

function initials(name) {
  return (name || 'ST').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () => api('/api/auth/me').then((d) => {
    setUser(d.user);
    setForm({
      fullName: d.user.fullName || '',
      college: d.user.college || '',
      degree: d.user.degree || '',
      graduationYear: d.user.graduationYear || '',
      primaryCareerInterest: d.user.primaryCareerInterest || '',
      location: d.user.profile?.location || '',
      bio: d.user.profile?.bio || '',
      phone: d.user.profile?.phone || ''
    });
  }).catch((e) => setErr(e.message));

  useEffect(() => { load(); }, []);
  if (err) return <div className="panel"><h2>Could not load profile</h2><p>{err}</p></div>;
  if (!user) return <div className="loading-screen">Loading profile…</div>;

  const strength = Math.min(100, 20 + (user.profile?.completed ? 25 : 0) + Math.min(30, (user.skills || []).length * 6) + (form.location ? 10 : 0) + (form.bio ? 15 : 0));

  async function save() {
    setMsg('');
    try {
      const d = await api('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: form.fullName,
          college: form.college,
          degree: form.degree,
          graduationYear: form.graduationYear,
          primaryCareerInterest: form.primaryCareerInterest,
          profile: { location: form.location, bio: form.bio, phone: form.phone }
        })
      });
      setUser(d.user);
      setEditing(false);
      setMsg('Profile updated.');
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <>
      <SectionHeader
        eyebrow="IDENTITY"
        title="My Profile"
        description="Build a verified profile that shows recruiters what you can do."
        action={<button className="secondary-btn" onClick={() => setEditing(!editing)}><Edit3 size={16} /> {editing ? 'Cancel' : 'Edit profile'}</button>}
      />
      {msg && <div className="info-banner" style={{ marginBottom: 16 }}><span>✓</span><div><b>{msg}</b></div></div>}
      <div className="profile-layout">
        <div className="panel profile-main">
          <div className="profile-cover">
            <div className="profile-avatar">{initials(user.fullName)}<button type="button"><Camera size={15} /></button></div>
          </div>
          <div className="profile-info">
            <div>
              <h2>{user.fullName} <ShieldCheck size={18} /></h2>
              <p>{user.degree || 'Student'}{user.graduationYear ? ` · ${user.graduationYear}` : ''}</p>
            </div>
            <span className="verified">✓ Verified student</span>
          </div>
          {editing ? (
            <div className="add-skill" style={{ flexWrap: 'wrap' }}>
              <input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input placeholder="College" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
              <input placeholder="Degree" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} />
              <input placeholder="Graduation year" value={form.graduationYear} onChange={(e) => setForm({ ...form, graduationYear: e.target.value })} />
              <input placeholder="Career interest" value={form.primaryCareerInterest} onChange={(e) => setForm({ ...form, primaryCareerInterest: e.target.value })} />
              <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input placeholder="Short bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              <button className="primary-btn" onClick={save}>Save profile</button>
            </div>
          ) : (
            <div className="profile-details">
              <span><Mail /> {user.email}</span>
              <span><MapPin /> {user.profile?.location || 'Add your location'}</span>
              <span><GraduationCap /> {user.college || 'Add your college'}</span>
            </div>
          )}
        </div>
        <div className="panel strength-panel">
          <span className="eyebrow">PROFILE STRENGTH</span>
          <div className="strength-number">{strength}%</div>
          <div className="bar"><i style={{ width: `${strength}%` }} /></div>
          <p>Keep adding skills, assessments and projects to strengthen this profile.</p>
          <div className="check-list">
            <div>✓ Basic information</div>
            <div>{(user.skills || []).length ? '✓' : '＋'} Skills & assessments</div>
            <div>{user.primaryCareerInterest ? '✓' : '＋'} Career goals</div>
            <div className={user.profile?.completed ? '' : 'todo'}>{user.profile?.completed ? '✓ Profile completed' : '＋ Complete profile details'}</div>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-title">
          <div><span className="eyebrow">CAREER TARGET</span><h2>What are you preparing for?</h2></div>
          <button className="icon-text-btn" onClick={() => setEditing(true)}><Plus size={16} /> Edit target</button>
        </div>
        <div className="target-box">
          <div className="target-icon">⌁</div>
          <div>
            <b>{user.primaryCareerInterest || 'Set a target role'}</b>
            <p>{user.college || 'Your institution'} · {user.graduationYear || 'Graduation year'}</p>
          </div>
        </div>
      </div>
    </>
  );
}
