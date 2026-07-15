import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, Send, Trash2, Copy, Check, Eye, ChevronRight, Sparkles, 
  RefreshCw, ClipboardList, HelpCircle, Layers, Smartphone, Monitor, Info, CheckCircle2, UserCheck
} from "lucide-react";
import { SentEmail, HistoryItem } from "../types";

interface EduMailHubProps {
  userId: string;
  userEmail: string;
  history: HistoryItem[];
  onMailSent: () => void;
}

const EMAIL_THEMES = [
  { 
    id: "academic", 
    name: "Classic Academic", 
    desc: "Clean indigo header with dual borders, crisp serif fonts, and study-oriented footer layouts.",
    bg: "bg-indigo-50/50 text-indigo-700 border-indigo-100",
    headerBg: "#4f46e5",
    textColor: "#1e293b"
  },
  { 
    id: "emerald", 
    name: "Emerald Leaf", 
    desc: "Warm forest greens, light-mint tables, botanical typography, and organic spacing.",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
    headerBg: "#059669",
    textColor: "#0f172a"
  },
  { 
    id: "midnight", 
    name: "Midnight Study", 
    desc: "Immersive dark slate theme with neon borders and glowing cyan highlight metrics.",
    bg: "bg-slate-900 text-slate-100 border-slate-700",
    headerBg: "#1e1b4b",
    textColor: "#f1f5f9"
  },
  { 
    id: "minimalist", 
    name: "Minimal Memo", 
    desc: "Crisp brutalist layout with high contrast, typewriter borders, and raw monospace accents.",
    bg: "bg-slate-50 text-slate-800 border-slate-200",
    headerBg: "#18181b",
    textColor: "#09090b"
  }
];

