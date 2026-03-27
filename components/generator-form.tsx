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

  useEffect(() => {
    try {
      const storage = getBrowserStorage();
      const raw = storage ? storage.getItem(STORAGE_KEY) : null;
      const parsed = raw ? Number(raw) : 0;
      setUsed(Number.isFinite(parsed) ? parsed : 0);
    } catch {
      setUsed(0);
    } finally {
      setHydrated(true);
    }
  }, []);

  const isLocked = useMemo(() => used >= FREE_GENERATIONS, [used]);
  const isGenerateDisabled = loading || !hydrated || isLocked || quotaExhausted;

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (quotaExhausted) {
      setError(QUOTA_EXHAUSTED_MESSAGE);
      return;
    }

    if (isLocked) {
      setError("Free limit reached. Upgrade to continue.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audience,
          offer,
          currentMessage,
          dropOffStage,
          platform,
          tone,
          extraContext,
        }),
      });

      const json = (await res.json()) as GenerateApiResponse | GenerateApiError;

      if (!res.ok || !("data" in json)) {
        if ("quotaExhausted" in json && json.quotaExhausted) {
          setQuotaExhausted(true);
        }

        throw new Error("error" in json ? json.error : "Something went wrong.");
      }

      setResult(json.data);
      incrementUsage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate.");
    } finally {
      setLoading(false);
    }
  }

  const buttonLabel = loading
    ? "Fixing outreach..."
    : quotaExhausted
    ? "Generation unavailable"
    : isLocked
    ? "Upgrade to continue"
    : "Fix outreach";

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700 md:p-8">
        <div className="mb-8 flex items-start justify-between gap-6 border-b border-zinc-800 pb-6">
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Product input
            </p>
            <h2 className="font-editorial mt-3 text-3xl tracking-[-0.02em] text-white">
              Fix broken outreach.
            </h2>
          </div>
          <div className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            MVP beta
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
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
            }}
            className="font-mono-ui inline-flex rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-zinc-400 transition hover:border-zinc-500 hover:text-white"
          >
            Use example
          </button>

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
                Problem
              </p>
              <p className="mt-3 text-sm italic leading-7 text-zinc-300">
                You are getting attention, but people are not moving to book. The drop is happening between interest and action.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur opacity-80">
              <div className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                Why
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                The message shows value, but does not create enough clarity or pressure to take the next step.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                    Problem
                  </p>
                  <p className="mt-3 text-sm italic leading-7 text-zinc-300">
                    {result.problem}
                  </p>
                </div>
                <CopyButton value={result.problem} />
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                    Why
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-200">
                    {result.why}
                  </p>
                </div>
                <CopyButton value={result.why} />
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                    What&apos;s happening
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-200">
                    {result.whatIsHappening}
                  </p>
                </div>
                <CopyButton value={result.whatIsHappening} />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-editorial text-2xl tracking-[-0.02em] text-white">
                Sequence to increase booked calls
              </h3>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                      Primary rewrite
                    </p>
                    <p className="mt-3 text-sm leading-7 text-zinc-200">
                      {result.primaryRewrite}
                    </p>
                  </div>
                  <CopyButton value={result.primaryRewrite} />
                </div>
              </div>

              <ResultCard title="Angle variation" items={result.angleVariations} />

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

              <ResultCard
                title="Objection handling"
                items={result.objectionHandling.map(
                  (item) => `${item.objection}\n\n${item.reply}`
                )}
              />

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                      CTA
                    </p>
                    <p className="mt-3 text-sm leading-7 text-zinc-200">
                      {result.cta}
                    </p>
                  </div>
                  <CopyButton value={result.cta} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                    What changed
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-200 whitespace-pre-wrap">
                    {result.whatChanged}
                  </p>
                </div>
                <CopyButton value={result.whatChanged} />
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                    Expected impact
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-200">
                    {result.expectedImpact}
                  </p>
                </div>
                <CopyButton value={result.expectedImpact} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
