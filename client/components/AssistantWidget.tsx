"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Mic, Loader2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import ProductCard, { ProductSummary } from "@/components/ProductCard";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  products?: ProductSummary[];
}

const SUGGESTIONS = [
  "Find me cotton fabric under $5",
  "What denim do you have in stock?",
  "Recommend fabric for summer apparel",
];

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi! I'm the TextileHub AI assistant. Ask me to find fabric, compare products, or answer sourcing questions — I'll search our live catalog for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      setInput(e.results[0][0].transcript);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setVoiceSupported(true);
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  async function sendMessage(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/assistant/chat", { message });
      const { reply, products } = res.data.data;
      setMessages((m) => [...m, { role: "assistant", text: reply, products }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: apiErrorMessage(err) }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed bottom-5 right-5 z-50 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-96 h-[70vh] max-h-[560px] bg-white border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-indigo-700 text-white px-4 py-3 flex items-center gap-2 shrink-0">
            <Sparkles size={18} />
            <div>
              <p className="font-semibold text-sm">AI Marketplace Assistant</p>
              <p className="text-xs text-indigo-200">Ask about fabrics, prices, or MOQ</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.products && m.products.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {m.products.slice(0, 4).map((p) => (
                        <ProductCard key={p._id} product={p} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500 inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Thinking...
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-2 shrink-0">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs border border-indigo-200 text-indigo-700 rounded-full px-2.5 py-1 hover:bg-indigo-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="border-t p-2 flex items-center gap-2 shrink-0"
          >
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                aria-label="Voice input"
                className={`p-2 rounded-md ${listening ? "bg-red-100 text-red-600" : "text-gray-500 hover:bg-gray-100"}`}
              >
                <Mic size={18} />
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about fabrics, prices, MOQ..."
              className="flex-1 border rounded-md px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 text-white p-2 rounded-md disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
