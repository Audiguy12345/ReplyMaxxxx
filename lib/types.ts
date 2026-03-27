export type Platform = "email" | "linkedin" | "twitter" | "instagram";
export type Tone = "professional" | "casual" | "aggressive" | "direct";
export type DropOffStage =
  | "views_to_clicks"
  | "clicks_to_replies"
  | "replies_to_booked_calls";

export interface GeneratorInput {
  audience: string;
  offer: string;
  currentMessage: string;
  dropOffStage: DropOffStage;
  platform: Platform;
  tone: Tone;
  extraContext?: string;
}

export interface GeneratorOutput {
  problem: string;
  why: string;
  whatIsHappening: string;
  primaryRewrite: string;
  angleVariations: string[];
  followUp: string;
  objectionHandling: {
    objection: string;
    reply: string;
  }[];
  cta: string;
  whatChanged: string;
  expectedImpact: string;
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