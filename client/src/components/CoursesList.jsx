import { useEffect, useState } from 'react';
import { db } from '../firebase/config.js';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { createCourse } from '../firebase/database.js';

const CoursesList = ({ userId, selectedCourseId, onSelectCourse }) => {
  const [courses, setCourses] = useState([]);
  const [newCourseName, setNewCourseName] = useState('');

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

  return (
    <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#fff' }}>
      <h3>Your Courses</h3>
      <div style={{ marginBottom: '10px' }}>
        {courses.map(course => (
          <button 
            key={course.id}
            onClick={() => onSelectCourse(course.id)}
            style={{
              margin: '5px',
              padding: '8px 12px',
              backgroundColor: selectedCourseId === course.id ? '#007cba' : '#eee',
              color: selectedCourseId === course.id ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {course.courseName}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '5px' }}>
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
      </div>
    </div>
  );
};

export default CoursesList;
