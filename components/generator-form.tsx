"use client";

import { useEffect, useMemo, useState } from "react";
import { ResultCard } from "@/components/result-card";
import { PaywallCard } from "@/components/paywall-card";
import { CopyButton } from "@/components/copy-button";
import { FREE_GENERATIONS, STORAGE_KEY } from "@/lib/config";
import type {
  DropOffStage,
  GenerateApiError,
  GenerateApiResponse,
  GeneratorOutput,
  Platform,
  Tone,
} from "@/lib/types";

const platformOptions: Array<{ value: Platform; label: string }> = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "reddit", label: "Reddit" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter" },
  { value: "email", label: "Email" },
];

const toneOptions: Array<{ value: Tone; label: string }> = [
  { value: "direct", label: "Direct" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "aggressive", label: "Aggressive" },
];

const dropOffStages: Array<{ value: DropOffStage; label: string }> = [
  { value: "views_to_clicks", label: "views -> clicks" },
  { value: "clicks_to_replies", label: "clicks -> replies" },
  { value: "replies_to_booked_calls", label: "replies -> booked calls" },
];

const QUOTA_EXHAUSTED_MESSAGE =
  "Generation is temporarily unavailable while credits are being replenished. Check back shortly.";
const ITERATION_MEMORY_KEY = "replymax_iteration_memory";

type FeedbackOutcome = "no_replies" | "replies_no_calls" | "calls_booked";

type IterationMemory = {
  input: {
    audience: string;
    offer: string;
    currentMessage: string;
    dropOffStage: DropOffStage;
    platform: Platform;
    tone: Tone;
    extraContext: string;
  };
  output: Pick<GeneratorOutput, "primaryRewrite" | "angleVariations" | "followUp" | "cta">;
  outcome: FeedbackOutcome;
  updatedAt: string;
};

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const storage = window.localStorage;

  if (
    !storage ||
    typeof storage.getItem !== "function" ||
    typeof storage.setItem !== "function"
  ) {
    return null;
  }

  return storage;
}

function getOutcomeLabel(outcome: FeedbackOutcome) {
  switch (outcome) {
    case "no_replies":
      return "No replies";
    case "replies_no_calls":
      return "Replies, no calls";
    case "calls_booked":
      return "Calls booked";
    default:
      return outcome;
  }
}

function getIterationHint(outcome: FeedbackOutcome) {
  switch (outcome) {
    case "no_replies":
      return "Got it. We tighten the first line and make the reply easier to earn.";
    case "replies_no_calls":
      return "Got it. We keep the reply trigger and tighten the booking step.";
    case "calls_booked":
      return "Got it. We keep what worked and tighten the next version so it is easier to repeat.";
    default:
      return "Got it. Here is the next version.";
  }
}

function getNextDropOffStage(outcome: FeedbackOutcome, currentStage: DropOffStage) {
  switch (outcome) {
    case "no_replies":
      return currentStage === "views_to_clicks" ? "views_to_clicks" : "clicks_to_replies";
    case "replies_no_calls":
      return "replies_to_booked_calls";
    case "calls_booked":
      return currentStage;
    default:
      return currentStage;
  }
}

function buildIterationContext(extraContext: string, outcome: FeedbackOutcome) {
  const outcomeContext = {
    no_replies: "Last result got no replies.",
    replies_no_calls: "Last result got replies but no calls.",
    calls_booked: "Last result booked calls.",
  }[outcome];

  const nextMove = {
    no_replies: "Tighten the hook and lower the reply friction.",
    replies_no_calls: "Tighten the booking step and make the next move obvious.",
    calls_booked: "Keep the same angle and tighten the follow-up for repeatability.",
  }[outcome];

  return [extraContext.trim(), outcomeContext, nextMove].filter(Boolean).join(" ").slice(0, 500);
}

function loadIterationMemory() {
  try {
    const storage = getBrowserStorage();
    const raw = storage ? storage.getItem(ITERATION_MEMORY_KEY) : null;

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as IterationMemory;
  } catch {
    return null;
  }
}

function saveIterationMemory(value: IterationMemory) {
  try {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(ITERATION_MEMORY_KEY, JSON.stringify(value));
    }
  } catch {
    // Ignore storage failures.
  }
}

