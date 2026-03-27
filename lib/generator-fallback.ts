import {
  buildGeneratorSourceText,
  detectFailureType,
  extractEvidence,
  scoreHumanSignal,
  scoreSendability,
  type FailureDetection,
  type GenerationTelemetry,
} from "@/lib/generator-analysis";
import type { GeneratorInput, GeneratorOutput } from "@/lib/types";

type FallbackResult = {
  output: GeneratorOutput;
  telemetry: GenerationTelemetry;
};

function buildProblem(input: GeneratorInput, detection: FailureDetection, anchor: string) {
  if (input.dropOffStage === "views_to_clicks") {
    return `${anchor} is getting seen, but people are not clicking through. The drop is happening between attention and action.`;
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return `${anchor} is getting clicks, but people are not replying. The drop is happening after interest shows up.`;
  }

  if (detection.type === "conversion") {
    return `${anchor} is getting attention, but people are not moving to book. The drop is happening between reply and booked call.`;
  }

  return `${anchor} is getting noticed, but people are not moving to the next step. The drop is happening before the booked call.`;
}

function buildWhy(input: GeneratorInput) {
  if (input.dropOffStage === "views_to_clicks") {
    return "The message shows up, but it does not create enough clarity or pull to earn the click.";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "People are interested enough to click, but the message still does not make replying feel easy or necessary.";
  }

  return "The message shows value, but it does not create enough clarity or pressure to take the next step.";
}

function buildWhatIsHappening(input: GeneratorInput) {
  if (input.dropOffStage === "views_to_clicks") {
    return "Interest is there, but it dies before the click step.";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "The click happens, but the conversation dies before a reply starts.";
  }

  return "Interest is there, but it dies before the booking step.";
}

function buildAnchor(input: GeneratorInput) {
  const sourceText = buildGeneratorSourceText(input);
  const evidence = extractEvidence(sourceText);
  if (evidence.dominantSignal?.type === "numeric_contrast") {
    return `${evidence.dominantSignal.high.toLocaleString()} vs ${evidence.dominantSignal.low.toLocaleString()}`;
  }

  return evidence.concreteDetails[0] || "The message";
}

function buildPrimaryRewrite(input: GeneratorInput, anchor: string) {
  if (input.dropOffStage === "views_to_clicks") {
    return `${anchor} says people see it, but they are not clicking. That's the part worth fixing first.`;
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return `${anchor} is getting clicks, but not enough replies. The gap looks like what happens right after the click.`;
  }

  return `${anchor} is getting attention, but people are not moving to book. The drop looks like it happens between reply and booked call.`;
}

function buildAngleVariations(input: GeneratorInput, anchor: string) {
  if (input.dropOffStage === "views_to_clicks") {
    return [
      `${anchor} is getting seen, but almost no one clicks. That is where it breaks.`,
      `${anchor} shows attention is there. The click just is not happening after the first read.`,
    ];
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return [
      `${anchor} gets the click, but not the reply. That is the leak.`,
      `${anchor} is doing enough to get opened, but not enough to make someone answer back.`,
    ];
  }

  return [
    `${anchor} gets attention, but not enough booked calls. That is the leak.`,
    `${anchor} is getting replies, but they are not turning into booked calls. That is where it breaks.`,
  ];
}

function buildFollowUp(input: GeneratorInput) {
  if (input.dropOffStage === "views_to_clicks") {
    return "The first job is earning the click. More visibility will not fix a weak first step.";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "The click is already happening. The next gain comes from making the reply feel easier than ignoring it.";
  }

  return "The reply is already happening. The next gain comes from making the booking step feel obvious and low-friction.";
}

