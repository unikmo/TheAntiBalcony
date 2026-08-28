import { getSupabaseAdmin } from "@/lib/supabase";

export const MEDIA_BUCKETS = {
  creative: "anti-balcony-creative",
  capture: "anti-balcony-capture",
  deliverables: "anti-balcony-deliverables",
} as const;

export const CREATIVE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

const CREATIVE_MAX_BYTES = 250 * 1024 * 1024;
const REMOTE_ASSET_MAX_BYTES = 500 * 1024 * 1024;

export function validateCreativeFile(input: { name: string; type: string; size: number }) {
  const type = input.type.toLowerCase();
  if (!CREATIVE_MIME_TYPES.includes(type as (typeof CREATIVE_MIME_TYPES)[number])) {
    throw new Error("Creative must be a JPG, PNG, WebP, MP4, MOV or WebM file.");
  }
  if (!Number.isFinite(input.size) || input.size < 1 || input.size > CREATIVE_MAX_BYTES) {
    throw new Error("Creative must be smaller than 250 MB.");
  }
  const extension = extensionForMime(type);
  return {
    filename: cleanFilename(input.name, extension),
    contentType: type,
    size: Math.trunc(input.size),
    extension,
  };
}

export async function createCreativeUpload(input: {
  orderId: string;
  filename: string;
  contentType: string;
  size: number;
}) {
  const db = requireDatabase();
  const file = validateCreativeFile({ name: input.filename, type: input.contentType, size: input.size });
  const path = `${input.orderId}/master-${Date.now()}.${file.extension}`;
  const { data, error } = await db.storage
    .from(MEDIA_BUCKETS.creative)
    .createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.token) throw new Error(`Could not prepare creative upload: ${error?.message || "No upload token returned."}`);

  const projectUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!projectUrl || !publishableKey) throw new Error("Supabase upload configuration is incomplete.");
  const projectId = new URL(projectUrl).hostname.split(".")[0];

  return {
    bucket: MEDIA_BUCKETS.creative,
    path,
    token: data.token,
    endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
    publishableKey,
    file,
  };
}

export async function createOperationsUpload(input: {
  orderId: string;
  kind: "capture" | "deliverable_video" | "deliverable_image";
  filename: string;
  contentType: string;
  size: number;
}) {
  const type = input.contentType.toLowerCase();
  const isImage = ["image/jpeg", "image/png", "image/webp"].includes(type);
  const isVideo = ["video/mp4", "video/quicktime", "video/webm"].includes(type);
  if (input.kind === "deliverable_image" && !isImage) throw new Error("Deliverable image must be JPG, PNG or WebP.");
  if (input.kind !== "deliverable_image" && !isVideo) throw new Error("Capture and video deliverables must be MP4, MOV or WebM.");
  if (!Number.isFinite(input.size) || input.size < 1 || input.size > REMOTE_ASSET_MAX_BYTES) {
    throw new Error("Operations upload must be smaller than 500 MB.");
  }
  const extension = extensionForMime(type);
  const bucket = input.kind === "capture" ? MEDIA_BUCKETS.capture : MEDIA_BUCKETS.deliverables;
  const label = input.kind.replaceAll("_", "-");
  const path = `${input.orderId}/${label}-${Date.now()}.${extension}`;
  const db = requireDatabase();
  const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.token) throw new Error(`Could not prepare operations upload: ${error?.message || "No upload token returned."}`);
  const projectUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!projectUrl || !publishableKey) throw new Error("Supabase upload configuration is incomplete.");
  const projectId = new URL(projectUrl).hostname.split(".")[0];
  return {
    bucket,
    path,
    token: data.token,
    endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
    publishableKey,
    contentType: type,
    filename: cleanFilename(input.filename, extension),
  };
}

export async function verifyStoredObject(bucket: string, path: string) {
  const db = requireDatabase();
  const slash = path.lastIndexOf("/");
  const folder = slash >= 0 ? path.slice(0, slash) : "";
  const name = slash >= 0 ? path.slice(slash + 1) : path;
  const { data, error } = await db.storage.from(bucket).list(folder, {
    limit: 2,
    search: name,
  });
  if (error) throw new Error(`Could not verify stored file: ${error.message}`);
  const object = data.find((item) => item.name === name);
  if (!object) throw new Error("Upload has not completed yet.");
  return object;
}

export async function createPrivateDownloadUrl(bucket: string, path: string, expiresInSeconds = 86400) {
  const db = requireDatabase();
  const { data, error } = await db.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) throw new Error(`Could not create private download link: ${error?.message || "No URL returned."}`);
  return data.signedUrl;
}

export async function copyRemoteAsset(input: {
  sourceUrl: string;
  bucket: string;
  path: string;
  allowedTypes: string[];
}) {
  const response = await fetchProviderAsset(input.sourceUrl);
  if (!response.ok) throw new Error(`Could not download provider asset (${response.status}).`);
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() || "";
  if (!input.allowedTypes.includes(contentType)) throw new Error(`Provider returned unsupported media type: ${contentType || "unknown"}.`);
  const announcedSize = Number(response.headers.get("content-length") || 0);
  if (announcedSize > REMOTE_ASSET_MAX_BYTES) throw new Error("Provider asset is larger than 500 MB.");
  const body = await response.arrayBuffer();
  if (body.byteLength < 1 || body.byteLength > REMOTE_ASSET_MAX_BYTES) throw new Error("Provider asset size is invalid.");

  const db = requireDatabase();
  const { error } = await db.storage.from(input.bucket).upload(input.path, body, {
    contentType,
    upsert: false,
    cacheControl: "3600",
  });
  if (error) throw new Error(`Could not preserve provider asset: ${error.message}`);
  return { path: input.path, contentType, size: body.byteLength };
}

async function fetchProviderAsset(sourceUrl: string) {
  let currentUrl = sourceUrl;
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    validateRemoteProviderUrl(currentUrl);
    const response = await fetch(currentUrl, { redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) throw new Error("Provider asset redirect did not include a destination.");
    currentUrl = new URL(location, currentUrl).toString();
  }
  throw new Error("Provider asset returned too many redirects.");
}

function validateRemoteProviderUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("Provider asset URL must use HTTPS.");
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("169.254.") ||
    hostname.startsWith("10.") ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^f[cd][0-9a-f]{2}:/i.test(hostname) ||
    /^fe[89ab][0-9a-f]:/i.test(hostname)
  ) {
    throw new Error("Provider asset URL must not target a private network.");
  }
}

function requireDatabase() {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Supabase storage is not configured.");
  return db;
}

function cleanFilename(name: string, extension: string) {
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "creative";
  return `${base}.${extension}`;
}

function extensionForMime(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "video/quicktime") return "mov";
  if (type === "video/webm") return "webm";
  return "mp4";
}
