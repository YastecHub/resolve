/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ICONS_MODE?: 'api' | 'offline';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
