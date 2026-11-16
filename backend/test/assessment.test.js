import test from "node:test";
import assert from "node:assert/strict";
import { evaluateInterviewTranscript, parseAssessment } from "../services/evaluationService.js";

const row = { name: "Answer relevance", score: 0, comment: "The answer discusses a different problem." };
const valid = { totalScore: 0, categoryScores: [row], strengths: [], areasForImprovement: ["Address the question."], finalAssessment: "Review the prompt." };

test("accepts a genuine zero and fenced JSON", async () => {
  const result = await evaluateInterviewTranscript(["You: I would sort it."], async () => "```json\n" + JSON.stringify(valid) + "\n```");
  assert.deepEqual(result, valid);
});
test("averages only supported categories", () => {
  const categoryScores = [row, { ...row, name: "Response structure", score: 90 }];
  assert.equal(parseAssessment(JSON.stringify({ ...valid, categoryScores })).totalScore, 45);
});
for (const [label, raw] of Object.entries({
  malformed: "{", missing: "{}", empty: JSON.stringify({ ...valid, categoryScores: [] }),
  unsupported: JSON.stringify({ ...valid, categoryScores: [{ ...row, name: "Eye contact" }] }),
  range: JSON.stringify({ ...valid, categoryScores: [{ ...row, score: 101 }] }),
  type: JSON.stringify({ ...valid, strengths: "clear" })
})) {
  test("rejects " + label, async () => {
    await assert.rejects(evaluateInterviewTranscript(["You: Example"], async () => raw),
      { status: 502, code: "INVALID_ASSESSMENT" });
  });
}
test("provider failure rejects without returning a score", async () => {
  await assert.rejects(evaluateInterviewTranscript(["You: Example"], async () => { throw Error("quota"); }),
    { status: 503, code: "ASSESSMENT_UNAVAILABLE" });
});
test("interviewer-only transcript skips the provider", async () => {
  await assert.rejects(evaluateInterviewTranscript(["Interviewer: Ready?"], () => assert.fail()),
    { status: 400, code: "NO_CANDIDATE_ANSWER" });
});
