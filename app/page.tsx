import { GeneratorForm } from "@/components/generator-form";
import { ProductMockup } from "@/components/product-mockup";

const features = [
  {
    number: "01",
    title: "Sounds sent.",
    body:
      "Pattern-interrupt openers, tighter follow-ups, and objection replies that sound like a real operator, not a demo prompt.",
  },
  {
    number: "02",
    title: "Reply-rate first.",
    body:
      "The goal is not to sound clever. The goal is to reduce friction, create curiosity, and make the next step easy to take.",
  },
  {
    number: "03",
    title: "Use it now.",
    body:
      "Real inputs, real outputs, and a product mockup you can actually point people to when the outreach lands.",
  },
];

const heroStats = [
  {
    label: "Openers",
    value: "3",
    detail: "Pattern interrupts that feel context-aware and sendable.",
  },
  {
    label: "Follow-ups",
    value: "2",
    detail: "Built to keep momentum without sounding needy or vague.",
  },
  {
    label: "Objection replies",
    value: "3",
    detail: "Commercial answers for price, timing, trust, and skepticism.",
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
              Generate
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
                  Cold outreach that gets replies.
                  <br />
                  Fewer wasted sends.
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                  Drop in your audience, offer, and rough message. ReplyMax turns it into
                  sharper openers, follow-ups, objection replies, and a positioning angle
                  you can actually send.
                </p>

                <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-500">
                  Built for people actually doing outbound, not just testing AI tools.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <a
                    href="#generator"
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:opacity-90"
                  >
                    Generate free
                  </a>
                  <a
                    href="#product-frame"
                    className="rounded-2xl border border-zinc-700 bg-zinc-900/60 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white"
                  >
                    See the product
                  </a>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/8 bg-white/[0.035] p-5 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.7)]"
                  >
                    <div className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      {item.label}
                    </div>
                    <div className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white">
                      {item.value}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-zinc-400">{item.detail}</p>
                  </div>
                ))}
              </div>
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
                Tight preview. Real enough to sell the next step.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-zinc-400">
                The outreach gets attention. The mockup gives it somewhere credible to
                land. Clear value, believable framing, and no bloated fake-product noise.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                <div className="font-editorial text-3xl text-white">3 min</div>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  to first message
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                <div className="font-editorial text-3xl text-white">4</div>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  platforms supported
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-black/20 p-5">
                <div className="font-editorial text-3xl text-white">Free</div>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  to start, no card
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-white/8 bg-[radial-gradient(circle_at_top_right,_rgba(148,163,184,0.12),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.025),_rgba(255,255,255,0.015))] p-5 shadow-[0_28px_90px_-45px_rgba(0,0,0,0.78)] sm:p-7">
            <ProductMockup />
            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-500">
              Use this as the visual support behind your outreach. It is screenshot-safe,
              simple, and grounded enough to make the DM or email feel credible.
            </p>
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
              The landing page sells it. The generator does the work.
            </h2>
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

      <section id="generator">
        <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          <div className="mb-10 max-w-3xl">
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Try the product
            </p>
            <h2 className="font-editorial mt-4 text-4xl tracking-[-0.03em] text-white sm:text-5xl">
              Put in your audience and offer. Get something sendable back.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
              This is the real generator, not a fake preview. Test the inputs, inspect the
              outputs, and see whether it gets you closer to replies.
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
