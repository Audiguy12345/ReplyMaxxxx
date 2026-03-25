import type { GeneratorInput, GeneratorOutput } from "@/lib/types";

function compactText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function stripTrailingPunctuation(value: string) {
  return value.replace(/[\s.!?,:;]+$/g, "").trim();
}

function toneVerb(tone: GeneratorInput["tone"]) {
  switch (tone) {
    case "professional":
      return "share";
    case "casual":
      return "send";
    default:
      return "show";
  }
}

function buildTrigger(extraContext: string, currentMessage: string) {
  const context = stripTrailingPunctuation(extraContext);
  const message = currentMessage.trim();

  if (context) {
    return context;
  }

  if (message) {
    return "Your current message reads generic, so it is easy to ignore";
  }

  return "The opener is probably the leak. If the first line feels generic, the message gets ignored before the offer gets judged";
}

function buildPositioningAngle(extraContext: string, currentMessage: string) {
  const trigger = buildTrigger(extraContext, currentMessage);

  return `${trigger}. That usually happens because the hook sounds like a pitch instead of something real. The gap is between getting seen and getting a reply. Tighten the first line around the exact problem they already notice, and that gap usually closes.`;
}

function buildOpeners(extraContext: string, currentMessage: string, tone: GeneratorInput["tone"]) {
  const action = toneVerb(tone);
  const trigger = buildTrigger(extraContext, currentMessage);

  return [
    `${trigger}. I can ${action} you one tighter version built around the part that is getting missed.`,
    `Are replies low because the first line gets skimmed, or because the conversation dies after someone answers? I can ${action} one example I would test.`,
    currentMessage.trim()
      ? "More sends probably will not fix this. The message is too polished and too easy to ignore."
      : "More sends probably will not fix this. Weak hooks waste the effort before the offer gets a real shot.",
  ];
}

function buildFollowUps() {
  return [
    "Circling back. If the message is being ignored, more volume will not solve it. I can show one version applied to your setup.",
    "Last note: this does not need to become a whole project. I can send one tailored example you can judge in under 5 minutes.",
  ];
}

function objectionSet() {
  return [
    {
      objection: "This is too expensive.",
      reply:
        "Fair. If this does not pay for itself quickly in replies or closed deals, it is not worth doing. I would rather prove it with something small first.",
    },
    {
      objection: "Bad timing right now.",
      reply:
        "Usually that means the next step needs to be smaller, not that the problem goes away. I can show a 5-minute version so you can judge it without committing to anything.",
    },
    {
      objection: "We already use something for this.",
      reply:
        "Good. That makes it easier to evaluate. I would look at the gap between what you are using and the replies or conversions you should be getting, then decide if there is real upside.",
    },
  ];
}

export function generateFallbackOutput(
  input: Pick<
    GeneratorInput,
    "audience" | "offer" | "platform" | "tone" | "extraContext" | "currentMessage"
  >
): GeneratorOutput {
  const extraContext = compactText(input.extraContext || "", 180);
  const currentMessage = compactText(input.currentMessage || "", 220);

  return {
    positioningAngle: buildPositioningAngle(extraContext, currentMessage),
    ctaRecommendation:
      "Offer one tailored example they can evaluate in under 5 minutes.",
    openers: buildOpeners(extraContext, currentMessage, input.tone),
    followUps: buildFollowUps(),
    objections: objectionSet(),
  };
}
