import express from 'express'
import cors from 'cors'
import dotenv from "dotenv"
import { OpenAI } from 'openai'
import admin from 'firebase-admin'

dotenv.config();

if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  admin.initializeApp({
    credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const openai = new OpenAI({
    apiKey: process.env.API_KEY,
})

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Middleware to verify Firebase token (optional)
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Allow requests without auth for backwards compatibility
    req.user = null;
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    req.user = null;
    next(); // Continue without auth for now
  }
};

app.get('/', (req, res) => {
    res.send("Backend is up")
});

app.post('/api/bodytext', verifyFirebaseToken, async (req, res) => {
  const { assignmentText } = req.body;
  const userId = req.user?.uid;

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
    
    // Log usage if user is authenticated
    if (userId) {
      console.log(`Grading request from user: ${userId}`);
    }
    
    res.json({ 
      insights: aiResponse,
      userId: userId || null 
    });
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