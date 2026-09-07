"use client";

import { useEffect, useRef, useState } from "react";

import { FeatureUnauthorized } from "@/components/feature-unauthorized";
import { usePortalSession } from "@/context/portal-session";
import { FEATURE_NAMES } from "@/lib/features/names";
import {
  getCloudinaryBrowserConfig,
  uploadSocialMediaToCloudinary,
} from "@/lib/socials/cloudinary";
import type { SocialFormat, SocialNetwork } from "@/lib/socials/preview";
import {
  SOCIAL_TEMPLATES,
  type SocialTemplateId,
} from "@/lib/socials/templates";

import { SegmentedControl, SocialPreview } from "./social-preview";

type UploadStatus = "idle" | "uploading" | "uploaded" | "local" | "error";

function mediaKindFromFile(file: File): "image" | "video" | null {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  return null;
}

async function downloadMedia(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not fetch media.");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function SocialsView() {
  const { can } = usePortalSession();
  const canCreateSocial = can(FEATURE_NAMES.socialCreate);
  const canPostSocial = can(FEATURE_NAMES.socialPost);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloudinaryReady = Boolean(getCloudinaryBrowserConfig());

  const [format, setFormat] = useState<SocialFormat>("post");
  const [network, setNetwork] = useState<SocialNetwork>("instagram");
  const [templateId, setTemplateId] = useState<SocialTemplateId>(
    SOCIAL_TEMPLATES[0].id,
  );
  const [text, setText] = useState("");
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<"image" | "video" | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [postNotice, setPostNotice] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [localUrl]);

  if (!canCreateSocial) {
    return (
      <FeatureUnauthorized message="You do not have access to Socials." />
    );
  }

  const previewUrl = remoteUrl ?? localUrl;

  async function onFileSelected(file: File | undefined) {
    if (!file) return;
    const kind = mediaKindFromFile(file);
    if (!kind) {
      setUploadError("Please choose an image or video file.");
      setUploadStatus("error");
      return;
    }

    if (localUrl) URL.revokeObjectURL(localUrl);
    const nextLocal = URL.createObjectURL(file);
    setLocalUrl(nextLocal);
    setRemoteUrl(null);
    setMediaKind(kind);
    setFileName(file.name);
    setUploadError(null);
    setPostNotice(null);

    if (!cloudinaryReady) {
      setUploadStatus("local");
      return;
    }

    setUploadStatus("uploading");
    try {
      const uploaded = await uploadSocialMediaToCloudinary(file);
      setRemoteUrl(uploaded.url);
      setMediaKind(uploaded.resourceType === "video" ? "video" : "image");
      setUploadStatus("uploaded");
    } catch (error) {
      setUploadStatus("error");
      setUploadError(
        error instanceof Error ? error.message : "Could not upload to Cloudinary.",
      );
    }
  }

  async function onDownload() {
    if (!previewUrl) return;
    const fallbackName = fileName ?? (format === "story" ? "story" : "post");
    await downloadMedia(previewUrl, fallbackName);
  }

  function onPost() {
    setPostNotice("Publishing will be available when the social API is ready.");
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
      <section className="space-y-4">
        <SegmentedControl
          ariaLabel="Content format"
          value={format}
          onChange={setFormat}
          options={[
            { value: "story", label: "Story" },
            { value: "post", label: "Post" },
          ]}
        />

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Template</span>
          <select
            value={templateId}
            onChange={(event) =>
              setTemplateId(event.target.value as SocialTemplateId)
            }
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {SOCIAL_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Media</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              void onFileSelected(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[2.75rem] w-full items-center justify-between gap-3 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left dark:border-zinc-700 dark:bg-zinc-950"
          >
            <span
              className={`truncate ${
                fileName
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {uploadStatus === "uploading"
                ? "Uploading…"
                : fileName ?? "Choose image or video"}
            </span>
            <span className="shrink-0 rounded-md border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
              Browse
            </span>
          </button>
          {fileName ? (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {uploadStatus === "uploaded" ? "Saved to Cloudinary" : null}
              {uploadStatus === "local"
                ? "Local preview only. Add Cloudinary env vars to store uploads."
                : null}
            </span>
          ) : (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {cloudinaryReady
                ? "Images and video upload to Cloudinary."
                : "Files preview locally until Cloudinary is configured."}
            </span>
          )}
          {uploadError ? (
            <span className="text-xs text-red-600 dark:text-red-400">
              {uploadError}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Text</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={8}
            placeholder="Write your caption…"
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>

        {postNotice ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{postNotice}</p>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={() => void onDownload()}
            disabled={!previewUrl}
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Download
          </button>
          {canPostSocial ? (
            <button
              type="button"
              onClick={onPost}
              className="rounded-full bg-zinc-800 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Post
            </button>
          ) : null}
        </div>
      </section>

      <SocialPreview
        format={format}
        network={network}
        onNetworkChange={setNetwork}
        mediaUrl={previewUrl}
        mediaKind={mediaKind}
        text={text}
      />
    </div>
  );
}
