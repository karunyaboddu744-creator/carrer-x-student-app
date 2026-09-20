import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Assessment from './pages/Assessment';
import Skills from './pages/Skills';
import Companies from './pages/Companies';
import Roadmap from './pages/Roadmap';
import Progress from './pages/Progress';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Projects from './pages/Projects';
import Challenges from './pages/Challenges';
import { api, getToken, setToken } from './api';
import './styles.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api('/api/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Starting CARRER-X…</div>;
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Auth onAuth={setUser} />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout user={user} setUser={setUser} onLogout={() => { setToken(null); setUser(null); }} />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings user={user} />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
