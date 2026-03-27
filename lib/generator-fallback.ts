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
    return `${anchor} is getting seen, but almost no one clicks. What are you using right now to turn those views into clicks?`;
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return `${anchor} is getting clicks, but replies drop right after the click. What are people seeing right after they click?`;
  }

  return `${anchor} is getting replies, but booked calls still do not happen. What are you using right now to turn that reply into a booked call?`;
}

function buildAngleVariations(input: GeneratorInput, anchor: string) {
  if (input.dropOffStage === "views_to_clicks") {
    return [
      `${anchor} gets attention, but the click still drops right after the first look. Where do you think that break is happening?`,
      `${anchor} already proves people see it, but the next action still does not happen. What is the step between the view and the click right now?`,
    ];
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return [
      `${anchor} gets the click, but the reply dies right after. Where do you think that drop is happening?`,
      `${anchor} is already earning attention, but the conversation still stalls. What is the first thing they see after they click?`,
    ];
  }

  return [
    `${anchor} gets replies, but the booking step still leaks. Where do you think people stop before the call?`,
    `${anchor} already has interest, but the booked call still does not happen. What is the next step after they reply right now?`,
  ];
}

function buildFollowUp(input: GeneratorInput) {
  if (input.dropOffStage === "views_to_clicks") {
    return "If more views are landing but clicks stay flat, the leak is in the first step. Where do you think that drop happens after the view?";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "If clicks are already there but replies are not, the leak is in the step right after the click. Is the drop happening in the first line or after they understand the offer?";
  }

  return "If replies are already there but calls are not, the leak is in the booking step. What happens between the reply and the booking link right now?";
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
    return "What are you currently doing to turn those views into clicks?";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "Where do you think the drop is happening after the click right now?";
  }

  return "What is the current step between the reply and the booked call?";
}

function buildWhatChanged(input: GeneratorInput) {
  if (input.dropOffStage === "views_to_clicks") {
    return "Before: generic setup, weak pull, no click tension. After: specific observation, clear leak, and a question that opens the conversation.";
  }

  if (input.dropOffStage === "clicks_to_replies") {
    return "Before: interest without response. After: specific observation, a clearer gap, and a question that invites a reply.";
  }

  return "Before: value without movement. After: clearer leak, sharper reason to act, and a question that opens the booking conversation.";
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
