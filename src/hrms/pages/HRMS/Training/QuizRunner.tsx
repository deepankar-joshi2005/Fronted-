/** @format */

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface Option {
  _id: string;
  text: string;
}
interface Question {
  _id: string;
  questionText: string;
  options: Option[];
}
interface ReviewItem {
  questionId: string;
  questionText: string;
  options: Option[];
  correctOptionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
}

type Phase = "intro" | "running" | "result";

const MAX_TAB_WARNINGS = 3;

export default function QuizRunner() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("intro");
  const [testInfo, setTestInfo] = useState<{ testDurationMinutes: number; passPercentage: number } | null>(null);
  const [loadError, setLoadError] = useState("");

  const [testAttemptId, setTestAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] = useState<{ scorePercentage: number; isPassed: boolean; isTimeExpired: boolean; reviewData: ReviewItem[] } | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const testAttemptIdRef = useRef(testAttemptId);
  testAttemptIdRef.current = testAttemptId;
  const submittingRef = useRef(false);

  useEffect(() => {
    axiosInstance
      .get(`/my-training/module/${moduleId}/test-info`)
      .then((res) => setTestInfo(res.data))
      .catch(() => setLoadError("Failed to load test information."));
  }, [moduleId]);

  const submitTest = useCallback(async () => {
    if (submittingRef.current || !testAttemptIdRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        testAttemptId: testAttemptIdRef.current,
        answers: Object.entries(answersRef.current).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })),
      };
      const res = await axiosInstance.post("/my-training/module/submit-test", payload);
      setResult(res.data);
      setPhase("result");
    } catch (err: any) {
      setLoadError(err.response?.data?.message || "Failed to submit the test.");
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (phase !== "running") return;
    if (secondsLeft <= 0) {
      submitTest();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft, submitTest]);

  // Anti-cheat: tab-switch detection
  useEffect(() => {
    if (phase !== "running") return;
    const onVisibility = () => {
      if (document.hidden) {
        setTabWarnings((w) => {
          const next = w + 1;
          if (next >= MAX_TAB_WARNINGS) submitTest();
          return next;
        });
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [phase, submitTest]);

  const startTest = async () => {
    setLoadError("");
    try {
      const res = await axiosInstance.post(`/my-training/module/${moduleId}/start-test`);
      setTestAttemptId(res.data.testAttemptId);
      setQuestions(res.data.questions || []);
      setSecondsLeft(res.data.durationSeconds || 1200);
      setAnswers({});
      setTabWarnings(0);
      setPhase("running");
    } catch (err: any) {
      setLoadError(err.response?.data?.message || "Failed to start the test.");
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (loadError && phase === "intro" && !testInfo) {
    return <div className="p-6 text-sm text-[var(--status-critical)]">{loadError}</div>;
  }

  if (phase === "intro") {
    return (
      <div className="p-6 sm:p-8">
        <Link to={`/hrms/training/module/${moduleId}`} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to Module
        </Link>
        <div className="card-premium max-w-lg mx-auto mt-6 p-8 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Ready to start the test?</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            You will have <strong>{testInfo?.testDurationMinutes ?? "—"} minutes</strong>. You need{" "}
            <strong>{testInfo?.passPercentage ?? 70}%</strong> to pass. Don't switch tabs — the test auto-submits
            after {MAX_TAB_WARNINGS} warnings. You get 2 attempts total.
          </p>
          {loadError && <p className="mt-3 text-sm text-[var(--status-critical)]">{loadError}</p>}
          <button
            type="button"
            onClick={startTest}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-6 py-2.5 text-sm font-semibold text-white shadow-premium-sm hover:opacity-90"
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        <div className="card-premium max-w-2xl mx-auto p-8 text-center">
          {result.isPassed ? (
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-[var(--status-good)]" />
          ) : (
            <XCircle className="mx-auto mb-3 h-12 w-12 text-[var(--status-critical)]" />
          )}
          <h2 className="text-xl font-bold text-[var(--foreground)]">{result.isPassed ? "You passed!" : "Not passed"}</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Score: <strong>{result.scorePercentage}%</strong>
            {result.isTimeExpired && " — time expired before submission"}
          </p>
          <button
            type="button"
            onClick={() => navigate("/hrms/training")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-6 py-2.5 text-sm font-semibold text-white shadow-premium-sm hover:opacity-90"
          >
            Back to Training
          </button>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Answer Review</h3>
          {result.reviewData.map((q, i) => (
            <div key={q.questionId} className="card-premium p-4">
              <p className="text-sm font-medium text-[var(--foreground)]">{i + 1}. {q.questionText}</p>
              <div className="mt-2 space-y-1">
                {q.options.map((o) => {
                  const isCorrectOpt = o._id === q.correctOptionId;
                  const isSelected = o._id === q.selectedOptionId;
                  return (
                    <div
                      key={o._id}
                      className={`rounded-md px-3 py-1.5 text-xs ${
                        isCorrectOpt
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : isSelected
                          ? "bg-red-50 text-red-700"
                          : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      {o.text} {isCorrectOpt && "✓"} {isSelected && !isCorrectOpt && "(your answer)"}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // running
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg bg-[var(--card)] border border-[var(--border)] px-4 py-3 shadow-premium-sm">
        <span className="text-sm font-medium text-[var(--foreground)]">Question {questions.length} total</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] px-3 py-1 text-sm font-semibold text-[var(--primary)]">
          <Clock className="h-4 w-4" /> {formatTime(secondsLeft)}
        </span>
      </div>

      {tabWarnings > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          <AlertTriangle className="h-4 w-4" /> Warning {tabWarnings}/{MAX_TAB_WARNINGS}: switching tabs during the test may auto-submit it.
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q._id} className="card-premium p-4 sm:p-5">
            <p className="text-sm font-medium text-[var(--foreground)]">{i + 1}. {q.questionText}</p>
            <div className="mt-3 space-y-2">
              {q.options.map((o) => (
                <label
                  key={o._id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                    answers[q._id] === o._id ? "border-[var(--primary)] bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]" : "border-[var(--border)] hover:bg-[var(--muted)]"
                  }`}
                >
                  <input
                    type="radio"
                    name={q._id}
                    checked={answers[q._id] === o._id}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: o._id }))}
                    className="h-4 w-4"
                  />
                  {o.text}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={submitting}
          onClick={submitTest}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-6 py-2.5 text-sm font-semibold text-white shadow-premium-sm hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Test"}
        </button>
      </div>
    </div>
  );
}
