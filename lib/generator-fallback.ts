import {
  buildGeneratorSourceText,
  detectFailureType,
  extractEvidence,
  hashString,
  scoreHumanSignal,
  selectStyleLane,
  stripTrailingPunctuation,
  type FailureDetection,
  type FailureSubtype,
  type FailureType,
  type GenerationTelemetry,
  type StyleLane,
} from "@/lib/generator-analysis";
import type { GeneratorInput, GeneratorOutput } from "@/lib/types";

type FallbackContext = {
  subtype: FailureSubtype;
  styleLane: StyleLane;
};

type FallbackResult = {
  output: GeneratorOutput;
  telemetry: GenerationTelemetry;
};

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
        close: "Needs a closer look.",
        objectionLead: "Fair.",
      };
    case "casual":
      return {
        close: "Probably needs fixing.",
        objectionLead: "Fair.",
      };
    default:
      return {
        close: "Worth fixing.",
        objectionLead: "Fair.",
      };
  }
}

function buildFallbackDiagnosis(
  failureType: FailureType,
  subtype: FailureSubtype,
  anchor: string
) {
  const detail = anchor || "the current setup";

  if (failureType === "conversion") {
    switch (subtype) {
      case "too_pitchy":
        return `${detail} is creating pressure before the decision feels safe, so interest leaks before anyone books.`;
      case "low_credibility":
        return `${detail} is asking for trust too early, so the value never gets a fair read.`;
      default:
        return `${detail} is getting attention, but the value is still too blurry at the decision step, so demos or signups stall.`;
    }
  }

  if (failureType === "attention") {
    switch (subtype) {
      case "flat_tone":
        return `${detail} is visible, but the packaging is too flat to earn a stop, so reach turns into passive scrolling.`;
      default:
        return `${detail} is showing up, but only a small slice is signaling back, so the drop is happening before intent turns into action.`;
    }
  }

  switch (subtype) {
    case "generic_opener":
      return `${detail} reads like it could go to anyone, so the opener gets filtered before the real point lands.`;
    case "weak_relevance":
      return `${detail} is saying something valid, but not in a way that proves it noticed this specific situation.`;
    case "too_pitchy":
      return `${detail} is leaning into the offer before earning attention, so the message feels like outreach on contact.`;
    default:
      return `${detail} is probably being skipped because it sounds careful instead of observant, so the reply window closes early.`;
  }
}

