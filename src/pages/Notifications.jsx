import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { api } from '../api';

export default function Notifications() {
  const [notes, setNotes] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/api/notifications').then((d) => setNotes(d.notifications || [])).catch((e) => setErr(e.message));
  }, []);

  return (
    <>
      <SectionHeader
        eyebrow="UPDATES"
        title="Notifications"
        description="Stay on top of your assessments, skills and career plan."
        action={<button className="secondary-btn" onClick={() => setNotes(notes.map((n) => ({ ...n, unread: false })))}><CheckCheck size={16} /> Mark all read</button>}
      />
      {err && <div className="panel"><p>{err}</p></div>}
      <div className="panel notifications">
        {notes.map((n) => (
          <div className={`notification ${n.unread ? 'unread' : ''}`} key={n.id}>
            <div className="notification-icon"><Bell size={17} /></div>
            <div>
              <b>{n.title}</b>
              <p>{n.body}</p>
              <span>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</span>
            </div>
            <ArrowRight className="notif-arrow" size={17} />
          </div>
        ))}
      </div>
    </>
  );
}
