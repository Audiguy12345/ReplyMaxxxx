import OpenAI from "openai";

import type { FailureDetection } from "@/lib/generator-analysis";
import type { GeneratorInput } from "@/lib/types";

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type ChatCompletionOptions = {
  systemPrompt?: string;
};

export type ProviderRewritePayload = {
  primaryRewrite: string;
  angleVariations: [string, string];
  followUp: string;
};

const REQUEST_TIMEOUT_MS = 12000;
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct:free";
const DEFAULT_SYSTEM_PROMPT =
  "Return only compact JSON. No markdown. No explanation.";

async function requestOpenAI(input: string, systemPrompt: string) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: REQUEST_TIMEOUT_MS,
  });

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: systemPrompt,
          },
        ],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: input }],
      },
    ],
  });

  const output = response.output_text?.trim();

  if (!output) {
    throw new Error("OpenAI returned an empty response.");
  }

  return output;
}

async function requestOpenRouter(input: string, systemPrompt: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("No AI provider is configured.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: input,
        },
      ],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const data = (await response.json()) as OpenRouterResponse;
  const output = data.choices?.[0]?.message?.content || "No output";

  if (!response.ok) {
    throw new Error(data.error?.message || output);
  }

  return output;
}

function formatDropOffStage(stage: GeneratorInput["dropOffStage"]) {
  switch (stage) {
    case "views_to_clicks":
      return "views -> clicks";
    case "clicks_to_replies":
      return "clicks -> replies";
    case "replies_to_booked_calls":
      return "replies -> booked calls";
    default:
      return stage;
  }
}

export function buildProviderRewritePrompt(
  input: GeneratorInput,
  detection: FailureDetection
) {
  return `
You are fixing a broken outbound message.

Audience:
${input.audience}

Offer:
${input.offer}

Platform:
${input.platform}

Tone:
${input.tone}

Drop-off stage:
${formatDropOffStage(input.dropOffStage)}

Detected failure:
${detection.type} / ${detection.subtype}

Original message:
${input.currentMessage}

Extra context:
${input.extraContext || "none"}

Your job:
- Rewrite the message so it fixes the detected failure
- Keep it short, specific, and sendable
- Do not sound like a marketer or AI assistant
- Do not use generic openers
- Do not start with I or we
- Do not pitch in the opener
- Use concrete details if they exist
- If numeric contrast exists, use it
- Make the next action feel obvious

Return ONLY valid JSON in this shape:
{
  "primaryRewrite": "string",
  "angleVariations": ["string", "string"],
  "followUp": "string"
}
`.trim();
}

export function safeParseProviderRewrite(raw: string): ProviderRewritePayload | null {
  try {
    const parsed = JSON.parse(raw) as ProviderRewritePayload;

    if (
      !parsed ||
      typeof parsed.primaryRewrite !== "string" ||
      !Array.isArray(parsed.angleVariations) ||
      parsed.angleVariations.length !== 2 ||
      parsed.angleVariations.some((item) => typeof item !== "string") ||
      typeof parsed.followUp !== "string"
    ) {
      return null;
    }

    return {
      primaryRewrite: parsed.primaryRewrite,
      angleVariations: [
        parsed.angleVariations[0],
        parsed.angleVariations[1],
      ],
      followUp: parsed.followUp,
    };
  } catch {
    return null;
  }
}

export async function generateChatCompletion(
  input: string,
  options: ChatCompletionOptions = {}
) {
  const mockResponse = process.env.OPENROUTER_MOCK_RESPONSE;

  if (mockResponse) {
    return mockResponse;
  }

  const systemPrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;

  if (process.env.OPENAI_API_KEY) {
    return requestOpenAI(input, systemPrompt);
  }

  return requestOpenRouter(input, systemPrompt);
}
