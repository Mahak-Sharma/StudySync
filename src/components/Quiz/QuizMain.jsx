import React, { useEffect, useState, useRef } from 'react';
import { createQuiz, fetchQuizzes, startQuiz, submitQuizAnswers, fetchQuizLeaderboard, deleteQuiz } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';
import { FaCheckCircle, FaHourglassStart, FaTrophy, FaPlus, FaTimes, FaUserCircle, FaListOl, FaQuestionCircle, FaTrash } from 'react-icons/fa';
import { db } from '../../api/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const defaultQuestion = { question: '', options: ['', '', '', ''], answer: 0 };

const statusColors = {
  created: '#bdbdbd',
  started: '#42a5f5',
  ended: '#66bb6a',
};
const statusIcons = {
  created: <FaHourglassStart color="#bdbdbd" style={{ marginRight: 4 }} />,
  started: <FaHourglassStart color="#42a5f5" style={{ marginRight: 4 }} />,
  ended: <FaCheckCircle color="#66bb6a" style={{ marginRight: 4 }} />,
};

const QuizMain = ({ groupId }) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ title: '', timer: 60, questions: [ { ...defaultQuestion } ] });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [participation, setParticipation] = useState(null); // { quiz, answers, submitted, score }
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [autoSubmitMsg, setAutoSubmitMsg] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [userMap, setUserMap] = useState({}); // userId -> displayName
  const timerRef = useRef();

  // Helper to fetch and cache usernames
  const fetchUsernames = async (userIds) => {
    const newMap = { ...userMap };
    const toFetch = userIds.filter(uid => !newMap[uid]);
    await Promise.all(toFetch.map(async (uid) => {
      try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          newMap[uid] = userSnap.data().displayName || uid;
        } else {
          newMap[uid] = uid;
        }
      } catch {
        newMap[uid] = uid;
      }
    }));
    setUserMap(prev => ({ ...prev, ...newMap }));
  };

  // Fetch quizzes for this group
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    fetchQuizzes(groupId).then(qs => {
      setQuizzes(qs);
      setLoading(false);
    });
  }, [groupId, creating, participation?.submitted, showLeaderboard]);

  // Fetch leaderboard for all quizzes on load (for attempt check)
  useEffect(() => {
    if (!quizzes.length || !user) return;
    quizzes.forEach(q => {
      fetchQuizLeaderboard(q.id).then(lb => {
        setQuizzes(prev => prev.map(quiz => quiz.id === q.id ? { ...quiz, leaderboard: lb } : quiz));
        // Fetch usernames for leaderboard
        fetchUsernames(lb.map(e => e.user_id));
      });
    });
  }, [quizzes.length, user]);

  // Timer effect for quiz participation
  useEffect(() => {
    if (!participation || participation.submitted) return;
    setTimeLeft(activeQuiz?.timer || 0);
    setAutoSubmitMsg('');
    if (timerRef.current) clearInterval(timerRef.current);
    if (activeQuiz) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line
  }, [activeQuiz, participation]);

  // Handlers for quiz creation
  const handleCreateChange = (field, value) => {
    setCreateData(prev => ({ ...prev, [field]: value }));
  };
  const handleQuestionChange = (idx, field, value) => {
    setCreateData(prev => {
      const questions = [...prev.questions];
      if (field === 'options') {
        questions[idx].options = value;
      } else {
        questions[idx][field] = value;
      }
      return { ...prev, questions };
    });
  };
  const addQuestion = () => {
    setCreateData(prev => ({ ...prev, questions: [...prev.questions, { ...defaultQuestion }] }));
  };
  const removeQuestion = (idx) => {
    setCreateData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  };
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const payload = {
        ...createData,
        created_by: user?.uid || 'unknown',
        questions: createData.questions.map(q => ({
          ...q,
          options: q.options.map(opt => opt.trim()),
          answer: Number(q.answer)
        }))
      };
      const res = await createQuiz(groupId, payload);
      if (!res.success) throw new Error('Quiz creation failed');
      setShowCreate(false);
      setCreateData({ title: '', timer: 60, questions: [ { ...defaultQuestion } ] });
    } catch (err) {
      setError(err.message || 'Quiz creation failed');
    }
    setCreating(false);
  };

  // Quiz participation
  const handleStartQuiz = async (quiz) => {
    setCurrentQ(0);
    setAutoSubmitMsg('');
    if (quiz.status !== 'started') {
      await startQuiz(quiz.id);
    }
    setActiveQuiz(quiz);
    setParticipation({ quiz, answers: Array(quiz.questions.length).fill(null), submitted: false, score: null });
    setShowLeaderboard(false);
  };
  const handleAnswerChange = (qIdx, optIdx) => {
    setParticipation(prev => {
      const answers = [...prev.answers];
      answers[qIdx] = optIdx;
      return { ...prev, answers };
    });
  };
  const handleSubmitAnswers = async () => {
    setSubmitting(true);
    clearInterval(timerRef.current);
    const { quiz, answers } = participation;
    const res = await submitQuizAnswers(quiz.id, user?.uid || 'unknown', answers);
    setParticipation(prev => ({ ...prev, submitted: true, score: res.score }));
    // Update quiz leaderboard in state instantly
    const newEntry = {
      user_id: user.uid,
      score: res.score,
      submitted_at: new Date().toISOString(),
    };
    setQuizzes(prev => prev.map(qz => qz.id === quiz.id ? { ...qz, leaderboard: [...(qz.leaderboard || []), newEntry] } : qz));
    setShowLeaderboard(true);
    const lb = await fetchQuizLeaderboard(quiz.id);
    setLeaderboard(lb);
    fetchUsernames([user.uid, ...lb.map(e => e.user_id)]);
    setSubmitting(false);
  };
  const handleAutoSubmit = async () => {
    setAutoSubmitMsg('Time is up! Your quiz was auto-submitted.');
    if (!participation?.submitted) {
      await handleSubmitAnswers();
    }
  };
  const handleShowLeaderboard = async (quiz) => {
    setActiveQuiz(quiz);
    setShowLeaderboard(true);
    const lb = await fetchQuizLeaderboard(quiz.id);
    setLeaderboard(lb);
    fetchUsernames(lb.map(e => e.user_id));
    // Update quiz leaderboard in state instantly (use functional update to avoid stale state)
    setQuizzes(prev => prev.map(qz => qz.id === quiz.id ? { ...qz, leaderboard: lb } : qz));
  };
  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    await deleteQuiz(quizId);
    setQuizzes(qs => qs.filter(q => q.id !== quizId));
  };

  // Check if user has already attempted a quiz
  const hasAttempted = (quiz) => {
    if (!quiz.leaderboard || !user) return false;
    return quiz.leaderboard.some(entry => entry.user_id === user.uid);
  };

  // UI
  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}><span className="loader" /> Loading quizzes...</div>;

  return (
    <div style={{ padding: 24, background: '#f7f8fa', borderRadius: 16, minHeight: 200, maxWidth: 700, margin: '0 auto', boxShadow: '0 2px 16px #e3eafc' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <FaQuestionCircle color="#1976d2" size={28} style={{ marginRight: 8 }} />
        <h3 style={{ color: '#1976d2', margin: 0 }}>Group Quiz Platform</h3>
      </div>
      {showCreate ? (
        <form onSubmit={handleCreateQuiz} style={{ background: '#fff', padding: 20, borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 8px #e3eafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Create New Quiz</h4>
            <button type="button" onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer' }}><FaTimes /></button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 500 }}>Title: <input value={createData.title} onChange={e => handleCreateChange('title', e.target.value)} required style={{ marginLeft: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc' }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 500 }}>Timer (seconds): <input type="number" min={10} value={createData.timer} onChange={e => handleCreateChange('timer', e.target.value)} required style={{ marginLeft: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 80 }} /></label>
          </div>
          {createData.questions.map((q, idx) => (
            <div key={idx} style={{ border: '1px solid #e3eafc', padding: 12, borderRadius: 8, marginBottom: 12, background: '#f9fafd' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <FaListOl color="#1976d2" style={{ marginRight: 6 }} />
                <label style={{ fontWeight: 500 }}>Q{idx+1}: <input value={q.question} onChange={e => handleQuestionChange(idx, 'question', e.target.value)} required style={{ width: '60%', marginLeft: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc' }} /></label>
                {createData.questions.length > 1 && <button type="button" onClick={() => removeQuestion(idx)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#e53935', fontSize: 18, cursor: 'pointer' }}><FaTimes /></button>}
              </div>
              <div style={{ marginLeft: 24 }}>
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} style={{ marginBottom: 4 }}>
                    <label style={{ fontWeight: 400 }}>Option {oIdx+1}: <input value={opt} onChange={e => {
                      const opts = [...q.options]; opts[oIdx] = e.target.value;
                      handleQuestionChange(idx, 'options', opts);
                    }} required style={{ marginLeft: 8, padding: 4, borderRadius: 4, border: '1px solid #ccc' }} /></label>
                  </div>
                ))}
                <div style={{ marginTop: 4 }}>
                  <label style={{ fontWeight: 400 }}>Correct Answer:
                    <select value={q.answer} onChange={e => handleQuestionChange(idx, 'answer', e.target.value)} style={{ marginLeft: 8, padding: 4, borderRadius: 4 }}>
                      {q.options.map((_, oIdx) => <option key={oIdx} value={oIdx}>Option {oIdx+1}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addQuestion} style={{ marginBottom: 12, background: '#e3eafc', color: '#1976d2', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}><FaPlus style={{ marginRight: 6 }} />Add Question</button>
          <div style={{ marginTop: 8 }}>
            <button type="submit" disabled={creating} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Create Quiz</button>
            <button type="button" onClick={() => setShowPreview(true)} style={{ marginLeft: 12, background: '#fffde7', color: '#ffb300', border: '1px solid #ffe082', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Preview</button>
          </div>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </form>
      ) : (
        <button onClick={() => setShowCreate(true)} style={{ marginBottom: 20, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 1px 8px #e3eafc' }}><FaPlus style={{ marginRight: 8 }} />Create New Quiz</button>
      )}

      {/* Quiz Preview Modal */}
      {showPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, maxWidth: 500, boxShadow: '0 2px 16px #e3eafc', position: 'relative' }}>
            <button onClick={() => setShowPreview(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#888', fontSize: 22, cursor: 'pointer' }}><FaTimes /></button>
            <h4 style={{ color: '#1976d2' }}>Quiz Preview</h4>
            <div><b>Title:</b> {createData.title}</div>
            <div><b>Timer:</b> {createData.timer} seconds</div>
            <ol style={{ marginTop: 12 }}>
              {createData.questions.map((q, idx) => (
                <li key={idx} style={{ marginBottom: 8 }}>
                  <div><b>Q{idx+1}:</b> {q.question}</div>
                  <ul>
                    {q.options.map((opt, oIdx) => <li key={oIdx}>{opt} {Number(q.answer) === oIdx && <FaCheckCircle color="#66bb6a" style={{ marginLeft: 4 }} />}</li>)}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <h4 style={{ marginTop: 0, marginBottom: 12, color: '#333', fontWeight: 600 }}>Available Quizzes</h4>
      {quizzes.length === 0 ? <div style={{ color: '#888', marginBottom: 24 }}>No quizzes yet.</div> : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
          {quizzes.map(q => (
            <div key={q.id} style={{ flex: '1 1 260px', minWidth: 260, background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px #e3eafc', padding: 18, marginBottom: 8, position: 'relative', borderLeft: `6px solid ${statusColors[q.status] || '#bdbdbd'}` }}>
              {/* Delete icon for quiz creator */}
              {user && q.created_by === user.uid && (
                <button onClick={() => handleDeleteQuiz(q.id)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#e53935', fontSize: 18, cursor: 'pointer' }} title="Delete Quiz"><FaTrash /></button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                {statusIcons[q.status]}
                <span style={{ fontWeight: 600, fontSize: 17 }}>{q.title}</span>
              </div>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>Questions: {q.questions.length} | Timer: {q.timer}s</div>
              <div style={{ color: statusColors[q.status], fontWeight: 500, marginBottom: 8 }}>Status: {q.status.charAt(0).toUpperCase() + q.status.slice(1)}</div>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>
                Participants: {q.leaderboard ? q.leaderboard.length : 0}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleStartQuiz(q)} disabled={q.status === 'ended' || hasAttempted(q)} style={{ background: hasAttempted(q) ? '#bdbdbd' : '#42a5f5', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: q.status === 'ended' || hasAttempted(q) ? 'not-allowed' : 'pointer', opacity: q.status === 'ended' || hasAttempted(q) ? 0.6 : 1 }}>{hasAttempted(q) ? 'Already Attempted' : 'Start / Participate'}</button>
                <button onClick={() => handleShowLeaderboard(q)} style={{ background: '#fffde7', color: '#ffb300', border: '1px solid #ffe082', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}><FaTrophy style={{ marginRight: 4 }} />Leaderboard</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz Participation UI */}
      {participation && activeQuiz && !participation.submitted && (
        <div style={{ background: '#e3f2fd', padding: 24, borderRadius: 12, marginTop: 24, boxShadow: '0 1px 8px #e3eafc', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          <h4 style={{ color: '#1976d2', marginBottom: 8 }}>Quiz: {activeQuiz.title}</h4>
          <div style={{ marginBottom: 12, color: '#888', fontWeight: 500 }}>
            Timer: <span style={{ color: timeLeft <= 10 ? '#e53935' : '#1976d2', fontWeight: 700 }}>{timeLeft}</span> seconds
          </div>
          <div style={{ marginBottom: 18, color: '#1976d2', fontWeight: 500 }}>Question {currentQ + 1} of {activeQuiz.questions.length}</div>
          <div style={{ marginBottom: 18, background: '#fff', borderRadius: 8, padding: 14, boxShadow: '0 1px 4px #e3eafc' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}><FaListOl style={{ marginRight: 6 }} />Q{currentQ + 1}: {activeQuiz.questions[currentQ].question}</div>
            <div style={{ marginLeft: 16, marginTop: 6 }}>
              {activeQuiz.questions[currentQ].options.map((opt, oIdx) => (
                <label key={oIdx} style={{ marginRight: 18, display: 'inline-block', marginBottom: 6, background: participation.answers[currentQ] === oIdx ? '#c8e6c9' : '#f7f8fa', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', border: participation.answers[currentQ] === oIdx ? '2px solid #66bb6a' : '1px solid #e3eafc', fontWeight: participation.answers[currentQ] === oIdx ? 600 : 400 }}>
                  <input
                    type="radio"
                    name={`q${currentQ}`}
                    checked={participation.answers[currentQ] === oIdx}
                    onChange={() => handleAnswerChange(currentQ, oIdx)}
                    style={{ marginRight: 6 }}
                  /> {opt}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0} style={{ background: '#bdbdbd', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: currentQ === 0 ? 'not-allowed' : 'pointer' }}>Previous</button>
            <button onClick={() => setCurrentQ(q => Math.min(activeQuiz.questions.length - 1, q + 1))} disabled={currentQ === activeQuiz.questions.length - 1} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: currentQ === activeQuiz.questions.length - 1 ? 'not-allowed' : 'pointer' }}>Next</button>
          </div>
          <button onClick={handleSubmitAnswers} disabled={submitting} style={{ marginTop: 18, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 1px 8px #e3eafc', width: '100%' }}>Submit Answers</button>
          {autoSubmitMsg && <div style={{ color: '#e53935', marginTop: 10, fontWeight: 600 }}>{autoSubmitMsg}</div>}
        </div>
      )}

      {/* Leaderboard UI */}
      {showLeaderboard && activeQuiz && (
        <div style={{ background: '#fffde7', padding: 24, borderRadius: 12, marginTop: 24, boxShadow: '0 1px 8px #ffe082', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          <h4 style={{ color: '#ffb300', marginBottom: 8 }}><FaTrophy style={{ marginRight: 8 }} />Leaderboard: {activeQuiz.title}</h4>
          {leaderboard.length === 0 ? <div style={{ color: '#888' }}>No submissions yet.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <thead>
                <tr style={{ background: '#ffe082' }}>
                  <th style={{ padding: 8, borderRadius: 4, textAlign: 'left' }}>Rank</th>
                  <th style={{ padding: 8, borderRadius: 4, textAlign: 'left' }}>User</th>
                  <th style={{ padding: 8, borderRadius: 4, textAlign: 'center' }}>Score</th>
                  <th style={{ padding: 8, borderRadius: 4, textAlign: 'center' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr key={entry.user_id} style={{ fontWeight: idx === 0 ? 'bold' : 'normal', color: idx === 0 ? '#388e3c' : idx === 1 ? '#1976d2' : idx === 2 ? '#ffb300' : '#333', background: idx % 2 === 0 ? '#fffde7' : '#fff' }}>
                    <td style={{ padding: 8 }}>{idx + 1} {idx === 0 && <FaTrophy color="#388e3c" title="Top Scorer" />} {idx === 1 && <FaTrophy color="#1976d2" title="2nd Place" />} {idx === 2 && <FaTrophy color="#ffb300" title="3rd Place" />}</td>
                    <td style={{ padding: 8 }}><FaUserCircle style={{ marginRight: 6, fontSize: 18 }} />{userMap[entry.user_id] || entry.user_id}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>{entry.score}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>{new Date(entry.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button onClick={() => setShowLeaderboard(false)} style={{ marginTop: 16, background: '#ffb300', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Close Leaderboard</button>
        </div>
      )}

      {/* Show score after submission */}
      {participation && participation.submitted && (
        <div style={{ background: '#c8e6c9', padding: 16, borderRadius: 8, marginTop: 18, textAlign: 'center', fontWeight: 600, fontSize: 18, color: '#388e3c', boxShadow: '0 1px 8px #e3eafc' }}>
          <FaCheckCircle style={{ marginRight: 8 }} />Your Score: {participation.score} / {activeQuiz.questions.length}
        </div>
      )}
    </div>
  );
};

export default QuizMain; 