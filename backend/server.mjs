import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual
} from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
const scryptAsync = promisify(scryptCallback);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadDotEnv(path.join(__dirname, ".env"));

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 8787);
const BASE_PATH = normalizeBasePath(process.env.BASE_PATH || "/backend");
const OPENAI_API_URL = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 45000);
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 18 * 1024 * 1024);
const PROMPT_QUALITY_SCORE_THRESHOLD = 6;

const MYSQL_HOST = (process.env.MYSQL_HOST || "").trim();
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306);
const MYSQL_USER = (process.env.MYSQL_USER || "").trim();
const MYSQL_PASSWORD = (process.env.MYSQL_PASSWORD || "").trim();
const MYSQL_DATABASE = (process.env.MYSQL_DATABASE || "").trim();

let mysqlPool = null;

const AUTH_SECRET = (process.env.AUTH_SECRET || "").trim();
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
const AUTH_REQUIRED = parseBoolean(process.env.SAAS_AUTH_REQUIRED, false);
const MIN_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const TOKEN_TTL_SECONDS_RAW = Number(process.env.TOKEN_TTL_SECONDS || 30 * 24 * 60 * 60);
const TOKEN_TTL_SECONDS =
  Number.isFinite(TOKEN_TTL_SECONDS_RAW) && TOKEN_TTL_SECONDS_RAW > 0
    ? Math.max(Math.floor(TOKEN_TTL_SECONDS_RAW), MIN_TOKEN_TTL_SECONDS)
    : 30 * 24 * 60 * 60;
const GUEST_MONTHLY_LIMIT = Number(process.env.GUEST_MONTHLY_LIMIT || 20);
const GUEST_KEY_SALT = (process.env.GUEST_KEY_SALT || AUTH_SECRET || "guest-key-salt").trim();
const APP_BASE_URL = (process.env.APP_BASE_URL || "").trim();
const RAZORPAY_API_BASE = (process.env.RAZORPAY_API_BASE || "https://api.razorpay.com/v1").replace(/\/+$/, "");
const _rzpKeyFromEnv = (process.env.RAZORPAY_KEY_ID || "").trim();
const _rzpSecretFromEnv = (process.env.RAZORPAY_KEY_SECRET || "").trim();
// Use live keys so checkout does not show "Test Mode". If env has test key, override to live.
const RAZORPAY_LIVE_KEY_ID = "rzp_live_SLIbMG7nGjimsH";
const RAZORPAY_LIVE_KEY_SECRET = "Mhao0XfOxZUyFP3uGMih9fi7";
const RAZORPAY_KEY_ID =
  _rzpKeyFromEnv.startsWith("rzp_test_") ? RAZORPAY_LIVE_KEY_ID : (_rzpKeyFromEnv || RAZORPAY_LIVE_KEY_ID);
const RAZORPAY_KEY_SECRET =
  _rzpKeyFromEnv.startsWith("rzp_test_") ? RAZORPAY_LIVE_KEY_SECRET : (_rzpSecretFromEnv || RAZORPAY_LIVE_KEY_SECRET);
const RAZORPAY_WEBHOOK_SECRET = (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
const RAZORPAY_CURRENCY = (process.env.RAZORPAY_CURRENCY || "USD").trim().toUpperCase();
const DEFAULT_PRICING_CURRENCY = (process.env.DEFAULT_PRICING_CURRENCY || RAZORPAY_CURRENCY || "USD")
  .trim()
  .toUpperCase();
const USD_TO_INR_RATE = Number(process.env.USD_TO_INR_RATE || 83);
const RAZORPAY_PRO_AMOUNT_SUBUNITS = Number(process.env.RAZORPAY_PRO_AMOUNT_SUBUNITS || 2000);
const RAZORPAY_UNLIMITED_AMOUNT_SUBUNITS = Number(process.env.RAZORPAY_UNLIMITED_AMOUNT_SUBUNITS || 6000);
const RAZORPAY_PRO_ANNUAL_AMOUNT_SUBUNITS = Number(
  process.env.RAZORPAY_PRO_ANNUAL_AMOUNT_SUBUNITS ||
    Math.round((RAZORPAY_PRO_AMOUNT_SUBUNITS > 0 ? RAZORPAY_PRO_AMOUNT_SUBUNITS : 2000) * 12 * 0.8)
);
const RAZORPAY_UNLIMITED_ANNUAL_AMOUNT_SUBUNITS = Number(
  process.env.RAZORPAY_UNLIMITED_ANNUAL_AMOUNT_SUBUNITS ||
    Math.round((RAZORPAY_UNLIMITED_AMOUNT_SUBUNITS > 0 ? RAZORPAY_UNLIMITED_AMOUNT_SUBUNITS : 6000) * 12 * 0.8)
);
const BOOTSTRAP_ADMIN_EMAILS = (process.env.BOOTSTRAP_ADMIN_EMAILS || "argro.official@gmail.com").trim();
const BOOTSTRAP_ADMIN_PASSWORD = (process.env.BOOTSTRAP_ADMIN_PASSWORD || "").trim();

const STRIPE_API_BASE = (process.env.STRIPE_API_BASE || "https://api.stripe.com/v1").replace(/\/+$/, "");
const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY || "").trim();
const STRIPE_WEBHOOK_SECRET = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
const STRIPE_PRICE_PRO_MONTHLY = (process.env.STRIPE_PRICE_PRO_MONTHLY || "").trim();
const STRIPE_PRICE_UNLIMITED_MONTHLY = (process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || "").trim();
const STRIPE_CHECKOUT_SUCCESS_URL = (process.env.STRIPE_CHECKOUT_SUCCESS_URL || "").trim();
const STRIPE_CHECKOUT_CANCEL_URL = (process.env.STRIPE_CHECKOUT_CANCEL_URL || "").trim();
const STRIPE_BILLING_PORTAL_RETURN_URL = (process.env.STRIPE_BILLING_PORTAL_RETURN_URL || "").trim();

const PLAN_CONFIG = {
  free: {
    code: "free",
    name: "Free",
    monthlyQuota: 20,
    priceUsdCents: 0
  },
  pro: {
    code: "pro",
    name: "Pro",
    monthlyQuota: 200,
    priceUsdCents: 2000
  },
  unlimited: {
    code: "unlimited",
    name: "Unlimited",
    monthlyQuota: null,
    priceUsdCents: 6000
  },
  guest: {
    code: "guest",
    name: "Guest",
    monthlyQuota: Number.isFinite(GUEST_MONTHLY_LIMIT) ? GUEST_MONTHLY_LIMIT : 20,
    priceUsdCents: 0
  }
};

const USER_PLAN_CODES = ["free", "pro", "unlimited"];
const USER_ROLES = ["subscriber", "admin", "superadmin"];
const SCHEMA_SQL = loadSchemaSql();

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});

function loadSchemaSql() {
  const schemaFilePath = path.join(__dirname, "schema.sql");
  try {
    const sql = fs.readFileSync(schemaFilePath, "utf8");
    if (typeof sql !== "string" || sql.trim().length === 0) {
      throw new Error("Schema file is empty.");
    }
    return sql;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error.";
    throw new Error(`Could not load database schema from ${schemaFilePath}: ${reason}`);
  }
}

async function bootstrap() {
  ensureDbConfig();
  mysqlPool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10
  });
  await ensureSchema();
  await ensureBootstrapAdmins();

  const server = http.createServer(async (req, res) => {
    setCorsHeaders(res);

    if (!req.url) {
      json(res, 404, { ok: false, error: "Not found." });
      return;
    }

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    let pathname = requestUrl.pathname;
    pathname = stripBasePath(pathname, BASE_PATH);
    // Backward compatibility for older clients hardcoded with /backend.
    pathname = stripBasePath(pathname, "/backend");

    try {
      if (req.method === "GET" && pathname === "/health") {
        json(res, 200, {
          ok: true,
          service: "image-analyser-backend",
          mode: "phase1-saas",
          now: new Date().toISOString()
        });
        return;
      }

      if (req.method === "GET" && pathname === "/api/pricing/context") {
        await handlePricingContext(req, res);
        return;
      }

      if (req.method === "POST" && pathname === "/api/auth/signup") {
        await handleSignup(req, res);
        return;
      }

      if (req.method === "POST" && pathname === "/api/auth/signin") {
        await handleSignin(req, res);
        return;
      }

      if (req.method === "GET" && pathname === "/api/auth/google/config") {
        await handleGoogleAuthConfig(req, res);
        return;
      }

      if (req.method === "GET" && pathname === "/api/auth/google/bridge") {
        await handleGoogleAuthBridge(req, res, requestUrl);
        return;
      }

      if (req.method === "POST" && pathname === "/api/auth/google") {
        await handleGoogleAuth(req, res);
        return;
      }

      if (req.method === "GET" && pathname === "/api/me") {
        await handleMe(req, res);
        return;
      }

      if (req.method === "GET" && pathname === "/api/usage") {
        await handleUsage(req, res);
        return;
      }

      if (req.method === "GET" && pathname === "/api/prompts/saved") {
        await handleListSavedPrompts(req, res, requestUrl);
        return;
      }

      if (req.method === "POST" && pathname === "/api/prompts/saved") {
        await handleSavePrompt(req, res);
        return;
      }

      const deleteSavedMatch = pathname.match(/^\/api\/prompts\/saved\/(\d+)$/);
      if (req.method === "DELETE" && deleteSavedMatch) {
        await handleDeleteSavedPrompt(req, res, Number(deleteSavedMatch[1]));
        return;
      }

      if (req.method === "POST" && pathname === "/api/subscription/plan") {
        await handleSelfSetPlan(req, res);
        return;
      }

      if (req.method === "POST" && pathname === "/api/billing/cancel-subscription") {
        await handleCancelSubscription(req, res);
        return;
      }

      if (req.method === "POST" && pathname === "/api/billing/checkout-session") {
        await handleCreateCheckoutSession(req, res);
        return;
      }

      if (req.method === "POST" && pathname === "/api/billing/portal-session") {
        await handleCreateBillingPortalSession(req, res);
        return;
      }

      if (req.method === "GET" && pathname === "/api/billing/orders") {
        await handleListBillingOrders(req, res);
        return;
      }

      if (req.method === "POST" && pathname === "/api/billing/verify-payment") {
        await handleVerifyRazorpayPayment(req, res);
        return;
      }

      if (req.method === "POST" && pathname === "/api/billing/webhook") {
        await handleRazorpayWebhook(req, res);
        return;
      }

      if (req.method === "GET" && pathname === "/api/admin/users") {
        await handleAdminListUsers(req, res);
        return;
      }

      if (req.method === "GET" && pathname === "/api/superadmin/overview") {
        await handleSuperadminOverview(req, res);
        return;
      }

      if (req.method === "GET" && pathname === "/api/superadmin/admins") {
        await handleSuperadminListAdmins(req, res);
        return;
      }

      if (req.method === "POST" && pathname === "/api/superadmin/admins") {
        await handleSuperadminCreateAdmin(req, res);
        return;
      }

      if (req.method === "GET" && pathname === "/api/superadmin/audit") {
        await handleSuperadminAudit(req, res);
        return;
      }

      if (req.method === "GET" && pathname === "/api/admin/overview") {
        await handleAdminOverview(req, res);
        return;
      }

      if (req.method === "GET" && pathname === "/api/admin/audit") {
        await handleAdminAudit(req, res);
        return;
      }

      const summaryMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/summary$/);
      if (req.method === "GET" && summaryMatch) {
        await handleAdminUserSummary(req, res, Number(summaryMatch[1]));
        return;
      }

      const planMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/plan$/);
      if (req.method === "POST" && planMatch) {
        await handleAdminSetPlan(req, res, Number(planMatch[1]));
        return;
      }

      const statusMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/status$/);
      if (req.method === "POST" && statusMatch) {
        await handleAdminSetStatus(req, res, Number(statusMatch[1]));
        return;
      }

      const roleMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/role$/);
      if (req.method === "POST" && roleMatch) {
        await handleAdminSetRole(req, res, Number(roleMatch[1]));
        return;
      }

      if (req.method === "POST" && pathname === "/api/describe-image") {
        await handleDescribeImage(req, res);
        return;
      }

      if (req.method === "POST" && pathname === "/api/translate-prompt") {
        await handleTranslatePrompt(req, res);
        return;
      }

      json(res, 404, { ok: false, error: "Not found." });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      json(res, status, { ok: false, error: toUserError(error) });
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`Image Analyser backend running at http://${HOST}:${PORT}`);
  });
}

async function handleSignup(req, res) {
  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email) {
    throw new HttpError(400, "Valid email is required.");
  }

  if (!isStrongPassword(password)) {
    throw new HttpError(400, "Password must be at least 8 characters.");
  }

  const passwordHash = await hashPassword(password);

  let userId;
  try {
    userId = await insertUser({ email, passwordHash });
  } catch (error) {
    const message = toUserError(error);
    if (/duplicate entry/i.test(message)) {
      throw new HttpError(409, "Account already exists.");
    }
    throw error;
  }

  const subscription = await setUserPlan(userId, "free", null);
  const token = createAuthToken({ sub: userId, role: "subscriber", email });
  const usage = await buildUsageSummary("user", String(userId), subscription.monthlyQuota);

  json(res, 201, {
    ok: true,
    token,
    user: {
      id: userId,
      email,
      role: "subscriber",
      status: "active"
    },
    subscription,
    usage
  });
}

async function handleSignin(req, res) {
  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    throw new HttpError(400, "Email and password are required.");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new HttpError(401, "Invalid email or password.");
  }

  if (user.status !== "active") {
    throw new HttpError(403, "Account is not active.");
  }

  const subscription = await getOrCreateActiveSubscription(user.id, user.planCode);
  const token = createAuthToken({ sub: user.id, role: user.role, email: user.email });
  const usage = await buildUsageSummary("user", String(user.id), subscription.monthlyQuota);

  json(res, 200, {
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    },
    subscription,
    usage
  });
}

async function handlePricingContext(req, res) {
  const pricing = buildPricingContext(req);
  json(res, 200, {
    ok: true,
    pricing
  });
}

async function handleGoogleAuthConfig(_req, res) {
  json(res, 200, {
    ok: true,
    enabled: Boolean(GOOGLE_CLIENT_ID),
    clientId: GOOGLE_CLIENT_ID || null
  });
}

