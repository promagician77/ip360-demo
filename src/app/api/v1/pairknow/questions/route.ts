import { ASSESSMENT_VERSION, DIMENSIONS, LIKERT_QUESTIONS, STRUCTURED_QUESTIONS, WEIGHT_OPTIONS } from "@/lib/assessment/questions";
import { jsonOk } from "@/lib/server/http";

/** Public: the PairKnow question bank, so partners can render the assessment themselves. */
export async function GET() {
  return jsonOk({
    version: ASSESSMENT_VERSION,
    dimensions: Object.values(DIMENSIONS),
    structured: STRUCTURED_QUESTIONS,
    likert: LIKERT_QUESTIONS,
    weights: { options: WEIGHT_OPTIONS, perDimension: true },
  });
}
