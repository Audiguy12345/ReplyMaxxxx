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

function getEvidence(input: GeneratorInput) {
  return extractEvidence(buildGeneratorSourceText(input));
}

function buildAnchor(input: GeneratorInput) {
  const evidence = getEvidence(input);

  if (evidence.dominantSignal?.type === "numeric_contrast") {
    return `${evidence.dominantSignal.high.toLocaleString()} vs ${evidence.dominantSignal.low.toLocaleString()}`;
  }

  return evidence.concreteDetails[0] || "The message";
}

function formatApproxNumber(value: number) {
  if (value >= 1000 && value % 1000 === 0) {
    return `~${value / 1000}k`;
  }

  return `~${value.toLocaleString()}`;
}

function buildObservedLead(input: GeneratorInput) {
  const evidence = getEvidence(input);
  const numeric = evidence.dominantSignal;

  if (numeric?.type === "numeric_contrast") {
    return `Saw you're getting ${formatApproxNumber(numeric.high)} views but only ${formatApproxNumber(numeric.low)} signals back`;
  }

  if (input.dropOffStage === "views_to_clicks") {
    return "Saw you're getting attention here";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "Saw you're already getting clicks";
  }

  return "Saw you're already getting replies";
}

function buildLossLead(input: GeneratorInput) {
  const evidence = getEvidence(input);
  const numeric = evidence.dominantSignal;

  if (numeric?.type === "numeric_contrast") {
    return `You've already paid for attention with those ${formatApproxNumber(numeric.high)} views`;
  }

  if (input.dropOffStage === "views_to_clicks") {
    return "You've already got attention here";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "You're already getting clicks";
  }

  return "You're already getting replies";
}

function buildProcessLead(input: GeneratorInput) {
  const evidence = getEvidence(input);
  const numeric = evidence.dominantSignal;

  if (numeric?.type === "numeric_contrast") {
    if (input.dropOffStage === "views_to_clicks") {
      return `${formatApproxNumber(numeric.high)} views to ${formatApproxNumber(numeric.low)} signals says the step between view and click is not clear`;
    }

    if (input.dropOffStage === "clicks_to_replies") {
      return `${formatApproxNumber(numeric.high)} views to ${formatApproxNumber(numeric.low)} signals says the step after the click is not clear`;
    }

    return `${formatApproxNumber(numeric.high)} views to ${formatApproxNumber(numeric.low)} signals says attention is there, but the step from reply to booked call is not clear`;
  }

  if (input.dropOffStage === "views_to_clicks") {
    return "You're getting attention, but the step to the click still is not clear";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "You're getting clicks, but the step to the reply still is not clear";
  }

  return "You're getting replies, but the step to the booked call still is not clear";
}

function buildPrimaryRewrite(input: GeneratorInput) {
  if (input.dropOffStage === "views_to_clicks") {
    return `${buildObservedLead(input)} - people see it but don't move. What are you using to turn that into clicks right now?`;
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return `${buildObservedLead(input)} - replies drop right after the click. What are people seeing right after they click?`;
  }

  return `${buildObservedLead(input)} - people reply but don't book. What are you using right now to turn that reply into a booked call?`;
}

function buildAngleVariations(input: GeneratorInput) {
  if (input.dropOffStage === "views_to_clicks") {
    return [
      `${buildLossLead(input)} - the leak is what happens after. Where do you think that drop is right now?`,
      `${buildProcessLead(input)}. What does that step look like right now for you?`,
    ];
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return [
      `${buildLossLead(input)} - the leak is what happens after the click. Where do you think that drop is right now?`,
      `${buildProcessLead(input)}. What does that step look like right now for you?`,
    ];
  }

  return [
    `${buildLossLead(input)} - the leak is what happens after the reply. Where do you think that drop is?`,
    `${buildProcessLead(input)}. What does that step look like right now?`,
  ];
}

function buildFollowUp(input: GeneratorInput) {
  if (input.dropOffStage === "views_to_clicks") {
    return "If you're already getting attention, is the drop happening in the first line or after they understand the offer?";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "If you're already getting clicks, is the drop happening in the first line or after they understand the offer?";
  }

  return "If you're already getting replies, is the drop happening right after the reply or when the booking step shows up?";
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
    return "If you want, I can map exactly where that drop is happening.";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "If you want, I can map exactly where replies start to die after the click.";
  }

  return "If you want, I can map exactly where the booking step starts to leak.";
}

function buildWhatChanged(input: GeneratorInput) {
  if (input.dropOffStage === "views_to_clicks") {
    return "Before: generic setup, weak pull, and no interaction path. After: observed signal, clearer loss framing, and a question that opens the conversation.";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "Before: interest without response. After: observed signal, clearer loss framing, and a question that invites a reply.";
  }

  return "Before: value without movement. After: observed signal, sharper loss framing, and a question that opens the booking conversation.";
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
  const styleLane =
    resolvedDetection.type === "attention"
      ? "curious"
      : resolvedDetection.type === "conversion"
        ? "direct"
        : "observant";
  const anchor = buildAnchor(generatorInput);
  const ranked = rankRewriteSet(
    buildPrimaryRewrite(generatorInput),
    buildAngleVariations(generatorInput),
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
