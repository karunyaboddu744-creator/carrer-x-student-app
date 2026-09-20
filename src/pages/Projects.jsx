import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import { Plus } from 'lucide-react';
import { api } from '../api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [err, setErr] = useState('');

  const load = () => api('/api/projects').then((d) => setProjects(d.projects || [])).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  async function add() {
    if (!title.trim()) return;
    await api('/api/projects', { method: 'POST', body: JSON.stringify({ title, description, technologies: [], status: 'in-progress' }) });
    setTitle('');
    setDescription('');
    setAdding(false);
    load();
  }

  return (
    <>
      <SectionHeader
        eyebrow="CAREER EVIDENCE"
        title="Projects"
        description="Track the work that proves what you can build."
        action={<button className="primary-btn" onClick={() => setAdding(!adding)}><Plus size={16} /> Add project</button>}
      />
      {err && <div className="panel"><p>{err}</p></div>}
      {adding && (
        <div className="panel add-skill">
          <input placeholder="Project title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="primary-btn" onClick={add}>Save project</button>
        </div>
      )}
      {projects.length ? projects.map((p) => (
        <div className="panel" key={p.id}>
          <div className="panel-title">
            <div>
              <span className="eyebrow">{p.status}</span>
              <h2>{p.title}</h2>
            </div>
            <span className="skill-status verified">{p.verification}</span>
          </div>
          <p>{p.description || 'No description yet.'}</p>
        </div>
      )) : <div className="panel"><p>No projects yet. Add your first project to start building verified evidence.</p></div>}
    </>
  );
}
