import type { GeneratorInput, GeneratorOutput } from "@/lib/types";

export type FailureType = "messaging" | "conversion" | "attention";

export type FailureSubtype =
  | "generic_opener"
  | "weak_relevance"
  | "no_curiosity"
  | "too_pitchy"
  | "too_safe"
  | "unclear_value"
  | "low_credibility"
  | "flat_tone";

export type FailureDetection = {
  type: FailureType;
  subtype: FailureSubtype;
  confidence: number;
  evidence: string[];
};

export type StyleLane =
  | "observant"
  | "curious"
  | "direct"
  | "pattern_match"
  | "contrarian_light";

export type DominantSignal = {
  type: "numeric_contrast";
  high: number;
  low: number;
};

export type ExtractedEvidence = {
  concreteDetails: string[];
  numericAnchors: string[];
  dominantSignal: DominantSignal | null;
  patterns: string[];
  weakInput: boolean;
};

export type HumanSignalRubric = {
  specificity: number;
  plausibility: number;
  naturalRhythm: number;
  nonTemplateFeel: number;
  openerRelevance: number;
};

export type HumanSignalScore = {
  score: number;
  reasons: string[];
  rubric: HumanSignalRubric;
};

export type ValidationResult = {
  valid: boolean;
  hardFailures: string[];
  softWarnings: string[];
  humanSignal: HumanSignalScore;
};

export type GenerationTelemetry = {
  source: "provider" | "fallback";
  failureType: FailureType;
  failureSubtype: FailureSubtype;
  styleLane: StyleLane;
  humanSignalScore: number;
  hardFailures: string[];
};

const GENERIC_PHRASES = [
  "hope you're doing well",
  "just wanted to reach out",
  "i came across",
  "thought i'd connect",
  "would love to chat",
  "help businesses like yours",
  "quick question",
  "came across your profile",
  "impressed by what you're building",
  "would love to connect",
  "quick chat",
  "circle back",
  "touch base",
];

const HARD_BANNED_PHRASES = [
  "hope you're doing well",
  "just wanted to reach out",
  "came across your profile",
  "would love to connect",
];

const VAGUE_PHRASES = [
  "something here",
  "worth looking at",
  "interesting",
  "could be improved",
  "seems like",
  "might be",
];

const WEAK_OPENER_PHRASES = [
  "something here",
  "worth asking",
  "felt worth",
  "something feels",
];

