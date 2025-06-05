import express from 'express'
import cors from 'cors'
import dotenv from "dotenv"
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send("Backend is up")
});

app.post('/api/bodytext', (req, res) => {
  const { assignmentText } = req.body;

  if (!assignmentText) {
    return res.status(400).json({ error: "Missing assignmentText" });
  }

  console.log("Received assignmentText:");
  console.log(assignmentText.slice(0, 500) + "...");

  res.json({ insights: `Received and processed: ${assignmentText.slice(0, 100)}...` });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});