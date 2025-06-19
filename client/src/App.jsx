import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from './hooks/UseAuth.js';
import AuthComponent from './components/AuthComponent.jsx';
import UserHeader from './components/UserHeader.jsx';
import CoursesList from './components/CoursesList.jsx';
import { db } from './firebase/config.js';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { saveGradingResultToCourse } from './firebase/database.js';
import './styles/App.css';

function App() {
  const [gradePanel, setGradePanel] = useState(true);
  const [coursePanel, setCoursePanel] = useState(false);
  const [courses, setCourses] = useState([]);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [grade, setGrade] = useState("");
  const [response, setResponse] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [gradeCourseId, setGradeCourseId] = useState(null);
  const { user, loading: authLoading, handleLogout, getFormDataHeaders } = useAuth();

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
    setErrorMessage("");
  }

async function gradeWithFile() {
  if (!file) {
    setErrorMessage("Please select a file.");
    return;
  }
  if (!gradeCourseId && user) {
    setErrorMessage("Please select a course.");
    return;
  }

  setIsLoading(true);
  setErrorMessage("");
  setResponse("");

  try {
    window.postMessage({ type: "SCRAPE_TEXT_REQUEST" }, "*");

    const handleResponse = async (event) => {
      if (event.source !== window || event.data?.type !== "SCRAPE_TEXT_RESPONSE") return;
      window.removeEventListener("message", handleResponse);

      const assignmentText = event.data.assignmentText;
      if (!assignmentText) {
        setErrorMessage("Failed to get assignment text.");
        setIsLoading(false);
        return;
      }

      // Get weight and bias from selected course
      const selectedCourse = courses.find(c => c.id === gradeCourseId);
      const weight = selectedCourse?.leniencyFactor?.weight || 1;
      const bias = selectedCourse?.leniencyFactor?.bias || 0;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("assignmentText", assignmentText);
      formData.append("weight", weight);
      formData.append("bias", bias);

      try {
        const headers = await getFormDataHeaders();
        const res = await axios.post("http://localhost:3001/api/grade", formData, { headers });

        const feedback = res.data.feedback;
        const score = res.data.preGradedScore;
        setResponse(feedback);
        setGrade(score);

        const gradingResult = { feedback, score };

        if (!feedback || !score) {
          setErrorMessage("Grading failed: Incomplete response from AI.");
          setIsLoading(false);
          return;
        }

        const result = await saveGradingResultToCourse(user.uid, gradeCourseId, file.name, gradingResult);

        if (!result.success) {
          setErrorMessage("Failed to save grading result: " + result.error);
        }
      } catch (err) {
        setErrorMessage("Grading failed: " + (err.response?.data?.error || err.message));
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener("message", handleResponse);
  } catch (err) {
    setErrorMessage("Unexpected error contacting content script.");
    setIsLoading(false);
  }
}

  const navBtnsStyle = {
    display: "flex",
    justifyContent: "left",
    gap: "10px",
    marginTop: "1rem",
    marginBottom: "1rem",
  };

  const buttonStyle = {
    padding: "0.5rem 1rem",
    border: "2px solid #007cba",
    borderRadius: "10px",
    backgroundColor: "#fff",
    color: "#000",
    cursor: "pointer",
    transition: "border 0.2s ease-in-out"
  };

  const handleAuthSuccess = () => setShowAuth(false);

  if (authLoading) {
    return <div style={{ padding: "1rem", textAlign: "center", minWidth: "400px" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "1rem", minWidth: "400px" }}>
      <UserHeader
        user={user}
        onShowAuth={() => setShowAuth(!showAuth)}
        onLogout={handleLogout}
        showAuth={showAuth}
      />

      {!showAuth && !user && (
        <AuthComponent
          onAuthSuccess={handleAuthSuccess}
          onCancel={() => setShowAuth(false)}
        />
      )}

      {user && (
        <div style={navBtnsStyle}>
          <button
            onClick={() => {
              setCoursePanel(false);
              setGradePanel(true);
            }}
            style={{ ...buttonStyle, border: gradePanel ? "2px solid #fff" : "2px solid #007cba" }}
          >
            Grade
          </button>
          <button
            onClick={() => {
              setCoursePanel(true);
              setGradePanel(false);
            }}
            style={{ ...buttonStyle, border: coursePanel ? "2px solid #fff" : "2px solid #007cba" }}
          >
            Courses
          </button>
        </div>
      )}

      {user && coursePanel && !showAuth && <CoursesList userId={user.uid} />}

      {gradePanel && !showAuth && user && (
        <div style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "10px", backgroundColor: "#fff" }}>
          <h3>{courses.length ? "Course" : "You have no courses"}</h3>
          <div style={{ marginBottom: '10px' }}>
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => setGradeCourseId(course.id)}
                style={{
                  padding: '8px 12px',
                  marginRight: "5px",
                  backgroundColor: gradeCourseId === course.id ? '#007cba' : '#eee',
                  color: gradeCourseId === course.id ? "#fff" : '#000',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                {course.courseName}
              </button>
            ))}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #ccc", margin: "20px 0" }} />
          <h3>Assignment File</h3>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="file-upload" style={{
              marginTop: '6px',
              marginBottom: '6px',
              backgroundColor: '#fff',
              color: '#007cba',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
            }}>
              Choose File
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleChange}
              accept=".pdf,.docx"
              style={{ display: 'none' }}
            />
            {file && (
              <span style={{ marginLeft: '10px', fontSize: "13px" }}>
                {file.name.length > 30 ? file.name.slice(0, 20) + '...' + file.name.slice(-10) : file.name}
              </span>
            )}
          </div>

          {file && gradeCourseId && (
            <button
              style={{
                padding: '8px 12px',
                backgroundColor: '#007cba',
                color: "#fff",
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
              onClick={gradeWithFile}
            >
              {isLoading ? "Grading..." : "Grade File"}
            </button>
          )}
        </div>
      )}

      {(response || errorMessage) && gradePanel && user && (
        <div style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: errorMessage ? "#ffe6e6" : "#f5f5f5",
          borderRadius: "10px",
          border: errorMessage ? "1px solid #cc0000" : "none"
        }}>
          {errorMessage ? (
            <>
              <h3 style={{ color: "#cc0000" }}>⚠️ Error</h3>
              <div style={{ color: "#cc0000", fontSize: "14px" }}>{errorMessage}</div>
            </>
          ) : (
            <>
              <h3>Score: {grade}</h3>
              <div style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.4" }}>
                {response}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;