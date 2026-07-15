import { useState } from "react";
import { motion } from "motion/react";
import { Compass, Send, Copy, Check, Sparkles, HelpCircle, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface RecommendationsModuleProps {
  userId: string;
  onQueryCompleted: () => void;
}

const ROADMAPS = [
  { topic: "Python Programming", level: "Beginner" },
  { topic: "Web Development with React", level: "Intermediate" },
  { topic: "Machine Learning & Neural Networks", level: "Advanced" }
];

export default function RecommendationsModule({ userId, onQueryCompleted }: RecommendationsModuleProps) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "Establishing user skill tier...",
    "Defining core conceptual stages...",
    "Selecting premium books, videos, and documentation...",
    "Structuring step-by-step phases...",
    "Finalizing customized study milestones..."
  ];

  const handleSubmit = async (e?: React.FormEvent, selectedTopic?: string, selectedDifficulty?: string) => {
    if (e) e.preventDefault();
    const queryTopic = selectedTopic || topic;
    const queryDiff = selectedDifficulty || difficulty;
    if (!queryTopic.trim()) return;

    setLoading(true);
    setError("");
    setRoadmap(null);
    setCopied(false);

    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % loadingMessages.length;
      setLoadingStep(step);
    }, 1500);

    try {
      // Fetch using GET parameters
      const url = `/api/learn/recommendations?topic=${encodeURIComponent(queryTopic)}&difficulty=${encodeURIComponent(queryDiff)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "x-user-id": userId
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate study roadmap.");
      }

      setRoadmap(data.recommended_resources);
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
    if (!roadmap) return;
    navigator.clipboard.writeText(roadmap);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Learning Roadmap Generator</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            EduGenie will build a highly customized study schedule and curate video channels, textbooks, articles, and training platforms for any subject tailored to your proficiency level.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Configure Study Path</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  What do you want to learn?
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Docker, Data Structures, Spanish..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Proficiency Tier
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                >
                  <option value="Beginner">Beginner Level</option>
                  <option value="Intermediate">Intermediate Level</option>
                  <option value="Advanced">Advanced Level</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs hover:shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    <span>Generate Path</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Select Maps */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Sample Paths</span>
            </h3>
            <div className="flex flex-col gap-2">
              {ROADMAPS.map((r, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setTopic(r.topic);
                    setDifficulty(r.level);
                    handleSubmit(undefined, r.topic, r.level);
                  }}
                  className="w-full text-left p-2.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 rounded-lg transition-all cursor-pointer font-medium flex justify-between items-center"
                >
                  <span>{r.topic}</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                    {r.level}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Map Details */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs min-h-[350px] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Personalized Learning Roadmap
              </span>
              {roadmap && (
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
                      <span>Copy Roadmap</span>
                    </>
                  )}
                </button>
              )}
            </div>

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
              ) : roadmap ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose prose-slate max-w-none text-slate-700 text-sm space-y-4 leading-relaxed"
                >
                  <ReactMarkdown>{roadmap}</ReactMarkdown>
                </motion.div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <Compass className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
                  <p>Design your study path on the left to generate a step-by-step personalized curriculum.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
