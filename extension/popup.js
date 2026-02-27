const ENABLED_KEY = "enabled";

const enabledToggle = document.getElementById("enabledToggle");
const toggleRow = enabledToggle?.closest(".toggle-row") || null;
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");

const authSignedOut = document.getElementById("authSignedOut");
const authSignedIn = document.getElementById("authSignedIn");
const signinTab = document.getElementById("signinTab");
const signupTab = document.getElementById("signupTab");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const googleAuthBtn = document.getElementById("googleAuthBtn");

const accountEmail = document.getElementById("accountEmail");
const planText = document.getElementById("planText");
const planStatusText = document.getElementById("planStatusText");
const creditsAlert = document.getElementById("creditsAlert");
const usageText = document.getElementById("usageText");
const usageMeterBar = document.getElementById("usageMeterBar");
const refreshUsageBtn = document.getElementById("refreshUsageBtn");
const signOutBtn = document.getElementById("signOutBtn");
const upgradePlanBtn = document.getElementById("upgradePlanBtn");
const savedPromptsBtn = document.getElementById("savedPromptsBtn");

let authMode = "signin";
let authBusy = false;
let usageBusy = false;

let viewState = {
  enabled: false,
  isAuthenticated: false,
  user: null,
  subscription: null,
  usage: null
};

init().catch((error) => {
  showError(`Failed to load popup: ${error.message}`);
});

async function init() {
  bindEvents();
  setAuthMode("signin");
  setStatus("Loading account...");
  clearError();

  const response = await sendRuntimeMessage({
    type: "get-extension-state",
    payload: { refresh: true }
  });

  if (!response?.ok || !response.state) {
    throw new Error(response?.error || "Could not load extension state.");
  }

  applyState(response.state);

  if (typeof response.state.authError === "string" && response.state.authError.trim()) {
    showError(response.state.authError.trim());
  }

  if (viewState.isAuthenticated) {
    if (isOutOfCredits(viewState.usage)) {
      showError(formatExhaustedCreditsMessage(viewState.subscription));
      setStatus("Credits exhausted. Upgrade plan to continue.");
    } else {
      setStatus("Signed in. Click an image to generate prompt.");
    }
  } else {
    setStatus("Sign in to enable click-to-prompt.");
  }
}

function bindEvents() {
  enabledToggle.addEventListener("change", onToggleChanged);

  signinTab.addEventListener("click", () => setAuthMode("signin"));
  signupTab.addEventListener("click", () => setAuthMode("signup"));

  authSubmitBtn.addEventListener("click", onAuthSubmit);
  googleAuthBtn.addEventListener("click", onGoogleAuth);
  passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onAuthSubmit().catch(() => {});
    }
  });

  refreshUsageBtn.addEventListener("click", onRefreshCredits);
  signOutBtn.addEventListener("click", onSignOut);
  upgradePlanBtn.addEventListener("click", onUpgradePlan);
  savedPromptsBtn.addEventListener("click", onOpenSavedPromptsPage);
}

function setAuthMode(nextMode) {
  authMode = nextMode === "signup" ? "signup" : "signin";

  signinTab.classList.toggle("is-active", authMode === "signin");
  signinTab.setAttribute("aria-selected", authMode === "signin" ? "true" : "false");

  signupTab.classList.toggle("is-active", authMode === "signup");
  signupTab.setAttribute("aria-selected", authMode === "signup" ? "true" : "false");

  passwordInput.autocomplete = authMode === "signup" ? "new-password" : "current-password";
  authSubmitBtn.textContent = authMode === "signup" ? "Create account" : "Sign in";
}

function applyState(rawState) {
  viewState = normalizeViewState(rawState);
  const outOfCredits = isOutOfCredits(viewState.usage);
  const canGenerate = viewState.isAuthenticated && !outOfCredits;

  enabledToggle.checked = canGenerate ? viewState.enabled : false;
  enabledToggle.disabled = !canGenerate;
  if (toggleRow) {
    toggleRow.classList.toggle("is-disabled", !canGenerate);
  }

  authSignedOut.hidden = viewState.isAuthenticated;
  authSignedIn.hidden = !viewState.isAuthenticated;

  if (viewState.isAuthenticated) {
    const email = viewState.user?.email || "Signed in user";
    accountEmail.textContent = email;
    planText.textContent = formatPlanLine(viewState.subscription);
    planStatusText.textContent = formatPlanStatusLine(viewState.subscription, viewState.usage);
    usageText.textContent = formatUsageLine(viewState.usage, viewState.subscription);
    const exhaustedMessage = outOfCredits ? formatExhaustedCreditsMessage(viewState.subscription) : "";
    creditsAlert.textContent = exhaustedMessage;
    creditsAlert.hidden = !exhaustedMessage;
    configureUpgradeButton(viewState.subscription);
    paintUsageMeter(viewState.usage);
    if (outOfCredits && viewState.enabled) {
      void forceDisableClickToPrompt();
    }
  } else {
    accountEmail.textContent = "";
    planText.textContent = "";
    planStatusText.textContent = "";
    creditsAlert.textContent = "";
    creditsAlert.hidden = true;
    usageText.textContent = "";
    configureUpgradeButton(null);
    paintUsageMeter(null);
    enabledToggle.checked = false;
  }
}

