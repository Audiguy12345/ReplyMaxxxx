"use client";

import { useEffect, useMemo, useState } from "react";
import { ResultCard } from "@/components/result-card";
import { PaywallCard } from "@/components/paywall-card";
import { CopyButton } from "@/components/copy-button";
import { FREE_GENERATIONS, STORAGE_KEY } from "@/lib/config";
import type {
  GenerateApiError,
  GenerateApiResponse,
  GeneratorOutput,
  Platform,
  Tone,
} from "@/lib/types";

const platforms: Platform[] = ["email", "linkedin", "twitter", "instagram"];
const tones: Tone[] = ["professional", "casual", "aggressive", "direct"];
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
      // Ignore storage failures and keep the session usable.
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

        throw new Error(
          "error" in json ? json.error : "Something went wrong."
        );
      }

      setResult(json.data);
      incrementUsage();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const buttonLabel = loading
    ? "Generating outreach..."
    : quotaExhausted
    ? "Generation unavailable"
    : isLocked
    ? "Upgrade to continue"
    : "Generate outreach";

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700 md:p-8">
        <div className="mb-8 flex items-start justify-between gap-6 border-b border-zinc-800 pb-6">
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Product input
            </p>
            <h2 className="font-editorial mt-3 text-3xl tracking-[-0.02em] text-white">
              Generate outreach you can send today.
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
              setAudience("B2B SaaS founders with strong traffic but weak demo conversion");
              setOffer("I rewrite landing page copy to increase booked demos without buying more traffic");
              setCurrentMessage(
                "Saw your team is already investing in traffic, but the CTA gets buried. I help SaaS founders tighten the message so more of that traffic turns into demos. Want me to send a quick rewrite idea?"
              );
            }}
            className="font-mono-ui inline-flex rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-zinc-400 transition hover:border-zinc-500 hover:text-white"
          >
            Use example
          </button>

          <div>
            <label className="font-mono-ui mb-2 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Target audience
            </label>
            <textarea
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Example: B2B SaaS founders getting traffic but struggling to convert to demos"
              className="min-h-[110px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-[14px] leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
              required
            />
          </div>

          <div>
            <label className="font-mono-ui mb-2 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Your offer
            </label>
            <textarea
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder="Example: I rewrite landing pages to increase demo conversions by 20-40%"
              className="min-h-[110px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-[14px] leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
              required
            />
          </div>

          <div>
            <label className="font-mono-ui mb-2 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Current outreach / optional
            </label>
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Paste a DM you've been sending..."
              className="min-h-[88px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-[14px] leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="font-mono-ui mb-2 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
              >
                {platforms.map((item) => (
                  <option key={item} value={item}>
                    {item}
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
                {tones.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-mono-ui mb-2 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Extra context
            </label>
            <textarea
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder="Optional: niche, proof, price, target outcome, or constraints"
              className="min-h-[90px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-[14px] leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
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
                Live preview
              </p>
              <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
                <div className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                  Example opener / linkedin / direct
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-200">
                  Hey, noticed you are running traffic to a page that buries the CTA.
                  I fix this exact problem. Fixed it for three SaaS founders last month.
                  Worth ten minutes?
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur opacity-70">
              <div className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                Follow-up
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                No pressure. Just figured the traffic you are paying for deserves a
                page that converts it.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                    Positioning angle
                  </p>
                  <p className="mt-3 text-sm italic leading-7 text-zinc-300">
                    {result.positioningAngle}
                  </p>
                </div>
                <CopyButton value={result.positioningAngle} />
              </div>
            </div>

            <ResultCard title="Openers" items={result.openers} />
            <ResultCard title="Follow-ups" items={result.followUps} />
            <ResultCard
              title="Objection replies"
              items={result.objections.map(
                (item) => `${item.objection}\n\n${item.reply}`
              )}
            />

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                    CTA recommendation
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-200">
                    {result.ctaRecommendation}
                  </p>
                </div>
                <CopyButton value={result.ctaRecommendation} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
