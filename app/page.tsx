import { GeneratorForm } from "@/components/generator-form";
import { ProductMockup } from "@/components/product-mockup";

const features = [
  {
    number: "01",
    title: "Sounds human.",
    body:
      "Not optimized. Not robotic. Messages that read like a real person who actually noticed the problem.",
  },
  {
    number: "02",
    title: "Reply-rate first.",
    body:
      "This is not about sounding smart. It is about getting the person on the other end to answer.",
  },
  {
    number: "03",
    title: "Send it today.",
    body:
      "One offer. One audience. A message you can use in minutes instead of another week of guessing.",
  },
];

const emailTemplate = `Subject: quick question about your outbound

Saw you're doing outbound and thought I'd reach out. I built a small tool called ReplyMax that rewrites cold outreach so it feels more natural and gets more replies. If you want, send me one of your current messages and I'll rewrite it for free.`;

const dmTemplate = `Saw you're doing outbound. I built a small tool that rewrites cold outreach so it actually gets replies. Want me to rewrite one of yours for free?`;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white">
      <nav className="border-b border-zinc-800/80 bg-transparent">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 md:px-10 lg:px-14">
          <div className="font-editorial text-xl tracking-[-0.01em] text-white">
            ReplyMax
          </div>

          <div className="hidden items-center gap-9 md:flex">
            <a href="#how-it-works" className="text-sm text-zinc-500 transition hover:text-zinc-300">
              How it works
            </a>
            <a href="#generator" className="text-sm text-zinc-500 transition hover:text-zinc-300">
              Generate
            </a>
            <a href="#outreach" className="text-sm text-zinc-500 transition hover:text-zinc-300">
              Outreach
            </a>
          </div>

          <a
            href="#generator"
            className="border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.08em] text-white"
          >
            Try free
          </a>
        </div>
      </nav>

      <section className="border-b border-zinc-800/80">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-14 lg:py-20">
          <div>
            <div className="mb-10 max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-500">
                ReplyMax
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl lg:max-w-[700px] lg:text-6xl">
                Cold outreach that gets replies - and clients
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
                Stop sending DMs that get ignored. Generate outreach that feels specific,
                credible, and built to start real conversations.
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                Built for people actually doing outbound - not just testing AI tools.
              </p>

              <div className="mt-4 h-px w-24 bg-gradient-to-r from-zinc-400 to-transparent" />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#generator"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:opacity-90"
              >
                Generate free
              </a>
              <a
                href="#mockup"
                className="rounded-2xl border border-zinc-700 bg-zinc-900/60 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white"
              >
                See the product
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur">
                <div className="font-editorial text-3xl text-white">3 min</div>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  to first message
                </p>
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur">
                <div className="font-editorial text-3xl text-white">4</div>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  platforms supported
                </p>
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur">
                <div className="font-editorial text-3xl text-white">Free</div>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  to start, no card
                </p>
              </div>
            </div>
          </div>

          <div id="mockup">
            <ProductMockup />
            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500">
              This mockup stays screenshot-safe: filled inputs, strong outputs, and no
              warning noise when you need proof for the landing page or outreach.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-zinc-800/80">
        <div className="mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-14 lg:px-14">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              How it works
            </p>
            <h2 className="mt-3 font-editorial text-4xl tracking-[-0.02em] text-white">
              The landing page sells it. The mockup proves it. The generator does the work.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.number}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur"
              >
                <div className="font-mono-ui text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                  {feature.number}
                </div>
                <h3 className="mt-5 font-editorial text-3xl leading-tight tracking-[-0.02em] text-white">
                  {feature.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-zinc-400">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="generator" className="border-b border-zinc-800/80">
        <div className="mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-16 lg:px-14">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Try the product
            </p>
            <h2 className="mt-3 font-editorial text-4xl tracking-[-0.02em] text-white md:text-5xl">
              Put in your audience and offer. Get something sendable back.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
              This is the real generator, not a fake preview. Test the inputs, inspect the outputs, and see whether it gets you closer to replies.
            </p>
          </div>

          <GeneratorForm />
        </div>
      </section>

      <section id="outreach">
        <div className="mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-16 lg:px-14">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Outreach assets
            </p>
            <h2 className="mt-3 font-editorial text-4xl tracking-[-0.02em] text-white md:text-5xl">
              Use one email and one DM until the product earns the right to scale.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
              You do not need a full email system yet. You need a repeatable script,
              a believable product view, and a clean social preview when the link gets shared.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl backdrop-blur">
              <p className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Cold email
              </p>
              <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                {emailTemplate}
              </pre>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl backdrop-blur">
              <p className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Social DM
              </p>
              <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                {dmTemplate}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
