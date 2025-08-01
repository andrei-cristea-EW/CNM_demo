/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INTEGRAIL_BEARER_TOKEN: string
  readonly VITE_INTEGRAIL_ACCOUNT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}