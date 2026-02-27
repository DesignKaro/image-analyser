export const LIVE_BACKEND_URL = "https://imagetopromptgenerator.one/backend";
export const LOCALHOST_BACKEND_URL = "http://127.0.0.1:8787";

export const DEFAULT_BACKEND_URL =
  process.env.NEXT_PUBLIC_USE_LOCALHOST === "false" ? LIVE_BACKEND_URL : LOCALHOST_BACKEND_URL;

export const AUTH_TOKEN_STORAGE_KEY = "image_to_prompt_auth_token";
export const SHRINK_DISTANCE = 220;

export function resolveBackendUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  const base = explicit || DEFAULT_BACKEND_URL;
  return base.replace(/\/+$/, "");
}
