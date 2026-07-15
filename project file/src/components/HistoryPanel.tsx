import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { History, Calendar, CheckCircle2, ChevronDown, ChevronUp, BookOpen, MessageSquare, Lightbulb, ClipboardList, FileText, Compass, Cpu } from "lucide-react";
import { HistoryItem } from "../types";
import ReactMarkdown from "react-markdown";

interface HistoryPanelProps {
  history: HistoryItem[];
  loading: boolean;
  onRefresh: () => void;
}

export default function HistoryPanel({ history, loading, onRefresh }: HistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getIconAndColor = (type: string) => {
    switch (type) {
      case "QnA":
        return { icon: MessageSquare, bg: "bg-indigo-50", text: "text-indigo-600", label: "Q&A" };
      case "Explanation":
        return { icon: Lightbulb, bg: "bg-amber-50", text: "text-amber-600", label: "Concept Explanation" };
      case "Quiz":
        return { icon: ClipboardList, bg: "bg-emerald-50", text: "text-emerald-600", label: "Interactive Quiz" };
      case "Summary":
        return { icon: FileText, bg: "bg-indigo-50", text: "text-indigo-600", label: "Text Summary" };
      case "Recommendation":
        return { icon: Compass, bg: "bg-indigo-50", text: "text-indigo-600", label: "Roadmap Plan" };
      default:
        return { icon: BookOpen, bg: "bg-slate-50", text: "text-slate-600", label: "Educational Query" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Learning History Logs</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Review your past educational queries, simplified explanations, generated MCQs, summarized files, and custom study syllabi.
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
        >
          Refresh Logs
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Synchronizing database entries...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 text-sm max-w-lg mx-auto shadow-xs">
          <History className="w-12 h-12 mx-auto text-slate-200 mb-3" />
          <p className="font-semibold text-slate-700">No History Available Yet</p>
          <p className="text-slate-400 text-xs mt-1">Submit questions, explanations, quizzes or summarizations in other sections to seed your study timeline.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {history.map((item) => {
            const query = item.query;
            const res = item.response;
            const isExpanded = expandedId === query.query_id;
            const { icon: Icon, bg, text, label } = getIconAndColor(query.query_type);

            return (
              <div
                key={query.query_id}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(query.query_id)}
                  className="p-4.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 ${bg} ${text} rounded-lg flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${bg} ${text}`}>
                          {label}
                        </span>
                        {query.query_type === "Explanation" && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <Cpu className="w-2.5 h-2.5" />
                            <span>LaMini-Flan-T5</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(query.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 mt-1 truncate max-w-[200px] sm:max-w-md md:max-w-lg lg:max-w-2xl">
                        {query.query_text}
                      </h4>
                    </div>
                  </div>

                  <div className="shrink-0 text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* Expanded Answer Panel */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="px-5 pb-5 pt-1.5 border-t border-slate-50 bg-slate-50/30 space-y-4">
                        {/* Prompt Segment */}
                        <div className="bg-slate-50 rounded-xl p-3 text-xs border border-slate-100">
                          <p className="font-semibold text-slate-500 mb-1">PROMPT / INPUT:</p>
                          <p className="text-slate-800 leading-relaxed font-mono bg-white/60 p-2 border border-slate-100 rounded-lg whitespace-pre-wrap">
                            {query.query_text}
                          </p>
                        </div>

                        {/* Response Segment */}
                        {res && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                EduGenie Response
                              </p>
                              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-semibold">
                                {res.model_used}
                              </span>
                            </div>
                            <div className="prose prose-slate max-w-none text-slate-700 text-xs leading-relaxed bg-white border border-slate-100 rounded-xl p-4.5">
                              <ReactMarkdown>{res.response_text}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Custom Quiz solving history details */}
                        {query.query_type === "Quiz" && item.quizzes && (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Generated Quizzes Details
                            </p>
                            <div className="space-y-2.5">
                              {item.quizzes.map((quiz, idx) => (
                                <div key={quiz.quiz_id} className="bg-white border border-slate-100 p-3 rounded-xl text-xs space-y-1.5">
                                  <p className="font-semibold text-slate-800">
                                    Q{idx + 1}. {quiz.question_text}
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                                      <strong className="text-slate-400">A.</strong> {quiz.option_a}
                                    </div>
                                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                                      <strong className="text-slate-400">B.</strong> {quiz.option_b}
                                    </div>
                                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                                      <strong className="text-slate-400">C.</strong> {quiz.option_c}
                                    </div>
                                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                                      <strong className="text-slate-400">D.</strong> {quiz.option_d}
                                    </div>
                                  </div>
                                  <div className="pt-1 flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Correct Answer: Option {quiz.correct_answer}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
