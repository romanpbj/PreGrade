import express from 'express'
import cors from 'cors'
import dotenv from "dotenv"
import { GoogleGenAI } from "@google/genai";
import bodytext from '../client/public/content.js'

dotenv.config();

const genAI = new GoogleGenAI(ProcessingInstruction.env.API_KEY);

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send("Backend is up")
});

app.get('/api/bodytext', (req, res) => {
    const { assignmentText } = req.body;
    if (!assignmentText) {
      return res.status(400).json({ error: "Missing assignmentText" });
    }
    const insights = `Processed insights for: ${assignmentText}`;
    res.json({ insights });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});