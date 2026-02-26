const DEFAULT_BACKEND_URL = "https://img.connectiqworld.cloud/backend";
const OPENAI_MODEL = "gpt-4o-mini";
const ENABLED_KEY = "enabled";
const BACKEND_URL_KEY = "backendUrl";
const MAX_FETCH_BYTES = 15 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20000;
const BACKEND_TIMEOUT_MS = 45000;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(
    {
      [ENABLED_KEY]: false,
      [BACKEND_URL_KEY]: DEFAULT_BACKEND_URL
    },
    (stored) => {
      const patch = {};

      if (typeof stored[ENABLED_KEY] !== "boolean") {
        patch[ENABLED_KEY] = false;
      }

      try {
        patch[BACKEND_URL_KEY] = normalizeBackendUrl(stored[BACKEND_URL_KEY]);
      } catch {
        patch[BACKEND_URL_KEY] = DEFAULT_BACKEND_URL;
      }

      if (Object.keys(patch).length) {
        chrome.storage.local.set(patch);
      }
    }
  );
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    return;
  }

  if (message.type === "toggle-enabled") {
    sendResponse({ ok: true });
    return;
  }

  if (message.type === "set-backend-url") {
    setBackendUrl(String(message?.payload?.backendUrl || ""))
      .then((backendUrl) => {
        sendResponse({ ok: true, backendUrl });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: toUserError(error) });
      });
    return true;
  }

  if (message.type === "check-backend-health") {
    checkBackendHealth()
      .then((payload) => {
        sendResponse({ ok: true, ...payload });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: toUserError(error) });
      });
    return true;
  }

  if (message.type !== "analyze-image") {
    return;
  }

  handleAnalyzeImageMessage(message.payload)
    .then((description) => {
      sendResponse({ ok: true, description });
    })
    .catch((error) => {
      sendResponse({ ok: false, error: toUserError(error) });
    });

  return true;
});

async function setBackendUrl(rawUrl) {
  const backendUrl = normalizeBackendUrl(rawUrl);
  await storageSet({ [BACKEND_URL_KEY]: backendUrl });
  return backendUrl;
}

async function getBackendUrl() {
  const stored = await storageGet({ [BACKEND_URL_KEY]: DEFAULT_BACKEND_URL });
  return normalizeBackendUrl(stored[BACKEND_URL_KEY]);
}

function normalizeBackendUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    throw new Error("Backend URL is required.");
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Backend URL is invalid.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Backend URL must use http or https.");
  }

  if (parsed.hostname === "img.connectiqworld.cloud" && parsed.protocol === "http:") {
    parsed.protocol = "https:";
  }

  const path = parsed.pathname.replace(/\/+$/, "");
  return `${parsed.origin}${path && path !== "/" ? path : ""}`;
}

