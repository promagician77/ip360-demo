/**
 * Seeds demo users, encrypted assessments, generated profiles and a demo API key.
 * Idempotent: re-running updates existing rows.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { encryptJson, sha256 } from "../src/lib/server/crypto";
import { generateProfile } from "../src/lib/assessment/scoring";
import { ASSESSMENT_VERSION } from "../src/lib/assessment/questions";
import { DEMO_PASSWORD, DEMO_PERSONAS } from "../src/lib/demo/personas";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  for (const persona of DEMO_PERSONAS) {
    const isPrimary = persona.slug === "maya";
    const user = await prisma.user.upsert({
      where: { email: persona.email },
      update: { displayName: persona.responses.displayName, passwordHash },
      create: {
        email: persona.email,
        displayName: persona.responses.displayName,
        passwordHash,
        role: isPrimary ? "admin" : "user",
      },
    });

    const existing = await prisma.assessment.findFirst({ where: { userId: user.id, status: "completed" } });
    const assessment = existing
      ? await prisma.assessment.update({
          where: { id: existing.id },
          data: { payload: encryptJson(persona.responses), version: ASSESSMENT_VERSION },
        })
      : await prisma.assessment.create({
          data: {
            userId: user.id,
            version: ASSESSMENT_VERSION,
            status: "completed",
            payload: encryptJson(persona.responses),
            completedAt: new Date(),
          },
        });

    const profile = generateProfile(persona.responses, {
      profileId: `demo_${persona.slug}`,
      lat: persona.lat,
      lng: persona.lng,
    });

    // Recreate the profile so its row id always equals profile.profileId
    // (MatchResult foreign keys rely on that invariant). Cascade clears cached matches.
    await prisma.profile.deleteMany({ where: { userId: user.id } });
    await prisma.profile.create({
      data: {
        id: profile.profileId,
        userId: user.id,
        assessmentId: assessment.id,
        data: JSON.stringify(profile),
        schemaVersion: profile.schemaVersion,
        displayName: profile.displayName,
        age: profile.demographics.age,
        gender: profile.demographics.gender,
        city: profile.demographics.city,
        lat: profile.demographics.lat,
        lng: profile.demographics.lng,
        intent: profile.intent,
        isDemo: true,
      },
    });
    console.log(`✓ ${persona.responses.displayName.padEnd(8)} ${persona.email}`);
  }

  // Demo partner API key (plaintext lives only in .env for the docs page)
  const demoKey = process.env.DEMO_API_KEY;
  if (demoKey) {
    const owner = await prisma.user.findUniqueOrThrow({ where: { email: "demo@ip360.app" } });
    await prisma.apiKey.upsert({
      where: { keyHash: sha256(demoKey) },
      update: { revokedAt: null },
      create: {
        name: "Demo partner platform",
        prefix: demoKey.slice(0, 16),
        keyHash: sha256(demoKey),
        ownerId: owner.id,
        scopes: "pairsync:match,pairknow:profile",
      },
    });
    console.log(`✓ API key    ${demoKey.slice(0, 16)}…`);
  }

  // Clear the match cache so a re-seed never serves stale results.
  await prisma.matchResult.deleteMany({});
  console.log(`\nDemo login: demo@ip360.app / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