async function handleGoogleAuthBridge(_req, res, requestUrl) {
  if (!GOOGLE_CLIENT_ID) {
    throw new HttpError(503, "Google login is not configured.");
  }

  const state = typeof requestUrl?.searchParams?.get("state") === "string"
    ? requestUrl.searchParams.get("state").trim()
    : "";
  const redirectUri = typeof requestUrl?.searchParams?.get("redirect_uri") === "string"
    ? requestUrl.searchParams.get("redirect_uri").trim()
    : "";

  if (!state) {
    throw new HttpError(400, "state is required.");
  }

  if (!isValidExtensionRedirectUri(redirectUri)) {
    throw new HttpError(400, "redirect_uri is invalid.");
  }

  const escapedClientId = escapeHtml(GOOGLE_CLIENT_ID);
  const escapedState = escapeHtml(state);
  const escapedRedirectUri = escapeHtml(redirectUri);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Google Sign In</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; background: #f8fafc; color: #0f172a; }
    .wrap { min-height: 100vh; display: grid; place-items: center; padding: 20px; }
    .card { width: min(460px, 92vw); background: #fff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 18px; box-shadow: 0 10px 28px rgba(15,23,42,.12); }
    h1 { margin: 0 0 8px; font-size: 1.05rem; }
    p { margin: 0 0 14px; font-size: .9rem; color: #334155; line-height: 1.45; }
    #googleButton { min-height: 44px; display: grid; place-items: start; }
    #status { margin-top: 12px; min-height: 20px; font-size: .82rem; color: #475569; }
    #status.error { color: #b91c1c; }
  </style>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Continue with Google</h1>
      <p>Choose your Google account to continue.</p>
      <div id="googleButton"></div>
      <div id="status">Loading Google sign in...</div>
    </div>
  </div>
  <script>
    (function () {
      const state = ${JSON.stringify(escapedState)};
      const redirectUri = ${JSON.stringify(escapedRedirectUri)};
      const clientId = ${JSON.stringify(escapedClientId)};
      const statusEl = document.getElementById("status");
      const buttonEl = document.getElementById("googleButton");

      function sendResult(params) {
        const hash = new URLSearchParams(params).toString();
        window.location.replace(redirectUri + "#" + hash);
      }

      function fail(code, detail) {
        statusEl.classList.add("error");
        statusEl.textContent = detail ? String(detail) : "Google sign-in failed.";
        sendResult({
          state,
          bridge_error: code || "google_sign_in_failed",
          bridge_error_description: detail || ""
        });
      }

      function onCredentialResponse(response) {
        const credential = response && typeof response.credential === "string" ? response.credential : "";
        if (!credential) {
          fail("missing_credential", "Google did not return a credential.");
          return;
        }

        sendResult({
          state,
          id_token: credential
        });
      }

      function init() {
        if (!window.google || !window.google.accounts || !window.google.accounts.id) {
          fail("gsi_unavailable", "Google SDK is unavailable.");
          return;
        }

        statusEl.textContent = "Waiting for Google account selection...";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: onCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signin"
        });

        window.google.accounts.id.renderButton(buttonEl, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 280
        });

        window.google.accounts.id.prompt(function (notification) {
          const notDisplayed = notification && typeof notification.isNotDisplayed === "function" && notification.isNotDisplayed();
          const skipped = notification && typeof notification.isSkippedMoment === "function" && notification.isSkippedMoment();
          if (notDisplayed || skipped) {
            statusEl.textContent = "Click Continue with Google.";
          }
        });
      }

      if (document.readyState === "complete" || document.readyState === "interactive") {
        init();
      } else {
        document.addEventListener("DOMContentLoaded", init, { once: true });
      }
    })();
  </script>