function buildObjectionHandling(input: GeneratorInput): GeneratorOutput["objectionHandling"] {
  return [
    {
      objection: "This is too expensive.",
      reply: "Fair. If this does not move more people to the next step, it is not worth paying for.",
    },
    {
      objection: "Bad timing right now.",
      reply:
        input.dropOffStage === "replies_to_booked_calls"
          ? "Fair. But if the leak is already after the reply, waiting just keeps burning demand through the same weak step."
          : "Fair. Timing matters less when the leak is already in the message path.",
    },
    {
      objection: "We already use something for this.",
      reply: "Using something is not the same as fixing the step where people stop moving.",
    },
  ];
}

function buildCta(input: GeneratorInput) {
  if (input.dropOffStage === "views_to_clicks") {
    return "Start with the click leak. Ask one direct question that makes the next click feel obvious.";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "Start with the reply leak. Ask one direct question that makes answering feel easy.";
  }

  return "Start with the booking leak. Ask one direct question that makes the booking step feel easier to take.";
}

function buildWhatChanged(input: GeneratorInput) {
  if (input.dropOffStage === "views_to_clicks") {
    return "Before: generic setup, weak pull, no click tension. After: specific observation, clear leak, stronger reason to click.";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "Before: interest without response. After: specific observation, clearer gap, easier reason to reply.";
  }

  return "Before: value without movement. After: clearer leak, sharper reason to act, stronger path to the booked call.";
}

function buildExpectedImpact(input: GeneratorInput) {
  if (input.dropOffStage === "views_to_clicks") {
    return "If this moves view to click from 2% to 4%, you double qualified traffic to the next step without more reach.";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "If this moves click to reply from 2% to 4%, you double active conversations without more traffic.";
  }

  return "If this moves reply to booked call from 2% to 4%, you double booked calls without more traffic.";
}

function rankRewriteSet(primaryRewrite: string, angleVariations: string[], input: GeneratorInput) {
  const sourceText = buildGeneratorSourceText(input);
  const ranked = [primaryRewrite, ...angleVariations]
    .map((text) => ({
      text,
      score: scoreSendability(text, sourceText).score,
    }))
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.text);

  return {
    primaryRewrite: ranked[0],
    angleVariations: ranked.slice(1, 3),
  };
}

export function generateFallbackOutput(
  input: Pick<
    GeneratorInput,
    "audience" | "offer" | "currentMessage" | "dropOffStage" | "platform" | "tone" | "extraContext"
  >,
  detection?: FailureDetection
): FallbackResult {
  const generatorInput = input as GeneratorInput;
  const sourceText = buildGeneratorSourceText(generatorInput);
  const resolvedDetection = detection || detectFailureType(sourceText);
  const styleLane = resolvedDetection.type === "attention" ? "curious" : resolvedDetection.type === "conversion" ? "direct" : "observant";
  const anchor = buildAnchor(generatorInput);
  const ranked = rankRewriteSet(
    buildPrimaryRewrite(generatorInput, anchor),
    buildAngleVariations(generatorInput, anchor),
    generatorInput
  );

  const output: GeneratorOutput = {
    problem: buildProblem(generatorInput, resolvedDetection, anchor),
    why: buildWhy(generatorInput),
    whatIsHappening: buildWhatIsHappening(generatorInput),
    primaryRewrite: ranked.primaryRewrite,
    angleVariations: ranked.angleVariations,
    followUp: buildFollowUp(generatorInput),
    objectionHandling: buildObjectionHandling(generatorInput),
    cta: buildCta(generatorInput),
    whatChanged: buildWhatChanged(generatorInput),
    expectedImpact: buildExpectedImpact(generatorInput),
  };

  const humanSignal = scoreHumanSignal(
    [
      output.problem,
      output.why,
      output.whatIsHappening,
      output.primaryRewrite,
      ...output.angleVariations,
      output.followUp,
      output.cta,
      output.whatChanged,
    ].join("\n"),
    sourceText
  );

  return {
    output,
    telemetry: {
      source: "fallback",
      failureType: resolvedDetection.type,
      failureSubtype: resolvedDetection.subtype,
      styleLane,
      humanSignalScore: humanSignal.score,
      hardFailures: [],
    },
  };
}