export function GeneratorForm() {
  const [audience, setAudience] = useState("");
  const [offer, setOffer] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [tone, setTone] = useState<Tone>("direct");
  const [extraContext, setExtraContext] = useState("");
  const [dropOffStage, setDropOffStage] = useState<DropOffStage>("replies_to_booked_calls");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GeneratorOutput | null>(null);
  const [used, setUsed] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [sendReadyMode, setSendReadyMode] = useState(true);
  const [feedbackOutcome, setFeedbackOutcome] = useState<FeedbackOutcome | null>(null);
  const [lastIteration, setLastIteration] = useState<IterationMemory | null>(null);

  useEffect(() => {
    try {
      const storage = getBrowserStorage();
      const raw = storage ? storage.getItem(STORAGE_KEY) : null;
      const parsed = raw ? Number(raw) : 0;
      setUsed(Number.isFinite(parsed) ? parsed : 0);
      setLastIteration(loadIterationMemory());
    } catch {
      setUsed(0);
      setLastIteration(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  const isLocked = useMemo(() => used >= FREE_GENERATIONS, [used]);
  const isGenerateDisabled = loading || !hydrated || isLocked || quotaExhausted;

  const sendReadySequence = useMemo(() => {
    if (!result) {
      return "";
    }

    return [
      result.primaryRewrite,
      ...result.angleVariations,
      result.followUp,
      result.cta.trim() ? result.cta : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [result]);

  function incrementUsage() {
    const next = used + 1;
    setUsed(next);

    try {
      const storage = getBrowserStorage();
      if (storage) {
        storage.setItem(STORAGE_KEY, String(next));
      }
    } catch {
      // Ignore storage failures.
    }
  }

  async function submitGeneration(overrides?: {
    audience?: string;
    offer?: string;
    currentMessage?: string;
    dropOffStage?: DropOffStage;
    platform?: Platform;
    tone?: Tone;
    extraContext?: string;
  }) {
    if (quotaExhausted) {
      setError(QUOTA_EXHAUSTED_MESSAGE);
      return;
    }

    if (isLocked) {
      setError("Free limit reached. Upgrade to continue.");
      return;
    }

    const payload = {
      audience: overrides?.audience ?? audience,
      offer: overrides?.offer ?? offer,
      currentMessage: overrides?.currentMessage ?? currentMessage,
      dropOffStage: overrides?.dropOffStage ?? dropOffStage,
      platform: overrides?.platform ?? platform,
      tone: overrides?.tone ?? tone,
      extraContext: overrides?.extraContext ?? extraContext,
    };

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as GenerateApiResponse | GenerateApiError;

      if (!res.ok || !("data" in json)) {
        if ("quotaExhausted" in json && json.quotaExhausted) {
          setQuotaExhausted(true);
        }

        throw new Error("error" in json ? json.error : "Something went wrong.");
      }

      setResult(json.data);
      setFeedbackOutcome(null);
      incrementUsage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to map the drop.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await submitGeneration();
  }

  function handleOutcomeSelect(outcome: FeedbackOutcome) {
    if (!result) {
      return;
    }

    setFeedbackOutcome(outcome);

    const snapshot: IterationMemory = {
      input: {
        audience,
        offer,
        currentMessage,
        dropOffStage,
        platform,
        tone,
        extraContext,
      },
      output: {
        primaryRewrite: result.primaryRewrite,
        angleVariations: result.angleVariations,
        followUp: result.followUp,
        cta: result.cta,
      },
      outcome,
      updatedAt: new Date().toISOString(),
    };

    setLastIteration(snapshot);
    saveIterationMemory(snapshot);
  }

  async function handleIterate() {
    if (!result || !feedbackOutcome) {
      return;
    }

    const nextDropOffStage = getNextDropOffStage(feedbackOutcome, dropOffStage);
    const nextCurrentMessage = result.primaryRewrite;
    const nextExtraContext = buildIterationContext(extraContext, feedbackOutcome);

    setCurrentMessage(nextCurrentMessage);
    setDropOffStage(nextDropOffStage);
    setExtraContext(nextExtraContext);

    await submitGeneration({
      currentMessage: nextCurrentMessage,
      dropOffStage: nextDropOffStage,
      extraContext: nextExtraContext,
    });
  }

  function loadLastFeedback() {
    if (!lastIteration) {
      return;
    }

    setAudience(lastIteration.input.audience);
    setOffer(lastIteration.input.offer);
    setCurrentMessage(lastIteration.output.primaryRewrite);
    setDropOffStage(getNextDropOffStage(lastIteration.outcome, lastIteration.input.dropOffStage));
    setPlatform(lastIteration.input.platform);
    setTone(lastIteration.input.tone);
    setExtraContext(buildIterationContext(lastIteration.input.extraContext, lastIteration.outcome));
    setFeedbackOutcome(lastIteration.outcome);
    setResult(null);
    setError("");
  }

  const buttonLabel = loading
    ? "Fixing the drop..."
    : quotaExhausted
      ? "Generation unavailable"
      : isLocked
        ? "Upgrade to continue"
        : "Turn replies into booked calls";

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700 md:p-8">
        <div className="mb-8 flex items-start justify-between gap-6 border-b border-zinc-800 pb-6">
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Product input
            </p>
            <h2 className="font-editorial mt-3 text-3xl tracking-[-0.02em] text-white">
              Fix the drop between interest and action.
            </h2>
          </div>
          <div className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            MVP beta
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setAudience("early-stage B2B SaaS founders");
                setOffer("help turning traffic into more booked demos");
                setCurrentMessage("Hey - noticed you're getting traffic. We help SaaS companies improve conversions. Want to chat?");
                setDropOffStage("replies_to_booked_calls");
                setPlatform("linkedin");
                setTone("direct");
                setExtraContext("10,000 views but only 100 signals back");
                setResult(null);
                setFeedbackOutcome(null);
              }}
              className="font-mono-ui inline-flex rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-zinc-400 transition hover:border-zinc-500 hover:text-white"
            >
              Use example
            </button>

            {lastIteration ? (
              <button
                type="button"
                onClick={loadLastFeedback}
                className="font-mono-ui inline-flex rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-zinc-400 transition hover:border-zinc-500 hover:text-white"
              >
                Use last feedback
              </button>
            ) : null}
          </div>

          {lastIteration ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-300">
              <div className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                Last outcome
              </div>
              <p className="mt-2">
                {getOutcomeLabel(lastIteration.outcome)}. {getIterationHint(lastIteration.outcome)}
              </p>
            </div>
          ) : null}

          <div>
            <label className="font-mono-ui mb-2 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Target
            </label>
            <textarea
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Example: SaaS founders getting replies but not enough booked calls"
              className="min-h-[110px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-[14px] leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
              required
            />
          </div>

          <div>
            <label className="font-mono-ui mb-2 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Offer
            </label>
            <textarea
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder="Example: I fix outbound messaging so more conversations turn into booked calls"
              className="min-h-[110px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-[14px] leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
              required
            />
          </div>

          <div>
            <label className="font-mono-ui mb-2 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Current message
            </label>
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Paste the message you are sending now..."
              className="min-h-[120px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-[14px] leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="font-mono-ui mb-2 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
              >
                {platformOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-mono-ui mb-2 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
              >
                {toneOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-mono-ui mb-2 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Where are you losing people?
            </label>
            <select
              value={dropOffStage}
              onChange={(e) => setDropOffStage(e.target.value as DropOffStage)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
            >
              {dropOffStages.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-mono-ui mb-2 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Extra context
            </label>
            <textarea
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder="Example: 10,000 views but only 100 signals back"
              className="min-h-[96px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-[14px] leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
            />
          </div>

          {quotaExhausted ? (
            <div className="rounded-3xl border border-amber-900/80 bg-amber-950/40 p-5 text-sm leading-6 text-amber-200">
              {QUOTA_EXHAUSTED_MESSAGE}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isGenerateDisabled}
            className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buttonLabel}
          </button>

          {hydrated ? <PaywallCard used={used} freeLimit={FREE_GENERATIONS} /> : null}

          {error ? (
            <div className="rounded-3xl border border-red-900 bg-red-950/40 p-6 text-sm text-red-300 shadow-xl backdrop-blur">
              {error}
            </div>
          ) : null}
        </form>
      </div>

      <div className="space-y-6">
        {!result ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
              <p className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Message
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                Saw you&apos;re getting replies, but people still don&apos;t book. What are you using right now to turn that into a booked call?
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur opacity-80">
              <div className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                Variations
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Two sharper ways to say the same thing without sounding templated.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur opacity-80">
              <div className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                Follow-up
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                A short question that keeps the conversation moving.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur opacity-70">
              <div className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                Optional CTA
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-500">
                A next step if you want to push the conversation forward.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-editorial text-2xl tracking-[-0.02em] text-white">
                Turn replies into booked calls
              </h3>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={sendReadyMode}
                    onChange={(e) => setSendReadyMode(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-white"
                  />
                  Send-ready mode
                </label>
                <CopyButton value={sendReadySequence} />
              </div>
            </div>

            {sendReadyMode ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                  Send-ready set
                </p>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                  {sendReadySequence}
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                        Message
                      </p>
                      <p className="mt-3 text-sm leading-7 text-zinc-200">
                        {result.primaryRewrite}
                      </p>
                    </div>
                    <CopyButton value={result.primaryRewrite} />
                  </div>
                </div>

                <ResultCard title="Variation" items={result.angleVariations} />

                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                        Follow-up
                      </p>
                      <p className="mt-3 text-sm leading-7 text-zinc-200">
                        {result.followUp}
                      </p>
                    </div>
                    <CopyButton value={result.followUp} />
                  </div>
                </div>

                {result.cta.trim().length > 0 ? (
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                          Optional CTA
                        </p>
                        <p className="mt-3 text-sm leading-7 text-zinc-200">
                          {result.cta}
                        </p>
                      </div>
                      <CopyButton value={result.cta} />
                    </div>
                  </div>
                ) : null}
              </>
            )}

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
              <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                What happened when you sent this?
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {([
                  ["no_replies", "No replies"],
                  ["replies_no_calls", "Replies, no calls"],
                  ["calls_booked", "Calls booked"],
                ] as Array<[FeedbackOutcome, string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleOutcomeSelect(value)}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      feedbackOutcome === value
                        ? "border-white bg-white text-black"
                        : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {feedbackOutcome ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                  Next version
                </p>
                <p className="mt-3 text-sm leading-7 text-zinc-200">
                  {getIterationHint(feedbackOutcome)}
                </p>
                <button
                  type="button"
                  onClick={handleIterate}
                  disabled={loading || quotaExhausted}
                  className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Based on that, give me the next version
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
