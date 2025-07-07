import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import multer from 'multer';
import { OpenAI } from 'openai';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { spawn } from 'child_process';
import path from 'path';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3001;

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
  res.send('Welcome to PreGrade API!');
});

app.post("/api/grade", upload.single("file"), async (req, res) => {
  const { assignmentText, weight, bias } = req.body;
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

  const safeWeight = parseFloat(weight) || 1;
  const safeBias = parseFloat(bias) || 0;

const prompt = `Grade the following student's assignment and give direct feedback.

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

    Remember: The weight and bias reflect how strict or lenient this specific course tends to be so tailor your response to that.

    Here's an example of what feedback section need to looks like, make sure to limit it to 3 sentences:
    1. You demonstrated a strong grasp of matrix algebra in the context of balancing chemical equations. However your course is strict so you should improve upon...

    2. Your paper was clear and well-structured, with examples that were both relevant and insightful.

    3. For future submissions, be sure to double-check for minor grammatical issues — your ideas are strong, so polishing the writing will enhance them further.

    Your response should just include the PreGraded Score at the top, and then the 3 bullet points and thats it.

    If the submition has nothing to do with the assignment, or is completely off-topic, give a score of 0 and say something like "This submission does not address the assignment prompt at all. Please review the assignment instructions and resubmit.".

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

app.post('/api/leniency', async (req, res) => {
  const { predicted, actual } = req.body;

  if (!predicted || !actual || predicted.length !== actual.length) {
    return res.status(400).json({ error: "Invalid input arrays" });
  }

  try {
    const scriptPath = path.resolve('leniency/leniency_model.py');
    const py = spawn('python', [scriptPath]);

    let result = '';
    let errorOutput = '';

    py.stdout.on('data', (data) => {
      result += data.toString();
    });

    py.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    py.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: "Python error", details: errorOutput });
      }

      try {
        const parsed = JSON.parse(result);
        res.json(parsed);
      } catch (err) {
        res.status(500).json({
          error: "Failed to parse Python output",
          raw: result,
          stderr: errorOutput
        });
      }
    });

    py.stdin.write(JSON.stringify({ predicted, actual }));
    py.stdin.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unexpected error invoking Python" });
  }
});

app.listen(PORT, () => {
  console.log(` Server is running on ${PORT}`);
});