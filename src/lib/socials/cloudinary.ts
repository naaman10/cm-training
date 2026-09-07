export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  resourceType: "image" | "video" | "raw" | string;
};

export function getCloudinaryBrowserConfig(): {
  cloudName: string;
  uploadPreset: string;
} | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
  if (!cloudName || !uploadPreset) return null;
  return { cloudName, uploadPreset };
}

function readCloudinaryError(json: unknown, status: number): string {
  if (json && typeof json === "object") {
    const error = (json as { error?: unknown }).error;
    if (error && typeof error === "object") {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  return `Cloudinary upload failed (HTTP ${status}).`;
}

export async function uploadSocialMediaToCloudinary(
  file: File,
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryBrowserConfig();
  if (!config) {
    throw new Error(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
    );
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", config.uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/auto/upload`,
    { method: "POST", body },
  );

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(readCloudinaryError(json, res.status));
  }

  const record = json as Record<string, unknown>;
  const url =
    typeof record.secure_url === "string"
      ? record.secure_url
      : typeof record.url === "string"
        ? record.url
        : null;
  const publicId = typeof record.public_id === "string" ? record.public_id : "";
  if (!url) {
    throw new Error("Cloudinary did not return a media URL.");
  }

  const resourceType =
    typeof record.resource_type === "string" ? record.resource_type : "image";

  return { url, publicId, resourceType };
}
