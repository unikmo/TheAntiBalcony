import { NextResponse } from "next/server";
import { adminAuthConfigured, createAdminSession, verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!adminAuthConfigured()) return NextResponse.redirect(new URL("/admin/login?error=not-configured", request.url), 303);
  const form = await request.formData();
  const password = String(form.get("password") || "");
  if (!verifyAdminPassword(password)) return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
  await createAdminSession();
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
