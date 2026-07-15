import { useState } from "react";
import { motion } from "motion/react";
import { Lightbulb, Send, Copy, Check, Info, Sparkles, Cpu } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ExplainModuleProps {
  userId: string;
  onQueryCompleted: () => void;
}

const TOPICS = [
  "Blockchain and Cryptography",
  "How the Internet works",
  "Inflation in Economics",
  "Theory of Relativity",
  "The water cycle"
];

export default function ExplainModule({ userId, onQueryCompleted }: ExplainModuleProps) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "Spinning up simulated LaMini-Flan-T5 node...",
    "Simplifying scientific terminology...",
    "Drafting beginner-friendly analogies...",
    "Breaking explanations into digestible blocks...",
    "Finalizing takeaways..."
  ];

  const handleSubmit = async (e?: React.FormEvent, selectedTopic?: string) => {
    if (e) e.preventDefault();
    const topicText = selectedTopic || topic;
    if (!topicText.trim()) return;

    setLoading(true);
    setError("");
    setExplanation(null);
    setCopied(false);

    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % loadingMessages.length;
      setLoadingStep(step);
    }, 1500);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify({ topic: topicText })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to explain the topic.");
      }

      setExplanation(data.response_text);
      setTopic("");
      onQueryCompleted();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">Concept Explainer</h2>
            <div className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>LaMini-Flan-T5-783M</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            EduGenie leverages a specialized, instruction-tuned lightweight model simulation to break down dense topics into plain, simple, analogy-rich explanations. Ideal for school students and beginners!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-500" />
              <span>Which topic would you like explained?</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Quantum Computing, Inflation..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800 placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl shadow-xs hover:shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4" />
                    <span>Explain Simply</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Explanations list */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Explanations</span>
            </h3>
            <div className="flex flex-col gap-2">
              {TOPICS.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit(undefined, item)}
                  className="w-full text-left p-2.5 text-xs text-slate-600 hover:text-amber-600 hover:bg-amber-50/50 border border-transparent hover:border-amber-100 rounded-lg transition-all cursor-pointer truncate"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-500" />
                <span>Simplified Learning Output</span>
              </span>
              {explanation && (
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
                      <span>Copy Explanation</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col justify-center">
              {loading ? (
                <div className="text-center py-12 space-y-4">
                  <div className="relative w-12 h-12 mx-auto">
                    <div className="absolute inset-0 border-3 border-amber-100 rounded-full" />
                    <div className="absolute inset-0 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
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
              ) : explanation ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose prose-slate max-w-none text-slate-700 text-sm space-y-4 leading-relaxed"
                >
                  <ReactMarkdown>{explanation}</ReactMarkdown>
                </motion.div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <Lightbulb className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
                  <p>Submit a topic to generate a simplified, analogy-rich conceptual explanation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