</body>
</html>`;

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(html);
}

async function handleGoogleAuth(req, res) {
  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const idToken = typeof body?.idToken === "string" ? body.idToken.trim() : "";

  if (!idToken) {
    throw new HttpError(400, "Google ID token is required.");
  }

  const googleProfile = await verifyGoogleIdToken(idToken);
  const email = normalizeEmail(googleProfile.email);
  if (!email) {
    throw new HttpError(401, "Google account did not return a valid email.");
  }

  let user = await findUserByEmail(email);

  if (!user) {
    const generatedPassword = `google-${googleProfile.sub || randomUUID()}-${randomBytes(12).toString("hex")}`;
    const passwordHash = await hashPassword(generatedPassword);
    const userId = await insertUser({ email, passwordHash });
    const subscription = await setUserPlan(userId, "free", null);
    const token = createAuthToken({ sub: userId, role: "subscriber", email });
    const usage = await buildUsageSummary("user", String(userId), subscription.monthlyQuota);

    json(res, 200, {
      ok: true,
      token,
      user: {
        id: userId,
        email,
        role: "subscriber",
        status: "active"
      },
      subscription,
      usage
    });
    return;
  }

  if (user.status !== "active") {
    throw new HttpError(403, "Account is not active.");
  }

  const subscription = await getOrCreateActiveSubscription(user.id, user.planCode);
  const token = createAuthToken({ sub: user.id, role: user.role, email: user.email });
  const usage = await buildUsageSummary("user", String(user.id), subscription.monthlyQuota);

  json(res, 200, {
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    },
    subscription,
    usage
  });
}

async function handleMe(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  const usage = await buildUsageSummary("user", String(actor.user.id), actor.subscription.monthlyQuota);

  json(res, 200, {
    ok: true,
    user: actor.user,
    subscription: actor.subscription,
    usage
  });
}

async function handleUsage(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  const usage = await buildUsageSummary("user", String(actor.user.id), actor.subscription.monthlyQuota);

  json(res, 200, {
    ok: true,
    plan: {
      code: actor.subscription.planCode,
      name: actor.subscription.planName,
      monthlyQuota: actor.subscription.monthlyQuota,
      priceUsdCents: actor.subscription.priceUsdCents
    },
    usage
  });
}

async function handleListSavedPrompts(req, res, requestUrl) {
  const actor = await resolveActor(req, { requireUser: true });
  const limitRaw = Number.parseInt(String(requestUrl?.searchParams?.get("limit") || "40"), 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 40;
  const prompts = await listSavedPromptsByUserId(actor.user.id, limit);

  json(res, 200, {
    ok: true,
    prompts
  });
}

async function handleSavePrompt(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  const body = await readJsonBody(req, MAX_BODY_BYTES);

  const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
  const description =
    typeof body?.description === "string" && body.description.trim()
      ? body.description.trim()
      : typeof body?.promptText === "string" && body.promptText.trim()
        ? body.promptText.trim()
        : "";
  const model =
    typeof body?.model === "string" && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : "";
  const sourcePageUrl =
    typeof body?.sourcePageUrl === "string"
      ? body.sourcePageUrl
      : typeof body?.pageUrl === "string"
        ? body.pageUrl
        : "";

  if (!requestId) {
    throw new HttpError(400, "requestId is required.");
  }

  if (!description) {
    throw new HttpError(400, "description is required.");
  }

  await saveGeneratedPrompt({
    userId: actor.user.id,
    requestId,
    model,
    promptText: description,
    imageUrl,
    sourcePageUrl
  });

  json(res, 200, {
    ok: true,
    saved: true,
    requestId
  });
}

async function handleDeleteSavedPrompt(req, res, promptId) {
  const actor = await resolveActor(req, { requireUser: true });
  const id = Number.isFinite(promptId) && promptId > 0 ? Math.floor(promptId) : 0;
  if (!id) {
    throw new HttpError(400, "Invalid prompt id.");
  }
  const deleted = await deleteSavedPromptByIdAndUser(id, actor.user.id);
  if (!deleted) {
    throw new HttpError(404, "Saved prompt not found.");
  }
  json(res, 200, { ok: true, deleted: true });
}

async function handleSelfSetPlan(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const planCode = normalizeUserPlanCode(body?.planCode);

  if (!planCode) {
    throw new HttpError(400, "planCode must be one of: free, pro, unlimited.");
  }

  const currentPlanCode = normalizeUserPlanCode(actor.subscription?.planCode) || "free";
  const currentRank = getPlanRank(currentPlanCode);
  const targetRank = getPlanRank(planCode);

  if (targetRank > currentRank) {
    throw new HttpError(402, "Plan upgrade requires payment. Use checkout.");
  }

  const subscription =
    targetRank === currentRank ? actor.subscription : await setUserPlan(actor.user.id, planCode, actor.user.id);
  const usage = await buildUsageSummary("user", String(actor.user.id), subscription.monthlyQuota);

  json(res, 200, {
    ok: true,
    subscription,
    usage
  });
}

async function handleCancelSubscription(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  const currentPlanCode = normalizeUserPlanCode(actor.subscription?.planCode) || "free";

  if (currentPlanCode === "free") {
    const usage = await buildUsageSummary("user", String(actor.user.id), actor.subscription.monthlyQuota);
    json(res, 200, {
      ok: true,
      canceled: false,
      message: "You are already on the Free plan.",
      subscription: actor.subscription,
      usage
    });
    return;
  }

  const subscription = await setUserPlan(actor.user.id, "free", actor.user.id);
  const usage = await buildUsageSummary("user", String(actor.user.id), subscription.monthlyQuota);

  json(res, 200, {
    ok: true,
    canceled: true,
    message: "Subscription canceled. No refund will be given for current month.",
    previousPlanCode: currentPlanCode,
    subscription,
    usage
  });
}

async function handleCreateCheckoutSession(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const planCode = normalizeUserPlanCode(body?.planCode);
  const billingCycle = normalizeBillingCycle(body?.billingCycle);

  if (planCode !== "pro" && planCode !== "unlimited") {
    throw new HttpError(400, "checkout supports paid plans only: pro, unlimited.");
  }

  const currentPlanCode = normalizeUserPlanCode(actor.subscription?.planCode) || "free";
  const currentRank = getPlanRank(currentPlanCode);
  const targetRank = getPlanRank(planCode);
  if (targetRank <= currentRank) {
    throw new HttpError(400, "Checkout is only required for upgrades.");
  }

  ensureRazorpayConfigured();
  const pricingContext = buildPricingContext(req);
  const charge = getRazorpayChargeForPlan(planCode, billingCycle, pricingContext.currency);

  const order = await razorpayRequest("POST", "/orders", {
    amount: charge.amountSubunits,
    currency: charge.currency,
    receipt: `i2p_${actor.user.id}_${Date.now()}`,
    notes: {
      user_id: String(actor.user.id),
      user_email: actor.user.email,
      plan_code: planCode,
      billing_cycle: billingCycle
    }
  });

  const orderId = typeof order?.id === "string" ? order.id.trim() : "";
  if (!orderId) {
    throw new HttpError(502, "Razorpay order creation failed.");
  }

  await upsertBillingOrderCreated({
    orderId,
    userId: actor.user.id,
    planCode,
    billingCycle,
    amountSubunits: charge.amountSubunits,
    currency: charge.currency
  });

  const planName = PLAN_CONFIG[planCode].name;
  json(res, 200, {
    ok: true,
    provider: "razorpay",
    keyId: RAZORPAY_KEY_ID,
    orderId,
    amount: charge.amountSubunits,
    currency: charge.currency,
    planCode,
    billingCycle,
    name: "Image to Prompt",
    description: `${planName} ${billingCycle} plan`,
    prefill: {
      email: actor.user.email
    }
  });
}

async function handleVerifyRazorpayPayment(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  ensureRazorpayConfigured();

  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const orderId = typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id.trim() : "";
  const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id.trim() : "";
  const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature.trim() : "";

  if (!orderId || !paymentId || !signature) {
    throw new HttpError(400, "Missing Razorpay payment verification fields.");
  }

  const order = await findBillingOrderByOrderIdAndUser(orderId, actor.user.id);
  if (!order) {
    throw new HttpError(404, "Billing order not found for this user.");
  }

  if (order.status === "paid") {
    const subscription = await getActiveSubscription(actor.user.id);
    const usage = await buildUsageSummary("user", String(actor.user.id), subscription?.monthlyQuota ?? 20);
    json(res, 200, {
      ok: true,
      billingCycle: order.billingCycle,
      subscription,
      usage
    });
    return;
  }

  if (!isValidRazorpayPaymentSignature(orderId, paymentId, signature, RAZORPAY_KEY_SECRET)) {
    await markBillingOrderFailed(orderId, paymentId, signature, body);
    throw new HttpError(400, "Invalid Razorpay signature.");
  }

  const payment = await razorpayRequest("GET", `/payments/${encodeURIComponent(paymentId)}`);
  const paymentOrderId = typeof payment?.order_id === "string" ? payment.order_id.trim() : "";
  const paymentStatus = typeof payment?.status === "string" ? payment.status.trim().toLowerCase() : "";
  const paymentAmount = Number.parseInt(String(payment?.amount || 0), 10);
  const paymentCurrency = typeof payment?.currency === "string" ? payment.currency.trim().toUpperCase() : "";

  if (!paymentOrderId || paymentOrderId !== orderId) {
    await markBillingOrderFailed(orderId, paymentId, signature, payment);
    throw new HttpError(400, "Payment does not match the order.");
  }

  if (paymentStatus !== "captured" && paymentStatus !== "authorized") {
    await markBillingOrderFailed(orderId, paymentId, signature, payment);
    throw new HttpError(400, "Payment is not captured.");
  }

  if (
    Number.isFinite(order.amountSubunits) &&
    order.amountSubunits > 0 &&
    Number.isFinite(paymentAmount) &&
    paymentAmount > 0 &&
    paymentAmount !== order.amountSubunits
  ) {
    await markBillingOrderFailed(orderId, paymentId, signature, payment);
    throw new HttpError(400, "Payment amount mismatch.");
  }

  if (order.currency && paymentCurrency && paymentCurrency !== order.currency) {
    await markBillingOrderFailed(orderId, paymentId, signature, payment);
    throw new HttpError(400, "Payment currency mismatch.");
  }

  const planCode = normalizeUserPlanCode(order.planCode);
  if (planCode !== "pro" && planCode !== "unlimited") {
    await markBillingOrderFailed(orderId, paymentId, signature, payment);
    throw new HttpError(400, "Invalid plan for paid billing.");
  }

  const subscription = await setUserPlan(actor.user.id, planCode, actor.user.id);
  await markBillingOrderPaid(orderId, paymentId, signature, payment);
  const usage = await buildUsageSummary("user", String(actor.user.id), subscription.monthlyQuota);

  json(res, 200, {
    ok: true,
    billingCycle: order.billingCycle,
    subscription,
    usage
  });
}

async function handleCreateBillingPortalSession(req, res) {
  await resolveActor(req, { requireUser: true });

  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const returnUrl = normalizeAbsoluteHttpUrl(body?.returnUrl) || getFallbackAppOrigin(req);

  json(res, 200, {
    ok: true,
    url: returnUrl,
    message: "Billing is managed in-app. Use plan buttons to switch plans."
  });
}

async function handleListBillingOrders(req, res) {
  const actor = await resolveActor(req, { requireUser: true });

  const rows = await queryJson(`
    SELECT JSON_OBJECT(
      'id', id,
      'planCode', plan_code,
      'billingCycle', billing_cycle,
      'amountSubunits', amount_subunits,
      'currency', currency,
      'status', status,
      'createdAt', DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ')
    )
    FROM billing_orders
    WHERE user_id = ${sqlNumber(actor.user.id)}
    ORDER BY created_at DESC
    LIMIT 100
  `);

  const orders = (Array.isArray(rows) ? rows : []).map((r) => ({
    id: r?.id,
    planCode: normalizeUserPlanCode(r?.planCode),
    billingCycle: normalizeBillingCycle(r?.billingCycle),
    amountSubunits: Number.parseInt(String(r?.amountSubunits || 0), 10) || 0,
    currency: typeof r?.currency === "string" ? r.currency.trim().toUpperCase() : "",
    status: typeof r?.status === "string" ? r.status.trim().toLowerCase() : "",
    createdAt: typeof r?.createdAt === "string" ? r.createdAt : null
  }));

  json(res, 200, { ok: true, orders });
}

async function handleRazorpayWebhook(req, res) {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    json(res, 200, { ok: true, ignored: true, reason: "RAZORPAY_WEBHOOK_SECRET is not configured." });
    return;
  }

  const rawBody = await readRawBody(req, MAX_BODY_BYTES);
  const signature = getSingleHeader(req.headers["x-razorpay-signature"]);

  if (!signature || !isValidRazorpayWebhookSignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET)) {
    throw new HttpError(400, "Invalid Razorpay webhook signature.");
  }

  json(res, 200, { ok: true, received: true });
}

async function handleAdminListUsers(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  ensureRole(actor.user.role, ["admin", "superadmin"]);

  const users = await listAdminUsers();
  json(res, 200, { ok: true, users });
}

async function handleSuperadminOverview(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  ensureRole(actor.user.role, ["superadmin"]);

  const overview = await getSuperadminOverview();
  json(res, 200, { ok: true, overview });
}

async function handleSuperadminListAdmins(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  ensureRole(actor.user.role, ["superadmin"]);

  const admins = await listSuperadminAdminAccounts();
  json(res, 200, { ok: true, admins });
}

async function handleSuperadminCreateAdmin(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  ensureRole(actor.user.role, ["superadmin"]);

  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  const roleRaw = typeof body?.role === "string" ? body.role.trim().toLowerCase() : "admin";
  const role = roleRaw === "superadmin" ? "superadmin" : "admin";

  if (!email) {
    throw new HttpError(400, "Valid email is required.");
  }

  if (!isStrongPassword(password)) {
    throw new HttpError(400, "Password must be at least 8 characters.");
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new HttpError(409, "User already exists with this email.");
  }

  const passwordHash = await hashPassword(password);
  const userId = await executeInsertAndReadId(`
    INSERT INTO users (email, password_hash, role, status, plan_code, created_at, updated_at)
    VALUES (
      ${sqlString(email)},
      ${sqlString(passwordHash)},
      ${sqlString(role)},
      'active',
      'free',
      UTC_TIMESTAMP(),
      UTC_TIMESTAMP()
    )
  `);
  await setUserPlan(userId, "free", null);
  await logAdminAction(actor.user.id, "create_admin", userId, {
    email,
    role
  });

  const createdUser = await findUserById(userId);
  json(res, 200, {
    ok: true,
    user: {
      id: createdUser?.id || userId,
      email: createdUser?.email || email,
      role: createdUser?.role || role,
      status: createdUser?.status || "active"
    }
  });
}

async function handleSuperadminAudit(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  ensureRole(actor.user.role, ["superadmin"]);

  const events = await listAdminAuditLogs(200);
  json(res, 200, { ok: true, events });
}

async function handleAdminOverview(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  ensureRole(actor.user.role, ["admin", "superadmin"]);

  const overview = await getAdminOverview();
  json(res, 200, { ok: true, overview });
}

async function handleAdminAudit(req, res) {
  const actor = await resolveActor(req, { requireUser: true });
  ensureRole(actor.user.role, ["admin", "superadmin"]);

  const events = await listAdminAuditLogs(80);
  json(res, 200, { ok: true, events });
}

async function handleAdminUserSummary(req, res, targetUserId) {
  const actor = await resolveActor(req, { requireUser: true });
  ensureRole(actor.user.role, ["admin", "superadmin"]);

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    throw new HttpError(404, "User not found.");
  }

  if (actor.user.role === "admin" && targetUser.role === "superadmin") {
    throw new HttpError(403, "Only superadmin can manage superadmin users.");
  }

  const subscription = await getOrCreateActiveSubscription(targetUserId, targetUser.planCode);
  const usage = await buildUsageSummary("user", String(targetUserId), subscription.monthlyQuota);
  const orders = await listBillingOrdersByUserId(targetUserId, 20);

  json(res, 200, {
    ok: true,
    user: {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      status: targetUser.status,
      planCode: targetUser.planCode,
      createdAt: targetUser.createdAt || null
    },
    subscription,
    usage,
    orders
  });
}

async function handleAdminSetPlan(req, res, targetUserId) {
  const actor = await resolveActor(req, { requireUser: true });
  ensureRole(actor.user.role, ["admin", "superadmin"]);

  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const planCode = normalizeUserPlanCode(body?.planCode);

  if (!planCode) {
    throw new HttpError(400, "planCode must be one of: free, pro, unlimited.");
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    throw new HttpError(404, "User not found.");
  }

  if (actor.user.role === "admin" && targetUser.role === "superadmin") {
    throw new HttpError(403, "Only superadmin can manage superadmin users.");
  }

  const subscription = await setUserPlan(targetUserId, planCode, actor.user.id);
  const usage = await buildUsageSummary("user", String(targetUserId), subscription.monthlyQuota);

  json(res, 200, {
    ok: true,
    user: {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      status: targetUser.status
    },
    subscription,
    usage
  });
}

async function handleAdminSetStatus(req, res, targetUserId) {
  const actor = await resolveActor(req, { requireUser: true });
  ensureRole(actor.user.role, ["admin", "superadmin"]);

  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const status = typeof body?.status === "string" ? body.status.trim().toLowerCase() : "";

  if (status !== "active" && status !== "suspended") {
    throw new HttpError(400, "status must be one of: active, suspended.");
  }

  if (targetUserId === actor.user.id && status === "suspended") {
    throw new HttpError(400, "You cannot suspend your own account.");
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    throw new HttpError(404, "User not found.");
  }

  if (actor.user.role === "admin" && targetUser.role === "superadmin") {
    throw new HttpError(403, "Only superadmin can manage superadmin users.");
  }

  await runSql(`
    UPDATE users
    SET status = ${sqlString(status)}, updated_at = UTC_TIMESTAMP()
    WHERE id = ${sqlNumber(targetUserId)}
  `);

  await logAdminAction(actor.user.id, "set_status", targetUserId, {
    status
  });

  json(res, 200, {
    ok: true,
    user: {
      id: targetUserId,
      status
    }
  });
}

async function handleAdminSetRole(req, res, targetUserId) {
  const actor = await resolveActor(req, { requireUser: true });
  ensureRole(actor.user.role, ["superadmin"]);

  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const role = typeof body?.role === "string" ? body.role.trim().toLowerCase() : "";

  if (!USER_ROLES.includes(role)) {
    throw new HttpError(400, "role must be one of: subscriber, admin, superadmin.");
  }

  if (targetUserId === actor.user.id) {
    throw new HttpError(400, "You cannot change your own role.");
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    throw new HttpError(404, "User not found.");
  }

  if (targetUser.role === "superadmin" && role !== "superadmin") {
    const superadminCount = await countUsersByRole("superadmin");
    if (superadminCount <= 1) {
      throw new HttpError(400, "At least one superadmin must remain.");
    }
  }

  await runSql(`
    UPDATE users
    SET role = ${sqlString(role)}, updated_at = UTC_TIMESTAMP()
    WHERE id = ${sqlNumber(targetUserId)}
  `);

  await logAdminAction(actor.user.id, "set_role", targetUserId, {
    role
  });

  json(res, 200, {
    ok: true,
    user: {
      id: targetUserId,
      role
    }
  });
}

async function handleDescribeImage(req, res) {
  const actor = await resolveActor(req, { requireUser: AUTH_REQUIRED });

  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const model = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;
  const normalizedAltText = sanitizePromptContext(body?.altText);
  const promptConfig = buildPromptConfig({
    rawPrompt: body?.prompt,
    altText: normalizedAltText
  });
  const imageInput = resolveImageInput(body?.imageDataUrl, body?.imageUrl);
  const apiKey = getOpenAiApiKey();

  const plan = actor.subscription || PLAN_CONFIG.guest;
  const usageBefore = await buildUsageSummary(actor.subjectType, actor.subjectKey, plan.monthlyQuota);

  if (usageBefore.limit !== null && usageBefore.used >= usageBefore.limit) {
    throw new HttpError(402, "Monthly usage limit reached. Upgrade your plan to continue.");
  }

  const rawDescription = await analyzeImage({
    apiKey,
    model,
    prompt: promptConfig.prompt,
    imageInput
  });
  let description = normalizePromptOutput(rawDescription) || rawDescription;

  if (!isPromptQualityAcceptable(description)) {
    const retryPrompt = buildQualityRetryPrompt({
      candidatePrompt: description,
      template: promptConfig.template,
      altText: normalizedAltText
    });
    const retryRawDescription = await analyzeImage({
      apiKey,
      model,
      prompt: retryPrompt,
      imageInput
    });
    const retryDescription = normalizePromptOutput(retryRawDescription) || retryRawDescription;
    description = pickHigherQualityPrompt(description, retryDescription);
  }

  const requestId = randomUUID();
  const consumed = await consumeUsage({
    subjectType: actor.subjectType,
    subjectKey: actor.subjectKey,
    limit: plan.monthlyQuota,
    planCode: plan.planCode,
    requestId
  });
  if (!consumed) {
    throw new HttpError(402, "Monthly usage limit reached. Upgrade your plan to continue.");
  }

  const usageAfter = await buildUsageSummary(actor.subjectType, actor.subjectKey, plan.monthlyQuota);

  json(res, 200, {
    ok: true,
    model,
    description,
    template: promptConfig.template,
    requestId,
    role: actor.user?.role || "guest",
    plan: {
      code: plan.planCode,
      name: plan.planName,
      monthlyQuota: plan.monthlyQuota,
      priceUsdCents: plan.priceUsdCents
    },
    usage: usageAfter
  });
}

const TRANSLATE_LANGUAGES = {
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese"
};

async function handleTranslatePrompt(req, res) {
  const actor = await resolveActor(req, { requireUser: true });

  const body = await readJsonBody(req, MAX_BODY_BYTES);
  const targetLangCode = typeof body?.targetLanguage === "string" ? body.targetLanguage.trim().toLowerCase() : "";
  const languageName = TRANSLATE_LANGUAGES[targetLangCode];
  if (!languageName) {
    throw new HttpError(400, "Invalid target language. Use: hi, es, fr, de, ja.");
  }

  const description = typeof body?.description === "string" ? body.description.trim() : "";
  if (!description) {
    throw new HttpError(400, "Description (prompt) is required.");
  }

  const imageInput = resolveImageInput(body?.imageDataUrl, body?.imageUrl);
  const model = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;
  const apiKey = getOpenAiApiKey();

  const plan = actor.subscription || PLAN_CONFIG.guest;
  const usageBefore = await buildUsageSummary(actor.subjectType, actor.subjectKey, plan.monthlyQuota);

  if (usageBefore.limit !== null && usageBefore.used >= usageBefore.limit) {
    throw new HttpError(402, "Monthly usage limit reached. Upgrade your plan to continue.");
  }

  const translatePrompt = `The user has provided an image and its description in English below. Rewrite the description entirely in ${languageName}. Keep the same structure, detail level, and image-generation focus. Output only the translated prompt text. No wrappers, labels, or markdown.

