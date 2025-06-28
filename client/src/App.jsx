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

  const handleAuthSuccess = () => setShowAuth(false);

  if (authLoading) {
    return <div style={{ padding: "1rem", textAlign: "center", minWidth: "400px" }}>Loading...</div>;
  }

return (
  <div style={{ padding: "1rem", minWidth: "400px", backgroundColor: "#007cba", minHeight: "100vh" }}>
    <div style={{
      backgroundColor: "#fff",
      borderRadius: "20px",
      padding: "1.5rem",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      color: "#000"
    }}>
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
        <div style={{ display: "flex", justifyContent: "center", marginTop: "0.5rem" }}>
          <div style={{
            display: "flex",
            border: "1px solid #ccc",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "#f5f5f5"
          }}>
            <button
              onClick={() => {
                setCoursePanel(false);
                setGradePanel(true);
              }}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                outline: "none",
                backgroundColor: gradePanel ? "#007cba" : "transparent",
                color: gradePanel ? "#fff" : "#000",
                fontWeight: "500",
                minWidth: "180px",
                cursor: "pointer",
                borderRight: "1px solid #ccc",
                transition: "background-color 0.3s ease, color 0.3s ease"
              }}
            >
              Grade
            </button>
            <button
              onClick={() => {
                setCoursePanel(true);
                setGradePanel(false);
              }}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                outline: "none",
                backgroundColor: coursePanel ? "#007cba" : "transparent",
                color: coursePanel ? "#fff" : "#000",
                fontWeight: "500",
                minWidth: "180px",
                cursor: "pointer",
                transition: "background-color 0.3s ease, color 0.3s ease"
              }}
            >
              Courses
            </button>
          </div>
        </div>
      )}

      {user && coursePanel && !showAuth && <CoursesList userId={user.uid} />}

      {gradePanel && !showAuth && user && (
        <>
          <div>
            <h3>{courses.length ? <></> : "Create Courses to grade for"}</h3>
            <div 
              style={{ 
                display: "flex", 
                flexWrap: "wrap", // Allows buttons to wrap if there are too many
                justifyContent: "center", // Centers buttons horizontally
                alignItems: "center", // Centers buttons vertically
                gap: "10px", // Adds spacing between buttons
                marginBottom: "10px" 
              }}
            >
              {courses.map(course => (
                <button
                  key={course.id}
                  onClick={() => setGradeCourseId(course.id)}
                  style={{
                    padding: "8px 16px",
                    marginRight: "8px",
                    minWidth: "80px",
                    fontWeight: 500,
                    border: gradeCourseId === course.id ? "1px solid #007cba" : "1px solid #ccc",
                    backgroundColor: gradeCourseId === course.id ? "#007cba" : "#f5f5f5",
                    color: gradeCourseId === course.id ? "#fff" : "#000",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                >
                  {course.courseName}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3>Assignment File</h3>
            <div style={{
              border: '2px dashed rgb(173, 173, 173)',
              borderRadius: '12px',
              padding: '1rem 1rem',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <img
                src={chrome.runtime.getURL("icons/cloud.png")}
                alt="Upload Icon"
                style={{
                  width: '100px',
                  height: '100px',
                  marginTop: '-25px',
                  marginBottom: '-20px',
                  opacity: 0.9
                }}
              />

              <label htmlFor="file-upload" style={{
                padding: '10px 20px',
                backgroundColor: '#007cba',
                color: '#fff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                display: 'inline-block'
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
                <div style={{ fontSize: '13px', color: '#333' }}>
                  {file.name.length > 40
                    ? file.name.slice(0, 25) + '...' + file.name.slice(-10)
                    : file.name}
                </div>
              )}
            </div>

            {file && gradeCourseId && (
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007cba',
                  color: "#eee",
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  marginTop: '1rem'
                }}
                onClick={gradeWithFile}
              >
                {isLoading ? "Grading..." : "Grade File"}
              </button>
            )}
          </div>

          {(response || errorMessage) && (
            <div style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: errorMessage ? "#ffe6e6" : "#f5f5f5",
              borderRadius: "10px",
              border: errorMessage ? "1px solid #cc0000" : "none",
              color: "#000"
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
        </>
      )}
    </div>
  </div>
);
}

export default App;