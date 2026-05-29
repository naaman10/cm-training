import Image from "next/image";

import {
  normalizeCourseThumbnail,
  thumbnailAspectRatio,
} from "@/lib/courses/normalize-thumbnail";
import type { CourseThumbnail } from "@/types/course";

type CourseThumbnailProps = {
  thumbnail: CourseThumbnail | null | undefined;
  title: string;
};

export function CourseThumbnailImage({
  thumbnail: rawThumbnail,
  title,
}: CourseThumbnailProps) {
  const thumbnail = normalizeCourseThumbnail(rawThumbnail);

  if (!thumbnail) {
    return (
      <div
        className="flex w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800"
        style={{ aspectRatio: "16 / 9" }}
      >
        <span className="px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No thumbnail
        </span>
      </div>
    );
  }

  const width = thumbnail.width ?? 800;
  const height = thumbnail.height ?? 450;
  const alt = thumbnail.title ?? title;

  return (
    <div
      className="relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800"
      style={{ aspectRatio: thumbnailAspectRatio(thumbnail) }}
    >
      <Image
        src={thumbnail.url}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        unoptimized={!isOptimizableContentfulUrl(thumbnail.url)}
      />
    </div>
  );
}

function isOptimizableContentfulUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "images.ctfassets.net" || host === "assets.ctfassets.net";
  } catch {
    return false;
  }
}
