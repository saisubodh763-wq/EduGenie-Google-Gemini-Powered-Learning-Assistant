import { useState } from "react";
import { motion } from "motion/react";
import { Send, HelpCircle, Copy, Check, Sparkles, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface QnAModuleProps {
  userId: string;
  onQueryCompleted: () => void;
}

const SUGGESTIONS = [
  "Explain the difference between mitosis and meiosis.",
  "How does photosynthesis convert light into chemical energy?",
  "What was the main cause of the Industrial Revolution?",
  "Can you simplify the concept of quantum superposition?"
];

export default function QnAModule({ userId, onQueryCompleted }: QnAModuleProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "Contacting EduGenie's knowledge vaults...",
    "Querying Gemini 3.5 Flash...",
    "Analyzing historical context...",
    "Drafting clear, structured answer...",
    "Pruning and polishing..."
  ];

  const handleSubmit = async (e?: React.FormEvent, selectedQuery?: string) => {
    if (e) e.preventDefault();
    const queryText = selectedQuery || query;
    if (!queryText.trim()) return;

    setLoading(true);
    setError("");
    setResponse(null);
    setCopied(false);

    // Rotate loading messages
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % loadingMessages.length;
      setLoadingStep(step);
    }, 1500);

    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify({ query: queryText })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get an answer.");
      }

      setResponse(data.response_text);
      setQuery("");
      onQueryCompleted(); // Trigger parent history refresh
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Q&A Lounge</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Ask any academic question, solve problems, or explore complex topics with the help of Gemini's reasoning capabilities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <span>Submit a Query</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                required
                rows={4}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything: 'What are Kepler's laws of planetary motion?'..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400 resize-none"
              />

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs hover:shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Ask EduGenie</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Suggested Prompts */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Suggested Topics</span>
            </h3>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit(undefined, item)}
                  className="w-full text-left p-2.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 rounded-lg transition-all cursor-pointer truncate"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Output Pane */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs min-h-[300px] flex flex-col overflow-hidden">
            {/* Pane Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                EduGenie Answer Engine
              </span>
              {response && (
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Answer</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Pane Body */}
            <div className="p-6 flex-1 flex flex-col justify-center">
              {loading ? (
                <div className="text-center py-12 space-y-4">
                  <div className="relative w-12 h-12 mx-auto">
                    <div className="absolute inset-0 border-3 border-indigo-100 rounded-full" />
                    <div className="absolute inset-0 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <motion.p
                    key={loadingStep}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-slate-500 text-sm font-medium"
                  >
                    {loadingMessages[loadingStep]}
                  </motion.p>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100 text-center max-w-md mx-auto my-6">
                  {error}
                </div>
              ) : response ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose prose-slate max-w-none text-slate-700 text-sm space-y-4 leading-relaxed"
                >
                  <ReactMarkdown>{response}</ReactMarkdown>
                </motion.div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
                  <p>Type your educational query or select a suggestion to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