const EVIDENCE_PRIORITY: Record<string, number> = {
  traffic: 100,
  demo: 95,
  demos: 95,
  conversion: 92,
  conversions: 92,
  cta: 90,
  "landing page": 88,
  landing: 84,
  funnel: 84,
  replies: 82,
  reply: 82,
  response: 80,
  responses: 80,
  hook: 78,
  hooks: 78,
  messaging: 76,
  outreach: 74,
  copy: 72,
  saas: 48,
  founder: 36,
  founders: 36,
  recruiter: 34,
  recruiters: 34,
  agency: 32,
  agencies: 32,
  ecommerce: 30,
  shopify: 30,
  linkedin: 20,
  twitter: 20,
  reddit: 20,
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function compactText(value: string, maxLength: number) {
  return normalizeWhitespace(value).slice(0, maxLength);
}

export function stripTrailingPunctuation(value: string) {
  return value.replace(/[\s.!?,:;]+$/g, "").trim();
}

export function hashString(input: string): number {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function buildGeneratorSourceText(
  input: Pick<
    GeneratorInput,
    "audience" | "offer" | "extraContext" | "currentMessage" | "platform" | "tone"
  >
) {
  return normalizeWhitespace(
    [
      input.audience,
      input.offer,
      input.extraContext || "",
      input.currentMessage || "",
      input.platform,
      input.tone,
    ].join(" ")
  );
}

export function detectFailureType(input: string): FailureDetection {
  const text = input.toLowerCase();
  const evidence: string[] = [];

  if (
    /generic|bland|template|same as everyone|sounds ai|robotic/.test(text)
  ) {
    evidence.push("generic language complaint");
    return {
      type: "messaging",
      subtype: "generic_opener",
      confidence: 0.9,
      evidence,
    };
  }

  if (
    /no replies|ignored|no response|seen no conversion|not booking/.test(text)
  ) {
    evidence.push("poor reply/conversion signal");
    return {
      type: "conversion",
      subtype: "unclear_value",
      confidence: 0.8,
      evidence,
    };
  }

  if (
    /not grabbing attention|boring|doesn'?t hook|stops scroll|ignored instantly/.test(
      text
    )
  ) {
    evidence.push("attention weakness");
    return {
      type: "attention",
      subtype: "no_curiosity",
      confidence: 0.85,
      evidence,
    };
  }

  if (
    /convert|conversion|booking|booked|demo|sign.?up|close|closing|checkout|purchase/.test(
      text
    ) ||
    (/traffic|visitors|clicks|leads/.test(text) &&
      /low|weak|not|drop|no/.test(text))
  ) {
    evidence.push("conversion intent terms");
    return {
      type: "conversion",
      subtype: /salesy|pitch|pushy|too aggressive/.test(text)
        ? "too_pitchy"
        : "unclear_value",
      confidence: 0.78,
      evidence,
    };
  }

  if (/views|engagement|impressions|reach|click.?through|ctr/.test(text)) {
    evidence.push("attention metrics terms");
    return {
      type: "attention",
      subtype: /flat|boring|safe/.test(text) ? "flat_tone" : "no_curiosity",
      confidence: 0.72,
      evidence,
    };
  }

  if (/reply|respond|response|email|outreach|cold|dm|message/.test(text)) {
    evidence.push("messaging terms");
    return {
      type: "messaging",
      subtype: /relevance|personal|specific|custom/.test(text)
        ? "weak_relevance"
        : /pitch|salesy/.test(text)
          ? "too_pitchy"
          : "too_safe",
      confidence: 0.74,
      evidence,
    };
  }

  return {
    type: "messaging",
    subtype: "too_safe",
    confidence: 0.45,
    evidence: ["default classification"],
  };
}

export function selectStyleLane(
  seed: string,
  failureType: FailureType
): StyleLane {
  const lanesByType: Record<FailureType, StyleLane[]> = {
    messaging: ["observant", "direct", "pattern_match"],
    conversion: ["direct", "curious", "pattern_match"],
    attention: ["curious", "contrarian_light", "observant"],
  };

  const lanes = lanesByType[failureType];
  return lanes[hashString(seed) % lanes.length];
}

function extractNumericAnchors(input: string): string[] {
  const matches =
    input.match(/\b\d[\d,]*(?:\.\d+)?(?:k|m|%|\+)?\b/gi) || [];

  return [...new Set(matches.map((match) => normalizeWhitespace(match)))];
}

function textIncludesNumericAnchor(text: string, anchor: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedAnchor = anchor.toLowerCase();
  const compactAnchor = normalizedAnchor.replace(/,/g, "");
  const digitsOnly = compactAnchor.replace(/[^\dkm%+]/g, "");
  const variants = new Set([normalizedAnchor, compactAnchor, digitsOnly]);

  if (/^\d{4,}$/.test(digitsOnly) && Number(digitsOnly) % 1000 === 0) {
    variants.add(`${Number(digitsOnly) / 1000}k`);
  }

  for (const variant of variants) {
    if (variant && normalizedText.includes(variant)) {
      return true;
    }
  }

  return false;
}

function extractNumericContrast(input: string) {
  const matches = extractNumericAnchors(input)
    .map((value) => ({
      raw: value,
      numeric: Number(value.toLowerCase().replace(/,/g, "").replace(/k$/, "000").replace(/m$/, "000000")),
    }))
    .filter((item) => Number.isFinite(item.numeric) && item.numeric >= 10);

  if (matches.length >= 2) {
    return {
      high: Math.max(...matches.map((item) => item.numeric)),
      low: Math.min(...matches.map((item) => item.numeric)),
    };
  }

  return null;
}

function extractDominantSignal(input: string): DominantSignal | null {
  const numericContrast = extractNumericContrast(input);

  if (numericContrast) {
    return {
      type: "numeric_contrast",
      high: numericContrast.high,
      low: numericContrast.low,
    };
  }

  return null;
}

function extractPatterns(input: string): string[] {
  const patterns: string[] = [];
  const lower = input.toLowerCase();

  if (/struggling|not getting|low response|ignored/.test(lower)) {
    patterns.push("low response problem");
  }

  if (/linkedin|twitter|reddit|email/.test(lower)) {
    patterns.push("outbound channel");
  }

  if (/saas|agency|founder/.test(lower)) {
    patterns.push("operator type");
  }

  return patterns;
}

export function extractEvidence(input: string): ExtractedEvidence {
  const numericAnchors = extractNumericAnchors(input);
  const dominantSignal = extractDominantSignal(input);
  const matches =
    input.match(
      /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?|\d+%|\d+\+?|\$\d+[kKmM]?|linkedin|reddit|twitter|cold email|saas|agency|agencies|founder|founders|recruiter|recruiters|ecommerce|shopify|traffic|reply|replies|response|responses|demo|demos|conversion|conversions|cta|hook|hooks|landing page|landing|funnel|messaging|outreach|copy)\b/g
    ) || [];

  const normalized = matches.map((match) => normalizeWhitespace(match));
  const ranked = [...new Set(normalized)].sort((left, right) => {
    const leftPriority = EVIDENCE_PRIORITY[left.toLowerCase()] || 0;
    const rightPriority = EVIDENCE_PRIORITY[right.toLowerCase()] || 0;
    return rightPriority - leftPriority;
  });
  const concreteDetails = [...numericAnchors, ...ranked.filter((item) => !numericAnchors.includes(item))].slice(0, 4);

  const patterns = extractPatterns(input);

  return {
    concreteDetails,
    numericAnchors,
    dominantSignal,
    patterns,
    weakInput: concreteDetails.length < 1 && patterns.length < 1,
  };
}

