const ENABLED_KEY = "enabled";
const OVERLAY_ID = "ia-overlay-root";
const MAX_CANVAS_EDGE = 1200;
const AUTO_HIDE_MS = 18000;
const INIT_FLAG = "__IA_CONTENT_INITIALIZED__";

let isEnabled = false;
let activeRequestId = 0;
let hideTimer = null;
let actionFeedbackTimer = null;

if (window[INIT_FLAG]) {
  syncEnabledState().catch((error) => {
    console.error("[Image to Prompt] Sync error:", error);
  });
} else {
  window[INIT_FLAG] = true;
  bootstrap().catch((error) => {
    console.error("[Image to Prompt] Initialization error:", error);
  });
}

async function bootstrap() {
  await syncEnabledState();

  document.addEventListener("click", onDocumentClick, true);
  document.addEventListener("keydown", onKeyDown, true);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[ENABLED_KEY]) {
      return;
    }

    isEnabled = Boolean(changes[ENABLED_KEY].newValue);
    setEnabledVisualState(isEnabled);
    if (!isEnabled) {
      hideOverlay();
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== "object") {
      return;
    }

    if (message.type === "ping-content") {
      sendResponse({ ok: true, enabled: isEnabled });
      return;
    }

    if (message.type === "set-enabled") {
      isEnabled = Boolean(message.enabled);
      setEnabledVisualState(isEnabled);
      if (!isEnabled) {
        hideOverlay();
      }
      sendResponse({ ok: true });
    }
  });
}

