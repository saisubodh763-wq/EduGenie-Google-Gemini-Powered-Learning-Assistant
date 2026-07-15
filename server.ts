import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parser
app.use(express.json());

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI features will fail.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "MOCK_KEY",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Database File Path
const DB_PATH = path.join(process.cwd(), "db.json");

// Define Database Schema Interfaces
interface User {
  user_id: string;
  name: string;
  email: string;
  password?: string; // Stored in plain/hashed text for simulation
  created_at: string;
}

interface UserQuery {
  query_id: string;
  user_id: string;
  query_type: string; // QnA, Explanation, Quiz, Summary, Recommendation
  query_text: string;
  created_at: string;
}

interface AiResponse {
  response_id: string;
  query_id: string;
  response_text: string;
  model_used: string;
  created_at: string;
}

interface Quiz {
  quiz_id: string;
  query_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string; // A, B, C, D
  created_at: string;
}

interface Summary {
  summary_id: string;
  query_id: string;
  summary_text: string;
  created_at: string;
}

interface LearningPath {
  path_id: string;
  query_id: string;
  topic: string;
  difficulty_level: string; // Beginner, Intermediate, Advanced
  recommended_resources: string; // Detail markdown
  created_at: string;
}

interface SentEmail {
  email_id: string;
  user_id: string;
  sender: string;
  recipient: string;
  subject: string;
  body_html: string;
  body_markdown: string;
  theme: string;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  queries: UserQuery[];
  ai_responses: AiResponse[];
  quizzes: Quiz[];
  summaries: Summary[];
  learning_paths: LearningPath[];
  emails?: SentEmail[];
}

// Ensure DB exists
function initDB(): DatabaseSchema {
  if (!fs.existsSync(DB_PATH)) {
    const initialDB: DatabaseSchema = {
      users: [],
      queries: [],
      ai_responses: [],
      quizzes: [],
      summaries: [],
      learning_paths: [],
      emails: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.emails) {
      parsed.emails = [];
    }
    return parsed;
  } catch (error) {
    console.error("Failed to parse DB, resetting", error);
    const initialDB: DatabaseSchema = {
      users: [],
      queries: [],
      ai_responses: [],
      quizzes: [],
      summaries: [],
      learning_paths: [],
      emails: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
}

const db = initDB();
if (!db.emails) {
  db.emails = [];
}

function saveDB() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Utility to generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// Authentication Middleware Simulation
// We read user_id from headers (for simpler React/Vite communication)
function getUserId(req: express.Request): string | null {
  const userId = req.headers["x-user-id"] || req.query.user_id;
  return userId ? String(userId) : null;
}

// AUTH ENDPOINTS
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ error: "User with this email already exists" });
    return;
  }

  const newUser: User = {
    user_id: "user_" + generateId(),
    name,
    email,
    password, // Plain for the demo, we check it during login
    created_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDB();

  // Omit password in response
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ success: true, user: userWithoutPassword });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, user: userWithoutPassword });
});

// CORE ENDPOINTS - EXPLAINED, QNA, QUIZ, SUMMARIZE, LEARNING PATHS

