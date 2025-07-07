import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { deleteGradedResult } from '../firebase/database';

const GradedAssignments = ({ userId, courseId }) => {
  const [assignments, setAssignments] = useState([]);
  const [visibleFeedback, setVisibleFeedback] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingScoreId, setEditingScoreId] = useState(null);
  const [scoreInput, setScoreInput] = useState('');
  const url = `https://pregrade.onrender.com`;

  useEffect(() => {
    if (!userId || !courseId) return;

    const gradingQuery = query(
      collection(db, 'users', userId, 'courses', courseId, 'gradingResults'),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(gradingQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignments(data);
    });

    return () => unsub();
  }, [userId, courseId]);

  const toggleFeedback = (id) => {
    setVisibleFeedback(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDelete = async (id) => {
    const result = await deleteGradedResult(userId, courseId, id);
    if (!result.success) {
      console.error("Failed to delete:", result.error);
    }
    setConfirmDeleteId(null);
  };

  const handleSaveScore = async (assignmentId) => {
    if (!scoreInput || !scoreInput.includes('/')) {
      alert("Invalid format. Please use 'e.g. 52/60'.");
      return;
    }

    try {
      const docRef = doc(db, 'users', userId, 'courses', courseId, 'gradingResults', assignmentId);
      await updateDoc(docRef, { actualScore: scoreInput });
      setEditingScoreId(null);
      setScoreInput('');

      const snapshot = await getDocs(collection(db, 'users', userId, 'courses', courseId, 'gradingResults'));
      const data = snapshot.docs.map(doc => doc.data());
      const predicted = [];
      const actual = [];

      for (const entry of data) {
        const pre = entry.gradingResult?.score;
        const act = entry.actualScore;

        if (pre && act && pre.includes('/') && act.includes('/')) {
          const predVal = parseFloat(pre.split('/')[0]);
          const actVal = parseFloat(act.split('/')[0]);
          if (!isNaN(predVal) && !isNaN(actVal)) {
            predicted.push(predVal);
            actual.push(actVal);
          }
        }
      }

      if (predicted.length >= 2) {
        const response = await fetch(`${url}api/leniency`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ predicted, actual }),
        });

        const result = await response.json();

        if (result.weight && result.bias) {
          const courseRef = doc(db, 'users', userId, 'courses', courseId);
          await updateDoc(courseRef, {
            leniencyFactor: { weight: result.weight, bias: result.bias }
          });
          console.log("✅ Leniency updated:", result);
        }
      }

    } catch (err) {
      console.error("Error saving score or updating leniency:", err);
      alert("Failed to save score or update leniency.");
    }
  };

  if (assignments.length === 0) return <p>No graded assignments found.</p>;

  return (
    <div style={{
        marginTop: '1rem',
        borderRadius: '10px',
        paddingBottom: '1rem',
        overflowX: 'auto'
        }}>
      <h4>Graded Assignments</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {assignments.map(a => (
          <div
            key={a.id}
            style={{
              position: 'relative',
              background: '#f5f5f5',
              borderRadius: '10px',
              border: "1px solid #ccc",
              wordWrap: 'break-word',
              padding: '12px',
            }}
          >
            {confirmDeleteId === a.id ? (
            <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                <button
                onClick={() => handleDelete(a.id)}
                title="Confirm Delete"
                style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: 'green'
                }}
                >
                ✓
                </button>
                <button
                onClick={() => setConfirmDeleteId(null)}
                title="Cancel"
                style={{
                    backgroundColor: 'red !important', // Force the background color
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: 'red', // Ensure text is visible on a red background
                }}
                >
                ✕
                </button>
            </div>
            ) : (
            <button
                onClick={() => setConfirmDeleteId(a.id)}
                title="Delete"
                style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: 'gray'
                }}
            >
                ✕
            </button>
            )}

            <strong>{a.assignmentName.slice(0, 30)}{a.assignmentName.length > 30 ? '...' : ''}</strong><br />
            <p>PreGrade Score: {a.gradingResult?.score || '—'}</p>
            {a.actualScore && <p>Actual Score: {a.actualScore}</p>}

            <button onClick={() => toggleFeedback(a.id)} style={{ backgroundColor: '#f5f5f5', color: '#007cba', border: 'none', cursor: 'pointer' }}>
              {visibleFeedback[a.id] ? 'Hide Feedback' : 'Show Feedback'}
            </button>

            {editingScoreId === a.id ? (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. 52/60"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  style={{ backgroundColor: '#f5f5f5', borderColor: 'gray', borderRadius: '4px', cursor: 'pointer' }}
                />
                <button onClick={() => handleSaveScore(a.id)} style={{ backgroundColor: '#f5f5f5', color: '#007cba', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                <button onClick={() => { setEditingScoreId(null); setScoreInput(''); }} style={{ backgroundColor: '#f5f5f5', color: 'gray', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setEditingScoreId(a.id)} style={{ backgroundColor: '#f5f5f5', color: 'gray', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {a.actualScore ? "Edit Actual Score" : "Enter Actual Score"}
              </button>
            )}

            {visibleFeedback[a.id] && (
              <div style={{ marginTop: '8px' }}>
                {a.feedback || a.gradingResult?.feedback || '—'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradedAssignments;