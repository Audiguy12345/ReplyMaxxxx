export type Platform = "email" | "linkedin" | "twitter" | "instagram";
export type Tone = "professional" | "casual" | "aggressive" | "direct";

export interface GeneratorInput {
  audience: string;
  offer: string;
  platform: Platform;
  tone: Tone;
  extraContext?: string;
  currentMessage?: string;
}

export interface GeneratorOutput {
  positioningAngle: string;
  ctaRecommendation: string;
  openers: string[];
  followUps: string[];
  objections: {
    objection: string;
    reply: string;
  }[];
}

export interface GenerateApiResponse {
  data: GeneratorOutput;
}

export type GenerateApiErrorCode =
  | "quota_exhausted"
  | "misconfigured"
  | "generation_failed"
  | "rate_limited"
  | "forbidden_origin"
  | "unsafe_input";

export interface GenerateApiError {
  error: string;
  code?: GenerateApiErrorCode;
  quotaExhausted?: boolean;
  retryAfterSeconds?: number;
}