async function onAuthSubmit() {
  if (authBusy) {
    return;
  }

  clearError();

  const email = typeof emailInput.value === "string" ? emailInput.value.trim() : "";
  const password = typeof passwordInput.value === "string" ? passwordInput.value : "";

  if (!email || !password) {
    showError("Email and password are required.");
    return;
  }

  setAuthBusy(true);
  setStatus(authMode === "signup" ? "Creating account..." : "Signing in...");

  try {
    const response = await sendRuntimeMessage({
      type: authMode === "signup" ? "auth-signup" : "auth-signin",
      payload: { email, password }
    });

    if (!response?.ok || !response.state) {
      throw new Error(response?.error || "Authentication failed.");
    }

    applyState(response.state);
    passwordInput.value = "";
    setStatus(authMode === "signup" ? "Account created. You are signed in." : "Signed in.");
    if (isOutOfCredits(viewState.usage)) {
      showError(formatExhaustedCreditsMessage(viewState.subscription));
    }
  } catch (error) {
    showError(toErrorMessage(error, "Authentication failed."));
  } finally {
    setAuthBusy(false);
  }
}

async function onGoogleAuth() {
  if (authBusy) {
    return;
  }

  clearError();
  setAuthBusy(true);
  setStatus("Opening web login...");

  try {
    const response = await sendRuntimeMessage({ type: "auth-google" });
    if (!response?.ok || !response.state) {
      throw new Error(response?.error || "Google sign-in failed.");
    }

    applyState(response.state);
    passwordInput.value = "";
    setStatus("Signed in.");
    if (isOutOfCredits(viewState.usage)) {
      showError(formatExhaustedCreditsMessage(viewState.subscription));
    }
  } catch (error) {
    showError(toErrorMessage(error, "Google sign-in failed."));
  } finally {
    setAuthBusy(false);
  }
}

async function onSignOut() {
  if (authBusy) {
    return;
  }

  clearError();
  setAuthBusy(true);
  setStatus("Signing out...");

  try {
    const response = await sendRuntimeMessage({ type: "auth-signout" });
    if (!response?.ok || !response.state) {
      throw new Error(response?.error || "Sign out failed.");
    }

    applyState(response.state);
    await notifyActiveTabEnabled(false).catch(() => {});
    setStatus("Signed out.");
  } catch (error) {
    showError(toErrorMessage(error, "Sign out failed."));
  } finally {
    setAuthBusy(false);
  }
}

async function onRefreshCredits() {
  if (usageBusy || !viewState.isAuthenticated) {
    return;
  }

  clearError();
  setUsageBusy(true);
  setStatus("Refreshing credits...");

  try {
    const response = await sendRuntimeMessage({ type: "refresh-auth-session" });
    if (!response?.ok || !response.state) {
      throw new Error(response?.error || "Could not refresh credits.");
    }

    applyState(response.state);
    if (isOutOfCredits(viewState.usage)) {
      const exhaustedMessage = formatExhaustedCreditsMessage(viewState.subscription);
      showError(exhaustedMessage);
      setStatus("Credits exhausted. Upgrade plan to continue.");
    } else {
      setStatus("Credits updated.");
    }
  } catch (error) {
    showError(toErrorMessage(error, "Could not refresh credits."));
  } finally {
    setUsageBusy(false);
  }
}

async function onUpgradePlan() {
  if (authBusy || !viewState.isAuthenticated) {
    return;
  }

  const path = getUpgradeTargetPath(viewState.subscription);
  clearError();
  upgradePlanBtn.disabled = true;
  setStatus(path === "/billing" ? "Opening billing page..." : "Opening upgrade page...");

  try {
    const response = await sendRuntimeMessage({
      type: "open-upgrade-page",
      payload: { path }
    });
    if (!response?.ok) {
      throw new Error(response?.error || "Could not open upgrade page.");
    }
    setStatus(path === "/billing" ? "Billing page opened." : "Upgrade page opened.");
  } catch (error) {
    showError(toErrorMessage(error, "Could not open upgrade page."));
  } finally {
    upgradePlanBtn.disabled = false;
  }
}

