import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, LogOut, HelpCircle, Lightbulb, ClipboardList, 
  FileText, Compass, History, User as UserIcon, Award, Sparkles, Plus, Clock, ArrowRight, Mail
} from "lucide-react";
import { User, HistoryItem } from "./types";
import AuthPanel from "./components/AuthPanel";
import QnAModule from "./components/QnAModule";
import ExplainModule from "./components/ExplainModule";
import QuizModule from "./components/QuizModule";
import SummaryModule from "./components/SummaryModule";
import RecommendationsModule from "./components/RecommendationsModule";
import HistoryPanel from "./components/HistoryPanel";
import EduMailHub from "./components/EduMailHub";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<"dashboard" | "qa" | "explain" | "quiz" | "summary" | "roadmap" | "history" | "mail">("dashboard");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load user from localStorage if exists
  useEffect(() => {
    const savedUser = localStorage.getItem("edugenie_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem("edugenie_user");
      }
    }
  }, []);

  // Fetch history when user changes or manual refresh
  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/history", {
        headers: {
          "x-user-id": user.user_id,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load learning logs:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [user]);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem("edugenie_user", JSON.stringify(authenticatedUser));
    setCurrentTab("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("edugenie_user");
    setCurrentTab("dashboard");
  };

  // Helper counters computed from history
  const totalQueries = history.length;
  const qnaCount = history.filter((h) => h.query.query_type === "QnA").length;
  const explainCount = history.filter((h) => h.query.query_type === "Explanation").length;
  const quizCount = history.filter((h) => h.query.query_type === "Quiz").length;
  const summaryCount = history.filter((h) => h.query.query_type === "Summary").length;
  const roadmapCount = history.filter((h) => h.query.query_type === "Recommendation").length;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <AuthPanel onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => setCurrentTab("dashboard")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/10 group-hover:bg-indigo-700 transition-all">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                EduGenie
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded">
                  Assistant
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">AI-Powered Learning Companion</p>
            </div>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400">{user.email}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-semibold border border-transparent hover:border-red-100"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Menu */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-3">
              Learning Portal
            </span>

            <nav className="space-y-1">
              {[
                { id: "dashboard", label: "Dashboard Hub", icon: BookOpen },
                { id: "qa", label: "Q&A Lounge", icon: HelpCircle },
                { id: "explain", label: "Concept Explainer", icon: Lightbulb, badge: "LaMini-T5" },
                { id: "quiz", label: "Quiz Master", icon: ClipboardList },
                { id: "summary", label: "Summary Studio", icon: FileText },
                { id: "roadmap", label: "Study Roadmaps", icon: Compass },
                { id: "mail", label: "EduMail Studio", icon: Mail, badge: "NEW" },
                { id: "history", label: "Learning Logs", icon: History, count: totalQueries }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id as any)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4.5 h-4.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                        isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {item.count !== undefined && item.count > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? "bg-white text-indigo-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Info card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-lg shadow-indigo-900/15 relative overflow-hidden hidden lg:block">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl" />
            <Sparkles className="w-6 h-6 text-indigo-400 mb-3" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-indigo-300 uppercase">
              STUDENT METRICS
            </h3>
            <p className="text-xs text-indigo-100 mt-2.5 leading-relaxed">
              Every academic query, generated quiz question, and learning path you run is logged into your personal dashboard database.
            </p>
            <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-indigo-300">STATUS:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                ACTIVE
              </span>
            </div>
          </div>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="min-h-[60vh]"
            >
              {currentTab === "dashboard" && (
                <div className="space-y-8">
                  {/* Hero Welcomer */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-indigo-50/30 to-transparent pointer-events-none rounded-r-3xl" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="w-4 h-4" />
                          <span>Student Portal</span>
                        </span>
                        <h2 className="text-xl md:text-2xl font-bold font-sans text-slate-800 tracking-tight">
                          Hello, {user.name}!
                        </h2>
                        <p className="text-slate-500 text-sm max-w-lg leading-relaxed">
                          Welcome to your central EduGenie dashboard. Leverage cloud-powered generative AI intelligence alongside fine-tuned models to fast-track your study outcomes.
                        </p>
                      </div>

                      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-50 flex items-center gap-3.5 self-start md:self-auto shrink-0">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
                          {totalQueries}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">TOTAL LOGS</p>
                          <p className="text-[10px] text-slate-500">Recorded activities</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick-Stats Metrics Row */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: "Q&A asked", count: qnaCount, icon: HelpCircle, bg: "bg-indigo-50 text-indigo-600" },
                      { label: "Explanations", count: explainCount, icon: Lightbulb, bg: "bg-amber-50 text-amber-600" },
                      { label: "Quizzes", count: quizCount, icon: ClipboardList, bg: "bg-emerald-50 text-emerald-600" },
                      { label: "Summaries", count: summaryCount, icon: FileText, bg: "bg-indigo-50 text-indigo-600" },
                      { label: "Roadmaps", count: roadmapCount, icon: Compass, bg: "bg-indigo-50 text-indigo-600" }
                    ].map((stat, sIdx) => {
                      const Icon = stat.icon;
                      return (
                        <div key={sIdx} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${stat.bg}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-slate-800 leading-none">{stat.count}</p>
                            <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wide truncate max-w-[80px]">
                              {stat.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Interactive Module Launcher (Bento Box style) */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                      LAUNCH AI STUDY TOOLS
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { 
                          id: "qa", 
                          title: "Q&A Lounge", 
                          desc: "Enter academic questions to get deep, structured answers from Gemini 3.5 Flash.", 
                          icon: HelpCircle, 
                          color: "from-indigo-500 to-indigo-600",
                          lightColor: "bg-indigo-50 text-indigo-600" 
                        },
                        { 
                          id: "explain", 
                          title: "Concept Explainer", 
                          desc: "Simulate LaMini-Flan-T5 to break complex educational concepts into straightforward, analogy-rich summaries.", 
                          icon: Lightbulb, 
                          color: "from-amber-500 to-amber-600",
                          lightColor: "bg-amber-50 text-amber-600" 
                        },
                        { 
                          id: "quiz", 
                          title: "Quiz Master", 
                          desc: "Formulate randomized 3-question MCQ tests from textbook materials and track your scores.", 
                          icon: ClipboardList, 
                          color: "from-emerald-500 to-emerald-600",
                          lightColor: "bg-emerald-50 text-emerald-600" 
                        },
                        { 
                          id: "summary", 
                          title: "Summary Studio", 
                          desc: "Condense long chapters, essays, or research studies into clear revision bullet notes.", 
                          icon: FileText, 
                          color: "from-indigo-500 to-indigo-600",
                          lightColor: "bg-indigo-50 text-indigo-600" 
                        },
                        {
                          id: "mail",
                          title: "EduMail Studio",
                          desc: "Convert study material into custom-themed mock email dispatches and duplicate cloned study logs.",
                          icon: Mail,
                          color: "from-indigo-500 to-indigo-600",
                          lightColor: "bg-indigo-50 text-indigo-600"
                        }
                      ].map((card) => {
                        const Icon = card.icon;
                        return (
                          <div 
                            key={card.id}
                            onClick={() => setCurrentTab(card.id as any)}
                            className="bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group cursor-pointer text-left"
                          >
                            <div className="space-y-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.lightColor}`}>
                                <Icon className="w-5.5 h-5.5" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                  {card.title}
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                </h4>
                                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                                  {card.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent History Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                        RECENT LEARNING ACTIVITIES
                      </h3>
                      {history.length > 0 && (
                        <button 
                          onClick={() => setCurrentTab("history")}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1 transition-all"
                        >
                          View Full Logs
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {history.length === 0 ? (
                      <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-xs">
                        <Clock className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                        <p>No recent activity. Launch an AI study tool above to see your logs populate here!</p>
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-50 overflow-hidden shadow-xs">
                        {history.slice(0, 3).map((item, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setCurrentTab("history")}
                            className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                                <History className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">
                                  {item.query.query_text}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {item.query.query_type} • {new Date(item.query.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">
                              Review Log
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentTab === "qa" && (
                <QnAModule userId={user.user_id} onQueryCompleted={fetchHistory} />
              )}

              {currentTab === "explain" && (
                <ExplainModule userId={user.user_id} onQueryCompleted={fetchHistory} />
              )}

              {currentTab === "quiz" && (
                <QuizModule userId={user.user_id} onQueryCompleted={fetchHistory} />
              )}

              {currentTab === "summary" && (
                <SummaryModule userId={user.user_id} onQueryCompleted={fetchHistory} />
              )}

              {currentTab === "roadmap" && (
                <RecommendationsModule userId={user.user_id} onQueryCompleted={fetchHistory} />
              )}

              {currentTab === "mail" && (
                <EduMailHub
                  userId={user.user_id}
                  userEmail={user.email}
                  history={history}
                  onMailSent={fetchHistory}
                />
              )}

              {currentTab === "history" && (
                <HistoryPanel 
                  history={history} 
                  loading={loadingHistory} 
                  onRefresh={fetchHistory} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
