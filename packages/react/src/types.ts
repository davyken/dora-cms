export type ContentType = "text" | "richtext" | "image" | "color";

export interface ContentItem {
  slotId: string;
  type: ContentType;
  value: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  coverImage?: string;
  publishedAt: string;
}

export interface DoraConfig {
  /** Identifies which site's content to load — lets one backend serve several sites. */
  siteId: string;
  /** Base URL of the dora-cms backend, e.g. https://api.yoursite.com or https://yoursite.com (Vercel functions). */
  apiUrl: string;
}