function buildFallbackRewrite(
  failureType: FailureType,
  subtype: FailureSubtype,
  styleLane: StyleLane,
  evidence: ReturnType<typeof extractEvidence>,
  input: GeneratorInput
) {
  const channel = platformWord(input.platform);
  const { close } = toneSet(input.tone);
  const [anchor, anchor2] = evidence.concreteDetails;
  const pair = anchor && anchor2 ? `${anchor} and ${anchor2}` : anchor || anchor2 || channel;

  if (failureType === "conversion") {
    if (subtype === "too_pitchy") {
      return {
        observant: `${pair} suggests the page is asking for too much too early. Pull the pressure out of the decision step first. ${close}`,
        curious: `The gap is proof before the demo ask. ${close}`,
        direct: `The leak looks like premature pitch, not lack of interest. Soften the ask and sharpen the proof. ${close}`,
        pattern_match: `Seen this pattern before: traffic is qualified, then the page rushes the sale and loses intent. ${close}`,
        contrarian_light: `The answer probably is not more traffic. It is less pressure at the moment of choice. ${close}`,
      }[styleLane];
    }

    if (subtype === "low_credibility") {
      return {
        observant: `${pair} reads like trust is lagging behind interest. Add proof before the ask gets bigger. ${close}`,
        curious: `The better question is what would make the decision feel safer here before anyone books. ${close}`,
        direct: `Trust is the gap here. Evidence has to show up before the ask. ${close}`,
        pattern_match: `When bookings stay flat with decent traffic, the missing piece often is credibility, not volume. ${close}`,
        contrarian_light: `A stronger CTA usually does less here than a stronger proof layer. ${close}`,
      }[styleLane];
    }

    return {
      observant: `${pair} points to friction after interest. The drop is after attention, not before it. ${close}`,
      curious: `The drop is between attention and booking. Is that where they hesitate? ${close}`,
      direct: `The drop is between attention and booking. More traffic will not fix that first. ${close}`,
      pattern_match: `Seen this pattern before: the page gets qualified traffic, but the value and CTA do not survive the moment of choice. ${close}`,
      contrarian_light: `The offer may be fine. The path to saying yes is what looks expensive here. ${close}`,
    }[styleLane];
  }

  if (failureType === "attention") {
    if (subtype === "flat_tone") {
      return {
        observant: `${pair} feels too polite on entry. The first beat needs more contrast to earn a stop. ${close}`,
        curious: `The hook is not earning the stop yet. ${close}`,
        direct: `The packaging is too flat. More posting will not compensate for a soft first impression. ${close}`,
        pattern_match: `This pattern usually is not bad content. It is content introduced with too little tension. ${close}`,
        contrarian_light: `Polished hooks often underperform when the real issue is lack of bite. ${close}`,
      }[styleLane];
    }

    return {
      observant: `${pair} suggests the work is being seen but not felt fast enough. The hook has to earn the stop sooner. ${close}`,
      curious: `People are seeing it. The drop is right after the first beat. ${close}`,
      direct: `Posting more is not the answer if the packaging stays flat. The first impression has to create tension immediately. ${close}`,
      pattern_match: `This usually is not a content-quality problem. It is a packaging problem that shows up before the substance gets a chance. ${close}`,
      contrarian_light: `Better content often underperforms when it is introduced too politely. A stronger hook usually matters more than another post. ${close}`,
    }[styleLane];
  }

  if (subtype === "generic_opener") {
    return {
      observant: `${pair} makes this feel like the first line could go to anyone. Lead with what is actually distinct here. ${close}`,
      curious: `A better version asks from something real in the input, not from a stock outreach setup. ${close}`,
      direct: `The opener is generic. Use the actual miss instead. ${close}`,
      pattern_match: `This usually improves when the opener sounds noticed instead of composed for broad use. ${close}`,
      contrarian_light: `Extra polish will not save a generic first line. Specificity will. ${close}`,
    }[styleLane];
  }

  if (subtype === "weak_relevance") {
    return {
      observant: `${pair} is a usable anchor, but the line still needs to prove it noticed this case and not a category. ${close}`,
      curious: `The next version should ask from the real context, not from a generic messaging theory. ${close}`,
      direct: `The problem is not effort. It is relevance that still feels one step too abstract. ${close}`,
      pattern_match: `Seen this before: the point is valid, but it lands like a category read instead of a real observation. ${close}`,
      contrarian_light: `Personalization is not the same as relevance. The line has to sound earned. ${close}`,
    }[styleLane];
  }

  if (subtype === "too_pitchy") {
    return {
      observant: `${pair} makes the message feel like it is selling before it has earned attention. Lead with the miss, not the service. ${close}`,
      curious: `A better version asks what is getting skipped first, then leaves the offer out of the opener. ${close}`,
      direct: `Strip the pitch. Name the miss. Ask one question. Stop there. ${close}`,
      pattern_match: `This usually improves when the opener stops sounding like outreach and starts sounding like a real observation. ${close}`,
      contrarian_light: `More offer language usually suppresses replies here, not improves them. ${close}`,
    }[styleLane];
  }

  return {
    observant: `${pair} makes this feel like the first line is doing too little work. Lead with that problem before the offer shows up. ${close}`,
    curious: `A better version asks what is getting ignored first, then leaves room for a short reply instead of forcing a pitch. ${close}`,
    direct: `Strip the sales setup. Call out the skipped opener or the dead reply chain in plain language, then stop. ${close}`,
    pattern_match: `This usually improves when the opener names the real miss, not the service. The message should sound noticed, not prepared. ${close}`,
    contrarian_light: `More personalization will not help if the first line still sounds like outreach. The fix is sharper framing, not extra polish. ${close}`,
  }[styleLane];
}

