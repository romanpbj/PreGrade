import express from 'express'
import cors from 'cors'
import dotenv from "dotenv"
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const genAI = new GoogleGenAI(ProcessingInstruction.env.API_KEY);

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send("Backend is up")
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});