import { useEffect } from "react";
import { useSeo, type SeoValues } from "./seo";

export interface DoraHeadProps extends SeoValues {
  /** Matches the `page` prop passed to <SeoFields> for this page. Defaults to "default". */
  page?: string;
}

function upsertMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

/**
 * Applies the client-editable title/description/OG image directly to
 * `document.title` and the page's <meta> tags. Works for a plain
 * client-rendered SPA (like this package's own demo) with zero extra
 * wiring. This mutates the DOM after hydration, so it does NOT affect the
 * markup a crawler sees before JS runs — for a server-rendered framework
 * (Next.js, Remix, ...), use useSeo() instead and feed its result into
 * your framework's own head-management API (e.g. Next's `<Head>`), which
 * runs on the server and doesn't have that gap.
 */
export function DoraHead({ page, title, description, ogImage }: DoraHeadProps) {
  const seo = useSeo(page, { title, description, ogImage });

  useEffect(() => {
    document.title = seo.title;
    upsertMeta("name", "description", seo.description);
    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:description", seo.description);
    if (seo.ogImage) upsertMeta("property", "og:image", seo.ogImage);
  }, [seo.title, seo.description, seo.ogImage]);

  return null;
}
