import {
  buildGeneratorSourceText,
  detectFailureType,
  extractEvidence,
  hashString,
  scoreHumanSignal,
  scoreSendability,
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
        close: "That's where it breaks.",
        objectionLead: "Fair.",
      };
    case "casual":
      return {
        close: "That's where it breaks.",
        objectionLead: "Fair.",
      };
    default:
      return {
        close: "That's where it breaks.",
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
        return `${detail} is creating pressure too early, so people drop before anyone books.`;
      case "low_credibility":
        return `${detail} asks for trust too early, so people stop before anyone clicks or books.`;
      default:
        return `${detail} shows attention is there, but nothing happens after the view.`;
    }
  }

  if (failureType === "attention") {
    switch (subtype) {
      case "flat_tone":
        return `${detail} is visible, but the first beat is too flat to earn a stop, so reach turns into passive scrolling.`;
      default:
        return `${detail} is showing up, but only a small slice is signaling back, so nothing happens after the first look.`;
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
      return `${detail} sounds careful instead of observed, so the reply window closes early.`;
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
        observant: `${pair} suggests the page is asking too much too early. Pull the pressure out first. ${close}`,
        curious: `The gap is proof before the demo ask. ${close}`,
        direct: `The ask shows up too fast. People see it, then stop moving. ${close}`,
        pattern_match: `Seen this pattern before: traffic is qualified, then the page rushes the sale and nothing happens after. ${close}`,
        contrarian_light: `More traffic will not fix this. The pressure is landing too early. ${close}`,
      }[styleLane];
    }

    if (subtype === "low_credibility") {
      return {
        observant: `${pair} reads like people see it, but they do not trust it yet. Show proof before the ask gets bigger. ${close}`,
        curious: `What would make this feel safer before anyone books? ${close}`,
        direct: `People are not buying it yet. Proof has to show up before the ask. ${close}`,
        pattern_match: `When bookings stay flat with decent traffic, the proof is not landing fast enough. ${close}`,
        contrarian_light: `A stronger CTA will not save this before the proof does. ${close}`,
      }[styleLane];
    }

    return {
      observant: `${pair} points to a drop after attention. People see it, then nothing happens. ${close}`,
      curious: `People see it, then no one books. Is that where it breaks? ${close}`,
      direct: `People see it, then no one books. More traffic won't fix that first. ${close}`,
      pattern_match: `Seen this pattern before: the page gets qualified traffic, but people do not click or book after the first read. ${close}`,
      contrarian_light: `The offer is not the problem. People just are not taking the next step. ${close}`,
    }[styleLane];
  }

  if (failureType === "attention") {
    if (subtype === "flat_tone") {
      return {
        observant: `${pair} feels too polite on entry. The first beat needs more contrast to earn a stop. ${close}`,
        curious: `The hook is not earning the stop yet. ${close}`,
        direct: `The first beat is too flat. More posting won't fix a soft first impression. ${close}`,
        pattern_match: `This is not bad content. It is getting introduced with too little tension. ${close}`,
        contrarian_light: `Polished hooks often underperform when the real issue is lack of bite. ${close}`,
      }[styleLane];
    }

    return {
      observant: `${pair} suggests people see it, but they do not stop or react fast enough. ${close}`,
      curious: `People are seeing it. The drop is right after the first beat. ${close}`,
      direct: `Posting more isn't the answer if the first beat stays flat. The first impression has to create tension fast. ${close}`,
      pattern_match: `This is not a content problem. The first beat is too soft before the substance gets a chance. ${close}`,
      contrarian_light: `Better content still dies when the first beat is too polite. A stronger hook matters more than another post. ${close}`,
    }[styleLane];
  }

  if (subtype === "generic_opener") {
    return {
      observant: `${pair} makes this feel like the first line could go to anyone. Use what is actually distinct here. ${close}`,
      curious: `A better version asks from something real in the input, not from a stock outreach setup. ${close}`,
      direct: `The opener is generic. Use the actual miss instead. ${close}`,
      pattern_match: `This improves when the opener sounds noticed instead of composed for broad use. ${close}`,
      contrarian_light: `Extra polish will not save a generic first line. Specificity will. ${close}`,
    }[styleLane];
  }

  if (subtype === "weak_relevance") {
    return {
      observant: `${pair} is a usable anchor, but the line still needs to prove it noticed this case and not a category. ${close}`,
      curious: `The next version should ask from the real context, not from a generic theory. ${close}`,
      direct: `The problem is not effort. The line still does not land fast enough. ${close}`,
      pattern_match: `Seen this before: the point is valid, but it lands like a category read instead of a real observation. ${close}`,
      contrarian_light: `More detail is not the same as a real hit. The line has to sound earned. ${close}`,
    }[styleLane];
  }

  if (subtype === "too_pitchy") {
    return {
      observant: `${pair} makes the message feel like it is selling before it has earned attention. Use the miss, not the service. ${close}`,
      curious: `A better version asks what is getting skipped first, then leaves the offer out of the opener. ${close}`,
      direct: `Strip the pitch. Name the miss. Ask one question. Stop there. ${close}`,
      pattern_match: `This improves when the opener stops sounding like outreach and starts sounding like a real observation. ${close}`,
      contrarian_light: `More offer language suppresses replies here, not improves them. ${close}`,
    }[styleLane];
  }

  return {
    observant: `${pair} makes this feel like the first line is doing too little work. Start with that problem before the offer shows up. ${close}`,
    curious: `A better version asks what is getting ignored first, then leaves room for a short reply. ${close}`,
    direct: `Strip the sales setup. Name the skipped opener or the dead reply chain, then stop. ${close}`,
    pattern_match: `This improves when the opener names the real miss, not the service. The message should sound noticed, not prepared. ${close}`,
    contrarian_light: `More detail will not help if the first line still sounds like outreach. The fix is a sharper first hit, not extra polish. ${close}`,
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
      normalizedAnchor ? `${normalizedAnchor} stood out. That's where ${failureType === "conversion" ? "people stop before booking" : failureType === "attention" ? "people keep scrolling" : "replies start dying"}.` : "One thing stood out. The first impression is doing too little work.",
      normalizedAnchor ? `Noticed ${normalizedAnchor}. That tends to make the whole message easier to skip.` : "Noticed a pattern here. Effort is not what is breaking.",
      normalizedAnchor && normalizedAnchor2 ? `${combo} is the tell. The gap shows up before the real point lands.` : "The issue shows up before the ask does.",
    ],
    curious: [
      normalizedAnchor ? `${normalizedAnchor} - is that where it drops?` : "What's happening right after the first look?",
      normalizedAnchor ? `${normalizedAnchor} - almost no one acts.` : "People see it, but almost no one acts.",
      normalizedAnchor ? `${normalizedAnchor} - what's happening right after that?` : "What's happening right after they see it?",
    ],
    direct: [
      normalizedAnchor ? `${normalizedAnchor} - that's where ${failureType === "conversion" ? "bookings drop" : failureType === "attention" ? "clicks die" : "replies die"}.` : "That's where response rate breaks.",
      `Most ${failureType === "attention" ? "posts" : "messages"} lose people in the first line. That's where it breaks.`,
      `The issue here isn't effort. It's ${subtype === "weak_relevance" ? "the line still feels generic" : subtype === "too_pitchy" ? "the ask shows up too early" : "the drop happens too early"}.`,
    ],
    pattern_match: [
      `This reads like a ${failureType === "conversion" ? "drop before booking" : failureType === "attention" ? "hook" : "first-line miss"} problem more than a volume problem.`,
      normalizedAnchor ? `${normalizedAnchor} points to the same gap every time.` : "Seen this pattern before.",
      `People are seeing it. They just are not reacting.` ,
    ],
    contrarian_light: [
      `The ${failureType === "conversion" ? "offer" : failureType === "attention" ? "content" : "channel"} is not the problem.`,
      `More ${failureType === "attention" ? "posting" : "outreach"} makes this worse, not better.`,
      `Polished messaging can kill replies here.`,
    ],
  };

  return laneMap[styleLane];
}

