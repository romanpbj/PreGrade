import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from './hooks/UseAuth.js';
import AuthComponent from './components/AuthComponent.jsx';
import UserHeader from './components/UserHeader.jsx';
import CoursesList from './components/CoursesList.jsx';
import { db } from './firebase/config.js';
import { collection, onSnapshot } from 'firebase/firestore';

function App() {
  const [gradePanel, setGradePanel] = useState(true);
  const [coursePanel, setCoursePanel] = useState(false);
  const [courses, setCourses] = useState([]);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [gradeCourseId, setGradeCourseId] = useState(null);
  const { user, loading: authLoading, handleLogout, getAuthHeaders, getFormDataHeaders } = useAuth();

  useEffect(() => {
    if (!user || !user.uid) {
      setCourses([]);
      return;
    }

    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'courses'),
      (snapshot) => {
        const courseData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCourses(courseData);
      }
    );

    return () => unsub();
  }, [user]);

  function handleChange(e) {
    setFile(e.target.files[0]);
    setResponse("");
  }

  async function gradeWithFile() {
    if (!file) return alert("Please select a file first.");
    if (!gradeCourseId) return alert("Please select a course.");
    setIsLoading(true);

    try {
      window.postMessage({ type: "SCRAPE_TEXT_REQUEST" }, "*");

      const handleResponse = async (event) => {
        if (event.source !== window || event.data?.type !== "SCRAPE_TEXT_RESPONSE") return;
        window.removeEventListener("message", handleResponse);

        const assignmentText = event.data.assignmentText;

        if (!assignmentText) {
          setIsLoading(false);
          return alert("Failed to get assignment text.");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("assignmentText", assignmentText);

        try {
          const headers = await getFormDataHeaders();
          const res = await axios.post("http://localhost:3001/api/grade", formData, { headers });

          setResponse(res.data.insights);
          alert(`File "${res.data.filename}" graded successfully!`);
        } catch (err) {
          console.error(err);
          alert("Grading failed: " + (err.response?.data?.error || err.message));
        } finally {
          setIsLoading(false);
        }
      };

      window.addEventListener("message", handleResponse);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      alert("Unexpected error contacting content script.");
    }
  }

  const handleAuthSuccess = (user) => {
    setShowAuth(false);
    alert(`Welcome ${user.displayName || user.email}!`);
  };

  if (authLoading) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", minWidth: "400px" }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", minWidth: "400px" }}>
      <UserHeader
        user={user}
        onShowAuth={() => setShowAuth(!showAuth)}
        onLogout={handleLogout}
        showAuth={showAuth}
      />

      {showAuth && !user && (
        <AuthComponent
          onAuthSuccess={handleAuthSuccess}
          onCancel={() => setShowAuth(false)}
        />
      )}

      {!showAuth && (
        <div>
          <button onClick={() => { setCoursePanel(false); setGradePanel(true); }}>Grade</button>
          {user && <button onClick={() => { setCoursePanel(true); setGradePanel(false); }}>Courses</button>}
        </div>
      )}

      {user && coursePanel && !showAuth && (
        <CoursesList userId={user.uid} />
      )}

      {gradePanel && !showAuth && (
        <div style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "5px", backgroundColor: "#fff" }}>
          {!user ? (
            <h3>Sign in for course specific grading</h3>
          ) : courses.length ? (
            <h3>Select Course</h3>
          ) : (
            <h3>You have no courses</h3>
          )}
          <div style={{ marginBottom: '10px' }}>
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => setGradeCourseId(course.id)}
                style={{
                  margin: '5px',
                  padding: '8px 12px',
                  backgroundColor: gradeCourseId === course.id ? '#bababa' : '#eee',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {course.courseName}
              </button>
            ))}
          </div>

          <h3>Upload Assignment File</h3>
          <input
            type="file"
            onChange={handleChange}
            accept=".pdf,.docx"
            style={{ marginBottom: "10px" }}
          />
          <div>
            <button
              onClick={gradeWithFile}
              disabled={isLoading || !file || !gradeCourseId}
            >
              {isLoading ? "Grading..." : "Grade File"}
            </button>
          </div>
          {file && (
            <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
      )}

      {response && gradePanel && (
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "5px" }}>
          <h3>PreGrade Response:</h3>
          <div style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.4" }}>
            {response}
          </div>
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: "center", margin: "1rem 0" }}>
          <p>Processing... Please wait.</p>
        </div>
      )}
    </div>
  );
}

export default App;