export function hasConcreteAnchor(text: string, input: string): boolean {
  const inputTokens = input
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 4);
  const numericAnchors = extractNumericAnchors(input);
  const textLower = text.toLowerCase();

  if (numericAnchors.some((anchor) => textIncludesNumericAnchor(text, anchor))) {
    return true;
  }

  return inputTokens.some((token) => textLower.includes(token));
}

function average(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function scoreHumanSignal(text: string, input: string): HumanSignalScore {
  const reasons: string[] = [];
  const lower = text.toLowerCase();
  const evidence = extractEvidence(input);
  let scorePenalty = 0;
  let scoreBonus = 0;

  const rubric: HumanSignalRubric = {
    specificity: 100,
    plausibility: 100,
    naturalRhythm: 100,
    nonTemplateFeel: 100,
    openerRelevance: 100,
  };

  for (const phrase of GENERIC_PHRASES) {
    if (lower.includes(phrase)) {
      rubric.nonTemplateFeel -= 18;
      rubric.plausibility -= 8;
      reasons.push(`generic phrase: ${phrase}`);
    }
  }

  for (const phrase of VAGUE_PHRASES) {
    if (lower.includes(phrase)) {
      scorePenalty += 6;
      reasons.push(`vague phrasing: ${phrase}`);
    }
  }

  if (lower.includes("worth looking at")) {
    scorePenalty += 15;
    reasons.push("ai filler phrase");
  }

  for (const phrase of WEAK_OPENER_PHRASES) {
    if (lower.includes(phrase)) {
      scorePenalty += 15;
      reasons.push("weak vague opener");
    }
  }

  if (/[!?]{2,}/.test(text)) {
    rubric.naturalRhythm -= 15;
    reasons.push("overpunctuated");
  }

  if (/^[A-Z][^.]+\.\s[A-Z][^.]+\.$/.test(text.trim())) {
    scorePenalty += 15;
    rubric.naturalRhythm -= 10;
    rubric.nonTemplateFeel -= 8;
    reasons.push("too structurally perfect");
  }

  if ((text.match(/,/g) || []).length > 3) {
    scorePenalty += 10;
    rubric.naturalRhythm -= 6;
    reasons.push("over-structured sentence flow");
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 12) {
    rubric.specificity -= 12;
    rubric.plausibility -= 8;
    reasons.push("too thin to feel intentional");
  }

  if (
    /(revolutionize|unlock|supercharge|game-changing|skyrocket)/i.test(text)
  ) {
    rubric.plausibility -= 20;
    rubric.nonTemplateFeel -= 10;
    reasons.push("marketing language");
  }

  const inputWords = new Set(
    input
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 4)
  );
  const overlap = text
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => inputWords.has(word)).length;

  if (overlap < 2) {
    rubric.openerRelevance -= 20;
    rubric.specificity -= 8;
    reasons.push("weak relevance to input");
  }

  if (/^\s*(i|we)\b/i.test(text)) {
    rubric.plausibility -= 15;
    reasons.push("invalid opener pronoun");
  }

  if (!/(problem|gap|miss|losing|drop|leak|fail|issue)/i.test(text)) {
    scorePenalty += 8;
    reasons.push("low tension / no clear problem signal");
  }

  if (!/(views|clicks|likes)/i.test(text)) {
    scorePenalty += 10;
    reasons.push("not grounded in observable metric");
  }

  if (!/(but|however|instead|yet)/i.test(text)) {
    scorePenalty += 8;
    reasons.push("missing contrast/tension");
  }

  if (evidence.numericAnchors.length > 0) {
    const numericAnchorHits = evidence.numericAnchors.filter((anchor) =>
      textIncludesNumericAnchor(text, anchor)
    );

    if (numericAnchorHits.length === 0) {
      scorePenalty += 15;
      reasons.push("missed strong numeric anchor");
    }

    if (numericAnchorHits.length >= 2) {
      scoreBonus += 10;
      reasons.push("strong numeric contrast");
    }
  }

  if (evidence.dominantSignal?.type === "numeric_contrast") {
    const hasHigh = textIncludesNumericAnchor(text, evidence.dominantSignal.high.toString());
    const hasLow = textIncludesNumericAnchor(text, evidence.dominantSignal.low.toString());

    if (!hasHigh || !hasLow) {
      scorePenalty += 20;
      reasons.push("lost numeric contrast");
    }

    if (!/\d/.test(text)) {
      scorePenalty += 25;
      reasons.push("missed dominant numeric signal");
    }
  }

  if (!hasConcreteAnchor(text, input)) {
    scorePenalty += 20;
    reasons.push("no concrete anchor to input");
  }

  if (!evidence.weakInput && !hasConcreteAnchor(text, input)) {
    rubric.specificity -= 22;
    rubric.openerRelevance -= 12;
    reasons.push("missing concrete anchor");
  }

  if (text.length > 180) {
    scorePenalty += 6;
    reasons.push("too wordy for outreach");
  }

  const sentenceCount = text.split(/[.!?]+/).filter((part) => part.trim().length > 0).length;
  if (sentenceCount > 0 && wordCount / sentenceCount < 4) {
    rubric.naturalRhythm -= 10;
    reasons.push("choppy rhythm");
  }

  for (const key of Object.keys(rubric) as Array<keyof HumanSignalRubric>) {
    rubric[key] = Math.max(0, Math.min(100, rubric[key]));
  }

  return {
    score: Math.max(0, average(Object.values(rubric)) - scorePenalty + scoreBonus),
    reasons,
    rubric,
  };
}

