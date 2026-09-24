import { ENGINE_VERSION } from "@/lib/matching/types";

/** Hand-maintained OpenAPI 3.1 document for the partner-facing v1 API. */
export function buildOpenApi(baseUrl: string) {
  const dimensionScores = {
    type: "object",
    required: ["values", "emotional", "lifestyle", "communication", "goals", "intimacy"],
    properties: Object.fromEntries(["values", "emotional", "lifestyle", "communication", "goals", "intimacy"].map((k) => [k, { type: "number", minimum: 0, maximum: 100 }])),
  };
  const dimensionWeights = {
    type: "object",
    properties: Object.fromEntries(["values", "emotional", "lifestyle", "communication", "goals", "intimacy"].map((k) => [k, { type: "integer", enum: [1, 2, 3] }])),
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "IP360 PairSync™ / PairKnow™ API",
      version: ENGINE_VERSION,
      description:
        "Partner-facing REST API. PairKnow endpoints convert assessment answers into a CompatibilityProfile; PairSync endpoints score and rank profiles and return human-readable explanations. All endpoints are stateless.",
    },
    servers: [{ url: baseUrl }],
    security: [{ bearerAuth: [] }, { apiKeyHeader: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
        apiKeyHeader: { type: "apiKey", in: "header", name: "X-API-Key" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: { code: { type: "string" }, message: { type: "string" }, details: {} },
            },
          },
        },
        CompatibilityProfile: {
          type: "object",
          required: ["profileId", "displayName", "demographics", "dimensions", "traits", "intent", "children", "relocation", "faithImportance", "smoking", "drinking", "preferences"],
          properties: {
            schemaVersion: { type: "string", example: "1.0.0" },
            profileId: { type: "string" },
            displayName: { type: "string", maxLength: 40 },
            demographics: {
              type: "object",
              required: ["age", "gender", "city", "lat", "lng"],
              properties: {
                age: { type: "integer", minimum: 18, maximum: 99 },
                gender: { type: "string", enum: ["woman", "man", "nonbinary"] },
                city: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
                bio: { type: "string", maxLength: 160 },
              },
            },
            dimensions: dimensionScores,
            traits: {
              type: "object",
              properties: {
                attachmentStyle: { type: "string", enum: ["secure", "anxious", "avoidant", "mixed"] },
                socialEnergy: { type: "string", enum: ["introvert", "ambivert", "extrovert"] },
                planningStyle: { type: "string", enum: ["structured", "balanced", "flexible"] },
                conflictStyle: { type: "string", enum: ["collaborative", "direct", "avoidant", "measured"] },
                affectionStyle: { type: "string", enum: ["physical", "quality_time", "gestures", "balanced"] },
              },
            },
            intent: { type: "string", enum: ["marriage", "long_term", "exploring"] },
            children: { type: "string", enum: ["want", "open", "dont_want", "have_want_more", "have_done"] },
            relocation: { type: "string", enum: ["yes", "maybe", "no"] },
            faithImportance: { type: "integer", minimum: 1, maximum: 5 },
            smoking: { type: "string", enum: ["never", "socially", "regularly"] },
            drinking: { type: "string", enum: ["never", "socially", "regularly"] },
            dealbreakers: { type: "array", items: { type: "string", enum: ["smoker", "heavy_drinker", "kids_mismatch", "faith_mismatch", "different_intent"] } },
            preferences: {
              type: "object",
              properties: {
                seeking: { type: "array", items: { type: "string", enum: ["woman", "man", "nonbinary"] } },
                ageMin: { type: "integer" },
                ageMax: { type: "integer" },
                maxDistanceKm: { type: "number" },
                weights: dimensionWeights,
              },
            },
            meta: { type: "object", additionalProperties: true },
          },
        },
        RuleTrace: {
          type: "object",
          properties: {
            ruleId: { type: "string", example: "E-04" },
            name: { type: "string" },
            stage: { type: "string", enum: ["eligibility", "scoring", "modifier"] },
            outcome: { type: "string", enum: ["pass", "fail", "bonus", "penalty", "neutral", "skipped"] },
            delta: { type: "number" },
            detail: { type: "string" },
          },
        },
        MatchResult: {
          type: "object",
          properties: {
            engineVersion: { type: "string" },
            profileA: { type: "string" },
            profileB: { type: "string" },
            eligible: { type: "boolean" },
            score: { type: "integer", minimum: 0, maximum: 100 },
            baseScore: { type: "integer" },
            modifierTotal: { type: "integer" },
            tier: { type: "string", enum: ["exceptional", "strong", "promising", "limited", "ineligible"] },
            distanceKm: { type: "number" },
            computedAt: { type: "string", format: "date-time" },
            explanation: {
              type: "object",
              properties: {
                headline: { type: "string" },
                summary: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                watchouts: { type: "array", items: { type: "string" } },
                dimensions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      key: { type: "string" },
                      label: { type: "string" },
                      scoreA: { type: "number" },
                      scoreB: { type: "number" },
                      compatibility: { type: "number" },
                      weight: { type: "number" },
                      contribution: { type: "number" },
                      band: { type: "string", enum: ["excellent", "good", "moderate", "low"] },
                      narrative: { type: "string" },
                    },
                  },
                },
                ruleTrail: { type: "array", items: { $ref: "#/components/schemas/RuleTrace" } },
              },
            },
          },
        },
      },
    },
    paths: {
      "/api/v1/health": {
        get: { summary: "Service health and versions", security: [], responses: { "200": { description: "OK" } } },
      },
      "/api/v1/pairknow/questions": {
        get: { summary: "PairKnow question bank", security: [], responses: { "200": { description: "Question bank with dimensions, structured and Likert items." } } },
      },
      "/api/v1/pairknow/profile": {
        post: {
          summary: "Generate a CompatibilityProfile from raw answers (stateless)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["profileId", "responses"],
                  properties: { profileId: { type: "string" }, responses: { type: "object", description: "Raw PairKnow answers. See /api/v1/pairknow/questions." } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Generated profile", content: { "application/json": { schema: { type: "object", properties: { profile: { $ref: "#/components/schemas/CompatibilityProfile" }, geocoded: { type: "boolean" } } } } } },
            "401": { description: "Missing/invalid API key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
            "422": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
      },
      "/api/v1/pairsync/match": {
        post: {
          summary: "Score one pair of profiles",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["profileA", "profileB"],
                  properties: {
                    profileA: { $ref: "#/components/schemas/CompatibilityProfile" },
                    profileB: { $ref: "#/components/schemas/CompatibilityProfile" },
                    options: { type: "object", properties: { includeRuleTrail: { type: "boolean", default: true } } },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Match result", content: { "application/json": { schema: { type: "object", properties: { result: { $ref: "#/components/schemas/MatchResult" } } } } } },
            "401": { description: "Missing/invalid API key" },
            "422": { description: "Validation error" },
            "429": { description: "Rate limited (120 requests/min per key)" },
          },
        },
      },
      "/api/v1/pairsync/rank": {
        post: {
          summary: "Rank up to 200 candidates for a seeker",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["seeker", "candidates"],
                  properties: {
                    seeker: { $ref: "#/components/schemas/CompatibilityProfile" },
                    candidates: { type: "array", maxItems: 200, items: { $ref: "#/components/schemas/CompatibilityProfile" } },
                    options: {
                      type: "object",
                      properties: {
                        limit: { type: "integer", default: 50 },
                        eligibleOnly: { type: "boolean", default: false },
                        includeRuleTrail: { type: "boolean", default: false },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Ranked results", content: { "application/json": { schema: { type: "object", properties: { seeker: { type: "string" }, count: { type: "integer" }, results: { type: "array", items: { $ref: "#/components/schemas/MatchResult" } } } } } } },
            "401": { description: "Missing/invalid API key" },
            "422": { description: "Validation error" },
            "429": { description: "Rate limited (60 requests/min per key)" },
          },
        },
      },
    },
  };
}
