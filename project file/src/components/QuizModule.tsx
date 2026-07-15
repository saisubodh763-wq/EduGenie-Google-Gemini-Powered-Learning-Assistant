import { useState } from "react";
import { motion } from "motion/react";
import { Award, ClipboardList, RefreshCw, Send, CheckCircle, XCircle, HelpCircle, Sparkles, AlertCircle } from "lucide-react";
import { Quiz } from "../types";

interface QuizModuleProps {
  userId: string;
  onQueryCompleted: () => void;
}

const PASSAGES = [
  {
    title: "DNA and RNA Structure",
    text: "Deoxyribonucleic acid (DNA) is a molecule that carries most of the genetic instructions used in the development, functioning, and reproduction of all known living organisms. DNA is composed of two polynucleotide chains that coil around each other to form a double helix. The two DNA strands are known as polynucleotides because they are composed of simpler monomeric units called nucleotides. Each nucleotide is composed of one of four nitrogen-containing nucleobases (cytosine, guanine, adenine, or thymine), a sugar called deoxyribose, and a phosphate group. In contrast, Ribonucleic acid (RNA) is typically single-stranded and contains uracil instead of thymine, and ribose sugar instead of deoxyribose."
  },
  {
    title: "The Solar System",
    text: "The Solar System is the gravitationally bound system of the Sun and the objects that orbit it. It formed 4.6 billion years ago from the gravitational collapse of a giant interstellar molecular cloud. The vast majority of the system's mass is in the Sun, with the majority of the remaining mass contained in the planet Jupiter. The eight planets are divided into the inner terrestrial planets (Mercury, Venus, Earth, and Mars), which are primarily composed of rock and metal, and the outer giant planets, which are substantially more massive. The two largest planets, Jupiter and Saturn, are gas giants, being composed mainly of hydrogen and helium."
  }
];

export default function QuizModule({ userId, onQueryCompleted }: QuizModuleProps) {
  const [passage, setPassage] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  // Solving states
  const [userAnswers, setUserAnswers] = useState<{ [quizId: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const loadingMessages = [
    "Reading passage context...",
    "Drafting educational quiz questions...",
    "Designing plausible distractors...",
    "Structuring multiple-choice options...",
    "Ready to test your knowledge!"
  ];

  const handleGenerate = async (e?: React.FormEvent, selectedPassage?: string) => {
    if (e) e.preventDefault();
    const text = selectedPassage || passage;
    if (!text.trim()) return;

    setLoading(true);
    setError("");
    setQuizzes(null);
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);

    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % loadingMessages.length;
      setLoadingStep(step);
    }, 1500);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify({ passage: text })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate quiz.");
      }

      setQuizzes(data.quizzes);
      onQueryCompleted();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const selectOption = (quizId: string, option: string) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [quizId]: option }));
  };

  const handleQuizSubmit = () => {
    if (!quizzes) return;
    let correctCount = 0;
    quizzes.forEach((quiz) => {
      const userAns = userAnswers[quiz.quiz_id];
      if (userAns && userAns.toUpperCase() === quiz.correct_answer.toUpperCase()) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex items-start gap-4">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Quiz Master</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            EduGenie will analyze any passage or learning topic you provide, formulate exactly three multiple-choice questions (MCQs), and evaluate your understanding in real time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-emerald-500" />
              <span>Paste Study Material</span>
            </h3>

            <form onSubmit={handleGenerate} className="space-y-3">
              <textarea
                required
                rows={6}
                value={passage}
                onChange={(e) => setPassage(e.target.value)}
                placeholder="Paste a paragraph, textbook section, or topic here (minimum 50 words works best)..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder:text-slate-400 resize-none"
              />

              <button
                type="submit"
                disabled={loading || !passage.trim()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-xs hover:shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Generate MCQs</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Preset Passages */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Select Practice Materials</span>
            </h3>
            <div className="flex flex-col gap-2">
              {PASSAGES.map((p, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setPassage(p.text);
                    handleGenerate(undefined, p.text);
                  }}
                  className="w-full text-left p-2.5 text-xs text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 border border-transparent hover:border-emerald-100 rounded-lg transition-all cursor-pointer font-medium"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Interactive Quiz Pane */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs min-h-[350px] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Interactive Quiz Arena
              </span>
              {submitted && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Your Score:</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    score === 3 ? "bg-emerald-100 text-emerald-800" :
                    score >= 1 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                  }`}>
                    {score} / 3 Correct ({Math.round((score / 3) * 100)}%)
                  </span>
                </div>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col justify-center">
              {loading ? (
                <div className="text-center py-12 space-y-4">
                  <div className="relative w-12 h-12 mx-auto">
                    <div className="absolute inset-0 border-3 border-emerald-100 rounded-full" />
                    <div className="absolute inset-0 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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
                <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100 text-center max-w-md mx-auto my-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              ) : quizzes && quizzes.length > 0 ? (
                <div className="space-y-6">
                  {quizzes.map((quiz, qIndex) => {
                    const selected = userAnswers[quiz.quiz_id];
                    const isCorrect = selected?.toUpperCase() === quiz.correct_answer.toUpperCase();
                    const showFeedback = submitted;

                    return (
                      <div key={quiz.quiz_id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3.5">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-slate-400 text-xs mt-1 w-5 shrink-0">
                            Q{qIndex + 1}.
                          </span>
                          <h4 className="text-sm font-semibold text-slate-800">
                            {quiz.question_text}
                          </h4>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-7">
                          {[
                            { key: "A", val: quiz.option_a },
                            { key: "B", val: quiz.option_b },
                            { key: "C", val: quiz.option_c },
                            { key: "D", val: quiz.option_d }
                          ].map((opt) => {
                            const isSelected = selected === opt.key;
                            const isCorrectOpt = quiz.correct_answer.toUpperCase() === opt.key;
                            
                            let optStyle = "bg-white border-slate-200 text-slate-700 hover:border-slate-300";
                            
                            if (isSelected && !showFeedback) {
                              optStyle = "bg-emerald-50 border-emerald-500 text-emerald-900";
                            } else if (showFeedback) {
                              if (isCorrectOpt) {
                                optStyle = "bg-emerald-100 border-emerald-600 text-emerald-900 font-medium";
                              } else if (isSelected && !isCorrectOpt) {
                                optStyle = "bg-red-100 border-red-500 text-red-900";
                              } else {
                                optStyle = "bg-white border-slate-100 text-slate-400 opacity-60";
                              }
                            }

                            return (
                              <button
                                key={opt.key}
                                type="button"
                                disabled={submitted}
                                onClick={() => selectOption(quiz.quiz_id, opt.key)}
                                className={`text-left p-3 text-xs border rounded-xl transition-all cursor-pointer flex items-center justify-between ${optStyle}`}
                              >
                                <span>
                                  <strong className="mr-1 text-slate-400">{opt.key}.</strong> {opt.val}
                                </span>
                                {showFeedback && isCorrectOpt && (
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                                {showFeedback && isSelected && !isCorrectOpt && (
                                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Submit / Reset Section */}
                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    {!submitted ? (
                      <button
                        type="button"
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(userAnswers).length < quizzes.length}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>Submit Answers</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGenerate(undefined, quizzes[0].question_text /* or repeat original text */)}
                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Try Another Quiz</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
                  <p>Paste text material or select a preset study topic on the left to generate an interactive quiz.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
