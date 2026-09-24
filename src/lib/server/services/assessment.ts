import { prisma } from "@/lib/db/client";
import { ASSESSMENT_VERSION } from "@/lib/assessment/questions";
import {
  assessmentDraftSchema,
  assessmentResponsesSchema,
  generateProfile,
  type AssessmentDraft,
  type AssessmentResponses,
} from "@/lib/assessment/scoring";
import type { CompatibilityProfile } from "@/lib/assessment/profile";
import { decryptJson, encryptJson } from "../crypto";
import { geocodeCity } from "../geocode";
import { HttpError } from "../http";

export interface AssessmentState {
  status: "not_started" | "in_progress" | "completed";
  assessmentId?: string;
  step: number;
  answers: Record<string, unknown>;
  completedAt?: string;
  version: string;
}

/** Returns the user's current assessment (draft or completed) with answers decrypted. */
export async function getAssessmentState(userId: string): Promise<AssessmentState> {
  const a = await prisma.assessment.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
  if (!a) return { status: "not_started", step: 0, answers: {}, version: ASSESSMENT_VERSION };
  const payload = decryptJson<AssessmentDraft | AssessmentResponses>(a.payload);
  const answers = a.status === "completed" ? (payload as AssessmentResponses) : (payload as AssessmentDraft).answers;
  return {
    status: a.status === "completed" ? "completed" : "in_progress",
    assessmentId: a.id,
    step: a.step,
    answers: answers as Record<string, unknown>,
    completedAt: a.completedAt?.toISOString(),
    version: a.version,
  };
}

/** Autosaves a partial draft. Creates the draft row on first save. */
export async function saveDraft(userId: string, input: unknown): Promise<AssessmentState> {
  const draft = assessmentDraftSchema.parse(input);
  const existing = await prisma.assessment.findFirst({
    where: { userId, status: "in_progress" },
    orderBy: { updatedAt: "desc" },
  });
  const payload = encryptJson(draft);
  if (existing) {
    await prisma.assessment.update({ where: { id: existing.id }, data: { payload, step: draft.step } });
  } else {
    await prisma.assessment.create({
      data: { userId, version: ASSESSMENT_VERSION, status: "in_progress", payload, step: draft.step },
    });
  }
  return getAssessmentState(userId);
}

/**
 * Validates the full response set, generates the compatibility profile and stores both
 * in one transaction. Re-submitting replaces the previous profile (retake support).
 */
export async function submitAssessment(userId: string, input: unknown): Promise<CompatibilityProfile> {
  const responses = assessmentResponsesSchema.parse(input);
  const geo = geocodeCity(responses.city);

  const draft = await prisma.assessment.findFirst({ where: { userId, status: "in_progress" } });
  const existingProfile = await prisma.profile.findUnique({ where: { userId } });
  const profileId = existingProfile?.id ?? `p_${userId}`;

  const profile = generateProfile(responses, { profileId, lat: geo.lat, lng: geo.lng });

  return prisma.$transaction(async (tx) => {
    // Retire any previously completed assessment so history is preserved but only one is active.
    if (existingProfile) await tx.profile.delete({ where: { userId } });

    const assessment = draft
      ? await tx.assessment.update({
          where: { id: draft.id },
          data: { status: "completed", payload: encryptJson(responses), completedAt: new Date(), version: ASSESSMENT_VERSION },
        })
      : await tx.assessment.create({
          data: { userId, version: ASSESSMENT_VERSION, status: "completed", payload: encryptJson(responses), completedAt: new Date() },
        });

    const stored = await tx.profile.create({
      data: {
        id: profileId,
        userId,
        assessmentId: assessment.id,
        schemaVersion: profile.schemaVersion,
        displayName: profile.displayName,
        age: profile.demographics.age,
        gender: profile.demographics.gender,
        city: profile.demographics.city,
        lat: profile.demographics.lat,
        lng: profile.demographics.lng,
        intent: profile.intent,
        data: JSON.stringify(profile),
      },
    });
    await tx.user.update({ where: { id: userId }, data: { displayName: profile.displayName } });
    return JSON.parse(stored.data) as CompatibilityProfile;
  });
}

export async function getProfileForUser(userId: string): Promise<CompatibilityProfile | null> {
  const p = await prisma.profile.findUnique({ where: { userId } });
  return p ? (JSON.parse(p.data) as CompatibilityProfile) : null;
}

export async function requireProfileForUser(userId: string): Promise<CompatibilityProfile> {
  const p = await getProfileForUser(userId);
  if (!p) throw new HttpError(409, "no_profile", "Complete the PairKnow assessment first.");
  return p;
}
