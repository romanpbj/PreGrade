import express from 'express'
import cors from 'cors'
import dotenv from "dotenv"
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send("Backend is up")
});

app.post('/api/bodytext', async (req, res) => {
  const { assignmentText } = req.body;

  if (!assignmentText) {
    return res.status(400).json({ error: "Missing assignmentText" });
  }

  console.log("Received assignmentText:");
  console.log(assignmentText.slice(0, 500) + "...");
  try {
    const response = await genAI.generateText({
        prompt: `Summarize the following text in one sentence: ${assignmentText}`,
        maxOutputTokens: 300,
    })
    const summary = response.generatedText
    res.json({ insights: `Received and processed: ${summary}` });
    } catch (error) {
        console.error("Error generating text with Gemini:", error);
        res.status(500).json({ error: "Failed to generate text" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});