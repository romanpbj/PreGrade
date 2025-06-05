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