/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 代理目标地址（开发环境） */
  readonly VITE_API_PROXY_TARGET: string

  /** API 基础路径 */
  readonly VITE_API_BASE_URL: string

  /** localStorage 中存储 Token 的 Key */
  readonly VITE_TOKEN_KEY: string

  /** localStorage 中存储用户信息的 Key */
  readonly VITE_USER_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
