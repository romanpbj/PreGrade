import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { deleteGradedResult } from '../firebase/database';

const GradedAssignments = ({ userId, courseId }) => {
  const [assignments, setAssignments] = useState([]);
  const [visibleFeedback, setVisibleFeedback] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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

  if (assignments.length === 0) return <p>No graded assignments found.</p>;

  return (
    <div style={{ marginTop: '1rem', maxWidth: '100%', overflowX: 'hidden' }}>
      <h4>Graded Assignments</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {assignments.map(a => (
          <div
            key={a.id}
            style={{
              position: 'relative',
              background: '#f9f9f9',
              padding: '10px',
              borderRadius: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              wordWrap: 'break-word'
            }}
          >
            {confirmDeleteId === a.id ? (
              <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                <button
                  onClick={() => handleDelete(a.id)}
                  style={{
                    backgroundColor: '#d32f2f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    marginRight: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{
                    backgroundColor: '#aaa',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteId(a.id)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: '#f9f9f9',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: '1'
                }}
              >
                ✕
              </button>
            )}

            <strong>{a.assignmentName}</strong><br />
            Score: {a.gradingResult?.score || '—'}<br />

            <button
              onClick={() => toggleFeedback(a.id)}
              style={{
                marginTop: '6px',
                marginBottom: '6px',
                backgroundColor: '#f9f9f9',
                color: '#007cba',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: "-5px"
              }}
            >
              {visibleFeedback[a.id] ? 'Hide Feedback' : 'Show Feedback'}
            </button>

            {visibleFeedback[a.id] && (
              <div style={{ marginTop: '8px' }}>
                {a.gradingResult?.feedback || '—'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradedAssignments;