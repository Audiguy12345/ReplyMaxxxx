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

const REQUEST_TIMEOUT_MS = 12000;

export async function generateChatCompletion(input: string) {
  const mockResponse = process.env.OPENROUTER_MOCK_RESPONSE;

  if (mockResponse) {
    return mockResponse;
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: [
        {
          role: "system",
          content:
            "Rewrite cold outreach so it feels human, specific, and easy to reply to. Keep it short.",
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
