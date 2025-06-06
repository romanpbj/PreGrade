import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");

  function handleChange(e) {
    setFile(e.target.files[0]);
    setResponse(""); // Clear previous response
  }

  async function handleSubmit(e) {
    e.preventDefault(); 
    if (!file) return alert("Please upload a file first.");
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await axios.post("http://localhost:3001/api/upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
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
          const res = await axios.post("http://localhost:3001/api/bodytext", {
            assignmentText: response.assignmentText
          });
          
          setResponse(res.data.insights);
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
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await axios.post("http://localhost:3001/api/grade", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setResponse(res.data.insights);
      alert(`File "${res.data.filename}" graded successfully!`);
      
    } catch (err) {
      console.error(err);
      alert("Grading failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ padding: "1rem", minWidth: "400px" }}>
      <h2>PreGrade</h2>
      
      {/* File Upload Section */}
      <div style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "5px" }}>
        <h3>Upload Assignment File</h3>
        <form onSubmit={handleSubmit}>
          <input 
            type="file" 
            onChange={handleChange} 
            accept=".pdf,.docx"
            style={{ marginBottom: "10px" }}
          />
          <div>
            <button type="submit" disabled={isLoading || !file}>
              {isLoading ? "Processing..." : "Upload & Analyze"}
            </button>
            <button 
              type="button" 
              onClick={gradeWithFile} 
              disabled={isLoading || !file}
              style={{ marginLeft: "10px" }}
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

      {/* Page Text Section */}
      <div style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "5px" }}>
        <h3>Grade Text from Page</h3>
        <button onClick={testAssignmentGrading} disabled={isLoading}>
          {isLoading ? "Processing..." : "Grade Assignment from Canvas"}
        </button>
      </div>

      {/* Response Section */}
      {response && (
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#black", borderRadius: "5px" }}>
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