async function syncEnabledState() {
  const stored = await storageGet({ [ENABLED_KEY]: false });
  isEnabled = Boolean(stored[ENABLED_KEY]);
  setEnabledVisualState(isEnabled);
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

function setEnabledVisualState(enabled) {
  document.documentElement.classList.toggle("ia-enabled", enabled);
}

function onKeyDown(event) {
  if (event.key === "Escape") {
    hideOverlay();
  }
}

async function onDocumentClick(event) {
  if (!isEnabled) {
    return;
  }

  const target = getClickedTarget(event);
  if (!target) {
    return;
  }

  const requestId = ++activeRequestId;
  const anchor = {
    x: event.clientX,
    y: event.clientY
  };

  if (!isExtensionRuntimeAvailable()) {
    showOverlay(
      {
        state: "error",
        text: "Extension was updated or reloaded. Refresh this tab once, then try again."
      },
      anchor
    );
    scheduleOverlayHide(AUTO_HIDE_MS);
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  showOverlay({ state: "loading", text: "Generating prompt..." }, anchor);

  try {
    const payload = await createImagePayload(target);

    const response = await sendRuntimeMessage({
      type: "analyze-image",
      payload
    });

    if (requestId !== activeRequestId) {
      return;
    }

    if (!response?.ok) {
      throw new Error(response?.error || "Analysis request failed.");
    }

    const promptOutput =
      typeof response.description === "string" ? response.description.trim() : "";
    if (!promptOutput) {
      throw new Error("No prompt output was returned.");
    }

    showOverlay(
      {
        state: "success",
        text: promptOutput,
        meta: formatUsageMeta(response.usage),
        requestId: typeof response.requestId === "string" ? response.requestId : "",
        model: typeof response.model === "string" ? response.model : "",
        imageUrl: typeof payload?.url === "string" ? payload.url : "",
        sourcePageUrl: typeof payload?.pageUrl === "string" ? payload.pageUrl : window.location.href
      },
      anchor
    );
    scheduleOverlayHide(AUTO_HIDE_MS);
  } catch (error) {
    if (requestId !== activeRequestId) {
      return;
    }
    showOverlay({ state: "error", text: toUserError(error) }, anchor);
    scheduleOverlayHide(AUTO_HIDE_MS);
  }
}

function getClickedTarget(event) {
  if (!(event.target instanceof Element)) {
    return null;
  }

  if (event.target.closest(`#${OVERLAY_ID}`)) {
    return null;
  }

  const path = typeof event.composedPath === "function" ? event.composedPath() : [];
  const elements = path.filter((node) => node instanceof Element);
  if (!elements.length) {
    elements.push(event.target);
  }

  for (const element of elements) {
    if (!(element instanceof Element)) {
      continue;
    }

    if (element.closest(`#${OVERLAY_ID}`)) {
      return null;
    }

    const image = resolveImageElement(element);
    if (image) {
      return { kind: "img", image };
    }

    const backgroundUrl = extractBackgroundImageUrl(element);
    if (backgroundUrl) {
      return { kind: "background", element, url: backgroundUrl };
    }
  }

  return null;
}

function resolveImageElement(element) {
  if (element instanceof HTMLImageElement) {
    return element;
  }

  const closestImg = element.closest("img");
  if (closestImg instanceof HTMLImageElement) {
    return closestImg;
  }

  const picture = element.closest("picture");
  if (picture instanceof HTMLPictureElement) {
    const fallbackImage = picture.querySelector("img");
    if (fallbackImage instanceof HTMLImageElement) {
      return fallbackImage;
    }
  }

  return null;
}

function extractBackgroundImageUrl(element) {
  if (!(element instanceof HTMLElement)) {
    return "";
  }

  if (element === document.documentElement || element === document.body) {
    return "";
  }

  const rect = element.getBoundingClientRect();
  if (rect.width < 32 || rect.height < 32) {
    return "";
  }

  const style = window.getComputedStyle(element);
  const backgroundImage = style.backgroundImage || "";
  if (!backgroundImage || backgroundImage === "none") {
    return "";
  }

  const match = /url\((['"]?)(.*?)\1\)/i.exec(backgroundImage);
  if (!match || !match[2]) {
    return "";
  }

  return resolveAbsoluteUrl(match[2].trim());
}

async function createImagePayload(target) {
  if (target.kind === "img") {
    const url = resolveImageUrl(target.image);
    if (!url) {
      throw new Error("Could not read the clicked image URL.");
    }

    const dataUrl = await captureImageDataUrl(target.image);
    return {
      url,
      altText: target.image.alt || "",
      dataUrl,
      pageUrl: window.location.href
    };
  }

  if (target.kind === "background") {
    const altText = [
      target.element.getAttribute("aria-label") || "",
      target.element.getAttribute("title") || ""
    ]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" | ");

    return {
      url: target.url,
      altText,
      dataUrl: null,
      pageUrl: window.location.href
    };
  }

  throw new Error("Unsupported image target.");
}

function resolveImageUrl(image) {
  const candidate =
    image.currentSrc ||
    image.src ||
    image.getAttribute("src") ||
    image.getAttribute("data-src") ||
    "";
  return resolveAbsoluteUrl(candidate);
}

function resolveAbsoluteUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return "";
  }

  try {
    return new URL(rawUrl, window.location.href).toString();
  } catch {
    return rawUrl;
  }
}

async function captureImageDataUrl(image) {
  const src = image.currentSrc || image.src || "";
  if (src.startsWith("data:image/")) {
    return src;
  }

  await waitForImageReady(image);
  if (!image.naturalWidth || !image.naturalHeight) {
    return null;
  }

  const { width, height } = scaleSize(image.naturalWidth, image.naturalHeight, MAX_CANVAS_EDGE);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    return null;
  }

  try {
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.86);
  } catch {
    // Cross-origin images can taint canvas. Fallback to URL-based fetch in background.
    return null;
  }
}

function waitForImageReady(image) {
  if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
    return Promise.resolve();
  }

  if (typeof image.decode === "function") {
    return image.decode().catch(() => waitForImageLoadEvents(image));
  }

  return waitForImageLoadEvents(image);
}

function waitForImageLoadEvents(image) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out while loading image data."));
    }, 3000);

    function onLoad() {
      cleanup();
      resolve();
    }

    function onError() {
      cleanup();
      reject(new Error("Failed to load image data."));
    }

    function cleanup() {
      clearTimeout(timeout);
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
    }

    image.addEventListener("load", onLoad, { once: true });
    image.addEventListener("error", onError, { once: true });
  });
}