Original description:
${description}`;

  const rawDescription = await analyzeImage({
    apiKey,
    model,
    prompt: translatePrompt,
    imageInput
  });
  const translatedDescription = normalizePromptOutput(rawDescription) || rawDescription;

  const requestId = randomUUID();
  const consumed = await consumeUsage({
    subjectType: actor.subjectType,
    subjectKey: actor.subjectKey,
    limit: plan.monthlyQuota,
    planCode: plan.planCode,
    requestId
  });
  if (!consumed) {
    throw new HttpError(402, "Monthly usage limit reached. Upgrade your plan to continue.");
  }

  const usageAfter = await buildUsageSummary(actor.subjectType, actor.subjectKey, plan.monthlyQuota);

  json(res, 200, {
    ok: true,
    model,
    description: translatedDescription,
    requestId,
    targetLanguage: targetLangCode,
    usage: usageAfter
  });
}

async function resolveActor(req, options = {}) {
  const requireUser = Boolean(options.requireUser);
  const token = readBearerToken(req.headers.authorization);

  if (!token) {
    if (requireUser) {
      throw new HttpError(401, "Authentication required.");
    }

    return {
      subjectType: "guest",
      subjectKey: getGuestSubjectKey(req),
      subscription: {
        planCode: PLAN_CONFIG.guest.code,
        planName: PLAN_CONFIG.guest.name,
        monthlyQuota: PLAN_CONFIG.guest.monthlyQuota,
        priceUsdCents: PLAN_CONFIG.guest.priceUsdCents,
        status: "active",
        renewsAt: null
      },
      user: null
    };
  }

  const payload = verifyAuthToken(token);
  const userId = Number.parseInt(String(payload.sub), 10);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new HttpError(401, "Invalid token.");
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new HttpError(401, "User not found for token.");
  }

  if (user.status !== "active") {
    throw new HttpError(403, "Account is not active.");
  }

  const subscription = await getOrCreateActiveSubscription(user.id, user.planCode);

  return {
    subjectType: "user",
    subjectKey: String(user.id),
    user,
    subscription
  };
}

async function buildUsageSummary(subjectType, subjectKey, monthlyQuota) {
  const periodKey = getCurrentPeriodKey();
  const used = await getUsageCount(subjectType, subjectKey, periodKey);

  return {
    periodKey,
    used,
    limit: monthlyQuota,
    remaining: monthlyQuota === null ? null : Math.max(0, monthlyQuota - used)
  };
}

async function insertUser({ email, passwordHash }) {
  const insertSql = `
    INSERT INTO users (email, password_hash, role, status, plan_code, created_at, updated_at)
    VALUES (
      ${sqlString(email)},
      ${sqlString(passwordHash)},
      'subscriber',
      'active',
      'free',
      UTC_TIMESTAMP(),
      UTC_TIMESTAMP()
    )
  `;

  return executeInsertAndReadId(insertSql);
}

async function setUserPlan(userId, planCode, actorUserId) {
  const normalized = normalizeUserPlanCode(planCode);
  if (!normalized) {
    throw new HttpError(400, "Invalid plan code.");
  }

  const config = PLAN_CONFIG[normalized];
  const quota = config.monthlyQuota === null ? "NULL" : sqlNumber(config.monthlyQuota);

  await runSql(`
    UPDATE users
    SET plan_code = ${sqlString(normalized)}, updated_at = UTC_TIMESTAMP()
    WHERE id = ${sqlNumber(userId)}
  `);

  await runSql(`
    UPDATE subscriptions
    SET status = 'canceled', updated_at = UTC_TIMESTAMP()
    WHERE user_id = ${sqlNumber(userId)} AND status = 'active'
  `);

  await runSql(`
    INSERT INTO subscriptions (
      user_id,
      plan_code,
      status,
      monthly_quota,
      price_usd_cents,
      started_at,
      renews_at,
      created_at,
      updated_at
    ) VALUES (
      ${sqlNumber(userId)},
      ${sqlString(normalized)},
      'active',
      ${quota},
      ${sqlNumber(config.priceUsdCents)},
      UTC_TIMESTAMP(),
      DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 DAY),
      UTC_TIMESTAMP(),
      UTC_TIMESTAMP()
    )
  `);

  if (Number.isFinite(actorUserId) && actorUserId > 0) {
    await logAdminAction(actorUserId, "set_plan", userId, {
      planCode: normalized
    });
  }

  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    throw new HttpError(500, "Could not fetch subscription.");
  }

  return subscription;
}

async function getOrCreateActiveSubscription(userId, fallbackPlanCode) {
  let subscription = await getActiveSubscription(userId);
  if (subscription) {
    return subscription;
  }

  const normalized = normalizeUserPlanCode(fallbackPlanCode) || "free";
  await setUserPlan(userId, normalized, null);
  subscription = await getActiveSubscription(userId);

  if (!subscription) {
    throw new HttpError(500, "Could not initialize subscription.");
  }

  return subscription;
}

async function getActiveSubscription(userId) {
  return queryOneJson(`
    SELECT JSON_OBJECT(
      'id', id,
      'userId', user_id,
      'planCode', plan_code,
      'planName', CASE
        WHEN plan_code = 'free' THEN 'Free'
        WHEN plan_code = 'pro' THEN 'Pro'
        WHEN plan_code = 'unlimited' THEN 'Unlimited'
        ELSE 'Unknown'
      END,
      'status', status,
      'monthlyQuota', monthly_quota,
      'priceUsdCents', price_usd_cents,
      'renewsAt', DATE_FORMAT(renews_at, '%Y-%m-%dT%H:%i:%sZ')
    )
    FROM subscriptions
    WHERE user_id = ${sqlNumber(userId)} AND status = 'active'
    ORDER BY id DESC
    LIMIT 1
  `);
}

async function findUserById(userId) {
  return queryOneJson(`
    SELECT JSON_OBJECT(
      'id', id,
      'email', email,
      'passwordHash', password_hash,
      'role', role,
      'status', status,
      'planCode', plan_code,
      'createdAt', DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ')
    )
    FROM users
    WHERE id = ${sqlNumber(userId)}
    LIMIT 1
  `);
}

async function findUserByEmail(email) {
  return queryOneJson(`
    SELECT JSON_OBJECT(
      'id', id,
      'email', email,
      'passwordHash', password_hash,
      'role', role,
      'status', status,
      'planCode', plan_code,
      'createdAt', DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ')
    )
    FROM users
    WHERE email = ${sqlString(email)}
    LIMIT 1
  `);
}

async function listUsers() {
  return queryJson(`
    SELECT JSON_OBJECT(
      'id', id,
      'email', email,
      'role', role,
      'status', status,
      'planCode', plan_code,
      'createdAt', DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ')
    )
    FROM users
    ORDER BY id DESC
    LIMIT 200
  `);
}

async function listAdminUsers() {
  const periodKey = getCurrentPeriodKey();
  return queryJson(`
    SELECT JSON_OBJECT(
      'id', u.id,
      'email', u.email,
      'role', u.role,
      'status', u.status,
      'planCode', u.plan_code,
      'createdAt', DATE_FORMAT(u.created_at, '%Y-%m-%dT%H:%i:%sZ'),
      'usageUsed', COALESCE(uc.used_count, 0),
      'usageLimit', CASE
        WHEN s.monthly_quota IS NOT NULL THEN s.monthly_quota
        WHEN u.plan_code = 'free' THEN 20
        WHEN u.plan_code = 'pro' THEN 200
        ELSE NULL
      END,
      'subscriptionStatus', COALESCE(s.status, 'canceled'),
      'renewsAt', DATE_FORMAT(s.renews_at, '%Y-%m-%dT%H:%i:%sZ')
    )
    FROM users u
    LEFT JOIN usage_counters uc
      ON uc.subject_type = 'user'
     AND uc.subject_key = CAST(u.id AS CHAR)
     AND uc.period_key = ${sqlString(periodKey)}
    LEFT JOIN subscriptions s
      ON s.id = (
        SELECT s2.id
        FROM subscriptions s2
        WHERE s2.user_id = u.id AND s2.status = 'active'
        ORDER BY s2.id DESC
        LIMIT 1
      )
    ORDER BY u.id DESC
    LIMIT 500
  `);
}

async function getAdminOverview() {
  const periodKey = getCurrentPeriodKey();
  const usersRow = await queryOneJson(`
    SELECT JSON_OBJECT(
      'totalUsers', COUNT(*),
      'activeUsers', SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END),
      'suspendedUsers', SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END),
      'paidUsers', SUM(CASE WHEN plan_code IN ('pro', 'unlimited') THEN 1 ELSE 0 END),
      'freeUsers', SUM(CASE WHEN plan_code = 'free' THEN 1 ELSE 0 END),
      'newUsers30d', SUM(CASE WHEN created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY) THEN 1 ELSE 0 END)
    )
    FROM users
  `);

  const usageRow = await queryOneJson(`
    SELECT JSON_OBJECT(
      'monthUsage', COALESCE(SUM(used_count), 0)
    )
    FROM usage_counters
    WHERE subject_type = 'user' AND period_key = ${sqlString(periodKey)}
  `);

  return {
    periodKey,
    totalUsers: Number.parseInt(String(usersRow?.totalUsers || 0), 10) || 0,
    activeUsers: Number.parseInt(String(usersRow?.activeUsers || 0), 10) || 0,
    suspendedUsers: Number.parseInt(String(usersRow?.suspendedUsers || 0), 10) || 0,
    paidUsers: Number.parseInt(String(usersRow?.paidUsers || 0), 10) || 0,
    freeUsers: Number.parseInt(String(usersRow?.freeUsers || 0), 10) || 0,
    newUsers30d: Number.parseInt(String(usersRow?.newUsers30d || 0), 10) || 0,
    monthUsage: Number.parseInt(String(usageRow?.monthUsage || 0), 10) || 0
  };
}

async function getSuperadminOverview() {
  const base = await getAdminOverview();

  const roleRow = await queryOneJson(`
    SELECT JSON_OBJECT(
      'subscriberCount', SUM(CASE WHEN role = 'subscriber' THEN 1 ELSE 0 END),
      'adminCount', SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END),
      'superadminCount', SUM(CASE WHEN role = 'superadmin' THEN 1 ELSE 0 END)
    )
    FROM users
  `);

  const billingRow = await queryOneJson(`
    SELECT JSON_OBJECT(
      'monthRevenueSubunits', COALESCE(SUM(CASE WHEN status = 'paid' AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY) THEN amount_subunits ELSE 0 END), 0),
      'weekRevenueSubunits', COALESCE(SUM(CASE WHEN status = 'paid' AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY) THEN amount_subunits ELSE 0 END), 0),
      'lifetimeRevenueSubunits', COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_subunits ELSE 0 END), 0),
      'paidPayments30d', COALESCE(SUM(CASE WHEN status = 'paid' AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0),
      'failedPayments30d', COALESCE(SUM(CASE WHEN status = 'failed' AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0),
      'pendingPayments30d', COALESCE(SUM(CASE WHEN status = 'created' AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0)
    )
    FROM billing_orders
  `);

  const auditRow = await queryOneJson(`
    SELECT JSON_OBJECT(
      'adminActions24h', COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END), 0),
      'criticalActions24h', COALESCE(SUM(CASE WHEN action IN ('set_role','set_status','set_plan','create_admin') AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END), 0)
    )
    FROM admin_audit_logs
  `);

  return {
    ...base,
    subscriberCount: Number.parseInt(String(roleRow?.subscriberCount || 0), 10) || 0,
    adminCount: Number.parseInt(String(roleRow?.adminCount || 0), 10) || 0,
    superadminCount: Number.parseInt(String(roleRow?.superadminCount || 0), 10) || 0,
    monthRevenueSubunits: Number.parseInt(String(billingRow?.monthRevenueSubunits || 0), 10) || 0,
    weekRevenueSubunits: Number.parseInt(String(billingRow?.weekRevenueSubunits || 0), 10) || 0,
    lifetimeRevenueSubunits: Number.parseInt(String(billingRow?.lifetimeRevenueSubunits || 0), 10) || 0,
    paidPayments30d: Number.parseInt(String(billingRow?.paidPayments30d || 0), 10) || 0,
    failedPayments30d: Number.parseInt(String(billingRow?.failedPayments30d || 0), 10) || 0,
    pendingPayments30d: Number.parseInt(String(billingRow?.pendingPayments30d || 0), 10) || 0,
    adminActions24h: Number.parseInt(String(auditRow?.adminActions24h || 0), 10) || 0,
    criticalActions24h: Number.parseInt(String(auditRow?.criticalActions24h || 0), 10) || 0
  };
}

async function listSuperadminAdminAccounts() {
  return queryJson(`
    SELECT JSON_OBJECT(
      'id', id,
      'email', email,
      'role', role,
      'status', status,
      'planCode', plan_code,
      'createdAt', DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ')
    )
    FROM users
    WHERE role IN ('admin', 'superadmin')
    ORDER BY FIELD(role, 'superadmin', 'admin'), id ASC
  `);
}

async function listAdminAuditLogs(limit = 80) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.floor(limit))) : 80;
  return queryJson(`
    SELECT JSON_OBJECT(
      'id', l.id,
      'action', l.action,
      'actorUserId', l.actor_user_id,
      'actorEmail', a.email,
      'targetUserId', l.target_user_id,
      'targetEmail', t.email,
      'meta', l.meta_json,
      'createdAt', DATE_FORMAT(l.created_at, '%Y-%m-%dT%H:%i:%sZ')
    )
    FROM admin_audit_logs l
    LEFT JOIN users a ON a.id = l.actor_user_id
    LEFT JOIN users t ON t.id = l.target_user_id
    ORDER BY l.id DESC
    LIMIT ${sqlNumber(safeLimit)}
  `);
}

async function listBillingOrdersByUserId(userId, limit = 20) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.floor(limit))) : 20;
  const rows = await queryJson(`
    SELECT JSON_OBJECT(
      'id', id,
      'planCode', plan_code,
      'billingCycle', billing_cycle,
      'amountSubunits', amount_subunits,
      'currency', currency,
      'status', status,
      'createdAt', DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ')
    )
    FROM billing_orders
    WHERE user_id = ${sqlNumber(userId)}
    ORDER BY created_at DESC
    LIMIT ${sqlNumber(safeLimit)}
  `);

  return (Array.isArray(rows) ? rows : []).map((row) => ({
    id: Number.parseInt(String(row?.id || 0), 10) || 0,
    planCode: normalizeUserPlanCode(row?.planCode) || "",
    billingCycle: normalizeBillingCycle(row?.billingCycle),
    amountSubunits: Number.parseInt(String(row?.amountSubunits || 0), 10) || 0,
    currency: typeof row?.currency === "string" ? row.currency.trim().toUpperCase() : "",
    status: typeof row?.status === "string" ? row.status.trim().toLowerCase() : "",
    createdAt: typeof row?.createdAt === "string" ? row.createdAt : null
  }));
}

async function listSavedPromptsByUserId(userId, limit = 40) {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.floor(limit))) : 40;
  const rows = await queryJson(`
    SELECT JSON_OBJECT(
      'id', id,
      'requestId', request_id,
      'model', model,
      'description', prompt_text,
      'imageUrl', image_url,
      'sourcePageUrl', source_page_url,
      'createdAt', DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ')
    )
    FROM saved_prompts
    WHERE user_id = ${sqlNumber(userId)}
    ORDER BY id DESC
    LIMIT ${sqlNumber(safeLimit)}
  `);

  return (Array.isArray(rows) ? rows : []).map((row) => ({
    id: Number.parseInt(String(row?.id || 0), 10) || 0,
    requestId: typeof row?.requestId === "string" ? row.requestId.trim() : "",
    model: typeof row?.model === "string" ? row.model.trim() : "",
    description: typeof row?.description === "string" ? row.description.trim() : "",
    imageUrl: typeof row?.imageUrl === "string" ? row.imageUrl.trim() : "",
    sourcePageUrl: typeof row?.sourcePageUrl === "string" ? row.sourcePageUrl.trim() : "",
    createdAt: typeof row?.createdAt === "string" ? row.createdAt : null
  }));
}

async function deleteSavedPromptByIdAndUser(promptId, userId) {
  const [result] = await mysqlPool.query(
    `DELETE FROM saved_prompts WHERE id = ${sqlNumber(promptId)} AND user_id = ${sqlNumber(userId)}`
  );
  return Number(result?.affectedRows || 0) > 0;
}

async function countUsersByRole(role) {
  const row = await queryOneJson(`
    SELECT JSON_OBJECT('count', COUNT(*))
    FROM users
    WHERE role = ${sqlString(role)}
  `);
  return Number.parseInt(String(row?.count || 0), 10) || 0;
}

async function ensureBootstrapAdmins() {
  const configured = String(BOOTSTRAP_ADMIN_EMAILS || "").trim();
  if (!configured) {
    return;
  }

  const emails = Array.from(
    new Set(
      configured
        .split(",")
        .map((rawEmail) => normalizeEmail(rawEmail))
        .filter(Boolean)
    )
  );
  if (emails.length === 0) {
    return;
  }

  let bootstrapPasswordPlain = BOOTSTRAP_ADMIN_PASSWORD;
  let bootstrapPasswordHash = "";

  for (const email of emails) {
    const existing = await findUserByEmail(email);
    if (existing) {
      if (bootstrapPasswordPlain && isStrongPassword(bootstrapPasswordPlain)) {
        const hash = await hashPassword(bootstrapPasswordPlain);
        await runSql(`
          UPDATE users
          SET password_hash = ${sqlString(hash)}, updated_at = UTC_TIMESTAMP()
          WHERE id = ${sqlNumber(existing.id)}
        `);
        console.log(`[bootstrap-admin] Updated password for ${email}.`);
      }
      if (existing.role !== "admin" && existing.role !== "superadmin") {
        await runSql(`
          UPDATE users
          SET role = 'admin', status = 'active', updated_at = UTC_TIMESTAMP()
          WHERE id = ${sqlNumber(existing.id)}
        `);
        console.log(`[bootstrap-admin] Elevated ${email} to admin.`);
      } else if (existing.status !== "active") {
        await runSql(`
          UPDATE users
          SET status = 'active', updated_at = UTC_TIMESTAMP()
          WHERE id = ${sqlNumber(existing.id)}
        `);
        console.log(`[bootstrap-admin] Activated admin account for ${email}.`);
      }
      await getOrCreateActiveSubscription(existing.id, existing.planCode || "free");
      continue;
    }

    if (!bootstrapPasswordHash) {
      if (!isStrongPassword(bootstrapPasswordPlain)) {
        bootstrapPasswordPlain = `Temp-${randomBytes(8).toString("hex")}Aa1`;
        console.warn(
          `[bootstrap-admin] BOOTSTRAP_ADMIN_PASSWORD is missing/weak. Using generated temporary password for ${email}: ${bootstrapPasswordPlain}`
        );
      }
      bootstrapPasswordHash = await hashPassword(bootstrapPasswordPlain);
    }

    const userId = await executeInsertAndReadId(`
      INSERT INTO users (email, password_hash, role, status, plan_code, created_at, updated_at)
      VALUES (
        ${sqlString(email)},
        ${sqlString(bootstrapPasswordHash)},
        'admin',
        'active',
        'free',
        UTC_TIMESTAMP(),
        UTC_TIMESTAMP()
      )
    `);
    await setUserPlan(userId, "free", null);
    console.log(`[bootstrap-admin] Created admin user ${email}.`);
  }
}

async function getUsageCount(subjectType, subjectKey, periodKey) {
  const row = await queryOneJson(`
    SELECT JSON_OBJECT('used', used_count)
    FROM usage_counters
    WHERE subject_type = ${sqlString(subjectType)}
      AND subject_key = ${sqlString(subjectKey)}
      AND period_key = ${sqlString(periodKey)}
    LIMIT 1
  `);

  const used = Number.parseInt(String(row?.used || 0), 10);
  return Number.isFinite(used) && used >= 0 ? used : 0;
}

async function saveGeneratedPrompt({ userId, requestId, model, promptText, imageUrl, sourcePageUrl }) {
  const normalizedUserId = Number.parseInt(String(userId || 0), 10);
  const normalizedRequestId = typeof requestId === "string" ? requestId.trim() : "";
  const normalizedModel = typeof model === "string" ? model.trim().slice(0, 80) : "";
  const normalizedPromptText = typeof promptText === "string" ? promptText.trim().slice(0, 12000) : "";
  const normalizedImageUrl =
    typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim().slice(0, 2000) : "";
  const normalizedSourcePageUrl =
    typeof sourcePageUrl === "string" && sourcePageUrl.trim() ? sourcePageUrl.trim().slice(0, 2000) : "";

  if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
    return;
  }
  if (!normalizedRequestId || !normalizedPromptText) {
    return;
  }

  await runSql(`
    INSERT INTO saved_prompts (
      user_id,
      request_id,
      model,
      prompt_text,
      image_url,
      source_page_url,
      created_at
    ) VALUES (
      ${sqlNumber(normalizedUserId)},
      ${sqlString(normalizedRequestId)},
      ${sqlString(normalizedModel)},
      ${sqlString(normalizedPromptText)},
      ${normalizedImageUrl ? sqlString(normalizedImageUrl) : "NULL"},
      ${normalizedSourcePageUrl ? sqlString(normalizedSourcePageUrl) : "NULL"},
      UTC_TIMESTAMP()
    )
    ON DUPLICATE KEY UPDATE
      model = VALUES(model),
      prompt_text = VALUES(prompt_text),
      image_url = VALUES(image_url),
      source_page_url = VALUES(source_page_url)
  `);
}

async function appendUsageEvent({ subjectType, subjectKey, periodKey, planCode, requestId }) {
  const normalizedPlanCode = normalizeAnyPlanCode(planCode);

  await runSql(`
    INSERT INTO usage_events (
      subject_type,
      subject_key,
      period_key,
      plan_code,
      event_type,
      request_id,
      created_at
    ) VALUES (
      ${sqlString(subjectType)},
      ${sqlString(subjectKey)},
      ${sqlString(periodKey)},
      ${sqlString(normalizedPlanCode)},
      'generate',
      ${sqlString(requestId)},
      UTC_TIMESTAMP()
    )
  `);
}

async function incrementUsage({ subjectType, subjectKey, planCode, requestId }) {
  const periodKey = getCurrentPeriodKey();

  await runSql(`
    INSERT INTO usage_counters (subject_type, subject_key, period_key, used_count, updated_at)
    VALUES (
      ${sqlString(subjectType)},
      ${sqlString(subjectKey)},
      ${sqlString(periodKey)},
      1,
      UTC_TIMESTAMP()
    )
    ON DUPLICATE KEY UPDATE
      used_count = used_count + 1,
      updated_at = UTC_TIMESTAMP()
  `);

  await appendUsageEvent({ subjectType, subjectKey, periodKey, planCode, requestId });
}

async function consumeUsage({ subjectType, subjectKey, limit, planCode, requestId }) {
  if (limit === null) {
    await incrementUsage({ subjectType, subjectKey, planCode, requestId });
    return true;
  }

  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
  if (safeLimit <= 0) {
    return false;
  }

  const periodKey = getCurrentPeriodKey();

  try {
    const [insertResult] = await mysqlPool.execute(
      `
      INSERT INTO usage_counters (subject_type, subject_key, period_key, used_count, updated_at)
      VALUES (?, ?, ?, 1, UTC_TIMESTAMP())
      `,
      [subjectType, subjectKey, periodKey]
    );
    if (Number(insertResult?.affectedRows || 0) > 0) {
      await appendUsageEvent({ subjectType, subjectKey, periodKey, planCode, requestId });
      return true;
    }
  } catch (error) {
    if (!isDuplicateEntryError(error)) {
      throw new HttpError(500, "Could not reserve usage quota.");
    }
  }

  const [updateResult] = await mysqlPool.execute(
    `
    UPDATE usage_counters
    SET used_count = used_count + 1, updated_at = UTC_TIMESTAMP()
    WHERE subject_type = ?
      AND subject_key = ?
      AND period_key = ?
      AND used_count < ?
    `,
    [subjectType, subjectKey, periodKey, safeLimit]
  );

  if (Number(updateResult?.affectedRows || 0) <= 0) {
    return false;
  }

  await appendUsageEvent({ subjectType, subjectKey, periodKey, planCode, requestId });
  return true;
}

async function logAdminAction(actorUserId, action, targetUserId, meta) {
  await runSql(`
    INSERT INTO admin_audit_logs (
      actor_user_id,
      action,
      target_user_id,
      meta_json,
      created_at
    ) VALUES (
      ${sqlNumber(actorUserId)},
      ${sqlString(action)},
      ${targetUserId ? sqlNumber(targetUserId) : "NULL"},
      ${sqlString(JSON.stringify(meta || {}))},
      UTC_TIMESTAMP()
    )
  `);
}

async function processStripeEvent(event) {
  const eventType = String(event?.type || "");

  if (eventType === "checkout.session.completed") {
    await processCheckoutSessionCompleted(event?.data?.object || {});
    return;
  }

  if (eventType === "customer.subscription.updated") {
    await processSubscriptionUpdated(event?.data?.object || {});
    return;
  }

  if (eventType === "customer.subscription.deleted") {
    await processSubscriptionDeleted(event?.data?.object || {});
  }
}

async function processCheckoutSessionCompleted(session) {
  const userId = resolveStripeUserId(session);
  const planCode = resolveStripePlanCode(session);
  const customerId = typeof session?.customer === "string" ? session.customer.trim() : "";
  const subscriptionId =
    typeof session?.subscription === "string" ? session.subscription.trim() : "";

  if (!Number.isFinite(userId) || userId <= 0 || !planCode) {
    throw new HttpError(400, "Checkout webhook metadata is incomplete.");
  }

  await setUserPlan(userId, planCode, null);

  if (customerId) {
    await upsertBillingProfile(userId, customerId);
  }

  if (subscriptionId) {
    const stripeSubscription = await stripeRequest("GET", `/subscriptions/${encodeURIComponent(subscriptionId)}`);
    await syncSubscriptionFromStripeObject(stripeSubscription, {
      fallbackUserId: userId,
      fallbackPlanCode: planCode,
      fallbackCustomerId: customerId
    });
  }
}

async function processSubscriptionUpdated(subscription) {
  await syncSubscriptionFromStripeObject(subscription);
}

async function processSubscriptionDeleted(subscription) {
  const synced = await syncSubscriptionFromStripeObject(subscription);
  if (synced.userId) {
    await setUserPlan(synced.userId, "free", null);
  }
}

async function syncSubscriptionFromStripeObject(subscription, context = {}) {
  const subscriptionId =
    typeof subscription?.id === "string" ? subscription.id.trim() : "";
  const customerId =
    typeof subscription?.customer === "string"
      ? subscription.customer.trim()
      : typeof context?.fallbackCustomerId === "string"
        ? context.fallbackCustomerId.trim()
        : "";

  if (!subscriptionId) {
    throw new HttpError(400, "Stripe subscription id is missing.");
  }

  const existingBilling = await findBillingSubscriptionByStripeId(subscriptionId);
  const userId =
    resolveStripeUserId(subscription) ||
    Number.parseInt(String(existingBilling?.userId || 0), 10) ||
    Number.parseInt(String(context?.fallbackUserId || 0), 10) ||
    (customerId ? await findUserIdByStripeCustomerId(customerId) : 0);

  if (!Number.isFinite(userId) || userId <= 0) {
    throw new HttpError(400, "Could not map Stripe subscription to a user.");
  }

  const planCode = resolveStripePlanCode(subscription) || context?.fallbackPlanCode || "pro";
  const status = typeof subscription?.status === "string" ? subscription.status.trim() : "active";
  const periodEndUtc = toSqlDateTimeUtcString(subscription?.current_period_end);
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ? 1 : 0;

  if (customerId) {
    await upsertBillingProfile(userId, customerId);
  }

  await upsertBillingSubscription({
    userId,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId || String(existingBilling?.stripeCustomerId || ""),
    planCode,
    status,
    currentPeriodEndUtc: periodEndUtc,
    cancelAtPeriodEnd
  });

  const isActivePlan = ["trialing", "active", "past_due", "unpaid"].includes(status);
  if (isActivePlan) {
    await setUserPlan(userId, planCode, null);
  }

  return {
    userId,
    planCode,
    status
  };
}

async function getOrCreateStripeCustomer(userId, email) {
  const existingCustomerId = await findStripeCustomerIdByUserId(userId);
  if (existingCustomerId) {
    return existingCustomerId;
  }

  ensureStripeSecretConfigured();

  const form = new URLSearchParams();
  form.set("email", email);
  form.set("metadata[user_id]", String(userId));

  const customer = await stripeRequest("POST", "/customers", {
    body: form
  });

  const customerId = typeof customer?.id === "string" ? customer.id.trim() : "";
  if (!customerId) {
    throw new HttpError(502, "Stripe customer creation failed.");
  }

  await upsertBillingProfile(userId, customerId);
  return customerId;
}

async function stripeRequest(method, pathName, options = {}) {
  ensureStripeSecretConfigured();

  const url = new URL(`${STRIPE_API_BASE}${pathName}`);
  if (options.query instanceof URLSearchParams) {
    url.search = options.query.toString();
  }

  const headers = {
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`
  };

  const requestOptions = {
    method,
    headers
  };

  if (options.body instanceof URLSearchParams) {
    requestOptions.body = options.body.toString();
    requestOptions.headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  const response = await fetch(url, requestOptions).catch(() => {
    throw new HttpError(502, "Could not reach Stripe API.");
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const stripeMessage =
      typeof payload?.error?.message === "string" ? payload.error.message.trim() : "";
    throw new HttpError(502, stripeMessage || `Stripe request failed (${response.status}).`);
  }

  return payload || {};
}

async function insertBillingWebhookEvent(eventId, eventType, payloadRaw) {
  try {
    await runSql(`
      INSERT INTO billing_webhook_events (
        stripe_event_id,
        event_type,
        processed,
        payload_json,
        created_at
      ) VALUES (
        ${sqlString(eventId)},
        ${sqlString(eventType)},
        0,
        ${sqlString(payloadRaw)},
        UTC_TIMESTAMP()
      )
    `);
    return true;
  } catch (error) {
    const message = toUserError(error);
    if (/duplicate entry/i.test(message)) {
      const existing = await getBillingWebhookEvent(eventId);
      const alreadyProcessed = Number.parseInt(String(existing?.processed || 0), 10) === 1;
      if (alreadyProcessed) {
        return false;
      }

      await runSql(`
        UPDATE billing_webhook_events
        SET event_type = ${sqlString(eventType)}, payload_json = ${sqlString(payloadRaw)}
        WHERE stripe_event_id = ${sqlString(eventId)}
      `);

      return true;
    }
    throw error;
  }
}

async function markBillingWebhookEventProcessed(eventId) {
  await runSql(`
    UPDATE billing_webhook_events
    SET processed = 1, processed_at = UTC_TIMESTAMP()
    WHERE stripe_event_id = ${sqlString(eventId)}
  `);
}

async function markBillingWebhookEventFailed(eventId) {
  await runSql(`
    UPDATE billing_webhook_events
    SET processed = 0, processed_at = NULL
    WHERE stripe_event_id = ${sqlString(eventId)}
  `);
}

async function findStripeCustomerIdByUserId(userId) {
  const row = await queryOneJson(`
    SELECT JSON_OBJECT('stripeCustomerId', stripe_customer_id)
    FROM billing_profiles
    WHERE user_id = ${sqlNumber(userId)}
    LIMIT 1
  `);

  const stripeCustomerId =
    typeof row?.stripeCustomerId === "string" ? row.stripeCustomerId.trim() : "";
  return stripeCustomerId || "";
}

async function getBillingWebhookEvent(eventId) {
  return queryOneJson(`
    SELECT JSON_OBJECT(
      'processed', processed
    )
    FROM billing_webhook_events
    WHERE stripe_event_id = ${sqlString(eventId)}
    LIMIT 1
  `);
}

async function findUserIdByStripeCustomerId(stripeCustomerId) {
  const row = await queryOneJson(`
    SELECT JSON_OBJECT('userId', user_id)
    FROM billing_profiles
    WHERE stripe_customer_id = ${sqlString(stripeCustomerId)}
    LIMIT 1
  `);
  const userId = Number.parseInt(String(row?.userId || 0), 10);
  return Number.isFinite(userId) && userId > 0 ? userId : 0;
}

async function findBillingSubscriptionByStripeId(stripeSubscriptionId) {
  return queryOneJson(`
    SELECT JSON_OBJECT(
      'userId', user_id,
      'stripeCustomerId', stripe_customer_id,
      'planCode', plan_code,
      'status', status
    )
    FROM billing_subscriptions
    WHERE stripe_subscription_id = ${sqlString(stripeSubscriptionId)}
    LIMIT 1
  `);
}

async function upsertBillingProfile(userId, stripeCustomerId) {
  if (!Number.isFinite(userId) || userId <= 0 || !stripeCustomerId) {
    return;
  }

  await runSql(`
    INSERT INTO billing_profiles (
      user_id,
      stripe_customer_id,
      created_at,
      updated_at
    ) VALUES (
      ${sqlNumber(userId)},
      ${sqlString(stripeCustomerId)},
      UTC_TIMESTAMP(),
      UTC_TIMESTAMP()
    )
    ON DUPLICATE KEY UPDATE
      stripe_customer_id = VALUES(stripe_customer_id),
      updated_at = UTC_TIMESTAMP()
  `);
}

async function upsertBillingSubscription({
  userId,
  stripeSubscriptionId,
  stripeCustomerId,
  planCode,
  status,
  currentPeriodEndUtc,
  cancelAtPeriodEnd
}) {
  if (!Number.isFinite(userId) || userId <= 0 || !stripeSubscriptionId || !stripeCustomerId) {
    return;
  }

  const normalizedPlanCode = normalizeUserPlanCode(planCode) || "pro";
  const normalizedStatus = String(status || "active").slice(0, 64);
  const normalizedCancelAtPeriodEnd = cancelAtPeriodEnd ? 1 : 0;
  const currentPeriodEndSql = currentPeriodEndUtc ? sqlString(currentPeriodEndUtc) : "NULL";

  await runSql(`
    INSERT INTO billing_subscriptions (
      user_id,
      stripe_subscription_id,
      stripe_customer_id,
      plan_code,
      status,
      current_period_end,
      cancel_at_period_end,
      created_at,
      updated_at
    ) VALUES (
      ${sqlNumber(userId)},
      ${sqlString(stripeSubscriptionId)},
      ${sqlString(stripeCustomerId)},
      ${sqlString(normalizedPlanCode)},
      ${sqlString(normalizedStatus)},
      ${currentPeriodEndSql},
      ${sqlNumber(normalizedCancelAtPeriodEnd)},
      UTC_TIMESTAMP(),
      UTC_TIMESTAMP()
    )
    ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      stripe_customer_id = VALUES(stripe_customer_id),
      plan_code = VALUES(plan_code),
      status = VALUES(status),
      current_period_end = VALUES(current_period_end),
      cancel_at_period_end = VALUES(cancel_at_period_end),
      updated_at = UTC_TIMESTAMP()
  `);
}

async function upsertBillingOrderCreated({
  orderId,
  userId,
  planCode,
  billingCycle,
  amountSubunits,
  currency
}) {
  if (
    !orderId ||
    !Number.isFinite(userId) ||
    userId <= 0 ||
    (planCode !== "pro" && planCode !== "unlimited") ||
    (billingCycle !== "monthly" && billingCycle !== "annual") ||
    !Number.isFinite(amountSubunits) ||
    amountSubunits <= 0 ||
    !currency
  ) {
    return;
  }

  await runSql(`
    INSERT INTO billing_orders (
      razorpay_order_id,
      user_id,
      plan_code,
      billing_cycle,
      amount_subunits,
      currency,
      status,
      created_at,
      updated_at
    ) VALUES (
      ${sqlString(orderId)},
      ${sqlNumber(userId)},
      ${sqlString(planCode)},
      ${sqlString(billingCycle)},
      ${sqlNumber(Math.round(amountSubunits))},
      ${sqlString(currency)},
      'created',
      UTC_TIMESTAMP(),
      UTC_TIMESTAMP()
    )
    ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      plan_code = VALUES(plan_code),
      billing_cycle = VALUES(billing_cycle),
      amount_subunits = VALUES(amount_subunits),
      currency = VALUES(currency),
      status = 'created',
      razorpay_payment_id = NULL,
      razorpay_signature = NULL,
      payload_json = NULL,
      updated_at = UTC_TIMESTAMP()
  `);
}

async function findBillingOrderByOrderIdAndUser(orderId, userId) {
  if (!orderId || !Number.isFinite(userId) || userId <= 0) {
    return null;
  }

  const row = await queryOneJson(`
    SELECT JSON_OBJECT(
      'id', id,
      'planCode', plan_code,
      'billingCycle', billing_cycle,
      'amountSubunits', amount_subunits,
      'currency', currency,
      'status', status
    )
    FROM billing_orders
    WHERE razorpay_order_id = ${sqlString(orderId)}
      AND user_id = ${sqlNumber(userId)}
    LIMIT 1
  `);

  if (!row) {
    return null;
  }

  return {
    id: Number.parseInt(String(row.id || 0), 10) || 0,
    planCode: normalizeUserPlanCode(row.planCode) || "",
    billingCycle: normalizeBillingCycle(row.billingCycle),
    amountSubunits: Number.parseInt(String(row.amountSubunits || 0), 10) || 0,
    currency: typeof row.currency === "string" ? row.currency.trim().toUpperCase() : "",
    status: typeof row.status === "string" ? row.status.trim().toLowerCase() : ""
  };
}

async function markBillingOrderPaid(orderId, paymentId, signature, payload) {
  await runSql(`
    UPDATE billing_orders
    SET
      status = 'paid',
      razorpay_payment_id = ${sqlString(paymentId)},
      razorpay_signature = ${sqlString(signature)},
      payload_json = ${sqlString(JSON.stringify(payload || {}))},
      updated_at = UTC_TIMESTAMP()
    WHERE razorpay_order_id = ${sqlString(orderId)}
  `);
}

async function markBillingOrderFailed(orderId, paymentId, signature, payload) {
  await runSql(`
    UPDATE billing_orders
    SET
      status = 'failed',
      razorpay_payment_id = ${sqlString(paymentId || "")},
      razorpay_signature = ${sqlString(signature || "")},
      payload_json = ${sqlString(JSON.stringify(payload || {}))},
      updated_at = UTC_TIMESTAMP()
    WHERE razorpay_order_id = ${sqlString(orderId)}
  `);
}

async function ensureSchema() {
  await runSql(SCHEMA_SQL);
  await ensureBillingOrdersSchema();
}

async function ensureBillingOrdersSchema() {
  const tableRow = await queryOneJson(`
    SELECT JSON_OBJECT(
      'tableExists',
      EXISTS(
        SELECT 1
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ${sqlString(MYSQL_DATABASE)}
          AND TABLE_NAME = 'billing_orders'
      )
    )
  `);

  const tableExists =
    Number.parseInt(String(tableRow?.tableExists ?? 0), 10) === 1 || tableRow?.tableExists === true;
  if (!tableExists) {
    return;
  }

  const columnRow = await queryOneJson(`
    SELECT JSON_OBJECT(
      'columnExists',
      EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ${sqlString(MYSQL_DATABASE)}
          AND TABLE_NAME = 'billing_orders'
          AND COLUMN_NAME = 'billing_cycle'
      )
    )
  `);
  const columnExists =
    Number.parseInt(String(columnRow?.columnExists ?? 0), 10) === 1 || columnRow?.columnExists === true;
  if (columnExists) {
    return;
  }

  await runSql(`
    ALTER TABLE billing_orders
    ADD COLUMN billing_cycle ENUM('monthly','annual') NOT NULL DEFAULT 'monthly' AFTER plan_code
  `);
}

async function executeInsertAndReadId(insertSql) {
  const connection = await mysqlPool.getConnection();
  try {
    const [insertResult] = await connection.query(insertSql);
    const directId = Number.parseInt(String(insertResult?.insertId ?? ""), 10);
    if (Number.isFinite(directId) && directId > 0) {
      return directId;
    }

    const [rows] = await connection.query("SELECT LAST_INSERT_ID() AS id");
    const fallbackId = Number.parseInt(String(Array.isArray(rows) && rows[0] ? rows[0].id : ""), 10);
    if (Number.isFinite(fallbackId) && fallbackId > 0) {
      return fallbackId;
    }

    throw new HttpError(500, "Database insert did not return an id.");
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    const message = error?.message || "Database insert failed.";
    throw new HttpError(500, message);
  } finally {
    connection.release();
  }
}

async function queryJson(sql) {
  const output = await runSql(sql);
  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function queryOneJson(sql) {
  const rows = await queryJson(sql);
  return rows[0] || null;
}

async function runSql(sql) {
  try {
    const [results] = await mysqlPool.query(sql);
    const sets =
      Array.isArray(results) &&
      results.length > 0 &&
      Array.isArray(results[0])
        ? results
        : [results];
    let out = "";
    for (let i = sets.length - 1; i >= 0; i--) {
      const rows = sets[i];
      if (Array.isArray(rows) && rows.length > 0) {
        const firstKey =
          typeof rows[0] === "object" && rows[0] !== null
            ? Object.keys(rows[0])[0]
            : null;
        out = rows
          .map((r) =>
            firstKey != null && typeof r === "object" && r !== null
              ? r[firstKey]
              : r
          )
          .join("\n");
        break;
      }
    }
    return typeof out === "string" ? out.trim() : "";
  } catch (error) {
    const message = error?.message || "Database request failed.";
    throw new HttpError(500, message);
  }
}

const DEFAULT_IMAGE_PROMPT = `You are an elite visual reconstruction prompt engineer.

Task:
Convert the input image into one direct copy-paste prompt that recreates the same image as closely as possible in major AI image models.

Output rules:
- Return exactly one paragraph prompt (no title, no label, no bullets, no markdown).
- Start the paragraph with: "Generate an image of ...".
- Keep it concrete and faithful to visible content.
- Include subject identity, pose/action, composition, perspective, lighting, color palette, materials/textures, and mood.
- Avoid guessing hidden details.
- Do not include phrases like "Prompt:", "Negative prompt:", "Variation:", or "Template:".`;

const PROMPT_TEMPLATES = [
  {
    id: "exact-scene-replica",
    name: "Exact Scene Replica",
    goal: "Reconstruct the scene with maximum visual fidelity and neutral styling.",
    emphasis: [
      "subject identity, count, and relative placement",
      "camera angle, framing, and perspective geometry",
      "lighting direction, contrast, and realistic materials"
    ]
  },
  {
    id: "cinematic-fidelity",
    name: "Cinematic Fidelity",
    goal: "Preserve the same scene while adding precise cinematic camera and light language without changing content.",
    emphasis: [
      "lens feel, depth of field, and focal hierarchy",
      "cinematic color grade grounded in the source image",
      "shadow/highlight behavior and scene atmosphere"
    ]
  },
  {
    id: "studio-product-match",
    name: "Studio Product Match",
    goal: "Recreate the image as a clean high-end product/still-life shot when subject type fits.",
    emphasis: [
      "surface detail, edges, and material texture accuracy",
      "controlled highlights, reflections, and background cleanliness",
      "commercial polish without adding new props"
    ]
  },
  {
    id: "portrait-identity-lock",
    name: "Portrait Identity Lock",
    goal: "Preserve face/subject expression, posture, and styling with near-identical visual character.",
    emphasis: [
      "facial structure or defining subject features",
      "hair/fabric texture and skin/material realism",
      "background separation and natural depth"
    ]
  },
  {
    id: "environment-depth-match",
    name: "Environment Depth Match",
    goal: "Rebuild environmental scenes with consistent scale, depth layers, and world detail.",
    emphasis: [
      "foreground-midground-background structure",
      "weather, atmosphere, and color depth consistency",
      "architectural/natural spatial relationships"
    ]
  },
  {
    id: "cross-model-copy-ready",
    name: "Cross-Model Copy Ready",
    goal: "Produce a balanced universal prompt that works well across ChatGPT, Midjourney, Gemini, and similar tools.",
    emphasis: [
      "clear descriptive hierarchy from main subject to context",
      "model-agnostic wording with strong specificity",
      "artifact-avoidance cues in natural language"
    ]
  }
];

function sanitizePromptContext(rawText, maxLength = 320) {
  if (typeof rawText !== "string") {
    return "";
  }
  return rawText.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function pickRandomPromptTemplate() {
  if (!PROMPT_TEMPLATES.length) {
    return null;
  }
  const index = randomInt(0, PROMPT_TEMPLATES.length);
  return PROMPT_TEMPLATES[index];
}

function buildPromptConfig({ rawPrompt, altText }) {
  if (typeof rawPrompt === "string" && rawPrompt.trim()) {
    return {
      prompt: rawPrompt.trim(),
      template: {
        id: "custom",
        name: "Custom Prompt"
      }
    };
  }

  const template = pickRandomPromptTemplate();
  const normalizedAltText = sanitizePromptContext(altText);
  const selectedTemplate =
    template || {
      id: "default-human-writer",
      name: "Default Human Writer"
    };

  if (!template) {
    return {
      prompt: DEFAULT_IMAGE_PROMPT,
      template: selectedTemplate
    };
  }

  return {
    prompt: buildTemplatePrompt(template, normalizedAltText),
    template: selectedTemplate
  };
}

function buildTemplatePrompt(template, altText) {
  const contextLine = altText
    ? `Optional context from page alt text (may be incomplete): "${altText}". Use it only when consistent with visible details.`
    : "No alt text context was provided. Rely fully on visible image content.";

  const emphasis = Array.isArray(template?.emphasis) ? template.emphasis.filter(Boolean) : [];
  const emphasisBlock = emphasis.length
    ? emphasis.map((item) => `- ${item}`).join("\n")
    : "- match the visible scene faithfully";

  return `You are a senior image prompt engineer focused on visual reconstruction quality.

Your goal: produce one direct copy-paste prompt that regenerates the same image with high fidelity.

Selected template:
- Name: ${template.name}
- Goal: ${template.goal}
- Extra emphasis:
${emphasisBlock}

Global requirements:
- Output exactly one paragraph, 110-180 words.
- Output only the final prompt text. No headings, no labels, no bullets, no markdown.
- Start the output with: "Generate an image of ...".
- Do not output "Prompt:", "Negative prompt:", "Template:", "Variation:", or any wrapper text.
- Ground all details in what is visible. Never invent hidden logos, unreadable text, or absent objects.
- Preserve: subject identity/count, pose/action, framing, relative scale, perspective, lighting direction, color palette, material textures, and mood.
- If visible text is clearly readable, include the exact text in the prompt; if not clearly readable, do not guess.
- Use explicit camera/composition language when inferable (angle, framing, depth of field, focal behavior).
- Keep wording model-agnostic so user can paste into any major LLM image generator.
- If uncertain, stay conservative and do not hallucinate.

${contextLine}`;
}

function normalizePromptOutput(rawOutput) {
  if (typeof rawOutput !== "string") {
    return "";
  }

  let text = rawOutput.trim();
  text = text.replace(/^```[\w-]*\s*/i, "").replace(/```$/i, "").trim();
  text = text.replace(/^(template|final prompt|copy[-\s]?ready prompt|prompt)\s*:\s*/i, "").trim();
  text = text.replace(/\bnegative prompt\s*:[\s\S]*$/i, "").trim();
  text = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean)
    .join(" ");
  text = text.replace(/\s{2,}/g, " ").trim();

  if (text.length > 1400) {
    text = text.slice(0, 1400).trim();
  }

  return ensureImageGenerationInstruction(text);
}

function ensureImageGenerationInstruction(promptText) {
  if (typeof promptText !== "string") {
    return "";
  }

  let text = promptText.replace(/\s+/g, " ").trim();
  if (!text) {
    return "";
  }

  if (/^generate an image\b/i.test(text)) {
    return text;
  }

  if (/^(generate|create|produce|render)\s+/i.test(text)) {
    text = text.replace(/^(generate|create|produce|render)\s+/i, "");
  }

  text = text
    .replace(/^an?\s+image\s+of\s+/i, "")
    .replace(/^an?\s+image\s+/i, "")
    .replace(/^image\s+of\s+/i, "")
    .trim();

  return `Generate an image of ${text}`;
}

function countWords(text) {
  if (typeof text !== "string") {
    return 0;
  }
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function includesAnyKeyword(text, keywords) {
  const source = typeof text === "string" ? text.toLowerCase() : "";
  return keywords.some((keyword) => source.includes(keyword));
}

function scorePromptQuality(promptText) {
  if (typeof promptText !== "string") {
    return -10;
  }

  const text = promptText.trim();
  if (!text) {
    return -10;
  }

  const words = countWords(text);
  const hasForbiddenWrapper = /\b(prompt|negative prompt|template|variation|style notes)\s*:/i.test(text);
  const hasPlaceholderTokens = /<[^>]+>/.test(text);
  const hasMultipleParagraphs = /\r?\n/.test(text);

  const compositionKeywords = [
    "composition",
    "framing",
    "foreground",
    "background",
    "perspective",
    "angle",
    "wide shot",
    "close-up",
    "depth of field",
    "focal"
  ];
  const lightingKeywords = [
    "lighting",
    "light",
    "shadow",
    "backlit",
    "soft light",
    "diffused",
    "contrast",
    "high-key",
    "low-key"
  ];
  const colorKeywords = [
    "color",
    "palette",
    "tone",
    "hue",
    "saturation",
    "warm",
    "cool",
    "vibrant",
    "muted"
  ];
  const textureKeywords = [
    "texture",
    "material",
    "surface",
    "fabric",
    "grain",
    "details",
    "realistic",
    "crisp"
  ];

  let score = 0;
  if (words >= 105 && words <= 200) {
    score += 2;
  } else if (words >= 80 && words <= 240) {
    score += 1;
  } else {
    score -= 2;
  }

  if (!hasForbiddenWrapper) {
    score += 2;
  } else {
    score -= 4;
  }

  if (!hasPlaceholderTokens) {
    score += 1;
  } else {
    score -= 3;
  }

  if (!hasMultipleParagraphs) {
    score += 1;
  }

  if (includesAnyKeyword(text, compositionKeywords)) {
    score += 1;
  }
  if (includesAnyKeyword(text, lightingKeywords)) {
    score += 1;
  }
  if (includesAnyKeyword(text, colorKeywords)) {
    score += 1;
  }
  if (includesAnyKeyword(text, textureKeywords)) {
    score += 1;
  }

  if (/[.?!]/.test(text)) {
    score += 1;
  }

  return score;
}

function isPromptQualityAcceptable(promptText) {
  return scorePromptQuality(promptText) >= PROMPT_QUALITY_SCORE_THRESHOLD;
}

function pickHigherQualityPrompt(primaryPrompt, alternatePrompt) {
  const primaryScore = scorePromptQuality(primaryPrompt);
  const alternateScore = scorePromptQuality(alternatePrompt);

  if (alternateScore > primaryScore) {
    return alternatePrompt;
  }
  return primaryPrompt;
}

function buildQualityRetryPrompt({ candidatePrompt, template, altText }) {
  const templateName = template?.name || "High Fidelity";
  const safeCandidate = sanitizePromptContext(candidatePrompt, 1200);
  const contextLine = altText
    ? `Optional alt text context: "${altText}". Use only if consistent with what is visible.`
    : "No alt text context is available.";

  return `You are fixing a weak image-reconstruction prompt.

Return one final copy-paste prompt that recreates the same image with high fidelity.

Strict output contract:
- Exactly one paragraph, 110-190 words.
- Output only the prompt text.
- Start the output with: "Generate an image of ...".
- No labels, no markdown, no bullets, no wrappers.
- No "Prompt:", "Negative prompt:", "Template:", or "Variation:".

Quality requirements:
- Keep the same visible scene: subject identity/count, pose/action, framing, perspective, scale, lighting direction, color palette, textures/materials, and mood.
- Add concrete camera/composition language where inferable.
- If visible text is clearly readable, include exact text; otherwise never guess text.
- Do not invent absent elements.
- Keep wording model-agnostic for any major LLM image generator.

Template style to preserve: ${templateName}
Previous candidate to improve: "${safeCandidate}"
${contextLine}`;
}

function resolveImageInput(imageDataUrl, imageUrl) {
  if (typeof imageDataUrl === "string" && imageDataUrl.startsWith("data:image/")) {
    return imageDataUrl;
  }

  if (typeof imageUrl === "string" && isHttpUrl(imageUrl)) {
    return imageUrl;
  }

  throw new HttpError(400, "Provide imageDataUrl (data:image/*) or imageUrl (http/https).");
}

function getOpenAiApiKey() {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (apiKey) {
    return apiKey;
  }

  throw new HttpError(
    500,
    "OPENAI_API_KEY is not configured. Add it in backend/.env or environment variables."
  );
}

async function analyzeImage({ apiKey, model, prompt, imageInput }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(OPENAI_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Return only the final prompt text requested by the user instructions. No wrappers, labels, markdown, or extra commentary."
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageInput } }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 520
      })
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error?.name === "AbortError") {
      throw new HttpError(504, "OpenAI request timed out.");
    }
    throw new HttpError(502, "Could not reach OpenAI.");
  }

  clearTimeout(timeout);

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new HttpError(response.status, parseOpenAiError(response.status, payload));
  }

  const text = extractDescription(payload);
  if (!text) {
    throw new HttpError(502, "OpenAI returned no description.");
  }

  return text;
}

