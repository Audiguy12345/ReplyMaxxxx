import { NextRequest, NextResponse } from "next/server";

import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "@/lib/config";
import { runReplyMaxEngine } from "@/lib/engine";
import type { GenerationTelemetry } from "@/lib/generator-analysis";
import {
  applyRateLimit,
  getClientIp,
  getRateLimitHeaders,
  hasPromptInjectionSignals,
  isAllowedOrigin,
  sanitizeUserText,
} from "@/lib/security";
import type {
  GenerateApiError,
  GeneratorInput,
  GeneratorOutput,
} from "@/lib/types";

function jsonResponse(
  body: GenerateApiError | { data: GeneratorOutput } | { error: string },
  status: number,
  rateLimitHeaders?: Record<string, string>,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...rateLimitHeaders,
      ...extraHeaders,
    },
  });
}

function validateInput(body: Partial<GeneratorInput>) {
  if (!body.audience || typeof body.audience !== "string") {
    return "Target is required.";
  }
  if (!body.offer || typeof body.offer !== "string") {
    return "Offer is required.";
  }
  if (!body.currentMessage || typeof body.currentMessage !== "string") {
    return "Current message is required.";
  }
  if (!body.dropOffStage || typeof body.dropOffStage !== "string") {
    return "Drop-off stage is required.";
  }
  if (
    body.extraContext !== undefined &&
    typeof body.extraContext !== "string"
  ) {
    return "Extra context must be a string.";
  }
  return null;
}

function buildGeneratorInput(
  audience: string,
  offer: string,
  currentMessage: string,
  dropOffStage: GeneratorInput["dropOffStage"],
  platform: GeneratorInput["platform"],
  tone: GeneratorInput["tone"],
  extraContext: string
): GeneratorInput {
  return {
    audience,
    offer,
    currentMessage,
    dropOffStage,
    platform,
    tone,
    extraContext,
  };
}

type ReplyMaxMetrics = {
  total: number;
  fallback: number;
  avgScore: number;
  subtypeFrequency: Record<string, number>;
  rejectionReasons: Record<string, number>;
};

function getReplyMaxMetrics(): ReplyMaxMetrics {
  const globalMetrics = globalThis as typeof globalThis & {
    __replymax_metrics?: ReplyMaxMetrics;
  };

  globalMetrics.__replymax_metrics = globalMetrics.__replymax_metrics || {
    total: 0,
    fallback: 0,
    avgScore: 0,
    subtypeFrequency: {},
    rejectionReasons: {},
  };

  return globalMetrics.__replymax_metrics;
}

function recordTelemetryMetrics(reason: string, telemetry: GenerationTelemetry) {
  const metrics = getReplyMaxMetrics();

  metrics.total += 1;

  if (telemetry.source === "fallback") {
    metrics.fallback += 1;
  }

  metrics.avgScore =
    metrics.total === 1
      ? telemetry.humanSignalScore
      : Math.round(
          (metrics.avgScore * (metrics.total - 1) + telemetry.humanSignalScore) /
            metrics.total
        );

  metrics.subtypeFrequency[telemetry.failureSubtype] =
    (metrics.subtypeFrequency[telemetry.failureSubtype] || 0) + 1;

  if (reason !== "provider_rewrite_applied") {
    metrics.rejectionReasons[reason] =
      (metrics.rejectionReasons[reason] || 0) + 1;

    for (const failure of telemetry.hardFailures) {
      metrics.rejectionReasons[failure] =
        (metrics.rejectionReasons[failure] || 0) + 1;
    }
  }

  return metrics;
}

function logTelemetry(reason: string, telemetry: GenerationTelemetry) {
  const metrics = recordTelemetryMetrics(reason, telemetry);

  console.warn("Generate telemetry:", {
    reason,
    source: telemetry.source,
    failureType: telemetry.failureType,
    failureSubtype: telemetry.failureSubtype,
    styleLane: telemetry.styleLane,
    humanSignalScore: telemetry.humanSignalScore,
    hardFailures: telemetry.hardFailures,
    metrics,
  });
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = applyRateLimit(
    `generate:${clientIp}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS
  );
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        error: "Too many generation attempts. Please wait a minute and try again.",
        code: "rate_limited",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      429,
      rateLimitHeaders
    );
  }

  if (!isAllowedOrigin(req)) {
    return jsonResponse(
      {
        error: "This request origin is not allowed.",
        code: "forbidden_origin",
      },
      403,
      rateLimitHeaders
    );
  }

  try {
    const body = (await req.json()) as Partial<GeneratorInput>;
    const error = validateInput(body);

    if (error) {
      return jsonResponse({ error }, 400, rateLimitHeaders);
    }

    const audience = sanitizeUserText(body.audience as string, 400);
    const offer = sanitizeUserText(body.offer as string, 400);
    const currentMessage = sanitizeUserText(body.currentMessage as string, 500);
    const dropOffStage = body.dropOffStage as GeneratorInput["dropOffStage"];
    const platform = (body.platform as GeneratorInput["platform"]) || "linkedin";
    const tone = (body.tone as GeneratorInput["tone"]) || "direct";
    const extraContext = sanitizeUserText(body.extraContext || "", 500);

    if (audience.length < 20) {
      return jsonResponse(
        { error: "Be more specific about your target." },
        400,
        rateLimitHeaders
      );
    }

    if (offer.length < 20) {
      return jsonResponse(
        { error: "Describe your offer clearly (what outcome you deliver)." },
        400,
        rateLimitHeaders
      );
    }

    if (currentMessage.length < 15) {
      return jsonResponse(
        { error: "Paste the current message you want fixed." },
        400,
        rateLimitHeaders
      );
    }

    if (
      hasPromptInjectionSignals([audience, offer, currentMessage, extraContext])
    ) {
      return jsonResponse(
        {
          error:
            "Request contains instructions unrelated to outreach generation. Remove prompt-like instructions and try again.",
          code: "unsafe_input",
        },
        400,
        rateLimitHeaders
      );
    }

    const generatorInput = buildGeneratorInput(
      audience,
      offer,
      currentMessage,
      dropOffStage,
      platform,
      tone,
      extraContext
    );

    const result = await runReplyMaxEngine(generatorInput);

    logTelemetry(result.meta.reason, result.telemetry);

    return jsonResponse(
      { data: result.output },
      200,
      rateLimitHeaders,
      {
        "x-generator-source": result.meta.source,
        "x-generator-reason": result.meta.reason,
      }
    );
  } catch (error) {
    console.error("Generate route error:", error);

    const body: GenerateApiError = {
      error: "Failed to map the drop after someone responds.",
      code: "generation_failed",
    };

    return jsonResponse(body, 500, rateLimitHeaders);
  }
}

