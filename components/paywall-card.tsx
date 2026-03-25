"use client";

import { CHECKOUT_URL } from "@/lib/config";

type PaywallCardProps = {
  used: number;
  freeLimit: number;
};

export function PaywallCard({ used, freeLimit }: PaywallCardProps) {
  const locked = used >= freeLimit;
  const hidePricing = !CHECKOUT_URL;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700">
      <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-zinc-500">
        {locked ? "Free limit reached" : "Free usage"}
      </p>

      <h3 className="font-editorial mt-3 text-3xl tracking-[-0.02em] text-white">
        {locked
          ? "Unlock more generations"
          : `${freeLimit - used} free generations left`}
      </h3>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
        <div className="flex gap-1.5">
          {Array.from({ length: freeLimit }).map((_, index) => (
            <span
              key={index}
              className={`h-2.5 w-2.5 rounded-full ${
                index < used
                  ? "bg-white"
                  : "border border-zinc-700 bg-transparent"
              }`}
            />
          ))}
        </div>
        <div className="text-xs text-zinc-400">
          <span className="text-white">{used}</span> of {freeLimit} free generations used
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-zinc-400">
        If this gets you one client, it pays for itself instantly.
      </p>

      {!hidePricing ? (
        <>
          <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-sm font-medium text-white">$10/month</p>
            <p className="mt-2 text-sm leading-7 text-zinc-400">
              Better outputs, unlimited generations, same simple workflow.
            </p>
          </div>

          <div className="mt-5">
            <a
              href={CHECKOUT_URL}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-black shadow-lg transition hover:opacity-90"
            >
              Upgrade
            </a>
          </div>
        </>
      ) : null}
    </div>
  );
}
