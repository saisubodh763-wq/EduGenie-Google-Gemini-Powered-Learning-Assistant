export interface User {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface UserQuery {
  query_id: string;
  user_id: string;
  query_type: "QnA" | "Explanation" | "Quiz" | "Summary" | "Recommendation";
  query_text: string;
  created_at: string;
}

export interface AiResponse {
  response_id: string;
  query_id: string;
  response_text: string;
  model_used: string;
  created_at: string;
}

export interface Quiz {
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

export interface Summary {
  summary_id: string;
  query_id: string;
  summary_text: string;
  created_at: string;
}

export interface LearningPath {
  path_id: string;
  query_id: string;
  topic: string;
  difficulty_level: "Beginner" | "Intermediate" | "Advanced";
  recommended_resources: string;
  created_at: string;
}

export interface HistoryItem {
  query: UserQuery;
  response?: AiResponse;
  quizzes?: Quiz[];
  summary?: Summary;
  learningPath?: LearningPath;
}

export interface SentEmail {
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