function humanizeLine(text: string, seed: string) {
  const variants = [
    (value: string) => value,
    (value: string) => value.replace(/\.$/, ""),
    (value: string) => value.replace(/\.$/, "..."),
    (value: string) => value.replace(/^Noticed\b/, "Saw"),
    (value: string) => value.replace(/^This reads like\b/, "Feels more like"),
    (value: string) => value.replace(/^The\s+(offer|content|channel)\s+is not the problem\b/i, "$1 is not the problem"),
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

  const rankedOpeners = orderedOpeners
    .map((opener) => ({
      opener,
      score: scoreSendability(opener, sourceText).score,
    }))
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.opener);

  const output: GeneratorOutput = {
    positioningAngle: buildFallbackDiagnosis(
      detection.type,
      ctx.subtype,
      anchor || input.extraContext || input.currentMessage || input.offer
    ),
    ctaRecommendation:
      "Start with the visible problem. Ask one direct question.",
    openers: rankedOpeners,
    followUps: [
      buildFallbackRewrite(detection.type, ctx.subtype, ctx.styleLane, evidence, input),
      detection.type === "conversion"
        ? "If the page is already getting attention, the next gain comes from making the next step obvious, not buying more traffic."
        : detection.type === "attention"
          ? "If views are present but clicks stay flat, the first beat is too soft to do its job."
          : "If the conversation keeps dying, the first line sounds written, not noticed.",
    ],
    objections: [
      {
        objection: "This is too expensive.",
        reply: `${toneSet(input.tone).objectionLead} If a sharper first line doesn't get more replies or clicks, it isn't worth paying for.` ,
      },
      {
        objection: "Bad timing right now.",
        reply:
          detection.type === "conversion"
            ? "Fair. If the leak is already in the funnel, waiting just burns more demand through the same weak step."
            : detection.type === "attention"
              ? "Fair. Timing matters less when the hook still is not earning a stop on contact."
              : "Fair. Bad timing means the ask should get smaller, not that the messaging issue disappears.",
      },
      {
        objection: "We already use something for this.",
        reply:
          detection.type === "conversion"
            ? "Using something isn't the same as getting more clicks or bookings. The metric is what matters."
            : detection.type === "attention"
              ? "Posting consistently isn't the same as getting people to react."
              : "Using a tool isn't the same as getting replies. The gap shows up in the first line.",
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




