function parseOpenAiError(status, payload) {
  const apiMessage = typeof payload?.error?.message === "string" ? payload.error.message.trim() : "";

  if (status === 401) {
    return "OpenAI API key is invalid or unauthorized.";
  }
  if (status === 429) {
    return "OpenAI rate limit reached. Try again shortly.";
  }
  if (status >= 500) {
    return "OpenAI server error.";
  }
  if (apiMessage) {
    return `OpenAI error: ${apiMessage}`;
  }

  return `OpenAI request failed (${status}).`;
}

function extractDescription(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const merged = content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join(" ")
      .trim();

    if (merged) {
      return merged;
    }
  }

  return "";
}

async function verifyGoogleIdToken(idToken) {
  if (!GOOGLE_CLIENT_ID) {
    throw new HttpError(503, "Google login is not configured.");
  }

  let response;
  try {
    response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      }
    );
  } catch {
    throw new HttpError(502, "Could not verify Google token.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    throw new HttpError(401, "Invalid Google credential.");
  }

  const aud = typeof payload?.aud === "string" ? payload.aud.trim() : "";
  if (!aud || aud !== GOOGLE_CLIENT_ID) {
    throw new HttpError(401, "Google credential audience mismatch.");
  }

  const iss = typeof payload?.iss === "string" ? payload.iss.trim() : "";
  if (iss !== "accounts.google.com" && iss !== "https://accounts.google.com") {
    throw new HttpError(401, "Google credential issuer is invalid.");
  }

  const exp = Number.parseInt(String(payload?.exp || 0), 10);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(exp) || exp <= now) {
    throw new HttpError(401, "Google credential expired.");
  }

  const email = normalizeEmail(payload?.email);
  const emailVerified = payload?.email_verified === true || payload?.email_verified === "true";
  if (!email || !emailVerified) {
    throw new HttpError(401, "Google account email is not verified.");
  }

  return {
    email,
    sub: typeof payload?.sub === "string" ? payload.sub.trim() : ""
  };
}

