const DEFAULT_BACKEND_URL = "https://img.connectiqworld.cloud/backend";

export function resolveBackendUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
  const selected = fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_BACKEND_URL;
  return selected.replace(/\/+$/, "");
}

export async function checkBackendHealth(signal?: AbortSignal): Promise<boolean> {
  const response = await fetch(`${resolveBackendUrl()}/health`, {
    method: "GET",
    signal
  });

  return response.ok;
}
