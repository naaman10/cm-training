import Image from "next/image";

import { normalizeCourseThumbnail } from "@/lib/courses/normalize-thumbnail";
import type { CourseThumbnail } from "@/types/course";

type CourseHeroProps = {
  thumbnail: CourseThumbnail | null | undefined;
  title: string;
  subtitle?: string | null;
  backHref: string;
};

export function CourseHero({
  thumbnail,
  title,
  subtitle,
  backHref,
}: CourseHeroProps) {
  const normalized = normalizeCourseThumbnail(thumbnail);

  return (
    <div className="relative h-52 overflow-hidden sm:h-60 lg:h-72 lg:rounded-2xl lg:shadow-md">
      {normalized ? (
        <Image
          src={normalized.url}
          alt={normalized.title ?? title}
          fill
          className="object-cover"
          sizes="(max-width: 1023px) 100vw, 380px"
          priority
          unoptimized={
            !normalized.url.includes("images.ctfassets.net") &&
            !normalized.url.includes("assets.ctfassets.net")
          }
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-400 via-fuchsia-300 to-amber-200" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/70 lg:rounded-2xl" />

      <div className="relative z-10 flex items-center justify-between px-4 pt-4 text-white lg:hidden">
        <a
          href={backHref}
          className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2 py-1 text-sm font-medium backdrop-blur-sm"
        >
          <span aria-hidden>←</span>
          <span className="sr-only sm:not-sr-only">Back</span>
        </a>
        <span className="text-sm font-medium text-white/90">Course detail</span>
        <span className="w-10" aria-hidden />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 lg:pb-8">
        <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-white/85">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
