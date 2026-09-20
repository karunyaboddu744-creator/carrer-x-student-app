import React, { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import { api } from '../api';

export default function Challenges() {
  const [items, setItems] = useState([]);
  const [recs, setRecs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [credits, setCredits] = useState(0);

  async function loadChallenges() {
    try {
      setLoading(true);
      setError('');

      const data = await api('/api/challenges');

      setItems(data.challenges || []);
      setCredits(Number(data.credits || 0));
    } catch (err) {
      setError(err.message || 'Unable to load challenges');
    } finally {
      setLoading(false);
    }
  }

  async function loadRecommendations() {
    try {
      const data = await api('/api/recommendations');
      setRecs(data.recommendations || []);
    } catch {
      // Recommendations are optional.
    }
  }

  useEffect(() => {
    loadChallenges();
    loadRecommendations();
  }, []);

  function openChallenge(challenge) {
    setSelected(challenge);
    setResponse('');
    setError('');
    setMessage('');
  }

  function closeChallenge() {
    if (submitting) return;

    setSelected(null);
    setResponse('');
    setError('');
    setMessage('');
  }

  async function completeChallenge() {
    if (!selected) return;

    if (response.trim().length < 10) {
      setError(
        'Please write at least 10 characters describing your solution.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      const data = await api(
        `/api/challenges/${selected.id}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({
            response: response.trim()
          })
        }
      );

      setCredits(Number(data.credits || 0));

      setMessage(
        data.message ||
          `Challenge completed! +${data.earned || selected.points} credits earned.`
      );

      setItems((current) =>
        current.map((challenge) =>
          challenge.id === selected.id
            ? {
                ...challenge,
                completed: true
              }
            : challenge
        )
      );

      setSelected((current) =>
        current
          ? {
              ...current,
              completed: true
            }
          : current
      );

      setResponse('');
    } catch (err) {
      setError(
        err.message ||
          'Unable to complete challenge.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SectionHeader
        eyebrow="PRACTICE ARENA"
        title="Challenges"
        description="Complete real-world challenges, build career evidence and earn CARRER-X credits."
      />

      {/* Credits summary */}
      <div
        className="panel"
        style={{
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <span className="eyebrow">
            YOUR CARRER-X CREDITS
          </span>

          <h2
            style={{
              margin: '6px 0 0',
              fontSize: 32
            }}
          >
            {credits}
          </h2>

          <p
            style={{
              margin: '4px 0 0',
              opacity: 0.7
            }}
          >
            Earn credits by completing challenges.
          </p>
        </div>

        <div
          style={{
            fontSize: 42
          }}
        >
          🏆
        </div>
      </div>

      {error && !selected && (
        <div
          className="panel"
          style={{
            marginBottom: 16,
            border: '1px solid #ef4444'
          }}
        >
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="panel">
          <p>Loading challenges...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="panel">
          <p>No challenges are available right now.</p>
        </div>
      ) : (
        <div className="company-grid">
          {items.map((challenge) => (
            <div
              className="company-card"
              key={challenge.id}
              style={{
                background: '#fff',
                padding: 20,
                cursor: challenge.completed
                  ? 'default'
                  : 'pointer',
                position: 'relative'
              }}
              onClick={() =>
                !challenge.completed &&
                openChallenge(challenge)
              }
            >
              {/* Completed badge */}
              {challenge.completed && (
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    padding: '5px 9px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: '#dcfce7',
                    color: '#166534'
                  }}
                >
                  ✓ COMPLETED
                </div>
              )}

              <div className="company-head">
                <div className="company-logo">
                  {challenge.points}
                </div>

                <div>
                  <h3>
                    {challenge.title}
                  </h3>

                  <p>
                    {challenge.category} ·{' '}
                    {challenge.difficulty}
                  </p>
                </div>
              </div>

              <p
                style={{
                  marginTop: 14,
                  lineHeight: 1.5,
                  opacity: 0.75
                }}
              >
                {challenge.description ||
                  'Complete this career-readiness challenge.'}
              </p>

              <div className="skill-tags">
                {(challenge.skills || []).map(
                  (skill) => (
                    <span key={skill}>
                      {skill}
                    </span>
                  )
                )}
              </div>

              {!challenge.completed && (
                <button
                  type="button"
                  style={{
                    marginTop: 18,
                    width: '100%',
                    padding: '11px 14px',
                    border: 0,
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    openChallenge(challenge);
                  }}
                >
                  Start Challenge →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div
        className="panel"
        style={{
          marginTop: 20
        }}
      >
        <div className="panel-title">
          <div>
            <span className="eyebrow">
              RECOMMENDED NEXT
            </span>

            <h2>
              From your skill gaps
            </h2>
          </div>
        </div>

        {recs.length === 0 ? (
          <p>No recommendations yet.</p>
        ) : (
          recs.map((recommendation) => (
            <div
              className="activity"
              key={recommendation.id}
              style={{
                marginBottom: 14
              }}
            >
              <div>
                <b>
                  {recommendation.title}
                </b>

                <span>
                  {recommendation.reason} ·{' '}
                  {recommendation.priority}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Challenge modal */}
      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={closeChallenge}
        >
          <div
            className="panel"
            style={{
              width: 'min(720px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff'
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16
              }}
            >
              <div>
                <span className="eyebrow">
                  {selected.category}
                </span>

                <h2
                  style={{
                    marginTop: 6
                  }}
                >
                  {selected.title}
                </h2>

                <p>
                  {selected.description}
                </p>
              </div>

              <button
                type="button"
                onClick={closeChallenge}
                disabled={submitting}
                style={{
                  border: 0,
                  background: 'transparent',
                  fontSize: 24,
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 16,
                borderRadius: 12,
                background: '#f5f7fb'
              }}
            >
              <strong>
                Challenge instructions
              </strong>

              <ul
                style={{
                  marginTop: 10,
                  paddingLeft: 22,
                  lineHeight: 1.7
                }}
              >
                {(selected.instructions || []).map(
                  (instruction, index) => (
                    <li key={index}>
                      {instruction}
                    </li>
                  )
                )}
              </ul>
            </div>

            {selected.starter && (
              <p
                style={{
                  marginTop: 18,
                  fontWeight: 600
                }}
              >
                {selected.starter}
              </p>
            )}

            {selected.completed ? (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  borderRadius: 12,
                  background: '#dcfce7',
                  color: '#166534'
                }}
              >
                ✓ You have already completed this
                challenge.
              </div>
            ) : (
              <>
                <textarea
                  value={response}
                  onChange={(event) =>
                    setResponse(
                      event.target.value
                    )
                  }
                  placeholder="Write your solution, approach, architecture, algorithm or analysis here..."
                  rows={9}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    marginTop: 18,
                    padding: 14,
                    borderRadius: 12,
                    border: '1px solid #d1d5db',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    opacity: 0.65
                  }}
                >
                  Minimum 10 characters ·{' '}
                  {response.length} characters
                </div>

                {error && (
                  <div
                    style={{
                      marginTop: 14,
                      color: '#dc2626',
                      fontWeight: 600
                    }}
                  >
                    {error}
                  </div>
                )}

                {message && (
                  <div
                    style={{
                      marginTop: 14,
                      color: '#15803d',
                      fontWeight: 700
                    }}
                  >
                    {message}
                  </div>
                )}

                <button
                  type="button"
                  onClick={completeChallenge}
                  disabled={
                    submitting ||
                    response.trim().length < 10
                  }
                  style={{
                    width: '100%',
                    marginTop: 18,
                    padding: '13px 16px',
                    border: 0,
                    borderRadius: 10,
                    cursor:
                      submitting
                        ? 'wait'
                        : 'pointer',
                    fontWeight: 800,
                    opacity:
                      response.trim().length < 10
                        ? 0.5
                        : 1
                  }}
                >
                  {submitting
                    ? 'Submitting...'
                    : `Complete Challenge · +${selected.points} Credits`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}