import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import CompanyCard from '../components/CompanyCard';
import { Search, Filter } from 'lucide-react';
import { api } from '../api';

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/api/companies').then((d) => setCompanies(d.companies || [])).catch((e) => setErr(e.message));
  }, []);

  const list = companies.filter((c) => `${c.name} ${c.role}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <SectionHeader eyebrow="ROLE-SPECIFIC READINESS" title="Company Readiness" description="Compare your verified skills against the requirements of roles you care about." />
      <div className="company-toolbar">
        <div className="search large"><Search size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies or roles..." /></div>
        <button className="secondary-btn"><Filter size={16} /> Filters</button>
      </div>
      {err && <div className="panel"><p>{err}</p></div>}
      <div className="company-grid">{list.map((c) => <CompanyCard key={c.name} company={c} />)}</div>
      <div className="info-banner">
        <span>✦</span>
        <div>
          <b>How readiness is calculated</b>
          <p>Your score combines verified skills, assessment performance, experience and role-specific requirements. It is a guide—not a hiring prediction.</p>
        </div>
      </div>
    </>
  );
}
