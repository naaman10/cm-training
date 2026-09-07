export type SocialFormat = "post" | "story";
export type SocialNetwork = "facebook" | "instagram";

export function previewAspectRatio(
  format: SocialFormat,
  network: SocialNetwork,
): string {
  if (format === "story") return "9 / 16";
  if (network === "instagram") return "1 / 1";
  return "1.91 / 1";
}

export function previewFrameLabel(
  format: SocialFormat,
  network: SocialNetwork,
): string {
  const networkLabel = network === "facebook" ? "Facebook" : "Instagram";
  const formatLabel = format === "story" ? "story" : "post";
  return `${networkLabel} ${formatLabel}`;
}
