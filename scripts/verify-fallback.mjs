import { spawn } from "node:child_process";

const port = 3301;
const rootUrl = `http://127.0.0.1:${port}`;
const requestBody = {
  audience: "B2B SaaS founders with strong traffic but weak demo conversion",
  offer: "I rewrite landing page copy to increase booked demos without buying more traffic",
  platform: "linkedin",
  tone: "direct",
  extraContext: "CTA clarity and problem framing are usually the bottlenecks.",
  currentMessage:
    "Saw your team is already investing in traffic, but the CTA gets buried. Want me to send a quick rewrite idea?",
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createWrappedProviderResponse() {
  return [
    "```json",
    JSON.stringify(
      {
        positioningAngle:
          "Lead with the conversion leak: traffic is already there, but the page is not turning interest into demos.",
        ctaRecommendation:
          "Offer a quick teardown of the CTA and problem framing instead of asking for a full call.",
        openers: [
          "You already did the hard part and got traffic. The weaker link looks like demo conversion.",
          "Most teams buy more traffic before fixing the page friction that is suppressing demos.",
          "Your funnel probably does not need more visitors first. It needs a sharper path to the demo.",
        ],
        followUps: [
          "I can send one concrete rewrite for the hero and CTA so you can judge it fast.",
          "If helpful, I will point out the exact line where interest is probably dropping.",
        ],
        objections: [
          {
            objection: "We already have a copywriter.",
            reply:
              "That helps. I am not replacing the whole page, just pressure-testing the few lines that affect demo intent most.",
          },
          {
            objection: "We need more traffic, not copy edits.",
            reply:
              "More traffic helps only if the page converts the existing intent well. Fixing that first usually makes paid acquisition work harder.",
          },
          {
            objection: "Send details first.",
            reply:
              "Happy to. I can send one before-and-after rewrite so you can see whether the angle is worth discussing.",
          },
        ],
      },
      null,
      2
    ),
    "```",
    "Extra trailing text that should be ignored.",
  ].join("\n");
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const res = await fetch(`${rootUrl}/`);
      if (res.ok) {
        return;
      }
    } catch {
      // Server still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Server did not start in time. Run `npm run build` first.");
}

function shapeLooksValid(data) {
  return (
    data &&
    typeof data.positioningAngle === "string" &&
    typeof data.ctaRecommendation === "string" &&
    Array.isArray(data.openers) &&
    data.openers.length === 3 &&
    Array.isArray(data.followUps) &&
    data.followUps.length === 2 &&
    Array.isArray(data.objections) &&
    data.objections.length === 3 &&
    data.objections.every(
      (item) =>
        item &&
        typeof item.objection === "string" &&
        typeof item.reply === "string"
    )
  );
}

async function stopServer(server, stderrRef) {
  server.kill("SIGTERM");

  await new Promise((resolve) => {
    server.once("exit", () => resolve());
    setTimeout(() => {
      if (!server.killed) {
        server.kill("SIGKILL");
      }
      resolve();
    }, 2000);
  });

  if (server.exitCode && server.exitCode !== 0 && !stderrRef.value.includes("SIGTERM")) {
    process.stderr.write(stderrRef.value);
  }
}

function startServer(env) {
  const server = spawn(
    process.execPath,
    [
      "--no-experimental-webstorage",
      "./node_modules/next/dist/bin/next",
      "start",
      "--port",
      String(port),
    ],
    {
      cwd: process.cwd(),
      env,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  const stderrRef = { value: "" };
  server.stderr.on("data", (chunk) => {
    stderrRef.value += chunk.toString();
  });

  return { server, stderrRef };
}

const fallbackRun = startServer({
  ...process.env,
  OPENROUTER_API_KEY: "",
});

try {
  await waitForServer();

  const pageRes = await fetch(`${rootUrl}/`);
  assert(pageRes.ok, `Home page failed with status ${pageRes.status}`);

  const apiRes = await fetch(`${rootUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const payload = await apiRes.json();

  assert(apiRes.ok, `API returned ${apiRes.status}`);
  assert(
    apiRes.headers.get("x-generator-source") === "fallback",
    "Expected fallback source when OPENROUTER_API_KEY is missing."
  );
  assert(
    apiRes.headers.get("x-generator-reason") === "provider_request_failed",
    "Expected fallback reason header for provider failure."
  );
  assert(payload && shapeLooksValid(payload.data), "Fallback payload shape is invalid.");

  await stopServer(fallbackRun.server, fallbackRun.stderrRef);

  const providerRun = startServer({
    ...process.env,
    OPENROUTER_API_KEY: "mock-key",
    OPENROUTER_MOCK_RESPONSE: createWrappedProviderResponse(),
  });

  await waitForServer();

  const providerRes = await fetch(`${rootUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const providerPayload = await providerRes.json();

  assert(providerRes.ok, `Provider-path API returned ${providerRes.status}`);
  assert(
    providerRes.headers.get("x-generator-source") === "provider",
    "Expected provider source for wrapped mock response."
  );
  assert(
    providerRes.headers.get("x-generator-parse-mode") === "recovered",
    "Expected recovered parse mode for wrapped mock response."
  );
  assert(
    providerPayload && shapeLooksValid(providerPayload.data),
    "Recovered provider payload shape is invalid."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        source: apiRes.headers.get("x-generator-source"),
        fallbackReason: apiRes.headers.get("x-generator-reason"),
        pageStatus: pageRes.status,
        apiStatus: apiRes.status,
        recoveredSource: providerRes.headers.get("x-generator-source"),
        recoveredParseMode: providerRes.headers.get("x-generator-parse-mode"),
      },
      null,
      2
    )
  );

  await stopServer(providerRun.server, providerRun.stderrRef);
} finally {
  await stopServer(fallbackRun.server, fallbackRun.stderrRef);
}