export default function EduMailHub({ userId, userEmail, history, onMailSent }: EduMailHubProps) {
  const [mails, setMails] = useState<SentEmail[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Tab within MailHub
  const [activeSubTab, setActiveSubTab] = useState<"compose" | "outbox">("compose");

  // Compose State
  const [recipient, setRecipient] = useState(userEmail);
  const [subject, setSubject] = useState("EduGenie Study Material recap");
  const [bodyText, setBodyText] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("academic");
  const [sending, setSending] = useState(false);
  const [sendStep, setSendStep] = useState(0);
  const [sendError, setSendError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Preview States
  const [previewEmail, setPreviewEmail] = useState<SentEmail | null>(null);
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");

  // Duplicate Modal State
  const [duplicateEmail, setDuplicateEmail] = useState<SentEmail | null>(null);
  const [duplicateRecipient, setDuplicateRecipient] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  const sendSteps = [
    "Establishing handshake with SMTP simulation server...",
    "Parsing markdown content into responsive HTML markup...",
    "Injecting brand-certified EduGenie email headers...",
    "Packaging digital digest envelope...",
    "Transmitting clone payload to recipient pipeline...",
    "Email delivered! Log stored in study database."
  ];

  // Load mails on load or change
  const fetchMailHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/mail/history", {
        headers: { "x-user-id": userId }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMails(data.emails || []);
      }
    } catch (err) {
      console.error("Failed to load email history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchMailHistory();
  }, [userId]);

  // Pre-populate with past study log if user selects one
  const handleImportHistoryItem = (item: HistoryItem) => {
    const qType = item.query.query_type;
    const prompt = item.query.query_text;
    const response = item.response?.response_text || "";

    setSubject(`EduGenie: ${qType} recap - "${prompt.slice(0, 35)}..."`);

    let templateBody = `### Study Material: ${qType}\n\n`;
    templateBody += `**Query / Focus Point:**\n> ${prompt}\n\n`;
    templateBody += `**AI-Generated Knowledge Summary:**\n\n${response}\n\n`;

    if (item.quizzes && item.quizzes.length > 0) {
      templateBody += `### Linked MCQs Practice:\n\n`;
      item.quizzes.forEach((q, idx) => {
        templateBody += `**Q${idx + 1}. ${q.question_text}**\n`;
        templateBody += `- A) ${q.option_a}\n`;
        templateBody += `- B) ${q.option_b}\n`;
        templateBody += `- C) ${q.option_c}\n`;
        templateBody += `- D) ${q.option_d}\n`;
        templateBody += `*Correct Answer: Option ${q.correct_answer}*\n\n`;
      });
    }

    templateBody += `---\n*Compiled via EduGenie AI Assistant. Keep on studying!*`;
    setBodyText(templateBody);
  };

  const getHtmlTemplate = (themeId: string, subj: string, markdown: string) => {
    // Generate styled mock HTML
    const selected = EMAIL_THEMES.find(t => t.id === themeId) || EMAIL_THEMES[0];
    const isDark = themeId === "midnight";

    const formattedBody = markdown
      .replace(/\n/g, "<br/>")
      .replace(/### (.*?)(<br\/>|$)/g, '<h3 style="color:' + (isDark ? "#818cf8" : selected.headerBg) + '; font-family: sans-serif; margin-top:20px; border-bottom:1px solid ' + (isDark ? "#334155" : "#e2e8f0") + '; padding-bottom:5px;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/> (.*?)(<br\/>|$)/g, '<blockquote style="border-left: 4px solid ' + selected.headerBg + '; padding-left: 10px; margin: 10px 0; color: ' + (isDark ? "#94a3b8" : "#64748b") + '; font-style: italic;">$1</blockquote>');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subj}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: ${isDark ? "#0f172a" : "#f8fafc"}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: ${isDark ? "#1e293b" : "#ffffff"}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid ${isDark ? "#334155" : "#e2e8f0"};">
          <tr>
            <td style="padding: 24px; background-color: ${selected.headerBg}; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.025em;">EduGenie Study Dispatch</h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.05em;">AI Learning Companion</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px; color: ${selected.textColor}; font-size: 14px; line-height: 1.6;">
              <h2 style="margin-top: 0; font-size: 16px; font-weight: bold; color: ${isDark ? "#ffffff" : "#1e293b"};">${subj}</h2>
              <div style="margin-top: 15px;">
                ${formattedBody}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px; background-color: ${isDark ? "#0f172a" : "#f1f5f9"}; border-t: 1px solid ${isDark ? "#334155" : "#e2e8f0"}; text-align: center; color: ${isDark ? "#64748b" : "#94a3b8"}; font-size: 11px;">
              <p style="margin: 0;">You received this study recap because you triggered a simulated dispatch from EduGenie.</p>
              <p style="margin: 4px 0 0 0; font-weight: 600;">EduGenie AI Studio App &bull; Powered by Gemini 3.5 Flash</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  };

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !bodyText.trim()) return;

    setSending(true);
    setSendError("");
    setSendStep(0);

    const fullHtml = getHtmlTemplate(selectedTheme, subject, bodyText);

    // Run simulated steps
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < sendSteps.length - 1) {
        setSendStep(step);
      }
    }, 1100);

    try {
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify({
          recipient,
          subject,
          body_markdown: bodyText,
          body_html: fullHtml,
          theme: selectedTheme
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger mail transmission.");
      }

      // Finish transmission
      clearInterval(stepInterval);
      setSendStep(sendSteps.length - 1);
      
      // Wait briefly for completion display
      setTimeout(() => {
        setSending(false);
        setBodyText("");
        setSubject("EduGenie Study Material recap");
        fetchMailHistory();
        onMailSent();
        setActiveSubTab("outbox");
      }, 1500);

    } catch (err: any) {
      clearInterval(stepInterval);
      setSending(false);
      setSendError(err.message || "An unexpected simulation transmission error occurred.");
    }
  };

  const handleDeleteMail = async (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/mail/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify({ email_id: emailId })
      });
      if (res.ok) {
        setMails(prev => prev.filter(m => m.email_id !== emailId));
        if (previewEmail?.email_id === emailId) {
          setPreviewEmail(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete email from database:", err);
    }
  };

  // Duplicate Mail Handler
  const handleOpenDuplicate = (email: SentEmail, e: React.MouseEvent) => {
    e.stopPropagation();
    setDuplicateEmail(email);
    setDuplicateRecipient(email.recipient);
  };

  const submitDuplicate = async () => {
    if (!duplicateEmail || !duplicateRecipient.trim()) return;
    setDuplicating(true);
    try {
      const res = await fetch("/api/mail/duplicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify({
          email_id: duplicateEmail.email_id,
          new_recipient: duplicateRecipient
        })
      });

      const data = await res.json();
      if (res.ok) {
        fetchMailHistory();
        onMailSent();
        setDuplicateEmail(null);
      } else {
        alert(data.error || "Failed to duplicate email record");
      }
    } catch (err) {
      console.error("Duplicate error:", err);
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">EduMail Studio</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Compose elegant study newsletters or duplicate/forward past academic queries, summaries, or quizzes directly into custom-styled mock dispatches. Perfect for group revision & duplicating educational mails.
          </p>
        </div>
      </div>

      {/* Local Tabs Selection */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab("compose")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "compose"
              ? "border-indigo-600 text-indigo-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Compose & Theming Studio
        </button>
        <button
          onClick={() => setActiveSubTab("outbox")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "outbox"
              ? "border-indigo-600 text-indigo-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Sent Outbox Logs
          {mails.length > 0 && (
            <span className="bg-indigo-50 text-indigo-600 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {mails.length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === "compose" ? (
          <motion.div
            key="compose"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Side: Study Logs & Import Helper (3 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Import from Learning logs</span>
                </h3>

                {history.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No logs available. Run some Q&A or quizzes first to seed material.</p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {history.map((h, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleImportHistoryItem(h)}
                        className="w-full text-left p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-lg transition-all text-[11px] cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[9px] font-bold text-indigo-600 uppercase mb-0.5">
                          <span>{h.query.query_type}</span>
                          <span>{new Date(h.query.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 truncate font-medium">{h.query.query_text}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Selector */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Envelope Theme Design</span>
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {EMAIL_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`text-left p-3 border rounded-xl transition-all cursor-pointer ${
                        selectedTheme === theme.id
                          ? "border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/10"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-800">{theme.name}</p>
                      <div className="w-full h-1 mt-2 rounded bg-slate-200 overflow-hidden">
                        <div className="h-full w-1/3" style={{ backgroundColor: theme.headerBg }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Compose Panel (8 cols) */}
            <div className="lg:col-span-8">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span>Draft Study Dispatch</span>
                </h3>

                {sending ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="relative w-14 h-14 mx-auto">
                      <div className="absolute inset-0 border-3 border-indigo-100 rounded-full" />
                      <div className="absolute inset-0 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <motion.p
                      key={sendStep}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-slate-600 text-sm font-medium"
                    >
                      {sendSteps[sendStep]}
                    </motion.p>
                    <div className="w-full max-w-xs mx-auto bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-1000" 
                        style={{ width: `${((sendStep + 1) / sendSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendMail} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                          Recipient Mail Address
                        </label>
                        <input
                          type="email"
                          required
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="e.g. peer-study@gmail.com"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                          Mail Subject Title
                        </label>
                        <input
                          type="text"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Study recap subject"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                        <span>Rich Material Markdown Markdown Body</span>
                        <span className="text-[9px] text-slate-400 text-right normal-case">Supports basic headers, quoteblocks, and linebreaks</span>
                      </label>
                      <textarea
                        required
                        rows={10}
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        placeholder="Import study material on the left or write your custom revision message in Markdown format here..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 font-mono resize-none"
                      />
                    </div>

                    {sendError && (
                      <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                        {sendError}
                      </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-slate-50">
                      <button
                        type="submit"
                        disabled={!bodyText.trim() || !recipient.trim() || !subject.trim()}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Simulate Sending Mail</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="outbox"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Outbox List (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-3">
                  Transmitted Mail History
                </span>

                {loadingHistory ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Loading mailboxes...</p>
                  </div>
                ) : mails.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    <Mail className="w-10 h-10 mx-auto text-slate-200 mb-2.5" />
                    <p className="font-semibold text-slate-700">No Sent Logs Yet</p>
                    <p className="text-[10px] mt-0.5">Use the compiler tool to generate your first study email newsletter.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {mails.map((mail) => {
                      const themeDetails = EMAIL_THEMES.find(t => t.id === mail.theme) || EMAIL_THEMES[0];
                      const isSelected = previewEmail?.email_id === mail.email_id;

                      return (
                        <div
                          key={mail.email_id}
                          onClick={() => setPreviewEmail(mail)}
                          className={`p-3.5 border rounded-xl transition-all cursor-pointer text-left relative overflow-hidden group ${
                            isSelected 
                              ? "bg-indigo-50/40 border-indigo-200 ring-1 ring-indigo-500/5" 
                              : "bg-white border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-medium">
                            <span className="font-mono text-slate-500 max-w-[120px] truncate">TO: {mail.recipient}</span>
                            <span>{new Date(mail.created_at).toLocaleDateString()}</span>
                          </div>
                          
                          <h4 className="text-xs font-bold text-slate-800 truncate mb-1.5">
                            {mail.subject}
                          </h4>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-50 mt-1">
                            <span className={`text-[9px] px-2 py-0.2 rounded font-semibold ${themeDetails.bg}`}>
                              {themeDetails.name}
                            </span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleOpenDuplicate(mail, e)}
                                title="Duplicate Mail"
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteMail(mail.email_id, e)}
                                title="Delete Log"
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Email Viewport (7 cols) */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[450px]">
                {previewEmail ? (
                  <>
                    {/* Viewport Control Panel */}
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                          <button
                            onClick={() => setViewportMode("desktop")}
                            className={`p-1.5 rounded transition-all cursor-pointer ${
                              viewportMode === "desktop" ? "bg-slate-100 text-slate-800 font-bold" : "text-slate-400 hover:text-slate-600"
                            }`}
                            title="Desktop View"
                          >
                            <Monitor className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewportMode("mobile")}
                            className={`p-1.5 rounded transition-all cursor-pointer ${
                              viewportMode === "mobile" ? "bg-slate-100 text-slate-800 font-bold" : "text-slate-400 hover:text-slate-600"
                            }`}
                            title="Mobile View"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                          Mock Envelope Viewer
                        </span>
                      </div>

                      {/* Outbox Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleOpenDuplicate(previewEmail, e)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Duplicate Mail</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteMail(previewEmail.email_id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Email Headers Section */}
                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] inline-block w-14">Sender:</span>
                        <span className="text-slate-700 font-semibold font-mono">{previewEmail.sender}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] inline-block w-14">Recipient:</span>
                        <span className="text-slate-800 font-semibold font-mono">{previewEmail.recipient}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] inline-block w-14">Subject:</span>
                        <span className="text-slate-800 font-bold">{previewEmail.subject}</span>
                      </div>
                    </div>

                    {/* Live Responsive iframe viewport simulation */}
                    <div className="flex-1 bg-slate-100/50 p-6 flex justify-center items-start overflow-y-auto">
                      <div 
                        className={`bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden transition-all duration-300 ${
                          viewportMode === "desktop" ? "w-full max-w-[550px]" : "w-[320px]"
                        }`}
                      >
                        {/* Simulation Bar */}
                        <div className="bg-slate-200/50 px-3 py-1.5 flex items-center gap-1.5 border-b border-slate-200">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <div className="bg-white/90 border border-slate-200/60 rounded px-2 py-0.5 text-[9px] text-slate-400 truncate flex-1 text-center font-mono font-medium">
                            edugenie://mailbox-viewer/secure_id={previewEmail.email_id}
                          </div>
                        </div>

                        {/* Raw Iframe simulator inside react container using dangerouslySetInnerHTML */}
                        <div 
                          className="p-1 min-h-[350px] overflow-y-auto max-h-[500px]"
                          dangerouslySetInnerHTML={{ __html: previewEmail.body_html }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-slate-400 text-xs">
                    <Eye className="w-10 h-10 text-slate-300 mb-2.5" />
                    <p className="font-semibold text-slate-700">No Email Selected</p>
                    <p className="text-[10px] mt-0.5">Pick a sent log from the list on the left to preview its simulated markup frame.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duplicate / Re-transmission modal */}
      <AnimatePresence>
        {duplicateEmail && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xl max-w-md w-full space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Duplicate Study Email</h3>
                  <p className="text-[10px] text-slate-400">Re-send a cloned copy of this educational resource.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Subject Title</p>
                <p className="text-xs font-semibold text-slate-800 truncate">{duplicateEmail.subject}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  New Recipient Address
                </label>
                <input
                  type="email"
                  required
                  value={duplicateRecipient}
                  onChange={(e) => setDuplicateRecipient(e.target.value)}
                  placeholder="e.g. classmate@school.edu"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium font-mono"
                />
                <p className="text-[9px] text-slate-400 mt-1">This will duplicate the existing email draft and simulate transmission to the new classmate.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setDuplicateEmail(null)}
                  className="px-3.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={duplicating || !duplicateRecipient.trim()}
                  onClick={submitDuplicate}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  {duplicating ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Duplicate & Resend</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
