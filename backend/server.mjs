import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadDotEnv(path.join(__dirname, ".env"));

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 8787);
const OPENAI_API_URL = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 45000);
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 18 * 1024 * 1024);

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

  if (req.method === "GET" && req.url === "/health") {
    json(res, 200, {
      ok: true,
      service: "image-analyser-backend",
      now: new Date().toISOString()
    });
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/describe-image") {
    json(res, 404, { ok: false, error: "Not found." });
    return;
  }

  try {
    const body = await readJsonBody(req, MAX_BODY_BYTES);
    const model = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;
    const prompt = buildPrompt(body?.prompt);
    const imageInput = resolveImageInput(body?.imageDataUrl, body?.imageUrl);
    const apiKey = getOpenAiApiKey();

    const description = await analyzeImage({
      apiKey,
      model,
      prompt,
      imageInput
    });

    json(res, 200, {
      ok: true,
      model,
      description
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    json(res, status, { ok: false, error: toUserError(error) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Image Analyser backend running at http://${HOST}:${PORT}`);
});

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

function buildPrompt(rawPrompt) {
  if (typeof rawPrompt === "string" && rawPrompt.trim()) {
    return rawPrompt.trim();
  }

  return DEFAULT_IMAGE_PROMPT;
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
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageInput } }
            ]
          }
        ],
        max_tokens: 350
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
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let size = 0;

    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      size += Buffer.byteLength(chunk, "utf8");
      if (size > maxBytes) {
        reject(new HttpError(413, "Payload too large."));
        req.destroy();
        return;
      }
      raw += chunk;
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new HttpError(400, "Invalid JSON payload."));
      }
    });

    req.on("error", () => {
      reject(new HttpError(400, "Failed to read request body."));
    });
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

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
