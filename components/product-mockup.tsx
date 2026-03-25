"use client";

import { useEffect, useState } from "react";

function formatCurrentTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ProductMockup() {
  const [currentTime, setCurrentTime] = useState(() =>
    formatCurrentTime(new Date())
  );

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(formatCurrentTime(new Date()));
    };

    updateTime();

    const interval = globalThis.setInterval(updateTime, 30000);

    return () => {
      globalThis.clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-[32px] border border-zinc-800 bg-zinc-950/80 p-3 shadow-2xl backdrop-blur">
      <div className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <div className="ml-4 rounded-full border border-zinc-800 bg-black/40 px-4 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            replymax.io
          </div>
          <div className="ml-auto text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            {currentTime}
          </div>
        </div>

        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-zinc-800 bg-zinc-900/50 p-6 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-zinc-800 pb-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Product input
                </p>
                <h3 className="mt-3 font-editorial text-3xl tracking-[-0.02em] text-white">
                  Generate outreach you can send today.
                </h3>
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                MVP beta
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Target audience
                </div>
                <p className="text-sm leading-6 text-zinc-200">
                  B2B SaaS founders with traffic but low conversion
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Your offer
                </div>
                <p className="text-sm leading-6 text-zinc-200">
                  I rewrite landing page copy to increase demo conversions by 20-40%
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    Platform
                  </div>
                  <p className="text-sm text-white">LinkedIn</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    Tone
                  </div>
                  <p className="text-sm text-white">Direct</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-black shadow-lg">
                Generate outreach
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-zinc-950 p-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur">
              <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Positioning angle
              </div>
              <p className="text-sm italic leading-7 text-zinc-300">
                You are paying for traffic, but the page is the leak. Fix the conversion problem before buying more attention.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur">
              <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Opener 1
              </div>
              <p className="text-sm leading-7 text-zinc-200">
                Hey - noticed you are running paid traffic but the CTA is buried. I fix this exact issue for SaaS founders. Worth 10 minutes?
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur opacity-80">
              <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Follow-up
              </div>
              <p className="text-sm leading-7 text-zinc-400">
                No pressure. Just figured the traffic you are paying for deserves a page that converts it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
