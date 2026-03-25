import { CopyButton } from "@/components/copy-button";

type ResultCardProps = {
  title: string;
  items: string[];
};

export function ResultCard({ title, items }: ResultCardProps) {
  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-editorial text-2xl tracking-[-0.02em] text-white">
          {title}
        </h3>
        <CopyButton value={items.join("\n\n---\n\n")} />
      </div>

      <div className="space-y-6">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl backdrop-blur transition hover:border-zinc-700 text-sm leading-7 whitespace-pre-wrap text-zinc-200"
          >
            <div className="font-mono-ui mb-3 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
              {title} {index + 1}
            </div>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
