import { useDora } from "./DoraProvider";

export interface SeoValues {
  title: string;
  description: string;
  ogImage: string;
}

export function seoSlotIds(page: string): { title: string; description: string; ogImage: string } {
  return {
    title: `seo:${page}:title`,
    description: `seo:${page}:description`,
    ogImage: `seo:${page}:ogImage`,
  };
}

/**
 * Reads the client-editable SEO values for a page, falling back to whatever
 * defaults the developer coded — so a page with nothing saved yet still
 * renders sensible tags. Framework-agnostic on purpose: dora-cms doesn't
 * control how your app renders <head> (Next's Head, react-helmet, plain
 * DOM), so this just hands back data. For a plain client-rendered SPA,
 * <DoraHead> below applies these directly with no extra wiring.
 */
export function useSeo(page: string | undefined, defaults: SeoValues): SeoValues {
  const { content } = useDora();
  const slots = seoSlotIds(page ?? "default");
  return {
    title: content[slots.title]?.value ?? defaults.title,
    description: content[slots.description]?.value ?? defaults.description,
    ogImage: content[slots.ogImage]?.value ?? defaults.ogImage,
  };
}