function createAuthToken({ sub, role, email }) {
  ensureAuthSecret();

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub,
    role,
    email,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS
  };

  return signToken(payload);
}

function verifyAuthToken(token) {
  ensureAuthSecret();

  const parts = String(token).split(".");
  if (parts.length !== 3) {
    throw new HttpError(401, "Invalid token format.");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = base64UrlEncode(createHmac("sha256", AUTH_SECRET).update(signingInput).digest());

  const expectedBuffer = Buffer.from(expectedSignature);
  const gotBuffer = Buffer.from(encodedSignature);

  if (expectedBuffer.length !== gotBuffer.length || !timingSafeEqual(expectedBuffer, gotBuffer)) {
    throw new HttpError(401, "Invalid token signature.");
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
  } catch {
    throw new HttpError(401, "Invalid token payload.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(payload?.exp) || payload.exp <= now) {
    throw new HttpError(401, "Token expired.");
  }

  return payload;
}

function signToken(payload) {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const encodedHeader = base64UrlEncode(Buffer.from(JSON.stringify(header), "utf8"));
  const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = base64UrlEncode(createHmac("sha256", AUTH_SECRET).update(signingInput).digest());

  return `${signingInput}.${signature}`;
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const parts = String(storedHash).split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const [, salt, hexHash] = parts;
  const expected = Buffer.from(hexHash, "hex");
  const derived = await scryptAsync(password, salt, expected.length);
  const got = Buffer.from(derived);

  return got.length === expected.length && timingSafeEqual(got, expected);
}

function readBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string") {
    return "";
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function getCurrentPeriodKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getGuestSubjectKey(req) {
  const ip = getClientIp(req);
  return createHash("sha256")
    .update(`${GUEST_KEY_SALT}:${ip}`)
    .digest("hex")
    .slice(0, 48);
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  const remoteAddress = req.socket?.remoteAddress;
  if (typeof remoteAddress === "string" && remoteAddress.trim()) {
    return remoteAddress.trim();
  }

  return "0.0.0.0";
}

function normalizeEmail(raw) {
  if (typeof raw !== "string") {
    return "";
  }

  const value = raw.trim().toLowerCase();
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return looksLikeEmail ? value : "";
}

function isValidExtensionRedirectUri(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return false;
  }

  let parsed;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (!host.endsWith(".chromiumapp.org")) {
    return false;
  }

  return true;
}

function escapeHtml(raw) {
  const value = typeof raw === "string" ? raw : "";
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeUserPlanCode(raw) {
  if (typeof raw !== "string") {
    return "";
  }

  const value = raw.trim().toLowerCase();
  return USER_PLAN_CODES.includes(value) ? value : "";
}

function normalizeAnyPlanCode(raw) {
  if (typeof raw !== "string") {
    return PLAN_CONFIG.guest.code;
  }

  const value = raw.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(PLAN_CONFIG, value) ? value : PLAN_CONFIG.guest.code;
}

function normalizeBillingCycle(raw) {
  if (typeof raw !== "string") {
    return "monthly";
  }
  const value = raw.trim().toLowerCase();
  return value === "annual" ? "annual" : "monthly";
}

function getPlanRank(planCode) {
  const normalized = normalizeUserPlanCode(planCode);
  if (normalized === "pro") return 1;
  if (normalized === "unlimited") return 2;
  return 0;
}

function resolveSupportedCurrency(raw) {
  const value = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (value === "INR" || value === "USD") {
    return value;
  }

  const fallback = typeof DEFAULT_PRICING_CURRENCY === "string" ? DEFAULT_PRICING_CURRENCY.trim().toUpperCase() : "";
  if (fallback === "INR" || fallback === "USD") {
    return fallback;
  }
  return "USD";
}

function parseCountryCode(raw) {
  if (typeof raw !== "string") return "";
  const value = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(value) ? value : "";
}

function getCountryFromAcceptLanguage(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return "";
  }

  const firstPart = raw.split(",")[0] || "";
  const localeToken = firstPart.split(";")[0]?.trim() || "";
  if (!localeToken) return "";

  const match = localeToken.match(/^[a-z]{2,3}[-_]([A-Za-z]{2})$/i);
  if (!match?.[1]) return "";
  return parseCountryCode(match[1]);
}

function getRequestCountryCode(req) {
  const directHeaderCandidates = [
    req?.headers?.["cf-ipcountry"],
    req?.headers?.["x-vercel-ip-country"],
    req?.headers?.["x-country-code"],
    req?.headers?.["cloudfront-viewer-country"],
    req?.headers?.["x-appengine-country"]
  ];

  for (const candidate of directHeaderCandidates) {
    const parsed = parseCountryCode(getSingleHeader(candidate));
    if (parsed) {
      return parsed;
    }
  }

  const acceptLanguageCountry = getCountryFromAcceptLanguage(getSingleHeader(req?.headers?.["accept-language"]));
  if (acceptLanguageCountry) {
    return acceptLanguageCountry;
  }

  return "";
}

function getCurrencyForCountryCode(countryCode) {
  if (countryCode === "IN") {
    return "INR";
  }
  return resolveSupportedCurrency(DEFAULT_PRICING_CURRENCY);
}

function convertUsdSubunitsToCurrencySubunits(usdSubunits, currencyRaw) {
  const usdAmount = Number.isFinite(usdSubunits) ? Math.max(0, Number(usdSubunits)) : 0;
  const currency = resolveSupportedCurrency(currencyRaw);

  if (currency === "USD") {
    return Math.round(usdAmount);
  }

  if (currency === "INR") {
    const safeRate = Number.isFinite(USD_TO_INR_RATE) && USD_TO_INR_RATE > 0 ? USD_TO_INR_RATE : 83;
    const usdMajor = usdAmount / 100;
    const inrSubunits = usdMajor * safeRate * 100;
    return Math.max(0, Math.round(inrSubunits));
  }

  return Math.round(usdAmount);
}

function buildPricingContext(req) {
  const country = getRequestCountryCode(req);
  const currency = getCurrencyForCountryCode(country);
  const proMonthlyUsd = Number.isFinite(RAZORPAY_PRO_AMOUNT_SUBUNITS) && RAZORPAY_PRO_AMOUNT_SUBUNITS > 0
    ? Math.round(RAZORPAY_PRO_AMOUNT_SUBUNITS)
    : PLAN_CONFIG.pro.priceUsdCents;
  const unlimitedMonthlyUsd =
    Number.isFinite(RAZORPAY_UNLIMITED_AMOUNT_SUBUNITS) && RAZORPAY_UNLIMITED_AMOUNT_SUBUNITS > 0
      ? Math.round(RAZORPAY_UNLIMITED_AMOUNT_SUBUNITS)
      : PLAN_CONFIG.unlimited.priceUsdCents;
  const proAnnualUsd =
    Number.isFinite(RAZORPAY_PRO_ANNUAL_AMOUNT_SUBUNITS) && RAZORPAY_PRO_ANNUAL_AMOUNT_SUBUNITS > 0
      ? Math.round(RAZORPAY_PRO_ANNUAL_AMOUNT_SUBUNITS)
      : Math.round(proMonthlyUsd * 12 * 0.8);
  const unlimitedAnnualUsd =
    Number.isFinite(RAZORPAY_UNLIMITED_ANNUAL_AMOUNT_SUBUNITS) && RAZORPAY_UNLIMITED_ANNUAL_AMOUNT_SUBUNITS > 0
      ? Math.round(RAZORPAY_UNLIMITED_ANNUAL_AMOUNT_SUBUNITS)
      : Math.round(unlimitedMonthlyUsd * 12 * 0.8);

  const plans = [
    {
      code: "free",
      monthlyAmountSubunits: 0,
      annualAmountSubunits: 0,
      monthlyQuota: PLAN_CONFIG.free.monthlyQuota
    },
    {
      code: "pro",
      monthlyAmountSubunits: convertUsdSubunitsToCurrencySubunits(proMonthlyUsd, currency),
      annualAmountSubunits: convertUsdSubunitsToCurrencySubunits(proAnnualUsd, currency),
      monthlyQuota: PLAN_CONFIG.pro.monthlyQuota
    },
    {
      code: "unlimited",
      monthlyAmountSubunits: convertUsdSubunitsToCurrencySubunits(unlimitedMonthlyUsd, currency),
      annualAmountSubunits: convertUsdSubunitsToCurrencySubunits(unlimitedAnnualUsd, currency),
      monthlyQuota: PLAN_CONFIG.unlimited.monthlyQuota
    }
  ];

  return {
    country: country || "UNKNOWN",
    currency,
    plans
  };
}

function ensureRazorpayConfigured() {
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    return;
  }
  throw new HttpError(500, "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
}

function getRazorpayChargeForPlan(planCode, billingCycleRaw, currencyRaw) {
  const normalized = normalizeUserPlanCode(planCode);
  if (normalized !== "pro" && normalized !== "unlimited") {
    throw new HttpError(400, "Paid plans only: pro, unlimited.");
  }

  const billingCycle = normalizeBillingCycle(billingCycleRaw);
  const baseUsdAmountSubunits =
    billingCycle === "annual"
      ? normalized === "pro"
        ? RAZORPAY_PRO_ANNUAL_AMOUNT_SUBUNITS
        : RAZORPAY_UNLIMITED_ANNUAL_AMOUNT_SUBUNITS
      : normalized === "pro"
        ? RAZORPAY_PRO_AMOUNT_SUBUNITS
        : RAZORPAY_UNLIMITED_AMOUNT_SUBUNITS;

  const monthlyUsdAmount = PLAN_CONFIG[normalized].priceUsdCents;
  const annualUsdAmount = Math.round(monthlyUsdAmount * 12 * 0.8);
  const defaultUsdAmount = billingCycle === "annual" ? annualUsdAmount : monthlyUsdAmount;
  const resolvedUsdAmount =
    Number.isFinite(baseUsdAmountSubunits) && baseUsdAmountSubunits > 0
      ? Math.round(baseUsdAmountSubunits)
      : defaultUsdAmount;
  const currency = resolveSupportedCurrency(currencyRaw);
  const amountSubunits = convertUsdSubunitsToCurrencySubunits(resolvedUsdAmount, currency);

  if (!Number.isFinite(amountSubunits) || amountSubunits <= 0) {
    throw new HttpError(500, `Invalid Razorpay amount configured for ${normalized} (${billingCycle}).`);
  }

  return {
    amountSubunits,
    currency,
    billingCycle
  };
}

async function razorpayRequest(method, pathName, body = null) {
  ensureRazorpayConfigured();
  const url = new URL(`${RAZORPAY_API_BASE}${pathName}`);
  const basicToken = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`, "utf8").toString("base64");
  const headers = {
    Authorization: `Basic ${basicToken}`
  };
  const requestOptions = {
    method,
    headers
  };

  if (body && typeof body === "object") {
    requestOptions.body = JSON.stringify(body);
    requestOptions.headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, requestOptions).catch(() => {
    throw new HttpError(502, "Could not reach Razorpay API.");
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const providerMessage =
      typeof payload?.error?.description === "string"
        ? payload.error.description.trim()
        : typeof payload?.error?.reason === "string"
          ? payload.error.reason.trim()
          : "";
    throw new HttpError(502, providerMessage || `Razorpay request failed (${response.status}).`);
  }

  return payload || {};
}

function isValidRazorpayPaymentSignature(orderId, paymentId, signature, keySecret) {
  const expected = createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(String(signature || ""), "utf8");
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

function isValidRazorpayWebhookSignature(rawBody, signature, webhookSecret) {
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(String(signature || ""), "utf8");
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

function resolveStripeUserId(source) {
  const metadataUserId = Number.parseInt(String(source?.metadata?.user_id || 0), 10);
  if (Number.isFinite(metadataUserId) && metadataUserId > 0) {
    return metadataUserId;
  }

  const clientReferenceId = Number.parseInt(String(source?.client_reference_id || 0), 10);
  if (Number.isFinite(clientReferenceId) && clientReferenceId > 0) {
    return clientReferenceId;
  }

  return 0;
}

function resolveStripePlanCode(source) {
  const metadataPlanCode = normalizeUserPlanCode(source?.metadata?.plan_code);
  if (metadataPlanCode) {
    return metadataPlanCode;
  }

  const itemPriceId = source?.items?.data?.[0]?.price?.id;
  const mappedFromItem = mapPriceIdToPlanCode(itemPriceId);
  if (mappedFromItem) {
    return mappedFromItem;
  }

  const singlePriceId = source?.plan?.id;
  const mappedFromPlan = mapPriceIdToPlanCode(singlePriceId);
  if (mappedFromPlan) {
    return mappedFromPlan;
  }

  return "";
}

function mapPriceIdToPlanCode(priceId) {
  const normalizedPriceId = typeof priceId === "string" ? priceId.trim() : "";
  if (!normalizedPriceId) {
    return "";
  }

  if (STRIPE_PRICE_PRO_MONTHLY && normalizedPriceId === STRIPE_PRICE_PRO_MONTHLY) {
    return "pro";
  }

  if (STRIPE_PRICE_UNLIMITED_MONTHLY && normalizedPriceId === STRIPE_PRICE_UNLIMITED_MONTHLY) {
    return "unlimited";
  }

  return "";
}

function getStripePriceIdForPlan(planCode) {
  if (planCode === "pro") {
    return STRIPE_PRICE_PRO_MONTHLY;
  }
  if (planCode === "unlimited") {
    return STRIPE_PRICE_UNLIMITED_MONTHLY;
  }
  return "";
}

function ensureStripeSecretConfigured() {
  if (STRIPE_SECRET_KEY) {
    return;
  }

  throw new HttpError(500, "Stripe is not configured. Set STRIPE_SECRET_KEY.");
}

function ensureStripeCheckoutConfig() {
  ensureStripeSecretConfigured();
  if (STRIPE_PRICE_PRO_MONTHLY && STRIPE_PRICE_UNLIMITED_MONTHLY) {
    return;
  }

  throw new HttpError(
    500,
    "Stripe plan prices are not configured. Set STRIPE_PRICE_PRO_MONTHLY and STRIPE_PRICE_UNLIMITED_MONTHLY."
  );
}

function ensureStripeWebhookConfigured() {
  ensureStripeSecretConfigured();
  if (STRIPE_WEBHOOK_SECRET) {
    return;
  }

  throw new HttpError(500, "Stripe webhook is not configured. Set STRIPE_WEBHOOK_SECRET.");
}

function getFallbackAppOrigin(req) {
  const explicit = normalizeAbsoluteHttpUrl(APP_BASE_URL);
  if (explicit) {
    return explicit;
  }

  const originHeader = getSingleHeader(req?.headers?.origin);
  const normalizedOrigin = normalizeAbsoluteHttpUrl(originHeader);
  if (normalizedOrigin) {
    return normalizedOrigin;
  }

  const host = getSingleHeader(req?.headers?.host) || "localhost:3000";
  const forwardedProto = getSingleHeader(req?.headers?.["x-forwarded-proto"]);
  const protocol =
    forwardedProto && ["http", "https"].includes(forwardedProto.toLowerCase())
      ? forwardedProto.toLowerCase()
      : host.includes("localhost") || host.startsWith("127.") || host.startsWith("0.0.0.0")
        ? "http"
        : "https";

  return `${protocol}://${host}`;
}

function normalizeAbsoluteHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "";
  }
}

