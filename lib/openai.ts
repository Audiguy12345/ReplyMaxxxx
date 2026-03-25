import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "your_openai_api_key_here") {
    throw new Error("Missing OPENAI_API_KEY in environment.");
  }

  return new OpenAI({ apiKey });
}
