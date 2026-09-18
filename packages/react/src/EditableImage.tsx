import React, { useRef, useState } from "react";
import { useDora } from "./DoraProvider";

export interface EditableImageProps {
  /** Stable identifier for this image within the site, e.g. "logo" or "hero-image". */
  id: string;
  /** Default image shown until the client uploads a replacement. */
  src: string;
  alt: string;
  className?: string;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function EditableImage({ id, src, alt, className }: EditableImageProps) {
  const { content, isAdminMode, isAuthenticated, api, setContentValue } = useDora();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stored = content[id];
  const currentSrc = stored ? stored.value : src;
  const canEdit = isAdminMode && isAuthenticated;

  if (!canEdit) {
    return <img src={currentSrc} alt={alt} className={className} />;
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

  return (
    <span className="dora-editable-image">
      <img src={currentSrc} alt={alt} className={className} />
      <button
        type="button"
        className="dora-editable-image-trigger"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : "Change image"}
      </button>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={handleFileChange} />
      {error && <span className="dora-editable-image-error">{error}</span>}
    </span>
  );
}
