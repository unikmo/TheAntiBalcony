export type CreativeSpec = {
  contentType: string;
  width: number;
  height: number;
  durationSeconds: number | null | undefined;
};

export function validateCreativeSpec(input: CreativeSpec) {
  if (!Number.isInteger(input.width) || !Number.isInteger(input.height) || input.width < 1 || input.height < 1) {
    throw new Error("Creative dimensions are required.");
  }
  const aspectRatio = input.width / input.height;
  if (input.height <= input.width || Math.abs(aspectRatio - 9 / 16) > 0.015) {
    throw new Error("Creative must use a standard vertical 9:16 canvas, such as 1080 × 1920.");
  }
  if (input.contentType.startsWith("video/")) {
    if (!Number.isFinite(input.durationSeconds) || Number(input.durationSeconds) < 14.5 || Number(input.durationSeconds) > 15.5) {
      throw new Error("Video creative must be 15 seconds long (14.5–15.5 seconds accepted for encoding tolerance).");
    }
  } else if (input.durationSeconds !== null && input.durationSeconds !== undefined) {
    throw new Error("Image creative must not include a video duration.");
  }
}
