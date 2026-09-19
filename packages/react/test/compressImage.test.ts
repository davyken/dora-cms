import { describe, expect, it } from "vitest";
import { compressImage } from "../src/compressImage";

describe("compressImage", () => {
  it("returns GIFs unchanged, to preserve animation", async () => {
    const file = new File(["fake-gif-bytes"], "party.gif", { type: "image/gif" });
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it("falls back to the original file when the browser can't decode the image", async () => {
    // jsdom has no real createImageBitmap/canvas decoder, so this exercises
    // the same safety net a corrupt or unsupported upload would hit.
    const file = new File(["not-actually-an-image"], "photo.png", { type: "image/png" });
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it("never throws, even for an empty file", async () => {
    const file = new File([], "empty.jpg", { type: "image/jpeg" });
    await expect(compressImage(file)).resolves.toBe(file);
  });
});