export function hasRepetitiveStructure(openers: string[]) {
  const normalizedStarts = openers.map((opener) =>
    opener
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .slice(0, 2)
      .join(" ")
  );

  return new Set(normalizedStarts).size < openers.length;
}

export function validateOutput(text: string, input: string): ValidationResult {
  const hardFailures: string[] = [];
  const softWarnings: string[] = [];

  if (/^\s*(i|we)\b/i.test(text)) {
    hardFailures.push("opener starts with I/we");
  }

  if (
    /(book a call|schedule a call|let'?s hop on|book a demo|schedule a demo)/i.test(
      text.split("\n")[0] || text
    )
  ) {
    hardFailures.push("pitch in opener");
  }

  if (
    /(target audience|customer segment|ideal customer profile|persona)/i.test(
      text
    )
  ) {
    hardFailures.push("segment language");
  }

  for (const phrase of HARD_BANNED_PHRASES) {
    if (text.toLowerCase().includes(phrase)) {
      hardFailures.push(`banned phrase: ${phrase}`);
    }
  }

  const humanSignal = scoreHumanSignal(text, input);

  if (humanSignal.score < 80) {
    softWarnings.push(...humanSignal.reasons);
  }

  return {
    valid: hardFailures.length === 0 && humanSignal.score >= 75,
    hardFailures,
    softWarnings,
    humanSignal,
  };
}

