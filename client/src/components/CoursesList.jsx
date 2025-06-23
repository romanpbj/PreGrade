import { useEffect, useState } from 'react';
import { db } from '../firebase/config.js';
import { collection, onSnapshot } from 'firebase/firestore';
import { createCourse, deleteCourse } from '../firebase/database.js';
import GradedAssignments from './GradedAssignments.jsx';

const CoursesList = ({ userId }) => {
  const [courses, setCourses] = useState([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [create, setCreate] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(
      collection(db, 'users', userId, 'courses'),
      (snapshot) => {
        const courseData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCourses(courseData);
      }
    );

    return () => unsub();
  }, [userId]);

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) return alert('Enter a course name');
    const result = await createCourse(userId, newCourseName.trim());
    if (result.success) {
      setNewCourseName('');
    } else {
      alert('Error creating course: ' + result.error);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    const result = await deleteCourse(userId, courseId);
    if (!result.success) {
      console.error("Error deleting course: " + result.error);
    }
    setConfirmDeleteId(null);
  };

  return (
    <div style={{
      marginBottom: '1rem',
      borderRadius: '10px',
      backgroundColor: '#fff',
      maxWidth: '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      <div style={{ marginBottom: '10px' }}>
        {courses.map(course => (
          <div key={course.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <button
              onClick={() => setSelectedCourseId(course.id)}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                marginRight: '10px',
                flexGrow: 1,
                textAlign: 'left',
                backgroundColor: selectedCourseId === course.id ? '#007cba' : '#eee',
                color: selectedCourseId === course.id ? '#fff' : '#000'
              }}
            >
              {course.courseName}
            </button>

            {confirmDeleteId === course.id ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleDeleteCourse(course.id)}
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
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: 'red'
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteId(course.id)}
                title="Delete"
                style={{
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
          </div>
        ))}
      </div>

      {create && (
        <div style={{ display: 'flex', gap: '5px' }}>
          <input
            type="text"
            placeholder="New Course Name"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            style={{ flexGrow: 1, padding: '6px', borderRadius: "10px" }}
          />
          <button
            onClick={handleCreateCourse}
            style={{
              backgroundColor: '#fff',
              color: '#007cba',
              marginBottom: "9px",
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            Add
          </button>
          <button style={{
              backgroundColor: '#fff',
              color: '#gray',
              marginBottom: "9px",
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }} onClick={() => setCreate(false)}>Cancel</button>
        </div>
      )}

      <div>
        {!create && <button style={{
              backgroundColor: '#fff',
              color: '#007cba',
              marginBottom: "9px",
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }} onClick={() => setCreate(true)}>+ Add Course</button>}
      </div>

      {selectedCourseId && (
        <GradedAssignments userId={userId} courseId={selectedCourseId} />
      )}
    </div>
  );
};

export default CoursesList;