async function checkBackendHealth() {
  const backendUrl = await getBackendUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let response;
  try {
    response = await fetch(`${backendUrl}/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store"
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error?.name === "AbortError") {
      throw new Error("Backend health check timed out.");
    }
    const detail = normalizeNetworkErrorDetail(error, backendUrl);
    throw new Error(`Could not reach backend at ${backendUrl}.${detail}`);
  }

  clearTimeout(timeout);
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(`Backend health check failed (${response.status}).`);
  }

  return {
    backendUrl,
    message: `Connected to backend (${payload.service || "image-analyser-backend"}).`
  };
}

async function handleAnalyzeImageMessage(payload) {
  const stored = await storageGet({ [ENABLED_KEY]: false });
  if (!stored[ENABLED_KEY]) {
    throw new Error("Image analysis is disabled. Enable it from the extension popup.");
  }

  const backendUrl = await getBackendUrl();
  const imageDataUrl = await resolveImageDataUrl(payload);
  const prompt = buildPrompt(payload);
  return requestVisionDescription({
    backendUrl,
    prompt,
    imageDataUrl,
    imageUrl: typeof payload?.url === "string" ? payload.url : "",
    pageUrl: typeof payload?.pageUrl === "string" ? payload.pageUrl : ""
  });
}

async function resolveImageDataUrl(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("No image payload was received.");
  }

  if (typeof payload.dataUrl === "string" && payload.dataUrl.startsWith("data:image/")) {
    return payload.dataUrl;
  }

  if (typeof payload.url !== "string" || !payload.url.trim()) {
    throw new Error("The clicked image did not provide a usable URL.");
  }

  const imageUrl = payload.url.trim();
  if (imageUrl.startsWith("data:image/")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("blob:")) {
    throw new Error("Blob image URLs are not directly accessible. Open image in a new tab and retry.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    throw new Error("The image URL is invalid.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Only http/https image URLs are supported.");
  }

  const blob = await fetchImageBlob(parsedUrl.toString(), payload.pageUrl);
  return blobToDataUrl(blob);
}

async function fetchImageBlob(url, pageUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;
  const requestOptions = {
    method: "GET",
    signal: controller.signal,
    redirect: "follow",
    cache: "no-store",
    credentials: "include"
  };

  if (typeof pageUrl === "string" && /^https?:\/\//i.test(pageUrl)) {
    requestOptions.referrer = pageUrl;
  }

  try {
    response = await fetch(url, requestOptions);
  } catch (error) {
    clearTimeout(timeout);
    if (error?.name === "AbortError") {
      throw new Error("Timed out while downloading the image.");
    }
    throw new Error("Could not download the image for analysis.");
  }

  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`Image download failed (${response.status}).`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_FETCH_BYTES) {
    throw new Error("The image is too large to process.");
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType && !contentType.startsWith("image/")) {
    throw new Error("The clicked URL did not return an image.");
  }

  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) {
    throw new Error("The downloaded data is not an image.");
  }

  if (blob.size > MAX_FETCH_BYTES) {
    throw new Error("The image is too large to process.");
  }

  return blob;
}

async function blobToDataUrl(blob) {
  const mimeType = blob.type || "image/jpeg";
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuffer);
  return `data:${mimeType};base64,${base64}`;
}

function arrayBufferToBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

const DEFAULT_IMAGE_PROMPT = `You are a professional photographer and visual editor.
Write a minimal, premium image description for the given image.

Guidelines:
Keep the tone human, natural, and emotionally aware.
Write as if a seasoned photographer is describing the moment.
No fluff, no jargon, no buzzwords, no clichés.
Avoid over-explanation or technical specs unless essential to mood.
Focus on what is felt, seen, and implied in the frame.
Keep it concise (2–4 sentences max).
Make it sound refined, calm, and intentional.
Do not use hashtags, emojis, or marketing language.
Do not invent context that cannot be inferred from the image.
Let the description feel premium, subtle, and observant.`;

function buildPrompt(payload) {
  const altText = typeof payload?.altText === "string" ? payload.altText.trim() : "";
  if (!altText) {
    return DEFAULT_IMAGE_PROMPT;
  }
  return `${DEFAULT_IMAGE_PROMPT}\n\nContext (alt text from page): "${altText}"`;
}

async function requestVisionDescription({ backendUrl, prompt, imageDataUrl, imageUrl, pageUrl }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${backendUrl}/api/describe-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        prompt,
        imageDataUrl,
        imageUrl,
        pageUrl
      })
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error?.name === "AbortError") {
      throw new Error("Backend request timed out. Try again.");
    }
    const detail = normalizeNetworkErrorDetail(error, backendUrl);
    throw new Error(`Could not reach backend at ${backendUrl}.${detail}`);
  }

  clearTimeout(timeout);

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    const message = typeof payload?.error === "string" ? payload.error : "";
    throw new Error(message || `Backend request failed (${response.status}).`);
  }

  const text = extractDescription(payload);
  if (!text) {
    throw new Error("Backend returned no description.");
  }

  return text;
}

function extractDescription(payload) {
  if (typeof payload?.description === "string") {
    return payload.description.trim();
  }

  return "";
}

function toUserError(error) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  return message || "Image analysis failed.";
}

function normalizeNetworkErrorDetail(error, backendUrl) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  const insecureRemoteUrl =
    typeof backendUrl === "string" &&
    backendUrl.startsWith("http://") &&
    !backendUrl.startsWith("http://127.0.0.1") &&
    !backendUrl.startsWith("http://localhost");

  if (insecureRemoteUrl && (!message || /failed to fetch/i.test(message))) {
    return " Browser likely blocked remote HTTP (or HSTS upgraded it). Use HTTPS with a valid certificate for this host.";
  }

  if (!message) {
    return " Check backend URL and ensure server is running.";
  }

  if (/ERR_CERT|certificate|SSL|TLS/i.test(message)) {
    return ` SSL/certificate issue: ${message}`;
  }

  if (/mixed content|blocked/i.test(message)) {
    return ` Browser blocked insecure request: ${message}`;
  }

  return ` ${message}`;
}

function storageGet(defaults) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(defaults, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result || {});
    });
  });
}

function storageSet(value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(value, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}
