import type { SocialFormat, SocialNetwork } from "@/lib/socials/preview";
import {
  previewAspectRatio,
  previewFrameLabel,
} from "@/lib/socials/preview";

type SocialPreviewProps = {
  format: SocialFormat;
  network: SocialNetwork;
  onNetworkChange: (network: SocialNetwork) => void;
  mediaUrl: string | null;
  mediaKind: "image" | "video" | null;
  text: string;
};

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex rounded-full border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              selected
                ? "bg-zinc-800 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function MediaFrame({
  format,
  network,
  mediaUrl,
  mediaKind,
  text,
}: {
  format: SocialFormat;
  network: SocialNetwork;
  mediaUrl: string | null;
  mediaKind: "image" | "video" | null;
  text: string;
}) {
  const ratio = previewAspectRatio(format, network);
  const caption = text.trim();
  const overlayCaption = format === "story";

  return (
    <div
      className={`overflow-hidden bg-zinc-200 dark:bg-zinc-800 ${
        format === "story" ? "rounded-[28px]" : "rounded-2xl"
      }`}
    >
      <div className="relative w-full bg-zinc-300 dark:bg-zinc-700" style={{ aspectRatio: ratio }}>
        {mediaUrl && mediaKind === "video" ? (
          <video
            src={mediaUrl}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            controls={format === "post"}
            autoPlay={format === "story"}
            loop={format === "story"}
          />
        ) : mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob and Cloudinary preview
          <img
            src={mediaUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {format === "story" ? "Story image preview" : "Post image preview"}
          </div>
        )}
        {overlayCaption && caption ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-16">
            <p className="text-sm font-medium leading-relaxed text-white">{caption}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SocialPreview({
  format,
  network,
  onNetworkChange,
  mediaUrl,
  mediaKind,
  text,
}: SocialPreviewProps) {
  const caption = text.trim();
  const pageName = "checkmirrors";

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {previewFrameLabel(format, network)}
        </p>
        <SegmentedControl
          ariaLabel="Preview network"
          value={network}
          onChange={onNetworkChange}
          options={[
            { value: "facebook", label: "Facebook" },
            { value: "instagram", label: "Instagram" },
          ]}
        />
      </div>

      {format === "post" ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-9 w-9 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {pageName}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Just now</p>
            </div>
          </div>
          <MediaFrame
            format={format}
            network={network}
            mediaUrl={mediaUrl}
            mediaKind={mediaKind}
            text={text}
          />
          <div className="min-h-16 px-4 py-3">
            {caption ? (
              <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                <span className="font-semibold">{pageName} </span>
                {caption}
              </p>
            ) : (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Post text preview
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[280px]">
          <MediaFrame
            format={format}
            network={network}
            mediaUrl={mediaUrl}
            mediaKind={mediaKind}
            text={text}
          />
        </div>
      )}
    </aside>
  );
}

export { SegmentedControl };