async function onOpenSavedPromptsPage() {
  if (authBusy || !viewState.isAuthenticated) {
    return;
  }

  clearError();
  savedPromptsBtn.disabled = true;
  setStatus("Opening saved prompts...");

  try {
    const response = await sendRuntimeMessage({ type: "open-saved-prompts-page" });
    if (!response?.ok) {
      throw new Error(response?.error || "Could not open saved prompts page.");
    }
    setStatus("Saved prompts page opened.");
  } catch (error) {
    showError(toErrorMessage(error, "Could not open saved prompts page."));
  } finally {
    savedPromptsBtn.disabled = false;
  }
}

async function onToggleChanged(event) {
  const enabled = Boolean(event.target.checked);
  clearError();

  if (enabled && !viewState.isAuthenticated) {
    enabledToggle.checked = false;
    showError("Sign in required before enabling click-to-prompt.");
    return;
  }

  if (enabled && isOutOfCredits(viewState.usage)) {
    enabledToggle.checked = false;
    showError(formatExhaustedCreditsMessage(viewState.subscription));
    setStatus("Upgrade plan to continue.");
    return;
  }

  try {
    await storageSet({ [ENABLED_KEY]: enabled });
    viewState.enabled = enabled;

    if (enabled) {
      const injected = await ensureContentReadyInActiveTab();
      if (!injected.ok) {
        showError(injected.reason);
      }
    }

    await notifyActiveTabEnabled(enabled);
    setStatus(enabled ? "Click any image to generate prompt." : "Click-to-prompt is OFF.");

    sendRuntimeMessage({ type: "toggle-enabled", enabled }).catch(() => {});
  } catch (error) {
    enabledToggle.checked = !enabled;
    viewState.enabled = !enabled;
    showError(`Could not update preference: ${toErrorMessage(error, "Unknown error.")}`);
  }
}

function normalizeViewState(rawState) {
  return {
    enabled: Boolean(rawState?.enabled),
    isAuthenticated: Boolean(rawState?.isAuthenticated),
    user: normalizeUser(rawState?.user),
    subscription: normalizeSubscription(rawState?.subscription),
    usage: normalizeUsage(rawState?.usage)
  };
}

function normalizeUser(rawUser) {
  if (!rawUser || typeof rawUser !== "object") {
    return null;
  }

  const id = Number.parseInt(String(rawUser.id || 0), 10);
  const email = typeof rawUser.email === "string" ? rawUser.email.trim() : "";
  if (!id || !email) {
    return null;
  }

  return {
    id,
    email,
    role: typeof rawUser.role === "string" ? rawUser.role : "subscriber",
    status: typeof rawUser.status === "string" ? rawUser.status : "active"
  };
}

function normalizeSubscription(rawSubscription) {
  if (!rawSubscription || typeof rawSubscription !== "object") {
    return null;
  }

  const monthlyQuota =
    rawSubscription.monthlyQuota === null || rawSubscription.monthlyQuota === undefined
      ? null
      : Number.parseInt(String(rawSubscription.monthlyQuota), 10);

  return {
    planCode: typeof rawSubscription.planCode === "string" ? rawSubscription.planCode : "free",
    planName:
      typeof rawSubscription.planName === "string" && rawSubscription.planName.trim()
        ? rawSubscription.planName.trim()
        : "Free",
    status:
      typeof rawSubscription.status === "string" && rawSubscription.status.trim()
        ? rawSubscription.status.trim().toLowerCase()
        : "active",
    monthlyQuota: Number.isFinite(monthlyQuota) && monthlyQuota >= 0 ? monthlyQuota : null,
    priceUsdCents: Number.parseInt(String(rawSubscription.priceUsdCents || 0), 10) || 0
  };
}

function normalizeUsage(rawUsage) {
  if (!rawUsage || typeof rawUsage !== "object") {
    return null;
  }

  const used = Number.parseInt(String(rawUsage.used || 0), 10);
  const limitRaw = rawUsage.limit;
  const limit =
    limitRaw === null || limitRaw === undefined ? null : Number.parseInt(String(limitRaw), 10);
  const remainingRaw = rawUsage.remaining;
  const remaining =
    remainingRaw === null || remainingRaw === undefined
      ? null
      : Number.parseInt(String(remainingRaw), 10);

  return {
    used: Number.isFinite(used) && used >= 0 ? used : 0,
    limit: Number.isFinite(limit) && limit >= 0 ? limit : null,
    remaining: Number.isFinite(remaining) && remaining >= 0 ? remaining : null
  };
}

function formatPlanLine(subscription) {
  if (!subscription) {
    return "Plan: Free";
  }

  const quotaText =
    subscription.monthlyQuota === null ? "Unlimited monthly credits" : `${subscription.monthlyQuota} credits/month`;

  return `Plan: ${subscription.planName} • ${quotaText}`;
}

