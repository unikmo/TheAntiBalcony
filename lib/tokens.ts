import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createCapabilityToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function tokensMatch(rawToken: string, expectedHash: string) {
  const actual = Buffer.from(hashToken(rawToken), "utf8");
  const expected = Buffer.from(expectedHash, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function bearerToken(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
}

export function authorizedByEnvironmentSecret(request: Request, name: string) {
  const expected = process.env[name];
  const provided = bearerToken(request);
  if (!expected || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}
