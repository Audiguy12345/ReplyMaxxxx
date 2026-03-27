import { spawn } from "node:child_process";

const port = 3301;
const rootUrl = `http://127.0.0.1:${port}`;
const requestBody = {
  audience: "B2B SaaS founders getting clicks on LinkedIn but not enough replies from outbound.",
  offer: "I rewrite outbound messaging to turn more qualified conversations into booked calls from the same demand.",
  platform: "linkedin",
  tone: "direct",
  extraContext: "The leak usually happens after the click when the message gets too generic.",
  dropOffStage: "clicks_to_replies",
  currentMessage:
    "You are already getting clicks, but the message after the click is not giving people a reason to reply.",
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createValidProviderResponse() {
  return JSON.stringify({
    primaryRewrite:
      "You're getting clicks, but almost no one replies. That's the leak right after the click.",
    angleVariations: [
      "You're getting clicks, but replies drop right after the click. That's where it breaks.",
      "Clicks happen, but replies drop right after the click. That's the leak to fix.",
    ],
    followUp:
      "Clicks are there, but replies drop right after the click. That's the leak to fix.",
  });
}

function createLowQualityProviderResponse() {
  return JSON.stringify({
    primaryRewrite: "I wanted to reach out because your message could be improved.",
    angleVariations: [
      "We help teams like yours get better replies.",
      "This seems like it needs a closer look.",
    ],
    followUp: "Would love to chat about this.",
  });
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
    typeof data.problem === "string" &&
    typeof data.why === "string" &&
    typeof data.whatIsHappening === "string" &&
    typeof data.primaryRewrite === "string" &&
    Array.isArray(data.angleVariations) &&
    data.angleVariations.length === 2 &&
    typeof data.followUp === "string" &&
    Array.isArray(data.objectionHandling) &&
    data.objectionHandling.length === 3 &&
    data.objectionHandling.every(
      (item) =>
        item &&
        typeof item.objection === "string" &&
        typeof item.reply === "string"
    ) &&
    typeof data.cta === "string" &&
    typeof data.whatChanged === "string" &&
    typeof data.expectedImpact === "string"
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

async function runScenario(envOverrides) {
  const run = startServer({
    ...process.env,
    OPENAI_API_KEY: "",
    OPENROUTER_API_KEY: "",
    OPENROUTER_MOCK_RESPONSE: "",
    ...envOverrides,
  });

  try {
    await waitForServer();

    const res = await fetch(`${rootUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    return {
      status: res.status,
      source: res.headers.get("x-generator-source"),
      reason: res.headers.get("x-generator-reason"),
      payload: await res.json(),
    };
  } finally {
    await stopServer(run.server, run.stderrRef);
  }
}

const pageRun = startServer({
  ...process.env,
  OPENAI_API_KEY: "",
  OPENROUTER_API_KEY: "",
  OPENROUTER_MOCK_RESPONSE: "",
});

try {
  await waitForServer();

  const pageRes = await fetch(`${rootUrl}/`);
  assert(pageRes.ok, `Home page failed with status ${pageRes.status}`);

  await stopServer(pageRun.server, pageRun.stderrRef);

  const fallbackResult = await runScenario({});
  assert(fallbackResult.status === 200, `Fallback API returned ${fallbackResult.status}`);
  assert(fallbackResult.source === "fallback", "Expected fallback source when no provider key is configured.");
  assert(fallbackResult.reason === "provider_unavailable", "Expected provider_unavailable when no provider key is configured.");
  assert(shapeLooksValid(fallbackResult.payload.data), "Fallback payload shape is invalid.");

  const validProviderResult = await runScenario({
    OPENROUTER_API_KEY: "mock-key",
    OPENROUTER_MOCK_RESPONSE: createValidProviderResponse(),
  });
  assert(validProviderResult.status === 200, `Valid provider API returned ${validProviderResult.status}`);
  assert(validProviderResult.source === "provider", "Expected provider source when provider JSON is accepted.");
  assert(validProviderResult.reason === "provider_rewrite_applied", "Expected provider_rewrite_applied for valid provider JSON.");
  assert(shapeLooksValid(validProviderResult.payload.data), "Valid provider payload shape is invalid.");
  assert(validProviderResult.payload.data.problem === fallbackResult.payload.data.problem, "Problem should stay deterministic.");
  assert(validProviderResult.payload.data.why === fallbackResult.payload.data.why, "Why should stay deterministic.");
  assert(validProviderResult.payload.data.whatIsHappening === fallbackResult.payload.data.whatIsHappening, "WhatIsHappening should stay deterministic.");
  assert(validProviderResult.payload.data.whatChanged === fallbackResult.payload.data.whatChanged, "WhatChanged should stay deterministic.");
  assert(validProviderResult.payload.data.expectedImpact === fallbackResult.payload.data.expectedImpact, "ExpectedImpact should stay deterministic.");

  const providerRewriteSet = new Set([
    "You're getting clicks, but almost no one replies. That's the leak right after the click.",
    "You're getting clicks, but replies drop right after the click. That's where it breaks.",
    "Clicks happen, but replies drop right after the click. That's the leak to fix.",
  ]);
  const returnedRewriteSet = [
    validProviderResult.payload.data.primaryRewrite,
    ...validProviderResult.payload.data.angleVariations,
  ];
  assert(
    returnedRewriteSet.every((text) => providerRewriteSet.has(text)),
    "Rewrite set should come entirely from the accepted provider payload after reranking."
  );
  assert(
    validProviderResult.payload.data.followUp ===
      "Clicks are there, but replies drop right after the click. That's the leak to fix.",
    "Follow-up should come from the accepted provider payload."
  );

  const invalidJsonResult = await runScenario({
    OPENROUTER_API_KEY: "mock-key",
    OPENROUTER_MOCK_RESPONSE: "```json\n{\"primaryRewrite\":\"bad\"}\n```",
  });
  assert(invalidJsonResult.status === 200, `Invalid JSON API returned ${invalidJsonResult.status}`);
  assert(invalidJsonResult.source === "fallback", "Expected fallback source for invalid provider JSON.");
  assert(invalidJsonResult.reason === "provider_rewrite_invalid_json", "Expected provider_rewrite_invalid_json for markdown-wrapped provider output.");

  const lowQualityResult = await runScenario({
    OPENROUTER_API_KEY: "mock-key",
    OPENROUTER_MOCK_RESPONSE: createLowQualityProviderResponse(),
  });
  assert(lowQualityResult.status === 200, `Low-quality provider API returned ${lowQualityResult.status}`);
  assert(lowQualityResult.source === "fallback", "Expected fallback source for low-quality provider output.");
  assert(lowQualityResult.reason === "provider_rewrite_quality_rejected", "Expected provider_rewrite_quality_rejected for weak provider output.");

  console.log(
    JSON.stringify(
      {
        ok: true,
        pageStatus: pageRes.status,
        fallbackReason: fallbackResult.reason,
        providerReason: validProviderResult.reason,
        invalidJsonReason: invalidJsonResult.reason,
        lowQualityReason: lowQualityResult.reason,
        primaryRewrite: validProviderResult.payload.data.primaryRewrite,
      },
      null,
      2
    )
  );
} finally {
  await stopServer(pageRun.server, pageRun.stderrRef);
}
