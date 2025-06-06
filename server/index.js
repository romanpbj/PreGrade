import express from 'express'
import cors from 'cors'
import dotenv from "dotenv"
import { OpenAI } from 'openai'
import PdfParse from 'pdf-parse'

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.API_KEY,
})

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send("Backend is up")
});

router.post("/api/grade", upload.single("file"), async (req, res) => {
  const { assignmentText } = req.body;
  const fileBuffer = req.file?.buffer;

  if (!fileBuffer || !assignmentText) {
    return res.status(400).json({ error: "Missing file or assignmentText" });
  }

  let fileText = "";
  try {
    const pdfData = await pdfParse(fileBuffer);
    fileText = pdfData.text;
  } catch (err) {
    return res.status(500).json({ error: "Failed to parse PDF" });
  }

  const prompt = `Grade the following assignment:\n\nAssignment Instructions: ${assignmentText}\n\nStudent Submission:\n${fileText}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an AI teaching assistant. Grade the student's response." },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
    });

    const insights = completion.choices[0].message.content;
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate AI feedback" });
  }
});

app.post('/api/bodytext', async (req, res) => {
  const { assignmentText } = req.body;

  if (!assignmentText) {
    return res.status(400).json({ error: "Missing assignmentText" });
  }

  try {
    const completetion = await openai.chat.completions.create({ 
        model: "gpt-4",
        messages: [
            { role: "system", content: "You are a helpful assistant that generates insights from text." },
            { role: "user", content: `Generate insights from the following text: ${assignmentText}` }
        ],
        temperature: 0.7,
        max_tokens: 500,
     });

    const aiResponse = completetion.choices[0].message.content;
    res.json({ insights: aiResponse });
  } catch (error) {
    console.error("Error generating text with OpenAI:", error);
    res.status(500).json({ error: "Failed to generate text" });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});