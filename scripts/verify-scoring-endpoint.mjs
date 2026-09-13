import assert from "node:assert/strict";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const endpointUrl = new URL("/api/dev/score", baseUrl);

const answers = {
  bfi_01: 1,
  bfi_02: 4,
  bfi_03: 2,
  bfi_04: 4,
  bfi_05: 1,
  bfi_06: 2,
  bfi_07: 2,
  bfi_08: 5,
  bfi_09: 3,
  bfi_10: 3,
  ai_01: 4,
  ai_02: 5,
  ai_03: 5,
  ai_04: 3,
  ai_05: 5,
  ai_06: 4,
  ai_07: 2,
  ai_08: 2,
  ai_09: 5,
  ai_10: 4
};

const expected = {
  bfi: {
    extraversion: 62.5,
    agreeableness: 75,
    conscientiousness: 87.5,
    neuroticism: 37.5,
    openness: 75
  },
  ai: {
    trust: 75,
    cautious_use: 100,
    concern: 25,
    use_intent: 66.6666666667,
    social_impact: 62.5,
    overall_positive_attitude: 57.2916666667
  }
};

try {
  const response = await fetch(endpointUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers })
  });

  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  assert.deepEqual(payload, {
    ok: true,
    result: {
      bfi: expected.bfi,
      ai: expected.ai,
      metadata: {
        ai: {
          cautious_use: { descriptive: true }
        }
      }
    }
  });
  assert.equal(payload.result.metadata.ai.cautious_use.descriptive, true);

  const answersMissingAi10 = { ...answers };
  delete answersMissingAi10.ai_10;

  const invalidResponse = await fetch(endpointUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: answersMissingAi10 })
  });
  const invalidPayload = await invalidResponse.json();

  assert.equal(invalidResponse.status, 400, JSON.stringify(invalidPayload));
  assert.equal(invalidPayload.ok, false);
  assert.match(invalidPayload.error, /ai_10/);
  assert.deepEqual(Object.keys(invalidPayload).sort(), ["error", "ok"]);
  assert.equal(Object.hasOwn(invalidPayload, "stack"), false);

  console.log("endpoint scoring matches unit test");
} catch (error) {
  console.error("endpoint scoring verification failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
