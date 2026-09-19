import React, { useEffect, useRef, useState } from "react";
import { compressImage } from "./compressImage";
import { useDora } from "./DoraProvider";
import { MediaPicker } from "./MediaPicker";
import { seoSlotIds } from "./seo";

export interface SeoFieldsProps {
  /** Distinguishes this page's SEO values on a multi-page site. Defaults to "default". */
  page?: string;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * Collapsible admin panel letting the client edit a page's title, meta
 * description, and social-share (OG) image — saved as ordinary content
 * slots scoped by `page`, so a multi-page site can give each page its own
 * values. Pair with useSeo()/<DoraHead> to actually apply them. Renders
 * nothing outside admin mode / before login.
 */
export function SeoFields({ page = "default" }: SeoFieldsProps) {
  const { content, isAdminMode, isAuthenticated, api, setContentValue, resetContentValue } = useDora();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const slots = seoSlotIds(page);
  const storedTitle = content[slots.title]?.value ?? "";
  const storedDescription = content[slots.description]?.value ?? "";
  const ogImage = content[slots.ogImage]?.value;

  // Local drafts, saved on blur rather than on every keystroke — the same
  // approach as <Editable>, so typing a title doesn't fire a save per
  // character. Synced back whenever the saved value itself changes (first
  // load, or after a save elsewhere).
  const [title, setTitle] = useState(storedTitle);
  const [description, setDescription] = useState(storedDescription);
  useEffect(() => setTitle(storedTitle), [storedTitle]);
  useEffect(() => setDescription(storedDescription), [storedDescription]);

  if (!isAdminMode || !isAuthenticated) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const uploadable = await compressImage(file);
      const { url } = await api.uploadImage(uploadable);
      await setContentValue(slots.ogImage, "image", url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handlePick = async (url: string) => {
    setPickerOpen(false);
    setError(null);
    try {
      await setContentValue(slots.ogImage, "image", url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use that image");
    }
  };

  return (
    <div className={open ? "dora-seo-fields dora-seo-fields--open" : "dora-seo-fields"}>
      <button type="button" className="dora-seo-fields-toggle" onClick={() => setOpen((prev) => !prev)} aria-expanded={open}>
        SEO {open ? "▾" : "▸"}
      </button>
      {open && (
        <div className="dora-seo-fields-panel">
          <p className="dora-seo-fields-heading">Page SEO — "{page}"</p>
          <label>
            Page title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title !== storedTitle && setContentValue(slots.title, "text", title)}
              placeholder="Shown in the browser tab and search results"
            />
          </label>
          <label>
            Meta description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== storedDescription && setContentValue(slots.description, "text", description)}
              placeholder="One or two sentences shown under the title in search results"
              rows={3}
            />
          </label>
          <label>
            Social share image (OG image)
            {ogImage && <img src={ogImage} alt="Social share image preview" className="dora-seo-fields-og-preview" />}
            <div className="dora-seo-fields-og-actions">
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading…" : ogImage ? "Replace image" : "Upload image"}
              </button>
              <button type="button" onClick={() => setPickerOpen(true)} disabled={uploading}>
                Choose existing
              </button>
              {ogImage && (
                <button type="button" onClick={() => resetContentValue(slots.ogImage)} disabled={uploading}>
                  Remove
                </button>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={handleImageChange} />
          </label>
          {error && <p className="dora-seo-fields-error">{error}</p>}
        </div>
      )}
      {pickerOpen && <MediaPicker onSelect={handlePick} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
