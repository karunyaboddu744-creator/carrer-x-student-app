import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserRound, BrainCircuit, ChartNoAxesCombined, Building2, Map, TrendingUp, Bell, Settings, Menu, X, Search, Sparkles, FolderKanban, Trophy } from 'lucide-react';
import { api } from '../api';

const groups = [
  { label: 'OVERVIEW', items: [['/dashboard', 'Dashboard', LayoutDashboard], ['/profile', 'My Profile', UserRound], ['/assessment', 'AI Assessment', BrainCircuit]] },
  { label: 'GROWTH', items: [['/skills', 'My Skills', ChartNoAxesCombined], ['/projects', 'Projects', FolderKanban], ['/challenges', 'Challenges', Trophy], ['/companies', 'Company Readiness', Building2], ['/roadmap', 'Learning Roadmap', Map], ['/progress', 'Progress', TrendingUp]] },
  { label: 'ACCOUNT', items: [['/notifications', 'Notifications', Bell], ['/settings', 'Settings', Settings]] }
];

function initials(name) {
  return (name || 'ST').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function Layout({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [score, setScore] = useState(user?.readiness?.score || 0);
  const location = useLocation();
  const title = location.pathname.split('/')[1] || 'dashboard';

  useEffect(() => {
    api('/api/dashboard').then((d) => setScore(d.readiness?.score || 0)).catch(() => {});
    api('/api/notifications').then((d) => setUnread((d.notifications || []).filter((n) => n.unread).length)).catch(() => {});
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Sparkles size={18} /></div>
          <div><b>CareerSync</b><span>AI · STUDENT</span></div>
          <button className="mobile-close" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <div className="profile-mini">
          <div className="avatar">{initials(user?.fullName)}</div>
          <div><b>{user?.fullName || 'Student'}</b><span>{user?.degree || 'Student'}</span></div>
        </div>
        <nav>
          {groups.map((g) => (
            <div className="nav-group" key={g.label}>
              <small>{g.label}</small>
              {g.items.map(([to, label, Icon]) => (
                <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                  <Icon size={18} /><span>{label}</span>
                  {label === 'Notifications' && unread > 0 && <em>{unread}</em>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="readiness-mini">
            <span>CAREER READINESS</span>
            <strong>{score}%</strong>
            <div className="bar"><i style={{ width: `${score}%` }} /></div>
            <small>Live from your account</small>
          </div>
          <div className="version">CareerSync AI v1.0</div>
          <button className="secondary-btn" onClick={onLogout}>Sign out</button>
        </div>
      </aside>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setOpen(true)}><Menu /></button>
          <div className="breadcrumb">Workspace <span>/</span> <b>{title.replace('-', ' ')}</b></div>
          <div className="top-actions">
            <div className="search"><Search size={17} /><input placeholder="Search skills, companies..." /></div>
            <NavLink className="icon-btn" to="/notifications"><Bell size={19} />{unread > 0 && <i />}</NavLink>
            <div className="top-avatar">{initials(user?.fullName)}</div>
          </div>
        </header>
        <div className="page-wrap"><Outlet /></div>
      </main>
    </div>
  );
}
