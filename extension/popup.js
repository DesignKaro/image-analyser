const ENABLED_KEY = "enabled";
const BACKEND_URL_KEY = "backendUrl";
const DEFAULT_BACKEND_URL = "http://127.0.0.1:8787";

const enabledToggle = document.getElementById("enabledToggle");
const backendUrlInput = document.getElementById("backendUrl");
const saveBackendButton = document.getElementById("saveBackend");
const testBackendButton = document.getElementById("testBackend");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");

init().catch((error) => {
  showError(`Failed to load settings: ${error.message}`);
});

async function init() {
  const stored = await storageGet({
    [ENABLED_KEY]: false,
    [BACKEND_URL_KEY]: DEFAULT_BACKEND_URL
  });

  const enabled = Boolean(stored[ENABLED_KEY]);
  const backendUrl = safeNormalize(stored[BACKEND_URL_KEY], DEFAULT_BACKEND_URL);

  enabledToggle.checked = enabled;
  backendUrlInput.value = backendUrl;
  setStatus(enabled ? "Image analysis is ON." : "Image analysis is OFF.");
  clearError();

  enabledToggle.addEventListener("change", onToggleChanged);
  saveBackendButton.addEventListener("click", onSaveBackendClicked);
  testBackendButton.addEventListener("click", onTestBackendClicked);
  backendUrlInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSaveBackendClicked();
    }
  });
}

async function onToggleChanged(event) {
  const enabled = Boolean(event.target.checked);
  clearError();

  try {
    await storageSet({ [ENABLED_KEY]: enabled });

    if (enabled) {
      const injected = await ensureContentReadyInActiveTab();
      if (!injected.ok) {
        showError(injected.reason);
      }
    }

    await notifyActiveTabEnabled(enabled);
    setStatus(enabled ? "Image analysis is ON." : "Image analysis is OFF.");

    // Best effort ping so background wakes up immediately.
    sendRuntimeMessage({ type: "toggle-enabled", enabled }).catch(() => {});
  } catch (error) {
    showError(`Could not save preference: ${error.message}`);
  }
}

async function onSaveBackendClicked() {
  clearError();

  try {
    const backendUrl = normalizeBackendUrl(backendUrlInput.value);
    const response = await sendRuntimeMessage({
      type: "set-backend-url",
      payload: { backendUrl }
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not save backend URL.");
    }

    backendUrlInput.value = response.backendUrl;
    setStatus(`Backend URL saved: ${response.backendUrl}`);
  } catch (error) {
    showError(`Invalid backend URL: ${error.message}`);
  }
}

async function onTestBackendClicked() {
  clearError();

  try {
    const backendUrl = normalizeBackendUrl(backendUrlInput.value);
    const setResponse = await sendRuntimeMessage({
      type: "set-backend-url",
      payload: { backendUrl }
    });

    if (!setResponse?.ok) {
      throw new Error(setResponse?.error || "Could not save backend URL.");
    }

    const response = await sendRuntimeMessage({ type: "check-backend-health" });
    if (!response?.ok) {
      throw new Error(response?.error || "Backend health check failed.");
    }

    backendUrlInput.value = response.backendUrl;
    setStatus(response.message || "Backend is reachable.");
  } catch (error) {
    showError(error.message || "Backend health check failed.");
  }
}

function normalizeBackendUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    throw new Error("Backend URL is required.");
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Enter a valid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("URL must start with http:// or https://.");
  }

  const path = parsed.pathname.replace(/\/+$/, "");
  return `${parsed.origin}${path && path !== "/" ? path : ""}`;
}

function safeNormalize(value, fallback) {
  try {
    return normalizeBackendUrl(value);
  } catch {
    return fallback;
  }
}

function setStatus(message) {
  statusEl.textContent = message;
}

function showError(message) {
  errorEl.textContent = message;
}

function clearError() {
  errorEl.textContent = "";
}

async function ensureContentReadyInActiveTab() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return { ok: false, reason: "No active tab found." };
  }

  if (!isSupportedTabUrl(tab.url || "")) {
    return { ok: false, reason: "This page does not allow extension scripts." };
  }

  try {
    const ping = await sendTabMessage(tab.id, { type: "ping-content" });
    if (ping?.ok) {
      return { ok: true };
    }
  } catch {
    // Content script is not injected yet.
  }

  try {
    await insertTabCss(tab.id, ["content.css"]).catch(() => {});
    await executeTabScript(tab.id, ["content.js"]);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: `Enabled, but script injection failed on this tab: ${error.message}`
    };
  }
}

async function notifyActiveTabEnabled(enabled) {
  const tab = await getActiveTab();
  if (!tab?.id || !isSupportedTabUrl(tab.url || "")) {
    return;
  }

  await sendTabMessage(tab.id, { type: "set-enabled", enabled }).catch(() => {});
}

function isSupportedTabUrl(url) {
  if (!url) {
    return false;
  }

  return !/^(chrome|chrome-extension|edge|about|view-source):/i.test(url);
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

function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(Array.isArray(tabs) ? tabs[0] : null);
    });
  });
}

function sendTabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function executeTabScript(tabId, files) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        files
      },
      () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      }
    );
  });
}

function insertTabCss(tabId, files) {
  return new Promise((resolve, reject) => {
    chrome.scripting.insertCSS(
      {
        target: { tabId },
        files
      },
      () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      }
    );
  });
}
