import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "pop_moment_admin";
const SESSION_MESSAGE = "pop-moment-admin-v1";

function dashboardPassword() {
  return process.env.ADMIN_DASHBOARD_PASSWORD || "";
}

function sessionToken() {
  const password = dashboardPassword();
  if (!password) return "";
  return createHmac("sha256", password).update(SESSION_MESSAGE).digest("hex");
}

function safeEqual(a: string, b: string) {
  if (!a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function adminAuthConfigured() {
  return Boolean(dashboardPassword());
}

export function verifyAdminPassword(value: string) {
  return safeEqual(value, dashboardPassword());
}

export async function hasAdminSession() {
  const jar = await cookies();
  return safeEqual(jar.get(ADMIN_COOKIE)?.value || "", sessionToken());
}

export async function createAdminSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function destroyAdminSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}
