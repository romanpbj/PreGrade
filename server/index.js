import express from 'express'
import cors from 'cors'
import dotenv from "dotenv"
import { OpenAI } from 'openai'


dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.API_KEY,
})

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send("Backend is up");
});

app.post("/api/grade", upload.single("file"), async (req, res) => {
  const { assignmentText } = req.body;
  const fileBuffer = req.file?.buffer;

  if (!fileBuffer || !assignmentText) {
    return res.status(400).json({ error: "Missing file or assignmentText" });
  }

  let fileText = '';
  try {
    fileText = await extractTextFromPdf(fileBuffer);
  } catch (err) {
    console.error("PDF parse error:", err);
    return res.status(500).json({ error: "Failed to parse PDF" });
  }

  if (!fileText.trim()) {
    return res.status(400).json({ error: "No readable text found in the PDF." });
  }

  const prompt = `Grade the following assignment:\n\nAssignment Instructions:\n${assignmentText}\n\nStudent Submission:\n${fileText}`;

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
    res.json({ insights, filename: req.file.originalname });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Failed to generate AI feedback" });
  }
});

app.post('/api/bodytext', verifyFirebaseToken, async (req, res) => {
  const { assignmentText } = req.body;
  const userId = req.user?.uid;

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

// New endpoint for file upload (you can implement this similarly)
app.post('/api/upload', verifyFirebaseToken, async (req, res) => {
  const userId = req.user?.uid;
  
  // Your file upload logic here
  // For now, just return a placeholder
  res.json({ 
    insights: "File upload endpoint - implement your file processing logic here",
    userId: userId || null
  });
});

// New endpoint for grading files
app.post('/api/grade', verifyFirebaseToken, async (req, res) => {
  const userId = req.user?.uid;
  
  // Your file grading logic here
  // For now, just return a placeholder
  res.json({ 
    insights: "File grading endpoint - implement your file grading logic here",
    filename: "uploaded_file.pdf",
    userId: userId || null
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});