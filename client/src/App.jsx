import { useState } from "react";
import axios from "axios";

function App() {

  const [file, setFile] = useState([]);

  function handleChange(e){
    setFile(e.target.files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return alert("Please upload a file first.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/upload", formData);
      alert("File uploaded: " + res.data.message);
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    }
  }

  async function test() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_TEXT" }, async (response) => {
      if (!response?.assignmentText) {
        return alert("Failed to get assignment text.");
      }

      try {
        const res = await fetch("http://localhost:3001/api/bodyText", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignmentText: response.assignmentText })
        });

        const data = await res.json();
        alert("Gemini response: " + data.insights);
      } catch (err) {
        alert("Error contacting backend");
        console.error(err);
      }
    });
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2>PreGrade</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleChange} />
        <button type="submit">Grade</button>
      </form>
    </div>
  );
}

export default App;