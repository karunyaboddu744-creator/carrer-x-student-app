import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import {
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  Target,
  BookOpen,
  X,
  ArrowRight,
  ExternalLink,
  Code2,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api';

const fallbackCompanies = [
  {
    id: 'google',
    name: 'Google',
    role: 'Software Engineer',
    category: 'Software Engineering',
    readiness: 0,
    requiredSkills: [
      'Data Structures',
      'Algorithms',
      'JavaScript',
      'React',
      'System Design',
      'Problem Solving'
    ],
    guidelines: [
      'Build strong data structures and algorithm fundamentals.',
      'Practice solving problems with clear time and space complexity.',
      'Build production-style projects that demonstrate engineering ability.',
      'Understand APIs, databases, authentication and system design.',
      'Practice explaining your technical decisions clearly.'
    ]
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    role: 'Software Engineer',
    category: 'Software Engineering',
    readiness: 0,
    requiredSkills: [
      'Data Structures',
      'Algorithms',
      'C++',
      'JavaScript',
      'Cloud',
      'Problem Solving'
    ],
    guidelines: [
      'Strengthen DSA and problem-solving skills.',
      'Develop strong programming fundamentals.',
      'Understand cloud and distributed application concepts.',
      'Create projects that demonstrate practical engineering skills.',
      'Practice technical communication and debugging.'
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon',
    role: 'Software Development Engineer',
    category: 'Software Engineering',
    readiness: 0,
    requiredSkills: [
      'Data Structures',
      'Algorithms',
      'Java',
      'Python',
      'AWS',
      'System Design'
    ],
    guidelines: [
      'Master DSA and coding problem solving.',
      'Learn object-oriented programming thoroughly.',
      'Understand scalable backend and cloud architecture.',
      'Build measurable real-world projects.',
      'Practice structured technical problem solving.'
    ]
  },
  {
    id: 'tcs',
    name: 'TCS',
    role: 'Graduate Software Engineer',
    category: 'Software Engineering',
    readiness: 0,
    requiredSkills: [
      'Java',
      'Python',
      'SQL',
      'Data Structures',
      'Communication',
      'Problem Solving'
    ],
    guidelines: [
      'Build strong programming fundamentals.',
      'Practice SQL and database concepts.',
      'Improve aptitude and problem-solving skills.',
      'Develop communication and interview readiness.',
      'Maintain a portfolio of practical projects.'
    ]
  },
  {
    id: 'infosys',
    name: 'Infosys',
    role: 'Systems Engineer',
    category: 'Software Engineering',
    readiness: 0,
    requiredSkills: [
      'Java',
      'Python',
      'SQL',
      'Web Development',
      'Problem Solving',
      'Communication'
    ],
    guidelines: [
      'Strengthen programming and database fundamentals.',
      'Practice coding and logical reasoning.',
      'Build web or software projects.',
      'Improve communication and presentation skills.',
      'Track measurable progress in your technical skills.'
    ]
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    role: 'AI / Software Engineer',
    category: 'AI & Engineering',
    readiness: 0,
    requiredSkills: [
      'Python',
      'C++',
      'Machine Learning',
      'CUDA',
      'Algorithms',
      'Linear Algebra'
    ],
    guidelines: [
      'Build strong Python and C++ fundamentals.',
      'Learn machine learning fundamentals.',
      'Study algorithms and computational thinking.',
      'Explore GPU computing and CUDA concepts.',
      'Create AI projects with measurable outcomes.'
    ]
  }
];

function normalizeSkill(value) {
  return String(value || '').trim().toLowerCase();
}

function calculateReadiness(company, user) {
  const required = company.requiredSkills || [];
  const userSkills = (user?.skills || []).map((skill) =>
    normalizeSkill(typeof skill === 'string' ? skill : skill.name)
  );

  if (!required.length) return 0;

  const matched = required.filter((skill) =>
    userSkills.some(
      (userSkill) =>
        userSkill === normalizeSkill(skill) ||
        userSkill.includes(normalizeSkill(skill)) ||
        normalizeSkill(skill).includes(userSkill)
    )
  );

  return Math.round((matched.length / required.length) * 100);
}

function getSkillGaps(company, user) {
  const userSkills = (user?.skills || []).map((skill) =>
    normalizeSkill(typeof skill === 'string' ? skill : skill.name)
  );

  return (company.requiredSkills || []).filter(
    (skill) =>
      !userSkills.some(
        (userSkill) =>
          userSkill === normalizeSkill(skill) ||
          userSkill.includes(normalizeSkill(skill)) ||
          normalizeSkill(skill).includes(userSkill)
      )
  );
}

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [user, setUser] = useState(null);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [companyData, userData] = await Promise.all([
          api('/api/companies'),
          api('/api/auth/me')
        ]);

        setCompanies(
          companyData.companies?.length
            ? companyData.companies
            : fallbackCompanies
        );

        setUser(userData.user);
        setErr('');
      } catch (e) {
        setCompanies(fallbackCompanies);

        try {
          const userData = await api('/api/auth/me');
          setUser(userData.user);
        } catch {
          // Keep fallback data available.
        }

        setErr('');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const enrichedCompanies = useMemo(
    () =>
      companies.map((company) => ({
        ...company,
        calculatedReadiness: calculateReadiness(company, user),
        skillGaps: getSkillGaps(company, user)
      })),
    [companies, user]
  );

  const list = enrichedCompanies.filter((company) =>
    `${company.name} ${company.role} ${company.category}`
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  const openCompany = (company) => {
    setSelected(company);
  };

  return (
    <>
      <SectionHeader
        eyebrow="ROLE-SPECIFIC READINESS"
        title="Company Readiness"
        description="Understand what companies expect, identify your skill gaps, and prepare with a clear roadmap."
      />

      <div className="company-toolbar">
        <div className="search large">
          <Search size={17} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search companies or roles..."
          />
        </div>
      </div>

      {loading ? (
        <div className="panel">
          <p>Loading company readiness...</p>
        </div>
      ) : (
        <div className="company-grid">
          {list.map((company) => (
            <div
              key={company.id || company.name}
              className="panel"
              style={{
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => openCompany(company)}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center'
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(124, 92, 255, 0.12)'
                    }}
                  >
                    <Building2 size={23} />
                  </div>

                  <div>
                    <h3 style={{ margin: 0 }}>
                      {company.name}
                    </h3>
                    <p style={{ margin: '4px 0 0' }}>
                      {company.role}
                    </p>
                  </div>
                </div>

                <ArrowRight size={18} />
              </div>

              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 7
                  }}
                >
                  <span>Readiness</span>
                  <strong>
                    {company.calculatedReadiness}%
                  </strong>
                </div>

                <div className="bar">
                  <i
                    style={{
                      width: `${company.calculatedReadiness}%`
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 7,
                  marginTop: 15
                }}
              >
                {(company.requiredSkills || [])
                  .slice(0, 4)
                  .map((skill) => (
                    <span
                      key={skill}
                      className="skill-chip"
                    >
                      {skill}
                    </span>
                  ))}
              </div>

              <div
                style={{
                  marginTop: 16,
                  fontSize: 13,
                  opacity: 0.7
                }}
              >
                {company.skillGaps.length} skill gap
                {company.skillGaps.length === 1 ? '' : 's'} ·
                Click to view preparation plan
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !list.length && (
        <div className="panel">
          <h3>No companies found</h3>
          <p>
            Try searching for another company or role.
          </p>
        </div>
      )}

      <div className="info-banner">
        <span>✦</span>
        <div>
          <b>How readiness is calculated</b>
          <p>
            Your score compares the skills currently present
            in your CARRER-X profile with the skills listed for
            the selected role. It is a preparation indicator,
            not a hiring prediction.
          </p>
        </div>
      </div>

      {/* COMPANY DETAILS MODAL */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.72)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}
        >
          <div
            className="panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(900px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSelected(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer'
              }}
            >
              <X size={21} />
            </button>

            <div
              style={{
                display: 'flex',
                gap: 15,
                alignItems: 'center',
                paddingRight: 40
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(124, 92, 255, 0.14)'
                }}
              >
                <Building2 size={28} />
              </div>

              <div>
                <span className="eyebrow">
                  COMPANY READINESS
                </span>

                <h2 style={{ margin: '4px 0' }}>
                  {selected.name}
                </h2>

                <p style={{ margin: 0 }}>
                  {selected.role}
                </p>
              </div>
            </div>

            {/* READINESS */}
            <div
              style={{
                marginTop: 25,
                padding: 18,
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <span className="eyebrow">
                    YOUR READINESS
                  </span>

                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      marginTop: 5
                    }}
                  >
                    {selected.calculatedReadiness}%
                  </div>
                </div>

                <BarChart3 size={28} />
              </div>

              <div
                className="bar"
                style={{ marginTop: 14 }}
              >
                <i
                  style={{
                    width: `${selected.calculatedReadiness}%`
                  }}
                />
              </div>
            </div>

            {/* SKILL MATCH */}
            <div style={{ marginTop: 25 }}>
              <div className="panel-title">
                <div>
                  <span className="eyebrow">
                    SKILL ANALYSIS
                  </span>
                  <h2>Required Skills</h2>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 9
                }}
              >
                {(selected.requiredSkills || []).map(
                  (skill) => {
                    const missing =
                      selected.skillGaps.includes(skill);

                    return (
                      <div
                        key={skill}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '11px 13px',
                          borderRadius: 12,
                          border:
                            '1px solid rgba(255,255,255,0.07)'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                          }}
                        >
                          {missing ? (
                            <AlertCircle size={18} />
                          ) : (
                            <CheckCircle2 size={18} />
                          )}

                          <span>{skill}</span>
                        </div>

                        <span
                          style={{
                            fontSize: 12,
                            opacity: 0.7
                          }}
                        >
                          {missing
                            ? 'Skill gap'
                            : 'Matched'}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* GUIDELINES */}
            <div style={{ marginTop: 28 }}>
              <div className="panel-title">
                <div>
                  <span className="eyebrow">
                    PREPARATION
                  </span>
                  <h2>Company Guidelines</h2>
                </div>

                <BookOpen size={22} />
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 10
                }}
              >
                {(selected.guidelines || []).map(
                  (guideline, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        gap: 11,
                        alignItems: 'flex-start',
                        padding: 12,
                        borderRadius: 12,
                        background:
                          'rgba(255,255,255,0.025)'
                      }}
                    >
                      <span
                        style={{
                          minWidth: 24,
                          height: 24,
                          borderRadius: 50,
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      >
                        {index + 1}
                      </span>

                      <span>{guideline}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* NEXT ACTIONS */}
            <div style={{ marginTop: 28 }}>
              <div className="panel-title">
                <div>
                  <span className="eyebrow">
                    NEXT ACTIONS
                  </span>
                  <h2>Close your skill gaps</h2>
                </div>

                <Target size={22} />
              </div>

              {selected.skillGaps.length ? (
                <div
                  style={{
                    display: 'grid',
                    gap: 10
                  }}
                >
                  {selected.skillGaps.map((skill) => (
                    <div
                      key={skill}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: 12,
                        borderRadius: 12,
                        border:
                          '1px solid rgba(255,255,255,0.07)'
                      }}
                    >
                      <Code2 size={18} />
                      <span>
                        Build proof of skill in{' '}
                        <strong>{skill}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="info-banner">
                  <ShieldCheck size={20} />
                  <div>
                    <b>All listed skills matched.</b>
                    <p>
                      Continue with projects, assessments
                      and challenges to strengthen your proof.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 25,
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <button
                className="secondary-btn"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}