function buildOpenersByLane(
  styleLane: StyleLane,
  anchor: string,
  anchor2: string,
  failureType: FailureType,
  subtype: FailureSubtype
) {
  const normalizedAnchor = stripTrailingPunctuation(anchor);
  const normalizedAnchor2 = stripTrailingPunctuation(anchor2);
  const combo = normalizedAnchor && normalizedAnchor2
    ? `${normalizedAnchor} and ${normalizedAnchor2}`
    : normalizedAnchor || normalizedAnchor2 || "this";

  const laneMap: Record<StyleLane, string[]> = {
    observant: [
      normalizedAnchor ? `${normalizedAnchor} stood out. Usually that is where ${failureType === "conversion" ? "decisions slow down" : failureType === "attention" ? "people stop scrolling past" : "replies start dying"}.` : "One thing stood out. The first impression is probably doing less work than it should.",
      normalizedAnchor ? `Noticed ${normalizedAnchor}. That tends to make the whole message feel easier to skip.` : "Noticed a pattern here. It looks more like framing than effort.",
      normalizedAnchor && normalizedAnchor2 ? `${combo} is an interesting combo. It usually points to a gap in how the problem gets framed first.` : "There is something here most outreach misses. The issue shows up before the offer does.",
    ],
    curious: [
      normalizedAnchor ? `Curious what's happening after ${normalizedAnchor}. Is that where ${failureType === "conversion" ? "interest stalls" : failureType === "attention" ? "people drop" : "the reply chain goes quiet"}?` : "What's happening right after the first look?",
      normalizedAnchor ? `${normalizedAnchor} usually means attention is landing but intent is not.` : "People see it, but they are not moving.",
      normalizedAnchor ? `${normalizedAnchor} — what's happening right after that?` : "What's happening right after they see it?",
    ],
    direct: [
      normalizedAnchor ? `${normalizedAnchor} probably changes the way ${failureType === "conversion" ? "bookings" : failureType === "attention" ? "clicks" : "replies"} come in.` : "This probably affects response rate more than it looks.",
      `Most ${failureType === "attention" ? "posts" : "messages"} lose people in the first line. This looks fixable.`,
      `The issue here does not look like effort. It looks like ${subtype === "weak_relevance" ? "relevance" : subtype === "too_pitchy" ? "framing" : "timing"}.`,
    ],
    pattern_match: [
      `This reads like a ${failureType === "conversion" ? "decision-step" : failureType === "attention" ? "hook" : "relevance"} problem more than a volume problem.`,
      normalizedAnchor ? `${normalizedAnchor} usually points to the same messaging gap.` : "Seen this pattern before.",
      `The message likely is not failing on intent. It is failing on feel.`,
    ],
    contrarian_light: [
      `The problem probably is not the ${failureType === "conversion" ? "offer" : failureType === "attention" ? "content" : "channel"}.`,
      `More ${failureType === "attention" ? "posting" : "outreach"} usually makes this worse, not better.`,
      `Polished messaging can actually suppress replies here.`,
    ],
  };

  return laneMap[styleLane];
}

function humanizeLine(text: string, seed: string) {
  const variants = [
    (value: string) => value,
    (value: string) => value.replace(/\.$/, ""),
    (value: string) => value.replace(/\.$/, "..."),
    (value: string) => `${value} — might be off`,
    (value: string) => value.replace(/^Noticed\b/, "Saw"),
    (value: string) => value.replace(/^This reads like\b/, "Feels more like"),
    (value: string) => value.replace(/^This/, "This might be off but"),
    (value: string) => value.replace(/^The problem probably is not\b/, "Probably not a"),
  ];

  return variants[hashString(seed) % variants.length](text);
}

