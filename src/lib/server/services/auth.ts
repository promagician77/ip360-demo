import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { hashPassword, passwordPolicyError, verifyPassword } from "@/lib/auth/password";
import type { SessionUser } from "@/lib/auth/session";
import { HttpError } from "../http";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().max(200),
  displayName: z.string().trim().min(1).max(40),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().max(200),
});

export async function registerUser(input: unknown): Promise<SessionUser> {
  const data = registerSchema.parse(input);
  const policy = passwordPolicyError(data.password);
  if (policy) throw new HttpError(422, "weak_password", policy);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new HttpError(409, "email_taken", "An account with that email already exists.");

  const user = await prisma.user.create({
    data: { email: data.email, displayName: data.displayName, passwordHash: await hashPassword(data.password) },
  });
  return { id: user.id, email: user.email, displayName: user.displayName, role: "user" };
}

export async function loginUser(input: unknown): Promise<SessionUser> {
  const data = loginSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  // Constant-ish time: always run bcrypt even when the user is unknown.
  const ok = await verifyPassword(data.password, user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid");
  if (!user || !ok) throw new HttpError(401, "invalid_credentials", "Email or password is incorrect.");
  return { id: user.id, email: user.email, displayName: user.displayName, role: user.role === "admin" ? "admin" : "user" };
}