// helper to clean markdown JSON wrappers
function cleanJsonBlock(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

// 1. QnA Endpoint
// Supporting GET and POST for flexibility as specified
const handleQa = async (req: express.Request, res: express.Response) => {
  const userId = getUserId(req) || "anonymous";
  const queryText = String(req.query.query || req.body.query || req.body.query_text || "");

  if (!queryText) {
    res.status(400).json({ error: "Query text is required" });
    return;
  }

  try {
    // 1. Create USER_QUERY record
    const queryId = "q_" + generateId();
    const newQuery: UserQuery = {
      query_id: queryId,
      user_id: userId,
      query_type: "QnA",
      query_text: queryText,
      created_at: new Date().toISOString(),
    };
    db.queries.push(newQuery);

    // 2. Query Gemini
    const prompt = `You are EduGenie, an advanced learning assistant. Please answer the following educational question accurately and in a structured, engaging manner: \n\nQuestion: ${queryText}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const aiText = response.text || "No response generated by Gemini.";

    // 3. Create AI_RESPONSE record
    const responseId = "res_" + generateId();
    const newResponse: AiResponse = {
      response_id: responseId,
      query_id: queryId,
      response_text: aiText,
      model_used: "Gemini 3.5 Flash",
      created_at: new Date().toISOString(),
    };
    db.ai_responses.push(newResponse);
    saveDB();

    res.json({
      success: true,
      query_id: queryId,
      response_id: responseId,
      query_text: queryText,
      response_text: aiText,
      model_used: "Gemini 3.5 Flash",
    });
  } catch (err: any) {
    console.error("QA error:", err);
    res.status(500).json({ error: "Failed to generate Q&A response: " + err.message });
  }
};

app.get("/api/qa", handleQa);
app.post("/api/qa", handleQa);
app.get("/qa", handleQa);
app.post("/qa", handleQa);

// 2. Concept Explainer (Simulated LaMini-Flan-T5 model)
const handleExplain = async (req: express.Request, res: express.Response) => {
  const userId = getUserId(req) || "anonymous";
  const topic = String(req.body.topic || req.body.query_text || req.query.topic || "");

  if (!topic) {
    res.status(400).json({ error: "Topic/Concept is required" });
    return;
  }

  try {
    const queryId = "q_" + generateId();
    const newQuery: UserQuery = {
      query_id: queryId,
      user_id: userId,
      query_type: "Explanation",
      query_text: topic,
      created_at: new Date().toISOString(),
    };
    db.queries.push(newQuery);

    // LaMini-Flan-T5-783M simulation prompt: extremely concise, highly structured, simple, beginner-friendly, and very brief.
    const prompt = `You are simulating the LaMini-Flan-T5-783M model inside EduGenie.
This model is CPU-compatible, lightweight, instruction-tuned, and specifically fine-tuned for generating highly simplified, extremely concise, and readable explanations of complex educational topics.
Explain the following topic: "${topic}".
Instructions:
- Keep the explanation extremely clear, brief (no more than 3 short paragraphs), and beginner-friendly.
- Break down complex terms into simple analogies.
- Use bullet points for key takeaways.
- Focus on foundational understanding for a student with zero technical experience.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const explanation = response.text || "No explanation generated.";

    const responseId = "res_" + generateId();
    const newResponse: AiResponse = {
      response_id: responseId,
      query_id: queryId,
      response_text: explanation,
      model_used: "LaMini-Flan-T5-783M (Simulated)",
      created_at: new Date().toISOString(),
    };
    db.ai_responses.push(newResponse);
    saveDB();

    res.json({
      success: true,
      query_id: queryId,
      response_id: responseId,
      topic,
      response_text: explanation,
      model_used: "LaMini-Flan-T5-783M (Simulated)",
    });
  } catch (err: any) {
    console.error("Explain error:", err);
    res.status(500).json({ error: "Failed to generate explanation: " + err.message });
  }
};

app.post("/api/explain", handleExplain);
app.get("/api/explain", handleExplain);
app.post("/explain", handleExplain);
app.get("/explain", handleExplain);

// 3. Quiz Generation Endpoint
const handleQuiz = async (req: express.Request, res: express.Response) => {
  const userId = getUserId(req) || "anonymous";
  const passage = String(req.body.passage || req.body.query_text || req.query.passage || "");

  if (!passage) {
    res.status(400).json({ error: "Passage or educational topic is required" });
    return;
  }

  try {
    const queryId = "q_" + generateId();
    const newQuery: UserQuery = {
      query_id: queryId,
      user_id: userId,
      query_type: "Quiz",
      query_text: passage,
      created_at: new Date().toISOString(),
    };
    db.queries.push(newQuery);

    const prompt = `You are EduGenie's Quiz generator. Read the following passage or topic:
"${passage}"

Generate exactly three (3) multiple-choice questions (MCQs) based on the passage.
You MUST output the result in a valid JSON array format, where each object contains:
- "question_text": The clear question.
- "option_a": Option A.
- "option_b": Option B.
- "option_c": Option C.
- "option_d": Option D.
- "correct_answer": The letter of the correct option ('A', 'B', 'C', or 'D').

Only output valid JSON. Do not include markdown headers or any text other than the JSON block.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question_text: { type: Type.STRING },
              option_a: { type: Type.STRING },
              option_b: { type: Type.STRING },
              option_c: { type: Type.STRING },
              option_d: { type: Type.STRING },
              correct_answer: { type: Type.STRING },
            },
            required: ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer"],
          },
        },
      },
    });

    const rawJson = cleanJsonBlock(response.text || "[]");
    const quizItems = JSON.parse(rawJson);

    const generatedQuizzes: Quiz[] = [];

    for (const item of quizItems) {
      const quizId = "quiz_" + generateId();
      const newQuiz: Quiz = {
        quiz_id: quizId,
        query_id: queryId,
        question_text: item.question_text || "Question?",
        option_a: item.option_a || "",
        option_b: item.option_b || "",
        option_c: item.option_c || "",
        option_d: item.option_d || "",
        correct_answer: String(item.correct_answer || "A").toUpperCase(),
        created_at: new Date().toISOString(),
      };
      db.quizzes.push(newQuiz);
      generatedQuizzes.push(newQuiz);
    }

    // Also store an AI response for tracking
    const responseId = "res_" + generateId();
    const newResponse: AiResponse = {
      response_id: responseId,
      query_id: queryId,
      response_text: `Generated a 3-question MCQ quiz: \n1. ${quizItems[0]?.question_text}\n2. ${quizItems[1]?.question_text}\n3. ${quizItems[2]?.question_text}`,
      model_used: "Gemini 3.5 Flash",
      created_at: new Date().toISOString(),
    };
    db.ai_responses.push(newResponse);

    saveDB();

    res.json({
      success: true,
      query_id: queryId,
      response_id: responseId,
      quizzes: generatedQuizzes,
      model_used: "Gemini 3.5 Flash",
    });
  } catch (err: any) {
    console.error("Quiz error:", err);
    res.status(500).json({ error: "Failed to generate quiz: " + err.message });
  }
};

app.post("/api/quiz", handleQuiz);
app.get("/api/quiz", handleQuiz);
app.post("/quiz", handleQuiz);
app.get("/quiz", handleQuiz);

// 4. Summarization Endpoint
const handleSummarize = async (req: express.Request, res: express.Response) => {
  const userId = getUserId(req) || "anonymous";
  const text = String(req.body.text || req.body.query_text || req.query.text || "");

  if (!text) {
    res.status(400).json({ error: "Text to summarize is required" });
    return;
  }

  try {
    const queryId = "q_" + generateId();
    const newQuery: UserQuery = {
      query_id: queryId,
      user_id: userId,
      query_type: "Summary",
      query_text: text,
      created_at: new Date().toISOString(),
    };
    db.queries.push(newQuery);

    const prompt = `You are EduGenie's Summarizer. Please summarize the following long paragraph or text into a clear, concise, and structured summary. Retain all core terms and remove redundancy. Use bullet points for key takeaways:\n\nText:\n${text}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const summaryText = response.text || "No summary generated.";

    const responseId = "res_" + generateId();
    const newResponse: AiResponse = {
      response_id: responseId,
      query_id: queryId,
      response_text: summaryText,
      model_used: "Gemini 3.5 Flash",
      created_at: new Date().toISOString(),
    };
    db.ai_responses.push(newResponse);

    const summaryId = "sum_" + generateId();
    const newSummary: Summary = {
      summary_id: summaryId,
      query_id: queryId,
      summary_text: summaryText,
      created_at: new Date().toISOString(),
    };
    db.summaries.push(newSummary);

    saveDB();

    res.json({
      success: true,
      query_id: queryId,
      response_id: responseId,
      summary_id: summaryId,
      summary_text: summaryText,
      model_used: "Gemini 3.5 Flash",
    });
  } catch (err: any) {
    console.error("Summarize error:", err);
    res.status(500).json({ error: "Failed to generate summary: " + err.message });
  }
};

app.post("/api/summarize", handleSummarize);
app.get("/api/summarize", handleSummarize);
app.post("/summarize", handleSummarize);
app.get("/summarize", handleSummarize);

// 5. Learning Path Recommendation Endpoint
const handleRecommendations = async (req: express.Request, res: express.Response) => {
  const userId = getUserId(req) || "anonymous";
  const topic = String(req.query.topic || req.body.topic || req.body.query_text || "");
  const difficulty = String(req.query.difficulty || req.body.difficulty || "Beginner");

  if (!topic) {
    res.status(400).json({ error: "Topic is required" });
    return;
  }

  try {
    const queryId = "q_" + generateId();
    const newQuery: UserQuery = {
      query_id: queryId,
      user_id: userId,
      query_type: "Recommendation",
      query_text: `${topic} (${difficulty} Level)`,
      created_at: new Date().toISOString(),
    };
    db.queries.push(newQuery);

    const prompt = `You are EduGenie's Study Planner. Generate a highly personalized, structured learning path for the following topic: "${topic}".
Difficulty level specified: ${difficulty}.
Include:
1. A stepwise guide/phases from ${difficulty} level onwards.
2. Estimated time/milestones.
3. Recommended resources such as videos, books, articles, or practice websites.
4. Tips for success at this level.

Please output this in high-quality Markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const resourcesMarkdown = response.text || "No recommendations generated.";

    const responseId = "res_" + generateId();
    const newResponse: AiResponse = {
      response_id: responseId,
      query_id: queryId,
      response_text: resourcesMarkdown,
      model_used: "Gemini 3.5 Flash",
      created_at: new Date().toISOString(),
    };
    db.ai_responses.push(newResponse);

    const pathId = "path_" + generateId();
    const newLearningPath: LearningPath = {
      path_id: pathId,
      query_id: queryId,
      topic,
      difficulty_level: difficulty,
      recommended_resources: resourcesMarkdown,
      created_at: new Date().toISOString(),
    };
    db.learning_paths.push(newLearningPath);

    saveDB();

    res.json({
      success: true,
      query_id: queryId,
      response_id: responseId,
      path_id: pathId,
      topic,
      difficulty_level: difficulty,
      recommended_resources: resourcesMarkdown,
      model_used: "Gemini 3.5 Flash",
    });
  } catch (err: any) {
    console.error("Recommendations error:", err);
    res.status(500).json({ error: "Failed to generate learning path: " + err.message });
  }
};

app.get("/api/learn/recommendations", handleRecommendations);
app.post("/api/learn/recommendations", handleRecommendations);
app.get("/learn/recommendations", handleRecommendations);
app.post("/learn/recommendations", handleRecommendations);

// Simulated Email/Mail API
app.post("/api/mail/send", (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "User unauthorized" });
    return;
  }
  const { recipient, subject, body_html, body_markdown, theme } = req.body;
  if (!recipient || !subject) {
    res.status(400).json({ error: "Recipient and subject are required" });
    return;
  }

  const email_id = "mail_" + generateId();
  const newEmail: SentEmail = {
    email_id,
    user_id: userId,
    sender: "EduGenie AI Assistant <assistant@edugenie.local>",
    recipient,
    subject,
    body_html: body_html || "",
    body_markdown: body_markdown || "",
    theme: theme || "Modern Clean",
    created_at: new Date().toISOString()
  };

  if (!db.emails) db.emails = [];
  db.emails.push(newEmail);
  saveDB();

  res.json({ success: true, email: newEmail });
});

app.get("/api/mail/history", (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "User unauthorized" });
    return;
  }
  if (!db.emails) db.emails = [];
  const userMails = db.emails.filter((m) => m.user_id === userId).reverse();
  res.json({ success: true, emails: userMails });
});

app.post("/api/mail/delete", (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "User unauthorized" });
    return;
  }
  const { email_id } = req.body;
  if (!email_id) {
    res.status(400).json({ error: "Email ID is required" });
    return;
  }
  if (!db.emails) db.emails = [];
  const initialLength = db.emails.length;
  db.emails = db.emails.filter((m) => !(m.email_id === email_id && m.user_id === userId));
  
  if (db.emails.length !== initialLength) {
    saveDB();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Email log not found" });
  }
});

app.post("/api/mail/duplicate", (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "User unauthorized" });
    return;
  }
  const { email_id, new_recipient } = req.body;
  if (!email_id || !new_recipient) {
    res.status(400).json({ error: "Original Email ID and New Recipient are required" });
    return;
  }
  if (!db.emails) db.emails = [];
  const original = db.emails.find((m) => m.email_id === email_id && m.user_id === userId);
  if (!original) {
    res.status(404).json({ error: "Original email not found" });
    return;
  }

  const new_email_id = "mail_" + generateId();
  const duplicatedEmail: SentEmail = {
    ...original,
    email_id: new_email_id,
    recipient: new_recipient,
    created_at: new Date().toISOString()
  };

  db.emails.push(duplicatedEmail);
  saveDB();

  res.json({ success: true, email: duplicatedEmail });
});

// History Log API (gets all queries and linked responses/quizzes/summaries/learning paths for a user)
app.get("/api/history", (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "User unauthorized" });
    return;
  }

  // Filter queries for this user
  const userQueries = db.queries.filter((q) => q.user_id === userId);

  // Map user queries to aggregate data
  const history = userQueries.map((q) => {
    const response = db.ai_responses.find((r) => r.query_id === q.query_id);
    const linkedQuizzes = db.quizzes.filter((z) => z.query_id === q.query_id);
    const linkedSummary = db.summaries.find((s) => s.query_id === q.query_id);
    const linkedPath = db.learning_paths.find((p) => p.query_id === q.query_id);

    return {
      query: q,
      response,
      quizzes: linkedQuizzes.length > 0 ? linkedQuizzes : undefined,
      summary: linkedSummary,
      learningPath: linkedPath,
    };
  }).reverse(); // Most recent first

  res.json({ success: true, history });
});

// Start function for the Express application with Vite integration
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EduGenie Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
