/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DORA_SITE_ID?: string;
  readonly VITE_DORA_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
