import {
  buildGeneratorSourceText,
  detectFailureType,
  scoreSendability,
  validateOutput,
  type GenerationTelemetry,
} from "@/lib/generator-analysis";
import { generateFallbackOutput } from "@/lib/generator-fallback";
import {
  buildProviderRewritePrompt,
  generateChatCompletion,
  safeParseProviderRewrite,
  type ProviderRewritePayload,
} from "@/lib/openai";
import type { GeneratorInput, GeneratorOutput } from "@/lib/types";

const PROVIDER_SENDABILITY_THRESHOLD = 78;

export type EngineResult = {
  output: GeneratorOutput;
  telemetry: GenerationTelemetry;
  meta: {
    source: "provider" | "fallback";
    reason: string;
  };
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function rankRewriteSet(candidates: string[], input: GeneratorInput) {
  const sourceText = buildGeneratorSourceText(input);
  const ranked = [...new Set(candidates.map((candidate) => normalizeWhitespace(candidate)).filter(Boolean))]
    .map((text) => ({
      text,
      score: scoreSendability(text, sourceText).score,
    }))
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.text)
    .slice(0, 3);

  return {
    primaryRewrite: ranked[0],
    angleVariations: ranked.slice(1, 3),
  };
}

function preservesCurrentMessageIntent(currentMessage: string, rewrite: string) {
  const currentTokens = new Set(
    currentMessage
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 4)
  );
  const rewriteLower = rewrite.toLowerCase();
  let overlap = 0;

  currentTokens.forEach((token) => {
    if (rewriteLower.includes(token)) {
      overlap += 1;
    }
  });

  return overlap >= 2;
}

function getProviderCandidates(payload: ProviderRewritePayload) {
  return [
    payload.primaryRewrite,
    ...payload.angleVariations,
    payload.followUp,
  ];
}

function candidatePassesQuality(text: string, sourceText: string) {
  const validation = validateOutput(text, sourceText);
  const sendability = scoreSendability(text, sourceText);

  return {
    valid:
      validation.valid && sendability.score >= PROVIDER_SENDABILITY_THRESHOLD,
    validation,
    sendability,
  };
}

function classifyProviderResponse(raw: string) {
  try {
    JSON.parse(raw);
  } catch {
    return {
      payload: null,
      reason: "provider_rewrite_invalid_json",
    };
  }

  const payload = safeParseProviderRewrite(raw);

  if (!payload) {
    return {
      payload: null,
      reason: "provider_rewrite_shape_invalid",
    };
  }

  return {
    payload,
    reason: null,
  };
}

function mergeProviderFields(
  baseOutput: GeneratorOutput,
  payload: ProviderRewritePayload,
  input: GeneratorInput
): GeneratorOutput {
  const ranked = rankRewriteSet(
    [payload.primaryRewrite, ...payload.angleVariations],
    input
  );

  return {
    ...baseOutput,
    primaryRewrite: ranked.primaryRewrite,
    angleVariations: ranked.angleVariations,
    followUp: payload.followUp,
  };
}

export async function runReplyMaxEngine(
  input: GeneratorInput
): Promise<EngineResult> {
  const sourceText = buildGeneratorSourceText(input);
  const detection = detectFailureType(sourceText);
  const fallback = generateFallbackOutput(input, detection);

  try {
    const prompt = buildProviderRewritePrompt(input, detection);
    const raw = await generateChatCompletion(prompt, {
      systemPrompt: "Return only compact JSON. No markdown. No explanation.",
    });
    const parsed = classifyProviderResponse(raw);

    if (!parsed.payload) {
      return {
        output: fallback.output,
        telemetry: fallback.telemetry,
        meta: {
          source: "fallback",
          reason: parsed.reason || "provider_rewrite_failed",
        },
      };
    }

    const candidates = getProviderCandidates(parsed.payload);
    const qualityResults = candidates.map((text) =>
      candidatePassesQuality(text, sourceText)
    );

    if (!qualityResults.every((result) => result.valid)) {
      return {
        output: fallback.output,
        telemetry: fallback.telemetry,
        meta: {
          source: "fallback",
          reason: "provider_rewrite_quality_rejected",
        },
      };
    }

    const mergedOutput = mergeProviderFields(fallback.output, parsed.payload, input);

    if (!preservesCurrentMessageIntent(input.currentMessage, mergedOutput.primaryRewrite)) {
      return {
        output: fallback.output,
        telemetry: fallback.telemetry,
        meta: {
          source: "fallback",
          reason: "provider_rewrite_quality_rejected",
        },
      };
    }

    const primaryValidation = validateOutput(mergedOutput.primaryRewrite, sourceText);

    return {
      output: mergedOutput,
      telemetry: {
        source: "provider",
        failureType: detection.type,
        failureSubtype: detection.subtype,
        styleLane: fallback.telemetry.styleLane,
        humanSignalScore: primaryValidation.humanSignal.score,
        hardFailures: primaryValidation.hardFailures,
      },
      meta: {
        source: "provider",
        reason: "provider_rewrite_applied",
      },
    };
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "No AI provider is configured."
        ? "provider_unavailable"
        : "provider_rewrite_failed";

    if (reason === "provider_rewrite_failed") {
      console.warn("Provider rewrite failed:", error);
    }

    return {
      output: fallback.output,
      telemetry: fallback.telemetry,
      meta: {
        source: "fallback",
        reason,
      },
    };
  }
}
