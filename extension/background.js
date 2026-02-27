const DEFAULT_BACKEND_URL = "http://127.0.0.1:8787";
const LEGACY_LIVE_BACKEND_URL = "https://img.connectiqworld.cloud/backend";
const LIVE_BACKEND_URL = "https://imagetopromptgenerator.one/backend";
const OPENAI_MODEL = "gpt-4o-mini";
const ENABLED_KEY = "enabled";
const BACKEND_URL_KEY = "backendUrl";
const AUTH_TOKEN_KEY = "authToken";
const AUTH_USER_KEY = "authUser";
const AUTH_SUBSCRIPTION_KEY = "authSubscription";
const AUTH_USAGE_KEY = "authUsage";
const WEB_AUTH_TOKEN_STORAGE_KEY = "image_to_prompt_auth_token";
const MAX_FETCH_BYTES = 15 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20000;
const BACKEND_TIMEOUT_MS = 45000;
const LOCALHOST_WEB_APP_URL = "http://localhost:3000";
const LIVE_WEB_APP_URL = "https://imagetopromptgenerator.one";
const GOOGLE_WEB_LOGIN_TIMEOUT_MS = 4 * 60 * 1000;
const GOOGLE_WEB_LOGIN_POLL_MS = 1200;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(
    {
      [ENABLED_KEY]: false,
      [BACKEND_URL_KEY]: LIVE_BACKEND_URL
    },
    (stored) => {
      const patch = {};

      if (typeof stored[ENABLED_KEY] !== "boolean") {
        patch[ENABLED_KEY] = false;
      }

      try {
        const normalized = normalizeBackendUrl(stored[BACKEND_URL_KEY]);
        patch[BACKEND_URL_KEY] =
          normalized === LEGACY_LIVE_BACKEND_URL ? LIVE_BACKEND_URL : normalized;
      } catch {
        patch[BACKEND_URL_KEY] = LIVE_BACKEND_URL;
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

  if (message.type === "get-extension-state") {
    getExtensionStateSnapshot({ refresh: Boolean(message?.payload?.refresh) })
      .then((state) => {
        sendResponse({ ok: true, state });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: toUserError(error) });
      });
    return true;
  }

  if (message.type === "auth-signin" || message.type === "auth-signup") {
    const mode = message.type === "auth-signup" ? "signup" : "signin";
    handleAuthRequest(mode, message?.payload)
      .then((state) => {
        sendResponse({ ok: true, state });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: toUserError(error) });
      });
    return true;
  }

  if (message.type === "auth-google") {
    handleGoogleAuth()
      .then((state) => {
        sendResponse({ ok: true, state });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: toUserError(error) });
      });
    return true;
  }

  if (message.type === "refresh-auth-session") {
    refreshAuthSession()
      .then((state) => {
        sendResponse({ ok: true, state });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: toUserError(error) });
      });
    return true;
  }

  if (message.type === "list-saved-prompts") {
    listSavedPrompts(message?.payload)
      .then((prompts) => {
        sendResponse({ ok: true, prompts });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: toUserError(error) });
      });
    return true;
  }

  if (message.type === "save-prompt") {
    savePrompt(message?.payload)
      .then((result) => {
        sendResponse({ ok: true, ...result });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: toUserError(error) });
      });
    return true;
  }

  if (message.type === "auth-signout") {
    signOut()
      .then((state) => {
        sendResponse({ ok: true, state });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: toUserError(error) });
      });
    return true;
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

  if (message.type === "open-upgrade-page") {
    openUpgradePage(message?.payload)
      .then((payload) => {
        sendResponse({ ok: true, ...payload });
      })
      .catch((error) => {
        sendResponse({ ok: false, error: toUserError(error) });
      });
    return true;
  }

  if (message.type === "open-saved-prompts-page") {
    openSavedPromptsPage()
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
    .then((result) => {
      sendResponse({ ok: true, ...result });
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
  const stored = await storageGet({ [BACKEND_URL_KEY]: LIVE_BACKEND_URL });
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

  if ((parsed.hostname === "img.connectiqworld.cloud" || parsed.hostname === "imagetopromptgenerator.one") && parsed.protocol === "http:") {
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

async function openUpgradePage(payload) {
  const backendUrl = await getBackendUrl();
  const webBase = resolveWebAppUrlFromBackend(backendUrl);
  const targetPath = sanitizeWebAppPath(payload?.path);
  const url = new URL(targetPath, webBase);
  url.searchParams.set("source", "extension");
  url.searchParams.set("intent", targetPath === "/billing" ? "manage" : "upgrade");
  await createTab({ url: url.toString(), active: true });
  return { url: url.toString() };
}

async function openSavedPromptsPage() {
  const backendUrl = await getBackendUrl();
  const webBase = resolveWebAppUrlFromBackend(backendUrl);
  const url = new URL("/saved-prompts", webBase);
  url.searchParams.set("source", "extension");
  await createTab({ url: url.toString(), active: true });
  return { url: url.toString() };
}

function sanitizeWebAppPath(rawPath) {
  const value = typeof rawPath === "string" ? rawPath.trim() : "";
  if (value === "/billing") {
    return "/billing";
  }
  if (value === "/saved-prompts") {
    return "/saved-prompts";
  }
  return "/pricing";
}

async function handleAuthRequest(mode, payload) {
  const backendUrl = await getBackendUrl();
  const email = normalizeEmail(payload?.email);
  const password = typeof payload?.password === "string" ? payload.password : "";

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const authPayload = await requestAuthSession({
    backendUrl,
    mode,
    email,
    password
  });

  await persistAuthState({
    authToken: authPayload.token,
    user: authPayload.user,
    subscription: authPayload.subscription,
    usage: authPayload.usage
  });

  return getExtensionStateSnapshot();
}

async function handleGoogleAuth() {
  const backendUrl = await getBackendUrl();
  const authPayload = await requestGoogleSessionViaWebLogin({ backendUrl });

  await persistAuthState({
    authToken: authPayload.token,
    user: authPayload.user,
    subscription: authPayload.subscription,
    usage: authPayload.usage
  });

  return getExtensionStateSnapshot();
}

async function requestGoogleSessionViaWebLogin({ backendUrl }) {
  const loginUrl = buildWebLoginUrl(backendUrl);
  const loginTab = await createTab({ url: loginUrl, active: true });
  const tabId = toNullablePositiveInt(loginTab?.id);

  if (!tabId) {
    throw new Error("Could not open web login. Please open the web app and sign in.");
  }

  const deadline = Date.now() + GOOGLE_WEB_LOGIN_TIMEOUT_MS;
  let tokenMismatchHint = "";

  while (Date.now() < deadline) {
    const tab = await getTabIfExists(tabId);
    if (!tab) {
      throw new Error("Web login tab was closed before sign-in completed.");
    }

    const token = await readLocalStorageValueFromTab(tabId, WEB_AUTH_TOKEN_STORAGE_KEY);
    if (token) {
      try {
        const session = await fetchSession({
          backendUrl,
          authToken: token
        });

        await removeTab(tabId).catch(() => {});

        return {
          token,
          user: session.user,
          subscription: session.subscription,
          usage: session.usage
        };
      } catch (error) {
        if (isAuthorizationFailure(error)) {
          tokenMismatchHint =
            " Web app token does not match this backend. Ensure web and extension use the same backend URL.";
        } else {
          throw error;
        }
      }
    }

    await sleep(GOOGLE_WEB_LOGIN_POLL_MS);
  }

  throw new Error(
    `Timed out waiting for web login. Sign in on the opened page, then try again.${tokenMismatchHint}`
  );
}

function buildWebLoginUrl(backendUrl) {
  const webBase = resolveWebAppUrlFromBackend(backendUrl);
  const parsed = new URL(webBase);
  parsed.searchParams.set("source", "extension");
  parsed.searchParams.set("auth", "signin");
  return parsed.toString();
}

function resolveWebAppUrlFromBackend(backendUrl) {
  let parsed;
  try {
    parsed = new URL(backendUrl);
  } catch {
    return LOCALHOST_WEB_APP_URL;
  }

  if (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") {
    parsed.protocol = "http:";
    parsed.hostname = "localhost";
    parsed.port = "3000";
    parsed.pathname = "/";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  }

  if (parsed.hostname === "img.connectiqworld.cloud" || parsed.hostname === "imagetopromptgenerator.one") {
    return LIVE_WEB_APP_URL;
  }

  const trimmedPath = parsed.pathname.replace(/\/+$/, "");
  if (trimmedPath.endsWith("/backend")) {
    parsed.pathname = trimmedPath.slice(0, -"/backend".length) || "/";
  } else {
    parsed.pathname = "/";
  }

  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

async function refreshAuthSession() {
  const state = await readStoredState();
  if (!state.authToken) {
    throw new Error("Sign in required.");
  }

  try {
    const session = await fetchSession({
      backendUrl: state.backendUrl,
      authToken: state.authToken
    });

    await persistAuthState({
      authToken: state.authToken,
      user: session.user,
      subscription: session.subscription,
      usage: session.usage
    });
  } catch (error) {
    const status = Number(error?.status || 0);
    if (status === 402) {
      await storageSet({ [ENABLED_KEY]: false }).catch(() => {});
      try {
        const session = await fetchSession({
          backendUrl,
          authToken
        });
        const nextSubscription = mergePlanIntoSubscription(
          stored[AUTH_SUBSCRIPTION_KEY],
          session.subscription
        );
        await storageSet({
          [AUTH_USAGE_KEY]: normalizeUsageSnapshot(session.usage),
          [AUTH_SUBSCRIPTION_KEY]: nextSubscription
        });
      } catch {
        // Ignore profile refresh failures and still return an actionable error.
      }
      throw new Error("Credits exhausted for this month. Open extension popup and click Upgrade plan.");
    }

    if (isAuthorizationFailure(error)) {
      await clearAuthState();
      await storageSet({ [ENABLED_KEY]: false });
      throw new Error("Session expired. Sign in again.");
    }
    throw error;
  }

  return getExtensionStateSnapshot();
}

async function listSavedPrompts(payload) {
  const state = await readStoredState();
  if (!state.authToken) {
    throw new Error("Sign in required.");
  }

  const limitRaw = Number.parseInt(String(payload?.limit || 25), 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 25;

  const { response, payload: responsePayload } = await callBackendJson({
    backendUrl: state.backendUrl,
    path: `/api/prompts/saved?limit=${encodeURIComponent(String(limit))}`,
    method: "GET",
    authToken: state.authToken
  });

  if (!response.ok || !responsePayload?.ok) {
    const message = extractBackendError(responsePayload, `Could not load saved prompts (${response.status}).`);
    throw createHttpStatusError(response.status, message);
  }

  return normalizeSavedPromptList(responsePayload?.prompts);
}

async function savePrompt(payload) {
  const state = await readStoredState();
  if (!state.authToken) {
    throw new Error("Sign in required.");
  }

  const requestId = typeof payload?.requestId === "string" ? payload.requestId.trim() : "";
  const description = typeof payload?.description === "string" ? payload.description.trim() : "";
  const model = typeof payload?.model === "string" && payload.model.trim() ? payload.model.trim() : OPENAI_MODEL;
  const imageUrl = typeof payload?.imageUrl === "string" ? payload.imageUrl : "";
  const sourcePageUrl = typeof payload?.sourcePageUrl === "string" ? payload.sourcePageUrl : "";

  if (!requestId || !description) {
    throw new Error("requestId and description are required.");
  }

  try {
    const { response, payload: responsePayload } = await callBackendJson({
      backendUrl: state.backendUrl,
      path: "/api/prompts/saved",
      method: "POST",
      authToken: state.authToken,
      body: {
        requestId,
        model,
        description,
        imageUrl,
        sourcePageUrl
      }
    });

    if (!response.ok || !responsePayload?.ok) {
      const message = extractBackendError(responsePayload, `Could not save prompt (${response.status}).`);
      throw createHttpStatusError(response.status, message);
    }

    return {
      saved: true,
      requestId
    };
  } catch (error) {
    if (isAuthorizationFailure(error)) {
      await clearAuthState();
      await storageSet({ [ENABLED_KEY]: false });
      throw new Error("Session expired. Sign in again.");
    }
    throw error;
  }
}

async function signOut() {
  await clearAuthState();
  await storageSet({ [ENABLED_KEY]: false });
  return getExtensionStateSnapshot();
}

async function getExtensionStateSnapshot(options = {}) {
  const refresh = Boolean(options?.refresh);
  const snapshot = await readStoredState();

  if (!snapshot.authToken && snapshot.enabled) {
    await storageSet({ [ENABLED_KEY]: false });
    snapshot.enabled = false;
  }

  if (!refresh || !snapshot.authToken) {
    return toPublicState(snapshot);
  }

  try {
    const session = await fetchSession({
      backendUrl: snapshot.backendUrl,
      authToken: snapshot.authToken
    });

    await persistAuthState({
      authToken: snapshot.authToken,
      user: session.user,
      subscription: session.subscription,
      usage: session.usage
    });
  } catch (error) {
    if (isAuthorizationFailure(error)) {
      await clearAuthState();
      await storageSet({ [ENABLED_KEY]: false });
      const cleared = await readStoredState();
      return {
        ...toPublicState(cleared),
        authError: "Session expired. Sign in again."
      };
    }
    throw error;
  }

  const nextState = await readStoredState();
  return toPublicState(nextState);
}

async function readStoredState() {
  const stored = await storageGet({
    [ENABLED_KEY]: false,
    [BACKEND_URL_KEY]: LIVE_BACKEND_URL,
    [AUTH_TOKEN_KEY]: "",
    [AUTH_USER_KEY]: null,
    [AUTH_SUBSCRIPTION_KEY]: null,
    [AUTH_USAGE_KEY]: null
  });

  let backendUrl = LIVE_BACKEND_URL;
  try {
    backendUrl = normalizeBackendUrl(stored[BACKEND_URL_KEY]);
    if (backendUrl === LEGACY_LIVE_BACKEND_URL) {
      backendUrl = LIVE_BACKEND_URL;
      await storageSet({ [BACKEND_URL_KEY]: backendUrl });
    }
  } catch {
    backendUrl = LIVE_BACKEND_URL;
    await storageSet({ [BACKEND_URL_KEY]: backendUrl });
  }

  const authToken =
    typeof stored[AUTH_TOKEN_KEY] === "string" ? stored[AUTH_TOKEN_KEY].trim() : "";

  return {
    enabled: Boolean(stored[ENABLED_KEY]),
    backendUrl,
    authToken,
    user: normalizeUserSnapshot(stored[AUTH_USER_KEY]),
    subscription: normalizeSubscriptionSnapshot(stored[AUTH_SUBSCRIPTION_KEY]),
    usage: normalizeUsageSnapshot(stored[AUTH_USAGE_KEY])
  };
}

function toPublicState(state) {
  return {
    enabled: Boolean(state?.enabled),
    backendUrl: typeof state?.backendUrl === "string" ? state.backendUrl : LIVE_BACKEND_URL,
    isAuthenticated: Boolean(state?.authToken),
    user: normalizeUserSnapshot(state?.user),
    subscription: normalizeSubscriptionSnapshot(state?.subscription),
    usage: normalizeUsageSnapshot(state?.usage)
  };
}

async function persistAuthState({ authToken, user, subscription, usage }) {
  const normalizedToken = typeof authToken === "string" ? authToken.trim() : "";

  await storageSet({
    [AUTH_TOKEN_KEY]: normalizedToken,
    [AUTH_USER_KEY]: normalizedToken ? normalizeUserSnapshot(user) : null,
    [AUTH_SUBSCRIPTION_KEY]: normalizedToken ? normalizeSubscriptionSnapshot(subscription) : null,
    [AUTH_USAGE_KEY]: normalizedToken ? normalizeUsageSnapshot(usage) : null
  });
}

async function clearAuthState() {
  await storageSet({
    [AUTH_TOKEN_KEY]: "",
    [AUTH_USER_KEY]: null,
    [AUTH_SUBSCRIPTION_KEY]: null,
    [AUTH_USAGE_KEY]: null
  });
}

async function requestAuthSession({ backendUrl, mode, email, password }) {
  const { response, payload } = await callBackendJson({
    backendUrl,
    path: `/api/auth/${mode}`,
    method: "POST",
    body: {
      email,
      password
    }
  });

  if (!response.ok || !payload?.ok) {
    const message = extractBackendError(payload, `Authentication failed (${response.status}).`);
    throw createHttpStatusError(response.status, message);
  }

  const token = typeof payload?.token === "string" ? payload.token.trim() : "";
  if (!token) {
    throw new Error("Backend did not return an auth token.");
  }

  return {
    token,
    user: payload.user,
    subscription: payload.subscription,
    usage: payload.usage
  };
}

async function fetchSession({ backendUrl, authToken }) {
  const { response, payload } = await callBackendJson({
    backendUrl,
    path: "/api/me",
    method: "GET",
    authToken
  });

  if (!response.ok || !payload?.ok) {
    const message = extractBackendError(payload, `Could not load account (${response.status}).`);
    throw createHttpStatusError(response.status, message);
  }

  return {
    user: payload.user,
    subscription: payload.subscription,
    usage: payload.usage
  };
}

async function handleAnalyzeImageMessage(payload) {
  const stored = await storageGet({
    [ENABLED_KEY]: false,
    [AUTH_TOKEN_KEY]: "",
    [AUTH_SUBSCRIPTION_KEY]: null
  });

  if (!stored[ENABLED_KEY]) {
    throw new Error("Image analysis is disabled. Enable it from the extension popup.");
  }

  const authToken =
    typeof stored[AUTH_TOKEN_KEY] === "string" ? stored[AUTH_TOKEN_KEY].trim() : "";
  if (!authToken) {
    await storageSet({ [ENABLED_KEY]: false });
    throw new Error("Sign in required. Open the extension popup and sign in first.");
  }

  const backendUrl = await getBackendUrl();
  const imageDataUrl = await resolveImageDataUrl(payload);
  const altText = typeof payload?.altText === "string" ? payload.altText : "";

  try {
    const result = await requestVisionDescription({
      backendUrl,
      authToken,
      altText,
      imageDataUrl,
      imageUrl: typeof payload?.url === "string" ? payload.url : "",
      pageUrl: typeof payload?.pageUrl === "string" ? payload.pageUrl : ""
    });

    const nextSubscription = mergePlanIntoSubscription(
      stored[AUTH_SUBSCRIPTION_KEY],
      result.plan
    );

    await storageSet({
      [AUTH_USAGE_KEY]: result.usage,
      [AUTH_SUBSCRIPTION_KEY]: nextSubscription
    });

    return result;
  } catch (error) {
    if (isAuthorizationFailure(error)) {
      await clearAuthState();
      await storageSet({ [ENABLED_KEY]: false });
      throw new Error("Session expired. Sign in again.");
    }
    throw error;
  }
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

async function requestVisionDescription({ backendUrl, authToken, altText, imageDataUrl, imageUrl, pageUrl }) {
  const { response, payload } = await callBackendJson({
    backendUrl,
    path: "/api/describe-image",
    method: "POST",
    authToken,
    body: {
      model: OPENAI_MODEL,
      altText: typeof altText === "string" ? altText.trim() : "",
      imageDataUrl,
      imageUrl,
      pageUrl
    }
  });

  if (!response.ok || !payload?.ok) {
    const message = extractBackendError(payload, `Backend request failed (${response.status}).`);
    throw createHttpStatusError(response.status, message);
  }

  const description = extractDescription(payload);
  if (!description) {
    throw new Error("Backend returned no prompt output.");
  }
  const requestId = typeof payload?.requestId === "string" ? payload.requestId.trim() : "";
  if (!requestId) {
    throw new Error("Backend returned no request id.");
  }
  const model =
    typeof payload?.model === "string" && payload.model.trim() ? payload.model.trim() : OPENAI_MODEL;

  return {
    description,
    requestId,
    model,
    usage: normalizeUsageSnapshot(payload.usage),
    plan: normalizePlanSnapshot(payload.plan)
  };
}

async function callBackendJson({ backendUrl, path, method, authToken, body }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  const headers = {
    "Content-Type": "application/json"
  };

  if (typeof authToken === "string" && authToken.trim()) {
    headers.Authorization = `Bearer ${authToken.trim()}`;
  }

  let response;
  try {
    response = await fetch(`${backendUrl}${path}`, {
      method,
      headers,
      signal: controller.signal,
      body: body ? JSON.stringify(body) : undefined
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
  return { response, payload };
}

function extractDescription(payload) {
  if (typeof payload?.description === "string") {
    return payload.description.trim();
  }

  return "";
}

function extractBackendError(payload, fallback) {
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }
  return fallback;
}

function createHttpStatusError(status, message) {
  const error = new Error(message);
  error.status = Number.isFinite(Number(status)) ? Number(status) : 500;
  return error;
}

function isAuthorizationFailure(error) {
  const status = Number(error?.status || 0);
  return status === 401 || status === 403;
}

function normalizeUserSnapshot(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = toNullablePositiveInt(raw.id);
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const role = typeof raw.role === "string" ? raw.role.trim().toLowerCase() : "subscriber";
  const status = typeof raw.status === "string" ? raw.status.trim().toLowerCase() : "active";

  if (!id || !email) {
    return null;
  }

  return {
    id,
    email,
    role,
    status
  };
}

function normalizeSubscriptionSnapshot(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const planCode = normalizeUserPlanCode(raw.planCode || raw.code) || "free";
  const planNameSource =
    typeof raw.planName === "string" && raw.planName.trim()
      ? raw.planName.trim()
      : typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim()
        : planNameFromCode(planCode);

  return {
    id: toNullablePositiveInt(raw.id),
    userId: toNullablePositiveInt(raw.userId),
    planCode,
    planName: planNameSource,
    status: typeof raw.status === "string" && raw.status.trim() ? raw.status.trim().toLowerCase() : "active",
    monthlyQuota: toNullableNonNegativeInt(raw.monthlyQuota),
    priceUsdCents: toNonNegativeInt(raw.priceUsdCents),
    renewsAt: typeof raw.renewsAt === "string" && raw.renewsAt.trim() ? raw.renewsAt.trim() : null
  };
}

function normalizePlanSnapshot(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const code = normalizeAnyPlanCode(raw.code || raw.planCode);
  if (!code) {
    return null;
  }

  return {
    code,
    name:
      typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : planNameFromCode(code),
    monthlyQuota: toNullableNonNegativeInt(raw.monthlyQuota),
    priceUsdCents: toNonNegativeInt(raw.priceUsdCents)
  };
}

function normalizeUsageSnapshot(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const used = toNonNegativeInt(raw.used);
  const limit = toNullableNonNegativeInt(raw.limit);
  const remaining =
    limit === null
      ? null
      : toNullableNonNegativeInt(raw.remaining) ?? Math.max(0, limit - used);

  return {
    periodKey: typeof raw.periodKey === "string" ? raw.periodKey : "",
    used,
    limit,
    remaining
  };
}

function normalizeSavedPromptList(rawPrompts) {
  if (!Array.isArray(rawPrompts)) {
    return [];
  }

  return rawPrompts
    .map((rawPrompt) => normalizeSavedPromptItem(rawPrompt))
    .filter((entry) => Boolean(entry));
}

function normalizeSavedPromptItem(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = toNullablePositiveInt(raw.id);
  const requestId = typeof raw.requestId === "string" ? raw.requestId.trim() : "";
  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  const model = typeof raw.model === "string" ? raw.model.trim() : "";
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt.trim() : "";
  const imageUrl = typeof raw.imageUrl === "string" ? raw.imageUrl.trim() : "";
  const sourcePageUrl = typeof raw.sourcePageUrl === "string" ? raw.sourcePageUrl.trim() : "";

  if (!id || !description) {
    return null;
  }

  return {
    id,
    requestId,
    description,
    model,
    createdAt,
    imageUrl,
    sourcePageUrl
  };
}

function mergePlanIntoSubscription(currentSubscriptionRaw, planRaw) {
  const currentSubscription = normalizeSubscriptionSnapshot(currentSubscriptionRaw);
  const plan = normalizePlanSnapshot(planRaw);

  if (!plan) {
    return currentSubscription;
  }

  const userPlanCode = normalizeUserPlanCode(plan.code) || currentSubscription?.planCode || "free";

  return {
    id: currentSubscription?.id ?? null,
    userId: currentSubscription?.userId ?? null,
    planCode: userPlanCode,
    planName: plan.name || currentSubscription?.planName || planNameFromCode(userPlanCode),
    status: currentSubscription?.status || "active",
    monthlyQuota: plan.monthlyQuota,
    priceUsdCents: plan.priceUsdCents,
    renewsAt: currentSubscription?.renewsAt ?? null
  };
}

function normalizeAnyPlanCode(value) {
  const code = typeof value === "string" ? value.trim().toLowerCase() : "";
  return code === "guest" || code === "free" || code === "pro" || code === "unlimited"
    ? code
    : "";
}

function normalizeUserPlanCode(value) {
  const code = typeof value === "string" ? value.trim().toLowerCase() : "";
  return code === "free" || code === "pro" || code === "unlimited" ? code : "";
}

function planNameFromCode(code) {
  if (code === "guest") {
    return "Guest";
  }
  if (code === "pro") {
    return "Pro";
  }
  if (code === "unlimited") {
    return "Unlimited";
  }
  return "Free";
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function toNullablePositiveInt(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toNonNegativeInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toNullableNonNegativeInt(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function createTab(createProperties) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create(createProperties, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(tab || null);
    });
  });
}

function getTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(tab || null);
    });
  });
}

async function getTabIfExists(tabId) {
  try {
    return await getTab(tabId);
  } catch (error) {
    const message = typeof error?.message === "string" ? error.message.trim() : "";
    if (/No tab with id|Tabs cannot be edited right now/i.test(message)) {
      return null;
    }
    throw error;
  }
}

function removeTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.remove(tabId, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

function executeScript(injection) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(injection, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(Array.isArray(result) ? result : []);
    });
  });
}

async function readLocalStorageValueFromTab(tabId, key) {
  try {
    const injectionResults = await executeScript({
      target: { tabId },
      func: (storageKey) => {
        try {
          const raw = window.localStorage.getItem(storageKey);
          return typeof raw === "string" ? raw.trim() : "";
        } catch {
          return "";
        }
      },
      args: [key]
    });

    const value = injectionResults[0]?.result;
    return typeof value === "string" ? value.trim() : "";
  } catch (error) {
    const message = typeof error?.message === "string" ? error.message.trim() : "";
    if (
      /No tab with id|The tab was closed|Cannot access contents of url|Missing host permission|Cannot access a chrome/i.test(
        message
      )
    ) {
      return "";
    }
    throw error;
  }
}

function sleep(durationMs) {
  const delayMs = Number.isFinite(Number(durationMs)) ? Math.max(0, Number(durationMs)) : 0;
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
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
