const ENABLED_KEY = "enabled";

const enabledToggle = document.getElementById("enabledToggle");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");

init().catch((error) => {
  showError(`Failed to load settings: ${error.message}`);
});

async function init() {
  const stored = await storageGet({ [ENABLED_KEY]: false });
  const enabled = Boolean(stored[ENABLED_KEY]);

  enabledToggle.checked = enabled;
  setStatus(enabled ? "Image analysis is ON." : "Image analysis is OFF.");
  clearError();

  enabledToggle.addEventListener("change", onToggleChanged);
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
