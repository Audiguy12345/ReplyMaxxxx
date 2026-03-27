import { GeneratorForm } from "@/components/generator-form";
import { ProductMockup } from "@/components/product-mockup";

const features = [
  {
    number: "01",
    title: "Diagnose first.",
    body:
      "ReplyMax shows why the message fails before it rewrites anything, so the output feels like a fix, not another guess.",
  },
  {
    number: "02",
    title: "Booked-call focused.",
    body:
      "The flow is tied to the step where people stop moving, from views to clicks to booked calls.",
  },
  {
    number: "03",
    title: "Tight scope.",
    body:
      "No CRM, no dashboards, no platform sprawl. Just the message, the leak, and the fix sequence.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#121216] text-white">
      <nav className="sticky top-0 z-20 border-b border-white/8 bg-[#121216]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-5 sm:px-6 lg:px-10">
          <div className="font-editorial text-[30px] leading-none tracking-[-0.03em] text-white">
            ReplyMax
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm text-zinc-500 transition hover:text-zinc-300">
              How it works
            </a>
            <a href="#product-frame" className="text-sm text-zinc-500 transition hover:text-zinc-300">
              Product frame
            </a>
            <a href="#generator" className="text-sm text-zinc-500 transition hover:text-zinc-300">
              Fix outreach
            </a>
          </div>

          <a
            href="#generator"
            className="rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:border-zinc-500"
          >
            Try free
          </a>
        </div>
      </nav>

      <section className="border-b border-white/8">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="rounded-[34px] border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(196,181,253,0.14),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.015))] px-5 py-6 shadow-[0_28px_90px_-40px_rgba(0,0,0,0.72)] sm:px-8 sm:py-8">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <p className="font-mono-ui text-[11px] uppercase tracking-[0.32em] text-zinc-500">
                  ReplyMax
                </p>

                <h1 className="font-editorial mt-5 max-w-4xl text-5xl leading-[0.9] tracking-[-0.05em] text-white sm:text-6xl lg:text-[84px]">
                  Fix your outreach. Get more booked calls.
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                  Paste your message. ReplyMax shows why it fails and rewrites it into something that actually converts.
                </p>

                <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-500">
                  Fix the step where people see your offer but do not take action.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <a
                    href="#generator"
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:opacity-90"
                  >
                    Fix outreach
                  </a>
                  <a
                    href="#product-frame"
                    className="rounded-2xl border border-zinc-700 bg-zinc-900/60 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white"
                  >
                    See the flow
                  </a>
                </div>
              </div>

              <ProductMockup />
            </div>
          </div>
        </div>
      </section>

      <section id="product-frame" className="border-b border-white/8">
        <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.42fr_0.58fr] lg:px-10 lg:py-14">
          <div className="flex flex-col justify-between rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,_rgba(255,255,255,0.02),_rgba(255,255,255,0.012))] p-6 shadow-[0_28px_90px_-45px_rgba(0,0,0,0.78)] sm:p-8">
            <div>
              <p className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Product frame
              </p>
              <h2 className="font-editorial mt-4 text-4xl leading-[0.96] tracking-[-0.035em] text-white sm:text-5xl">
                Diagnose the leak. Fix the message. Get more booked calls.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-zinc-400">
                The wedge is simple: paste the message, pick where people drop off, and get a diagnosis-first rewrite sequence built around booked calls.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.number}
                className="rounded-3xl border border-white/8 bg-white/[0.02] p-6 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.7)]"
              >
                <div className="font-mono-ui text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                  {feature.number}
                </div>
                <h3 className="font-editorial mt-5 text-3xl leading-tight tracking-[-0.02em] text-white">
                  {feature.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-zinc-400">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-white/8">
        <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-14">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              How it works
            </p>
            <h2 className="font-editorial mt-4 text-4xl tracking-[-0.03em] text-white sm:text-5xl">
              Current message in. Diagnosis and fix sequence out.
            </h2>
          </div>
        </div>
      </section>

      <section id="generator">
        <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Try the product
            </p>
            <h2 className="font-editorial mt-4 text-4xl tracking-[-0.03em] text-white sm:text-5xl">
              Fix your outreach. Get more booked calls.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
              Paste your message, choose where people stop moving, and get a diagnosis plus the sequence to increase booked calls.
            </p>
          </div>

          <div className="rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.015))] p-2 shadow-[0_28px_90px_-45px_rgba(0,0,0,0.78)]">
            <GeneratorForm />
          </div>
        </div>
      </section>
    </main>
  );
}