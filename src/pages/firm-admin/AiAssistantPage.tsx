import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Mic, MicOff, Send, Trash2, User as UserIcon } from "lucide-react";
import * as aiAssistantApi from "../../api/aiAssistant.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

const SUGGESTIONS = [
  "How many business clients were added last month?",
  "How many compliance tasks are overdue?",
  "What's the status of our CRM pipeline?",
  "When does our firm's subscription plan expire?",
];

function useSpeechRecognition(onResult) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    return () => recognition.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  return { supported, listening, toggle };
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-brand text-white" : "bg-surface-2 text-brand"
        }`}
      >
        {isUser ? <UserIcon size={16} /> : <Bot size={16} />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser ? "bg-brand text-white" : "border border-border bg-surface text-text"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose-sm max-w-none [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AiAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  const { supported: voiceSupported, listening, toggle: toggleListening } = useSpeechRecognition(setInput);

  useEffect(() => {
    aiAssistantApi
      .getHistory()
      .then(({ data }) => setMessages(data.data))
      .catch(() => setError("Couldn't load your previous conversation."))
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(text?: string) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setError("");
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message, createdAt: new Date().toISOString() }]);
    setSending(true);
    try {
      const { data } = await aiAssistantApi.sendMessage(message);
      setMessages((prev) => [...prev, { role: "assistant", content: data.data.answer, createdAt: new Date().toISOString() }]);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
      setInput(message);
    } finally {
      setSending(false);
    }
  }

  async function handleClear() {
    await aiAssistantApi.clearHistory().catch(() => {});
    setMessages([]);
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading">AI Assistant</h1>
          <p className="mt-1 text-sm text-text-muted">
            Ask anything about your firm — business clients, CRM, compliance, staff, payroll, billing.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 size={14} /> Clear chat
          </Button>
        )}
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {loadingHistory ? (
            <div className="flex justify-center py-10">
              <Spinner size={24} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Bot size={24} />
              </div>
              <div>
                <p className="font-semibold text-heading">
                  Hi {user?.name?.split(" ")[0]}, I'm your firm's AI Assistant.
                </p>
                <p className="mt-1 text-sm text-text-muted">Try asking me one of these:</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="rounded-full border border-border bg-surface-2 px-3.5 py-1.5 text-xs text-text transition-colors hover:border-brand hover:text-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => <MessageBubble key={i} message={m} />)
          )}

          {sending && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-brand">
                <Bot size={16} />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted" />
              </div>
            </div>
          )}
        </div>

        {error && <p className="px-5 pb-1 text-xs text-danger">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2 border-t border-border p-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your question... (e.g. new clients added last month)"
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-heading placeholder:text-text-muted outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          {voiceSupported && (
            <Button
              type="button"
              variant={listening ? "danger" : "secondary"}
              size="md"
              onClick={toggleListening}
              title={listening ? "Stop listening" : "Speak your question"}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </Button>
          )}
          <Button type="submit" disabled={!input.trim() || sending}>
            <Send size={16} />
          </Button>
        </form>
      </Card>
    </div>
  );
}
