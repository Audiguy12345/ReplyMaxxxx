import type { GeneratorInput, GeneratorOutput } from "@/lib/types";

type FailureType = "messaging" | "conversion" | "attention";

function compactText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function stripTrailingPunctuation(value: string) {
  return value.replace(/[\s.!?,:;]+$/g, "").trim();
}

function detectFailureType(
  targetAudience: string,
  offer: string,
  extraContext: string
): FailureType {
  const input = `${targetAudience} ${offer} ${extraContext}`.toLowerCase();

  if (
    /convert|conversion|booking|booked|demo|sign.?up|close|closing|checkout|purchase/.test(
      input
    ) ||
    (/traffic|visitors|clicks|leads/.test(input) &&
      /low|weak|not|drop|no/.test(input))
  ) {
    return "conversion";
  }

  if (/reply|respond|response|email|outreach|cold|dm|message/.test(input)) {
    return "messaging";
  }

  if (/views|engagement|impressions|reach|click.?through|ctr/.test(input)) {
    return "attention";
  }

  return "messaging";
}

function platformWord(platform: GeneratorInput["platform"]) {
  switch (platform) {
    case "linkedin":
      return "message";
    case "email":
      return "email";
    case "twitter":
      return "DM";
    default:
      return "message";
  }
}

function toneSet(tone: GeneratorInput["tone"]) {
  switch (tone) {
    case "professional":
      return {
        soften: "Usually",
        close: "Worth looking at.",
        objectionLead: "Fair.",
      };
    case "casual":
      return {
        soften: "Usually",
        close: "Probably worth fixing.",
        objectionLead: "Fair.",
      };
    default:
      return {
        soften: "Usually",
        close: "Worth fixing.",
        objectionLead: "Fair.",
      };
  }
}

function cleanedContext(input: GeneratorInput) {
  return {
    extraContext: compactText(input.extraContext || "", 180),
    currentMessage: compactText(input.currentMessage || "", 220),
    offer: compactText(input.offer || "", 140),
    audience: compactText(input.audience || "", 120),
  };
}

function buildMessagingFallback(input: GeneratorInput): GeneratorOutput {
  const { extraContext, currentMessage } = cleanedContext(input);
  const tone = toneSet(input.tone);
  const channel = platformWord(input.platform);

  const trigger =
    stripTrailingPunctuation(extraContext) ||
    (currentMessage
      ? "The current message reads polished but easy to ignore"
      : `The ${channel} is probably losing people in the first line`);

  return {
    positioningAngle: `${trigger}. Usually that means the opener sounds like a pitch, so the offer never gets a real chance. The gap is between sending volume and getting actual replies.`,

    ctaRecommendation:
      "Lead with the visible problem first, then ask one direct question that is easy to answer.",

    openers: [
      `${trigger}. That is usually where replies die.`,
      `Are people ignoring the first line, or replying and then dropping off?`,
      `More sends will not fix a weak opener. The message is getting skipped before the offer lands.`,
    ],

    followUps: [
      `If reply rates are low, the issue is usually the first line rather than volume. ${tone.close}`,
      `If the conversation keeps dying, the message is probably framing the wrong problem.`,
    ],

    objections: [
      {
        objection: "This is too expensive.",
        reply: `${tone.objectionLead} If better messaging does not turn into more replies or more closed deals, it is not worth paying for.`,
      },
      {
        objection: "Bad timing right now.",
        reply:
          "That usually means the next step needs to be smaller, not that the problem disappears.",
      },
      {
        objection: "We already use something for this.",
        reply:
          "Using something is not the same as getting the result. The gap usually shows up in reply quality and conversion.",
      },
    ],
  };
}

function buildConversionFallback(input: GeneratorInput): GeneratorOutput {
  const { extraContext } = cleanedContext(input);
  const tone = toneSet(input.tone);

  const trigger =
    stripTrailingPunctuation(extraContext) ||
    "Traffic is showing up, but the conversion point is where it is breaking";

  return {
    positioningAngle: `${trigger}. Usually that means the page, CTA, or decision step is creating friction. The gap is between getting attention and getting someone to book, buy, or sign up.`,

    ctaRecommendation:
      "Call out the specific friction point first, then ask one question that makes them look at the conversion step differently.",

    openers: [
      `${trigger}. That usually means the decision point is weaker than the traffic.`,
      `Are people landing and leaving, or getting interested and then not booking?`,
      `More traffic will not fix a weak conversion step. Something in the page is stopping the decision.`,
    ],

    followUps: [
      `If clicks are there but bookings are not, the issue is usually friction, not traffic. ${tone.close}`,
      "When demos or signups stay flat, the offer is often reaching the page but not surviving the decision moment.",
    ],

    objections: [
      {
        objection: "We need more traffic first.",
        reply:
          "More traffic usually amplifies the leak. If the page is not converting now, extra volume mostly wastes more effort.",
      },
      {
        objection: "The page is already fine.",
        reply:
          "A page can look fine and still lose decisions. The metric matters more than the design opinion.",
      },
      {
        objection: "We already run tests.",
        reply:
          "Most tests change surface details. The bigger issue is usually where the decision gets stuck.",
      },
    ],
  };
}

function buildAttentionFallback(input: GeneratorInput): GeneratorOutput {
  const { extraContext } = cleanedContext(input);
  const tone = toneSet(input.tone);

  const trigger =
    stripTrailingPunctuation(extraContext) ||
    "The content is getting seen, but not pulling enough response";

  return {
    positioningAngle: `${trigger}. Usually that means the hook or packaging is too flat to make people stop. The gap is between being visible and getting clicks, engagement, or real interest.`,

    ctaRecommendation:
      "Lead with the packaging problem first, then ask one direct question about what people are actually reacting to.",

    openers: [
      `${trigger}. That usually points to a weak hook, not a lack of effort.`,
      `Are people seeing it and scrolling past, or clicking and then losing interest?`,
      `More posting will not fix weak packaging. The hook is not giving people a reason to stop.`,
    ],

    followUps: [
      `If views are there but clicks are flat, the packaging is probably doing less work than it should. ${tone.close}`,
      "When engagement stays low, the problem is often not the content itself but how it gets presented first.",
    ],

    objections: [
      {
        objection: "The content is good already.",
        reply:
          "Good content still gets ignored when the hook is weak. Quality alone does not force attention.",
      },
      {
        objection: "Algorithms are the real problem.",
        reply:
          "Algorithm issues are real, but weak hooks usually make the problem worse before the algorithm even matters.",
      },
      {
        objection: "We already post consistently.",
        reply:
          "Consistency helps distribution. It does not fix content that people keep skipping.",
      },
    ],
  };
}

export function generateFallbackOutput(
  input: Pick<
    GeneratorInput,
    "audience" | "offer" | "platform" | "tone" | "extraContext" | "currentMessage"
  >,
  failureType?: FailureType
): GeneratorOutput {
  const resolvedFailureType =
    failureType ||
    detectFailureType(input.audience, input.offer, input.extraContext || "");

  if (resolvedFailureType === "conversion") {
    return buildConversionFallback(input as GeneratorInput);
  }

  if (resolvedFailureType === "attention") {
    return buildAttentionFallback(input as GeneratorInput);
  }

  return buildMessagingFallback(input as GeneratorInput);
}
