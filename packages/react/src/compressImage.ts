const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Downscales and re-encodes an image client-side before upload, so a
 * client dropping in an unedited 12MP phone photo doesn't ship a
 * multi-megabyte file straight to storage and the site's visitors. Skips
 * GIFs (would destroy animation) and anything canvas can't decode —
 * those upload as-is, still bounded by EditableImage's own size check.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1 && file.size <= 400 * 1024) {
      // Already small and no resize needed — not worth re-encoding.
      bitmap.close();
      return file;
    }

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, outputType === "image/jpeg" ? JPEG_QUALITY : undefined)
    );
    if (!blob || blob.size >= file.size) return file;

    const ext = outputType === "image/png" ? "png" : "jpg";
    return new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), { type: outputType });
  } catch {
    // Compression is a best-effort optimization — any failure (unsupported
    // format, canvas restrictions) just falls back to the original file.
    return file;
  }
}
