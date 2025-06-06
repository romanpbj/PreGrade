import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { OpenAI } from 'openai';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

dotenv.config();

const app = express();
const PORT = 3001;

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

async function extractTextFromPdf(buffer) {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join(' ') + '\n\n';
  }

  return fullText;
}

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

app.post('/api/bodytext', async (req, res) => {
  const { assignmentText } = req.body;

  if (!assignmentText) {
    return res.status(400).json({ error: "Missing assignmentText" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates insights from text." },
        { role: "user", content: `Generate insights from the following text: ${assignmentText}` }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0].message.content;
    res.json({ insights: aiResponse });
  } catch (error) {
    console.error("Error generating text with OpenAI:", error);
    res.status(500).json({ error: "Failed to generate text" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});