function scaleSize(width, height, maxEdge) {
  if (width <= maxEdge && height <= maxEdge) {
    return { width, height };
  }

  const ratio = Math.min(maxEdge / width, maxEdge / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  };
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

function isExtensionRuntimeAvailable() {
  return Boolean(globalThis?.chrome?.runtime?.id);
}

function showOverlay(payload, anchor) {
  clearTimeout(hideTimer);

  const root = ensureOverlay();
  const textEl = root.querySelector(".ia-text");
  const metaEl = root.querySelector(".ia-meta");
  const spinner = root.querySelector(".ia-spinner");
  const statusPill = root.querySelector(".ia-state-pill");

  if (!textEl || !metaEl || !spinner || !statusPill) {
    return;
  }

  textEl.textContent = payload.text || "";
  const metaText = typeof payload.meta === "string" ? payload.meta.trim() : "";
  metaEl.textContent = metaText;
  metaEl.hidden = !metaText || payload.state === "loading";
  root.dataset.state = payload.state;
  spinner.hidden = payload.state !== "loading";

  const headerActions = root.querySelector(".ia-header-actions");
  if (headerActions) {
    headerActions.hidden = payload.state !== "success";
  }

  if (payload.state === "success") {
    const requestId = typeof payload.requestId === "string" ? payload.requestId.trim() : "";
    root.dataset.requestId = requestId;
    root.dataset.model = typeof payload.model === "string" ? payload.model.trim() : "";
    root.dataset.imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl.trim() : "";
    root.dataset.sourcePageUrl =
      typeof payload.sourcePageUrl === "string" ? payload.sourcePageUrl.trim() : "";
    root.dataset.saved = "0";
    setSaveButtonState(root, { saved: false, saving: false });
  } else {
    root.dataset.requestId = "";
    root.dataset.model = "";
    root.dataset.imageUrl = "";
    root.dataset.sourcePageUrl = "";
    root.dataset.saved = "0";
    setSaveButtonState(root, { saved: false, saving: false });
  }
  hideActionFeedback(root);

  if (payload.state === "loading") {
    statusPill.textContent = "Generating";
  } else if (payload.state === "error") {
    statusPill.textContent = "Error";
  } else {
    statusPill.textContent = "Prompt";
  }

  root.classList.add("ia-visible");
  positionOverlay(root, anchor);
}

function scheduleOverlayHide(delayMs) {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    hideOverlay();
  }, delayMs);
}

function hideOverlay() {
  clearTimeout(hideTimer);
  clearTimeout(actionFeedbackTimer);
  const root = document.getElementById(OVERLAY_ID);
  if (!root) {
    return;
  }
  hideActionFeedback(root);
  root.classList.remove("ia-visible");
}

function ensureOverlay() {
  let root = document.getElementById(OVERLAY_ID);
  if (root) {
    return root;
  }

  root = document.createElement("div");
  root.id = OVERLAY_ID;
  root.innerHTML = `
    <div class="ia-card" role="status" aria-live="polite">
      <div class="ia-header">
        <span class="ia-state-pill">Working</span>
        <div class="ia-header-actions">
          <button type="button" class="ia-btn-icon ia-save" aria-label="Save prompt" title="Save prompt">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>
          </button>
          <button type="button" class="ia-btn-icon ia-copy" aria-label="Copy output" title="Copy output">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <span class="ia-action-badge" hidden></span>
        </div>
        <button type="button" class="ia-close" aria-label="Close">&times;</button>
      </div>
      <div class="ia-body">
        <span class="ia-spinner" aria-hidden="true"></span>
        <div class="ia-content">
          <p class="ia-text"></p>
          <p class="ia-meta" hidden></p>
        </div>
      </div>
    </div>
  `;

  const closeButton = root.querySelector(".ia-close");
  if (closeButton) {
    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideOverlay();
    });
  }

  const copyButton = root.querySelector(".ia-copy");
  if (copyButton) {
    copyButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const textEl = root.querySelector(".ia-text");
      const textToCopy = textEl?.textContent?.trim() || "";
      if (!textToCopy) {
        return;
      }

      const copied = await copyTextToClipboard(textToCopy);
      if (!copied) {
        return;
      }

      showActionFeedback(root, "Copied");
    });
  }

  const saveButton = root.querySelector(".ia-save");
  if (saveButton) {
    saveButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const requestId = root.dataset.requestId || "";
      if (!requestId || root.dataset.saved === "1") {
        return;
      }

      const textEl = root.querySelector(".ia-text");
      const promptText = textEl?.textContent?.trim() || "";
      if (!promptText) {
        return;
      }

      setSaveButtonState(root, { saved: false, saving: true });

      try {
        const response = await sendRuntimeMessage({
          type: "save-prompt",
          payload: {
            requestId,
            description: promptText,
            model: root.dataset.model || "",
            imageUrl: root.dataset.imageUrl || "",
            sourcePageUrl: root.dataset.sourcePageUrl || window.location.href
          }
        });

        if (!response?.ok) {
          throw new Error(response?.error || "Could not save prompt.");
        }

        root.dataset.saved = "1";
        setSaveButtonState(root, { saved: true, saving: false });
        showActionFeedback(root, "Saved");
      } catch {
        setSaveButtonState(root, { saved: false, saving: false });
        showActionFeedback(root, "Save failed");
      }
    });
  }

  document.documentElement.appendChild(root);
  return root;
}

