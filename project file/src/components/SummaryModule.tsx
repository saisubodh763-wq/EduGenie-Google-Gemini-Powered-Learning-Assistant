import { useState } from "react";
import { motion } from "motion/react";
import { FileText, Send, Copy, Check, Sparkles, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SummaryModuleProps {
  userId: string;
  onQueryCompleted: () => void;
}

const PRESET_TEXTS = [
  {
    title: "Theory of Cognitive Development",
    text: "Jean Piaget's theory of cognitive development suggests that children move through four different stages of mental development. His theory focuses not only on understanding how children acquire knowledge, but also on understanding the nature of intelligence. Piaget's stages are: Sensorimotor stage (birth to 2 years), Preoperational stage (2 to 7 years), Concrete operational stage (7 to 11 years), and Formal operational stage (12 and up). Piaget believed that children take an active role in the learning process, acting much like little scientists as they perform experiments, make observations, and learn about the world. As kids interact with the world around them, they continually add new knowledge, build upon existing knowledge, and adapt previously held ideas to accommodate new information."
  },
  {
    title: "The Industrial Revolution",
    text: "The Industrial Revolution was the transition to new manufacturing processes in Great Britain, continental Europe, and the United States, in the period from about 1760 to about 1820 or 1840. This transition included going from hand production methods to machines, new chemical manufacturing and iron production processes, the increasing use of steam power and water power, the development of machine tools and the rise of the mechanized factory system. Industrialization also led to an unprecedented rise in the rate of population growth. Textile manufacturing was the dominant industry of the Industrial Revolution in terms of employment, value of output and capital invested. The textile industry was also the first to use modern production methods."
  }
];

export default function SummaryModule({ userId, onQueryCompleted }: SummaryModuleProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "Reading lengthy document details...",
    "Extracting critical academic concepts...",
    "Discarding redundancy and filler...",
    "Reassembling main points into bullet lists...",
    "Double-checking structure for readability..."
  ];

  const handleSubmit = async (e?: React.FormEvent, selectedText?: string) => {
    if (e) e.preventDefault();
    const textToSummarize = selectedText || text;
    if (!textToSummarize.trim()) return;

    setLoading(true);
    setError("");
    setSummary(null);
    setCopied(false);

    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % loadingMessages.length;
      setLoadingStep(step);
    }, 1500);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify({ text: textToSummarize })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate summary.");
      }

      setSummary(data.summary_text);
      setText("");
      onQueryCompleted();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Summary Studio</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            EduGenie will condense long passages, chapters, or scientific papers into structured, quick-revision outlines, keeping the vital information and shedding redundancies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Input Long Paragraphs</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                required
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your long text here to summarize..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400 resize-none"
              />

              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs hover:shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Summarize Text</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Select Preset Texts */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Select Sample Texts</span>
            </h3>
            <div className="flex flex-col gap-2">
              {PRESET_TEXTS.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setText(item.text);
                    handleSubmit(undefined, item.text);
                  }}
                  className="w-full text-left p-2.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 rounded-lg transition-all cursor-pointer font-medium"
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Outputs */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs min-h-[300px] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Summary Results
              </span>
              {summary && (
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
                      <span>Copy Summary</span>
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
              ) : summary ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose prose-slate max-w-none text-slate-700 text-sm space-y-4 leading-relaxed"
                >
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </motion.div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
                  <p>Input or paste a long passage on the left to extract a clear, summarized outline.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