function formatPlanStatusLine(subscription, usage) {
  const rawStatus =
    typeof subscription?.status === "string" && subscription.status.trim()
      ? subscription.status.trim().toLowerCase()
      : "active";

  if (isOutOfCredits(usage)) {
    return "Plan status: Credits exhausted";
  }

  if (usage?.limit !== null && usage?.limit !== undefined) {
    const remaining = getRemainingCredits(usage);
    if (remaining <= 3) {
      return "Plan status: Low credits";
    }
  }

  if (rawStatus === "canceled") {
    return "Plan status: Canceled";
  }
  if (rawStatus === "suspended") {
    return "Plan status: Suspended";
  }

  return "Plan status: Active";
}

function formatUsageLine(usage, subscription) {
  if (!usage) {
    if (subscription?.monthlyQuota === null) {
      return "0 used this month • Unlimited plan";
    }
    return "No usage yet.";
  }

  if (usage.limit === null) {
    return `${usage.used} used this month • Unlimited plan`;
  }

  const remaining = getRemainingCredits(usage);
  return `${remaining} credits left • ${usage.used}/${usage.limit} used`;
}

function formatExhaustedCreditsMessage(subscription) {
  const planCode = typeof subscription?.planCode === "string" ? subscription.planCode.trim().toLowerCase() : "free";
  if (planCode === "pro") {
    return "All Pro credits used for this month. Upgrade to Unlimited to continue.";
  }
  if (planCode === "unlimited") {
    return "Current plan access is restricted. Open billing to continue.";
  }
  return "All Free credits used for this month. Upgrade your plan to continue.";
}

function getRemainingCredits(usage) {
  if (!usage || usage.limit === null) {
    return 0;
  }
  return usage.remaining ?? Math.max(0, usage.limit - usage.used);
}

function isOutOfCredits(usage) {
  if (!usage || usage.limit === null) {
    return false;
  }
  return getRemainingCredits(usage) <= 0;
}

function paintUsageMeter(usage) {
  if (!usage || usage.limit === null || usage.limit <= 0) {
    usageMeterBar.style.width = usage && usage.limit === null ? "24%" : "0%";
    usageMeterBar.style.background = "#2563eb";
    return;
  }

  const percent = Math.max(0, Math.min(100, Math.round((usage.used / usage.limit) * 100)));
  usageMeterBar.style.width = `${percent}%`;
  usageMeterBar.style.background = percent >= 90 ? "#b91c1c" : "#2563eb";
}

function configureUpgradeButton(subscription) {
  if (!viewState.isAuthenticated) {
    upgradePlanBtn.textContent = "Upgrade plan";
    upgradePlanBtn.disabled = true;
    return;
  }

  const planCode = typeof subscription?.planCode === "string" ? subscription.planCode.trim().toLowerCase() : "free";
  if (planCode === "unlimited") {
    upgradePlanBtn.textContent = "Manage billing";
  } else if (planCode === "pro") {
    upgradePlanBtn.textContent = "Upgrade to Unlimited";
  } else {
    upgradePlanBtn.textContent = "Upgrade plan";
  }
  upgradePlanBtn.disabled = false;
}

function getUpgradeTargetPath(subscription) {
  const planCode = typeof subscription?.planCode === "string" ? subscription.planCode.trim().toLowerCase() : "free";
  return planCode === "unlimited" ? "/billing" : "/pricing";
}

async function forceDisableClickToPrompt() {
  if (!viewState.enabled) {
    return;
  }

  viewState.enabled = false;
  enabledToggle.checked = false;

  await storageSet({ [ENABLED_KEY]: false }).catch(() => {});
  await notifyActiveTabEnabled(false).catch(() => {});
  sendRuntimeMessage({ type: "toggle-enabled", enabled: false }).catch(() => {});
}

function setAuthBusy(busy) {
  authBusy = busy;
  const disabled = Boolean(busy);

  signinTab.disabled = disabled;
  signupTab.disabled = disabled;
  emailInput.disabled = disabled;
  passwordInput.disabled = disabled;
  authSubmitBtn.disabled = disabled;
  googleAuthBtn.disabled = disabled;
  signOutBtn.disabled = disabled;
  upgradePlanBtn.disabled = disabled || !viewState.isAuthenticated;
  savedPromptsBtn.disabled = disabled;
}

function setUsageBusy(busy) {
  usageBusy = busy;
  refreshUsageBtn.disabled = Boolean(busy);
}

function toErrorMessage(error, fallback) {
  const raw = typeof error?.message === "string" ? error.message.trim() : "";
  const base = raw || fallback || "Something went wrong.";

  if (/monthly usage limit reached|credits exhausted|usage limit reached|status 402/i.test(base)) {
    return "Credits exhausted for this month. Upgrade plan to continue.";
  }

  if (/session expired/i.test(base)) {
    return "Session expired. Sign in again.";
  }

  if (/sign in required|authentication required/i.test(base)) {
    return "Sign in required.";
  }

  return base;
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