function positionOverlay(root, anchor) {
  const card = root.querySelector(".ia-card");
  if (!card) {
    return;
  }

  const margin = 12;
  const offset = 16;
  root.style.left = "0px";
  root.style.top = "0px";

  const rect = card.getBoundingClientRect();
  const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
  const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);

  const left = clamp(anchor.x + offset, margin, maxLeft);
  const top = clamp(anchor.y + offset, margin, maxTop);

  root.style.left = `${left}px`;
  root.style.top = `${top}px`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setSaveButtonState(root, options = {}) {
  const saveButton = root.querySelector(".ia-save");
  if (!saveButton) {
    return;
  }

  const requestId = root.dataset.requestId || "";
  const saved = Boolean(options.saved);
  const saving = Boolean(options.saving);

  saveButton.disabled = saving || saved || !requestId;
  saveButton.classList.toggle("is-saved", saved);
  saveButton.classList.toggle("is-saving", saving);
  saveButton.setAttribute("aria-label", saved ? "Saved" : saving ? "Saving..." : "Save prompt");
  saveButton.setAttribute("title", saved ? "Saved" : saving ? "Saving..." : "Save prompt");
}

function hideActionFeedback(root) {
  const badge = root.querySelector(".ia-action-badge");
  if (badge) {
    badge.hidden = true;
    badge.textContent = "";
  }
}

function showActionFeedback(root, text) {
  const badge = root.querySelector(".ia-action-badge");
  if (!badge) {
    return;
  }

  badge.textContent = text;
  badge.hidden = false;

  clearTimeout(actionFeedbackTimer);
  actionFeedbackTimer = setTimeout(() => {
    hideActionFeedback(root);
  }, 1500);
}

async function copyTextToClipboard(text) {
  if (!text) {
    return false;
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below.
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const success = document.execCommand("copy");
    textarea.remove();
    return Boolean(success);
  } catch {
    return false;
  }
}

function toUserError(error) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  if (isExtensionContextInvalidatedError(message)) {
    return "Extension was updated or reloaded. Refresh this tab once, then try clicking the image again.";
  }
  return message || "Image analysis failed.";
}

function formatUsageMeta(usage) {
  if (!usage || typeof usage !== "object") {
    return "";
  }

  const used = toNonNegativeInt(usage.used);
  const limit = toNullableNonNegativeInt(usage.limit);
  if (limit === null) {
    return `${used} used this month • Unlimited plan`;
  }

  const remaining = toNullableNonNegativeInt(usage.remaining);
  const safeRemaining = remaining === null ? Math.max(0, limit - used) : remaining;
  return `${safeRemaining} credits left • ${used}/${limit} used`;
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

function isExtensionContextInvalidatedError(message) {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes("extension context invalidated") ||
    normalized.includes("receiving end does not exist") ||
    normalized.includes("message port closed before a response was received")
  );
}
