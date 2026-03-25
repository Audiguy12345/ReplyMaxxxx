"use client";

import { useState } from "react";

type CopyButtonProps = {
  value: string;
};

export function CopyButton({ value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="font-mono-ui whitespace-nowrap border border-[var(--rm-rule)] bg-[var(--rm-white)] px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--rm-muted)] transition hover:border-[var(--rm-muted)] hover:text-[var(--rm-ink)]"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