function preservesCurrentMessageIntent(
  currentMessage: string,
  output: GeneratorOutput
) {
  const currentTokens = new Set(
    currentMessage
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 4)
  );

  const outputText = [
    output.positioningAngle,
    ...output.openers,
    ...output.followUps,
    ...output.objections.map((item) => `${item.objection} ${item.reply}`),
  ]
    .join(" ")
    .toLowerCase();

  let overlap = 0;
  currentTokens.forEach((token) => {
    if (outputText.includes(token)) overlap += 1;
  });

  return overlap >= 2;
}

export function validateGeneratorOutput(
  output: GeneratorOutput,
  input: GeneratorInput,
  detection: FailureDetection
) {
  const sourceText = buildGeneratorSourceText(input);
  const hardFailures: string[] = [];
  const softWarnings: string[] = [];
  const scoredBlocks: string[] = [
    output.positioningAngle,
    output.ctaRecommendation,
    ...output.openers,
    ...output.followUps,
    ...output.objections.map((item) => `${item.objection} ${item.reply}`),
  ];

  const fullText = scoredBlocks.join("\n");
  const aggregateHumanSignal = scoreHumanSignal(fullText, sourceText);
  const evidence = extractEvidence(sourceText);

  if (aggregateHumanSignal.score < 80) {
    softWarnings.push(...aggregateHumanSignal.reasons);
  }

  if (
    /(target audience|customer segment|ideal customer profile|persona)/i.test(
      fullText
    )
  ) {
    hardFailures.push("segment language");
  }

  for (const phrase of HARD_BANNED_PHRASES) {
    if (fullText.toLowerCase().includes(phrase)) {
      hardFailures.push(`banned phrase: ${phrase}`);
    }
  }

  if (!evidence.weakInput && !hasConcreteAnchor(fullText, sourceText)) {
    hardFailures.push("missing concrete anchor");
  }

  if (
    input.currentMessage &&
    input.currentMessage.trim().length > 0 &&
    !preservesCurrentMessageIntent(input.currentMessage, output)
  ) {
    hardFailures.push("current message intent not preserved");
  }

  let anchoredOpeners = 0;

  if (hasRepetitiveStructure(output.openers)) {
    hardFailures.push("repetitive opener structure");
  }

  output.openers.forEach((opener, index) => {
    const openerValidation = validateOutput(opener, sourceText);

    if (hasConcreteAnchor(opener, sourceText)) {
      anchoredOpeners += 1;
    }

    if (openerValidation.hardFailures.length > 0) {
      hardFailures.push(
        ...openerValidation.hardFailures.map(
          (failure) => `opener_${index + 1}: ${failure}`
        )
      );
    }

    if (openerValidation.softWarnings.length > 0) {
      softWarnings.push(
        ...openerValidation.softWarnings.map(
          (warning) => `opener_${index + 1}: ${warning}`
        )
      );
    }
  });

  if (!evidence.weakInput && anchoredOpeners < 2) {
    hardFailures.push("insufficient anchored openers");
  }

  const lower = fullText.toLowerCase();

  if (detection.type === "conversion") {
    if (!/convert|conversion|book|close|checkout|purchase|demo/.test(lower)) {
      hardFailures.push("conversion alignment missing");
    }
  } else if (detection.type === "messaging") {
    if (!/reply|response|respond|ignored|ghost|silence|opener/.test(lower)) {
      hardFailures.push("messaging alignment missing");
    }
  } else if (detection.type === "attention") {
    if (!/views|engagement|click|ctr|reach|hook|scroll/.test(lower)) {
      hardFailures.push("attention alignment missing");
    }
  }

  return {
    valid: hardFailures.length === 0 && aggregateHumanSignal.score >= 75,
    hardFailures,
    softWarnings,
    humanSignal: aggregateHumanSignal,
  };
}


















