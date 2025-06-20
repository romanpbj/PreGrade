import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import multer from 'multer';
import { OpenAI } from 'openai';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

const app = express();
const PORT = 3001;

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


app.post("/api/grade", upload.single("file"), async (req, res) => {
  const { assignmentText, weight, bias } = req.body;
  const fileBuffer = req.file?.buffer;

  if (!fileBuffer || !assignmentText) {
    return res.status(400).json({ error: "Missing file or assignmentText" });
  }

  let fileText = '';
  try {
    if (req.file.mimetype === 'application/pdf') {
      fileText = await extractTextFromPdf(fileBuffer);
    } else if (
      req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      fileText = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file type. Only PDF and DOCX are allowed." });
    }
  } catch (err) {
    console.error("File parse error:", err);
    return res.status(500).json({ error: "Failed to parse uploaded file" });
  }

  if (!fileText.trim()) {
    return res.status(400).json({ error: "No readable text found in the file." });
  }

  const safeWeight = parseFloat(weight) || 1;
  const safeBias = parseFloat(bias) || 0;

  const prompt = `You are an AI teaching assistant. Grade the following student's assignment and give direct feedback.

    Begin by assigning a raw score based on the rubric. Then apply the leniency adjustment using this formula:

    Adjusted Score = (Weight x Raw Score) + Bias

    Use the following values:
    - Weight: ${safeWeight}
    - Bias: ${safeBias}
    - Raw Score: Your initial scoring based on the assignment quality

    At the very top of your response, output ONLY the final adjusted score exactly like this:
    "PreGraded Score: X/Y"
    Where X is the adjusted score (rounded to the nearest whole number) and Y is the total possible points as given in the assignment instructions.

    Then write some feedback.

    Your feedback should include exactly three concise bullet points:
    - Highlight what the student did well
    - Mention any areas needing improvement
    - Align your tone and feedback with the adjusted score (not the raw score)

    Here's an example of what feedback section need to looks like, make sure to limit it to 3 sentences:
    1. You demonstrated a strong grasp of matrix algebra in the context of balancing chemical equations. However your course is strict so you should improve upon...

    2. Your paper was clear and well-structured, with examples that were both relevant and insightful.

    3. For future submissions, be sure to double-check for minor grammatical issues — your ideas are strong, so polishing the writing will enhance them further.

    Your response should just include the PreGraded Score at the top, and then the 3 bullet points and thats it.

    Assignment Instructions:
    ${assignmentText}

    Student Submission:
    ${fileText}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an AI teaching assistant. Grade the student's response accurately." },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
    });

    const fullText = completion.choices[0].message.content;

    const scoreMatch = fullText.match(/^PreGraded Score:\s*(\d+\/\d+)/m);
    console.log("=== AI Raw Response ===\n", fullText);
    const preGradedScore = scoreMatch ? scoreMatch[1] : null;

    const feedback = fullText.replace(/^PreGraded Score:.*(\r?\n)?/m, "").trim();

    res.json({
      filename: req.file.originalname,
      preGradedScore,
      feedback
    });
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

app.post('/api/upload', async (req, res) => {
  res.json({ 
    insights: "File upload endpoint - implement your file processing logic here"
  });
});

app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});