function buildFallbackOutput(
  input: GeneratorInput,
  detection: FailureDetection,
  ctx: FallbackContext
): FallbackResult {
  const sourceText = buildGeneratorSourceText(input);
  const evidence = extractEvidence(sourceText);
  const dominantPair = evidence.dominantSignal?.type === "numeric_contrast"
    ? `${evidence.dominantSignal.high.toLocaleString()} vs ${evidence.dominantSignal.low.toLocaleString()}`
    : "";
  const anchor = dominantPair || evidence.concreteDetails[0] || "";
  const anchor2 = dominantPair ? "views vs likes" : evidence.concreteDetails[1] || "";
  const openersByLane = buildOpenersByLane(
    ctx.styleLane,
    anchor,
    anchor2,
    detection.type,
    ctx.subtype
  );
  const startIndex = hashString(sourceText + ctx.subtype) % openersByLane.length;
  const orderedOpeners = Array.from({ length: 3 }, (_, index) => {
    const base = openersByLane[(startIndex + index) % openersByLane.length];
    return humanizeLine(base, `${sourceText}:${ctx.subtype}:${index}`);
  });

  const output: GeneratorOutput = {
    positioningAngle: buildFallbackDiagnosis(
      detection.type,
      ctx.subtype,
      anchor || input.extraContext || input.currentMessage || input.offer
    ),
    ctaRecommendation:
      "Lead with the visible problem first, then ask one direct question that is easy to answer.",
    openers: orderedOpeners,
    followUps: [
      buildFallbackRewrite(detection.type, ctx.subtype, ctx.styleLane, evidence, input),
      detection.type === "conversion"
        ? "If the page is already getting attention, the next gain usually comes from clarifying the choice, not buying more traffic."
        : detection.type === "attention"
          ? "If views are present but clicks stay flat, the first packaging beat is usually too soft to do its job."
          : "If the conversation keeps dying, the first line is usually sounding prepared instead of noticed.",
    ],
    objections: [
      {
        objection: "This is too expensive.",
        reply: `${toneSet(input.tone).objectionLead} If clearer framing does not create better replies or cleaner decisions, it is not worth paying for.`,
      },
      {
        objection: "Bad timing right now.",
        reply:
          detection.type === "conversion"
            ? "Fair. If the leak is already in the funnel, waiting usually just burns more demand through the same weak step."
            : detection.type === "attention"
              ? "Fair. Timing matters less when the hook still is not earning a stop on contact."
              : "Fair. Bad timing usually means the ask should get smaller, not that the messaging issue disappears.",
      },
      {
        objection: "We already use something for this.",
        reply:
          detection.type === "conversion"
            ? "Using something is not the same as removing the decision friction. The metric is what matters."
            : detection.type === "attention"
              ? "Posting consistently is not the same as packaging the first beat well enough to earn interest."
              : "Using a tool is not the same as getting replies. The gap usually shows up in how the opener lands.",
      },
    ],
  };

  const humanSignal = scoreHumanSignal(
    [output.positioningAngle, ...output.openers, ...output.followUps].join("\n"),
    sourceText
  );

  return {
    output,
    telemetry: {
      source: "fallback",
      failureType: detection.type,
      failureSubtype: ctx.subtype,
      styleLane: ctx.styleLane,
      humanSignalScore: humanSignal.score,
      hardFailures: [],
    },
  };
}

export function generateFallbackOutput(
  input: Pick<
    GeneratorInput,
    "audience" | "offer" | "platform" | "tone" | "extraContext" | "currentMessage"
  >,
  detection?: FailureDetection
): FallbackResult {
  const generatorInput = input as GeneratorInput;
  const resolvedDetection =
    detection || detectFailureType(buildGeneratorSourceText(generatorInput));
  const styleLane = selectStyleLane(
    buildGeneratorSourceText(generatorInput),
    resolvedDetection.type
  );

  return buildFallbackOutput(generatorInput, resolvedDetection, {
    subtype: resolvedDetection.subtype,
    styleLane,
  });
}










