"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Sparkles } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";

type OnboardingRole = "buyer" | "supplier";

interface OnboardingAiAutofillProps {
  role: OnboardingRole;
  onApply: (values: Record<string, string>) => void;
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionEvent extends Event {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultItem>>;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export default function OnboardingAiAutofill({ role, onApply }: OnboardingAiAutofillProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const recognitionConstructor = (
      window as typeof window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }
    ).SpeechRecognition ||
      (
        window as typeof window & {
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).webkitSpeechRecognition;

    if (!recognitionConstructor) return;

    const recognition = new recognitionConstructor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setDescription((current) => (current ? `${current} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError("Voice input could not be captured. Please type your details instead.");
    };
    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
      recognitionRef.current = null;
    };
  }, []);

  function startVoiceInput() {
    setError("");
    try {
      recognitionRef.current?.start();
      setListening(true);
    } catch {
      setError("Voice input is already active. Please finish speaking first.");
    }
  }

  async function autofill() {
    if (description.trim().length < 12) {
      setError("Tell the assistant a little more about your business before autofilling.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await api.post("/assistant/onboarding-autofill", {
        role,
        description: description.trim(),
      });
      onApply(res.data.data.fields);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const example =
    role === "buyer"
      ? "We make sustainable casualwear in Dhaka and source cotton jersey and denim in batches of 1,000–2,000 metres."
      : "We are a knit-fabric manufacturer in Gazipur offering cotton jersey and fleece, MOQ 500 metres, open Monday–Saturday. Contact: +880…";

  return (
    <section className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
      <div className="flex gap-3">
        <span className="mt-0.5 rounded-lg bg-indigo-600 p-2 text-white">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-gray-900">Let AI set up your profile</h2>
          <p className="mt-1 text-sm text-gray-600">
            Describe your business in your own words. We&apos;ll suggest answers for the form; you can review and edit every field.
          </p>
          <label htmlFor="ai-onboarding-description" className="sr-only">
            Describe your business
          </label>
          <textarea
            id="ai-onboarding-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="mt-3 w-full resize-y rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder={example}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={autofill}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? "Preparing your profile..." : "Autofill with AI"}
            </button>
            {voiceSupported && (
              <button
                type="button"
                onClick={startVoiceInput}
                disabled={listening || loading}
                className="inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
              >
                <Mic size={16} className={listening ? "animate-pulse text-red-500" : ""} />
                {listening ? "Listening..." : "Speak instead"}
              </button>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </section>
  );
}
