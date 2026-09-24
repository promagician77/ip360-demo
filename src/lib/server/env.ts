/** Centralised, validated environment access. Fails fast on misconfiguration. */
function required(name: string, minLength = 1): string {
  const v = process.env[name];
  if (!v || v.length < minLength) {
    throw new Error(`Environment variable ${name} is missing or too short (need >= ${minLength} chars).`);
  }
  return v;
}

export const env = {
  get sessionSecret() {
    return required("SESSION_SECRET", 32);
  },
  get assessmentKey() {
    const hex = required("ASSESSMENT_ENCRYPTION_KEY", 64);
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) throw new Error("ASSESSMENT_ENCRYPTION_KEY must be 64 hex characters.");
    return Buffer.from(hex, "hex");
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
};
