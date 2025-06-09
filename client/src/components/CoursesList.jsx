import { useEffect, useState } from 'react';
import { db } from '../firebase/config.js';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { createCourse, deleteCourse } from '../firebase/database.js';


const CoursesList = ({ userId}) => {
  const [courses, setCourses] = useState([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [create, setCreate] = useState(false);

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
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    const result = await deleteCourse(userId, courseId);
    if (!result.success) {
      alert("Error deleting course: " + result.error);
    }
  };

  return (
    <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#fff' }}>
      <h3>Your Courses</h3>
      <div style={{ marginBottom: '10px' }}>
        {courses.map(course => (
          <div key={course.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <button 
              onClick={() => onSelectCourse(course.id)}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
                flexGrow: 1,
                textAlign: 'left',
                backgroundColor: '#eee'
              }}
            >
              {course.courseName}
            </button>
            <button 
              onClick={() => handleDeleteCourse(course.id)}
              style={{
                padding: '6px 10px',
                backgroundColor: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {create ? <div style={{ display: 'flex', gap: '5px' }}>
        <input 
          type="text" 
          placeholder="New Course Name" 
          value={newCourseName} 
          onChange={(e) => setNewCourseName(e.target.value)} 
          style={{ flexGrow: 1, padding: '8px' }}
        />
        <button onClick={handleCreateCourse} style={{ padding: '8px', backgroundColor: '#007cba', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Add
        </button>
      </div> : <></>}

      <div>
        {create ? <button onClick={() => setCreate(false)}>Cancel</button> : <button onClick={() => setCreate(true)}>Add Course</button>}

      </div>
    </div>
  );
};

export default CoursesList;
