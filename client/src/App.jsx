import { useState } from "react";
import axios from "axios";
import { useAuth } from './hooks/UseAuth.js';
import AuthComponent from './components/AuthComponent.jsx';
import UserHeader from './components/UserHeader.jsx';
import { saveGradingResult } from './firebase/database.js';

function App() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  
  const { user, loading: authLoading, handleLogout, getAuthHeaders, getFormDataHeaders } = useAuth();

  // File handlers
  function handleChange(e) {
    setFile(e.target.files[0]);
    setResponse("");
  }

  async function handleSubmit(e) {
    e.preventDefault(); 
    if (!file) return alert("Please upload a file first.");
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const headers = await getFormDataHeaders();
      const res = await axios.post("http://localhost:3001/api/upload", formData, { headers });
      setResponse(res.data.insights);
      alert("File uploaded and processed successfully!");
    } catch (err) {
      console.error(err);
      alert("Upload failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  }

  async function testAssignmentGrading() {
    setIsLoading(true);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_TEXT" }, async (response) => {
        if (!response?.assignmentText) {
          setIsLoading(false);
          return alert("Failed to get assignment text from the page.");
        }
        
        try {
          const headers = await getAuthHeaders();
          const res = await axios.post("http://localhost:3001/api/bodytext", {
            assignmentText: response.assignmentText
          }, { headers });
          
          setResponse(res.data.insights);
          
          // Save grading result to Firebase if user is authenticated
          if (user) {
            await saveGradingResult(user.uid, null, {
              assignmentText: response.assignmentText,
              gradingResult: res.data.insights,
              source: 'canvas_page',
              timestamp: new Date().toISOString()
            });
          }
          
          alert("Assignment graded successfully!");
          
        } catch (err) {
          alert("Error contacting backend: " + (err.response?.data?.error || err.message));
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      });
      
    } catch (error) {
      setIsLoading(false);
      alert("Error accessing browser tab");
      console.error(error);
    }
  }

async function gradeWithFile() {
  if (!file) return alert("Please select a file first.");
  setIsLoading(true);

  try {
    // Send message to content script to scrape text
    window.postMessage({ type: "SCRAPE_TEXT_REQUEST" }, "*");

    // Listen for response
    const handleResponse = async (event) => {
      if (event.source !== window || event.data?.type !== "SCRAPE_TEXT_RESPONSE") return;
      window.removeEventListener("message", handleResponse); // cleanup

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

        if (user) {
          await saveGradingResult(user.uid, null, {
            fileName: file.name,
            assignmentText,
            gradingResult: res.data.insights,
            source: "file_upload_with_canvas_text",
            timestamp: new Date().toISOString(),
          });
        }

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

      {/* Authentication Component */}
      {showAuth && !user && (
        <AuthComponent 
          onAuthSuccess={handleAuthSuccess}
          onCancel={() => setShowAuth(false)}
        />
      )}

      {/* File Upload Section */}
      <div style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "5px", backgroundColor: "#fff"}}>
        <h3>Upload Assignment File</h3>
        <form onSubmit={handleSubmit}>
          <input 
            type="file" 
            onChange={handleChange} 
            accept=".pdf,.docx"
            style={{ marginBottom: "10px" }}
          />
          <div>
            <button 
              type="button" 
              onClick={gradeWithFile} 
              disabled={isLoading || !file}
            >
              {isLoading ? "Grading..." : "Grade File"}
            </button>
          </div>
        </form>
        {file && (
          <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>
      {/* User Status */}
      {user && (
        <div style={{ marginBottom: "1rem", padding: "10px", backgroundColor: "#e8f5e8", borderRadius: "5px", fontSize: "12px" }}>
          ✓ Signed in - Your grading results are being saved to your account
        </div>
      )}

      {/* Response Section */}
      {response && (
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