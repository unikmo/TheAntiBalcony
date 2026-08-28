export type ShotstackSubmission = {
  orderId: string;
  orderRef: string;
  startupName: string;
  captureUrl: string;
  callbackToken: string;
};

type ShotstackQueuedResponse = {
  success?: boolean;
  response?: { id?: string };
  message?: string;
};

type ShotstackStatusResponse = {
  success?: boolean;
  response?: {
    id?: string;
    status?: string;
    url?: string;
    poster?: string | null;
    error?: string;
  };
};

export function shotstackConfigured() {
  return Boolean(process.env.SHOTSTACK_API_KEY);
}

export async function submitShotstackPackaging(input: ShotstackSubmission) {
  const key = process.env.SHOTSTACK_API_KEY;
  if (!key) return { submitted: false as const };
  const stage = process.env.SHOTSTACK_ENVIRONMENT === "v1" ? "v1" : "stage";
  const callback = new URL(`${siteUrl()}/api/providers/shotstack/callback`);
  callback.searchParams.set("order", input.orderId);
  callback.searchParams.set("token", input.callbackToken);

  const response = await fetch(`https://api.shotstack.io/edit/${stage}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({
      timeline: {
        background: "#070707",
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: "title",
                  text: `${input.startupName} · THE ANTI-BALCONY`,
                  style: "minimal",
                  color: "#f5f2eb",
                  size: "x-small",
                  background: "#cc070707",
                  position: "bottom",
                },
                start: 0,
                length: 25,
                position: "bottom",
                offset: { x: 0, y: 0.06 },
              },
            ],
          },
          {
            clips: [
              {
                asset: {
                  type: "title",
                  text: "LIVE FROM TIMES SQUARE, NYC",
                  style: "minimal",
                  color: "#ff5c45",
                  size: "xx-small",
                  background: "#cc070707",
                  position: "top",
                },
                start: 0,
                length: 25,
                position: "top",
                offset: { x: 0, y: -0.06 },
              },
            ],
          },
          {
            clips: [
              {
                asset: { type: "video", src: input.captureUrl, transcode: true, trim: 0, volume: 1 },
                start: 0,
                length: 25,
                fit: "cover",
              },
            ],
          },
        ],
      },
      output: {
        format: "mp4",
        resolution: "hd",
        aspectRatio: "9:16",
        fps: 30,
        quality: "high",
        poster: { capture: 12.5 },
      },
      callback: callback.toString(),
    }),
  });
  const data = await response.json() as ShotstackQueuedResponse;
  const id = data.response?.id;
  if (!response.ok || !id) throw new Error(`Shotstack render was not queued: ${data.message || response.status}.`);
  return { submitted: true as const, id, stage };
}

export async function getShotstackRender(renderId: string) {
  const key = process.env.SHOTSTACK_API_KEY;
  if (!key) throw new Error("Shotstack is not configured.");
  const stage = process.env.SHOTSTACK_ENVIRONMENT === "v1" ? "v1" : "stage";
  const response = await fetch(`https://api.shotstack.io/edit/${stage}/render/${encodeURIComponent(renderId)}?data=false`, {
    headers: { "x-api-key": key },
  });
  const data = await response.json() as ShotstackStatusResponse;
  if (!response.ok || !data.response?.status) throw new Error(`Could not read Shotstack render status (${response.status}).`);
  return data.response;
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://antibalcony.com").replace(/\/$/, "");
}
