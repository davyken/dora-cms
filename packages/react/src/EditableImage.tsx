import React, { useRef, useState } from "react";
import { useDora } from "./DoraProvider";

export interface EditableImageProps {
  /** Stable identifier for this image within the site, e.g. "logo" or "hero-image". */
  id: string;
  /** Default image shown until the client uploads a replacement. */
  src: string;
  alt: string;
  /**
   * Applied to the image's container, not the <img> itself — give it a
   * width/height (or aspect-ratio) here. The image always fills that box
   * via object-fit: cover, so an uploaded replacement with a different
   * aspect ratio gets cropped to fit instead of distorting the layout.
   */
  className?: string;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function EditableImage({ id, src, alt, className }: EditableImageProps) {
  const { content, isAdminMode, isAuthenticated, api, setContentValue, resetContentValue } = useDora();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stored = content[id];
  const currentSrc = stored ? stored.value : src;
  const canEdit = isAdminMode && isAuthenticated;
  const wrapperClassName = className ? `dora-editable-image ${className}` : "dora-editable-image";

  if (!canEdit) {
    return (
      <span className={wrapperClassName}>
        <img src={currentSrc} alt={alt} />
      </span>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setError("Image must be smaller than 5MB");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const { url } = await api.uploadImage(file);
      await setContentValue(id, "image", url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setError(null);
    try {
      await resetContentValue(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset image");
    } finally {
      setResetting(false);
    }
  };

  return (
    <span className={`${wrapperClassName} dora-editable-image--admin`}>
      <img src={currentSrc} alt={alt} />
      <span className="dora-editable-image-controls">
        <button
          type="button"
          className="dora-editable-image-trigger"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || resetting}
        >
          {uploading ? "Uploading…" : "Change image"}
        </button>
        {stored && (
          <button type="button" className="dora-editable-image-reset" onClick={handleReset} disabled={uploading || resetting}>
            {resetting ? "Resetting…" : "Reset"}
          </button>
        )}
      </span>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={handleFileChange} />
      {error && <span className="dora-editable-image-error">{error}</span>}
    </span>
  );
}