function getSingleHeader(value) {
  if (Array.isArray(value)) {
    return String(value[0] || "").trim();
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

function toSqlDateTimeUtcString(unixSeconds) {
  const value = Number(unixSeconds);
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  const date = new Date(value * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function isValidStripeWebhookSignature(rawBody, signatureHeader, webhookSecret) {
  const timestampMatch = signatureHeader.match(/(?:^|,)\s*t=(\d+)/);
  const v1Matches = Array.from(signatureHeader.matchAll(/(?:^|,)\s*v1=([0-9a-fA-F]+)/g));
  if (!timestampMatch || v1Matches.length === 0) {
    return false;
  }

  const timestamp = timestampMatch[1];
  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return v1Matches.some((match) => {
    const candidate = String(match[1] || "");
    const candidateBuffer = Buffer.from(candidate, "utf8");
    if (candidateBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return timingSafeEqual(expectedBuffer, candidateBuffer);
  });
}

function ensureRole(role, allowedRoles) {
  if (!allowedRoles.includes(role)) {
    throw new HttpError(403, "Insufficient permissions.");
  }
}

function isDuplicateEntryError(error) {
  if (error?.code === "ER_DUP_ENTRY") {
    return true;
  }
  const message = toUserError(error).toLowerCase();
  return message.includes("duplicate entry");
}

function isStrongPassword(value) {
  return typeof value === "string" && value.length >= 8;
}

function ensureDbConfig() {
  if (MYSQL_HOST && MYSQL_USER && MYSQL_PASSWORD && MYSQL_DATABASE) {
    return;
  }

  throw new Error("Missing MySQL configuration. Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE.");
}

function ensureAuthSecret() {
  if (AUTH_SECRET) {
    return;
  }

  throw new HttpError(
    500,
    "AUTH_SECRET is not configured. Set AUTH_SECRET in backend/.env before using auth endpoints."
  );
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Stripe-Signature, X-Razorpay-Signature, x-razorpay-signature"
  );
}

function readRawBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bufferChunk.length;

      if (size > maxBytes) {
        reject(new HttpError(413, "Payload too large."));
        req.destroy();
        return;
      }

      chunks.push(bufferChunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    req.on("error", () => {
      reject(new HttpError(400, "Failed to read request body."));
    });
  });
}

function readJsonBody(req, maxBytes) {
  return readRawBody(req, maxBytes).then((raw) => {
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      throw new HttpError(400, "Invalid JSON payload.");
    }
  });
}

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function toUserError(error) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  return message || "Backend request failed.";
}

function parseBoolean(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function normalizeBasePath(rawBasePath) {
  if (typeof rawBasePath !== "string") {
    return "";
  }

  const trimmed = rawBasePath.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }

  let normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  normalized = normalized.replace(/\/+$/, "");
  return normalized === "/" ? "" : normalized;
}

function stripBasePath(pathname, basePath) {
  const normalizedBasePath = normalizeBasePath(basePath);
  if (!normalizedBasePath) {
    return pathname;
  }

  if (pathname === normalizedBasePath) {
    return "/";
  }

  if (pathname.startsWith(`${normalizedBasePath}/`)) {
    return pathname.slice(normalizedBasePath.length) || "/";
  }

  return pathname;
}

function sqlString(value) {
  const normalized = String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `'${normalized}'`;
}

function sqlNumber(value) {
  const number = Number.parseInt(String(value), 10);
  if (!Number.isFinite(number)) {
    return "0";
  }
  return String(number);
}

function base64UrlEncode(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  let normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4 !== 0) {
    normalized += "=";
  }
  return Buffer.from(normalized, "base64");
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const source = fs.readFileSync(filePath, "utf8");
  const lines = source.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = stripWrappingQuotes(rawValue);

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
