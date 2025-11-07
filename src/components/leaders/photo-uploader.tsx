"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IconUpload, IconX, IconPhoto } from "@tabler/icons-react";
import { mediaUrl } from "@/lib/media";

export type PhotoUploaderProps = {
  currentUrl?: string | null;
  file: File | null;
  onFileChange: (f: File | null) => void;
  className?: string;
  note?: string;
};

export function PhotoUploader({ currentUrl, file, onFileChange, className, note }: PhotoUploaderProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function validateAndSet(files?: FileList | null) {
    setError(null);
    if (!files || !files.length) return;
    const f = files[0];
    const okTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!okTypes.includes(f.type)) {
      setError("Only JPEG, PNG, WEBP, GIF are allowed.");
      return;
    }
    const max = 3 * 1024 * 1024;
    if (f.size > max) {
      setError("Image must be 3MB or smaller.");
      return;
    }
    onFileChange(f);
  }

  return (
    <div className={className}>
      <Label>Photo</Label>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          validateAndSet(e.dataTransfer.files);
        }}
        className={[
          "mt-2 group relative overflow-hidden rounded-xl border border-dashed transition-colors",
          dragOver
            ? "border-[var(--color-green)] bg-[var(--color-green)]/5"
            : "border-[var(--color-border)] bg-white",
        ].join(" ")}
      >
        {/* Preview or Empty */}
        {preview ? (
          <div className="relative aspect-square w-full max-w-[240px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          </div>
        ) : currentUrl ? (
          <div className="relative aspect-square w-full max-w-[240px]">
            <Image
              src={mediaUrl(currentUrl)}
              alt="Current photo"
              fill
              sizes="240px"
              className="object-cover"
              // unoptimized
            />
          </div>
        ) : (
          <div className="flex aspect-square w-full max-w-[240px] items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-[var(--color-ink-muted)]">
              <IconPhoto className="h-8 w-8" />
              <span className="text-sm">No photo</span>
            </div>
          </div>
        )}

        {/* Hover buttons */}
        <div className="absolute inset-0 hidden items-end justify-between gap-2 p-2 group-hover:flex">
          <div className="pointer-events-none" />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              <IconUpload className="mr-1 h-4 w-4" />
              {preview || currentUrl ? "Replace" : "Upload"}
            </Button>
            {(preview || currentUrl) && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={() => onFileChange(null)}
                title="Remove"
              >
                <IconX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile upload controls */}
      <div className="mt-2 flex gap-2 sm:hidden">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <IconUpload className="mr-1 h-4 w-4" />
          {preview || currentUrl ? "Replace photo" : "Upload photo"}
        </Button>
        {(preview || currentUrl) && (
          <Button type="button" variant="outline" onClick={() => onFileChange(null)}>
            <IconX className="mr-1 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        id="photo"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => validateAndSet(e.target.files)}
      />

      <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
        {note ?? "JPG/PNG/WEBP/GIF · max 3MB"}
      </p>

      {error && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
