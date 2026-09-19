import React, { useEffect, useState } from "react";
import { useDora } from "./DoraProvider";
import type { MediaItem } from "./types";

export interface MediaPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

/**
 * Full-viewport overlay listing every image the client has ever uploaded to
 * this site (see GET /media), so they can reuse one instead of always
 * uploading a new file. A fixed overlay rather than an inline dropdown
 * since <EditableImage>/<SeoFields> can be mounted anywhere in an
 * arbitrary page layout — an overlay avoids fighting that layout for space.
 */
export function MediaPicker({ onSelect, onClose }: MediaPickerProps) {
  const { api } = useDora();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMedia()
      .then(({ items }) => setItems(items))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load media"))
      .finally(() => setLoading(false));
  }, [api]);

  return (
    <div className="dora-media-picker-backdrop" onClick={onClose}>
      <div className="dora-media-picker" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Choose an image">
        <div className="dora-media-picker-header">
          <span>Choose an image</span>
          <button type="button" className="dora-media-picker-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {loading && <p className="dora-media-picker-status">Loading…</p>}
        {error && <p className="dora-media-picker-status dora-media-picker-error">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="dora-media-picker-status">No uploads yet — upload an image first.</p>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="dora-media-picker-grid">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="dora-media-picker-item"
                onClick={() => onSelect(item.url)}
              >
                <img src={item.url} alt="Uploaded image" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
