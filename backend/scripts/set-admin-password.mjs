#!/usr/bin/env node
/**
 * One-off script: set password for bootstrap admin (argro.official@gmail.com).
 * Uses same .env and hashing as server.mjs. Run from backend: node scripts/set-admin-password.mjs
 */
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scrypt = promisify(scryptCb);

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const source = fs.readFileSync(filePath, "utf8");
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sep = trimmed.indexOf("=");
    if (sep <= 0) continue;
    const key = trimmed.slice(0, sep).trim();
    const raw = trimmed.slice(sep + 1).trim();
    const value = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1).replace(/\\"/g, '"') : raw;
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString("hex")}`;
}

async function main() {
  const envPath = path.join(__dirname, "..", ".env");
  loadDotEnv(envPath);

  const email = (process.env.BOOTSTRAP_ADMIN_EMAILS || "argro.official@gmail.com").split(",")[0].trim();
  const newPassword = (process.env.BOOTSTRAP_ADMIN_PASSWORD || "").trim();
  if (!newPassword) {
    console.error("Set BOOTSTRAP_ADMIN_PASSWORD in backend/.env and run again.");
    process.exit(1);
  }

  const host = (process.env.MYSQL_HOST || "").trim();
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = (process.env.MYSQL_USER || "").trim();
  const password = (process.env.MYSQL_PASSWORD || "").trim();
  const database = (process.env.MYSQL_DATABASE || "").trim();
  if (!host || !user || !database) {
    console.error("MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE must be set in backend/.env");
    process.exit(1);
  }

  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
  });

  const passwordHash = await hashPassword(newPassword);
  const [result] = await pool.execute(
    "UPDATE users SET password_hash = ?, updated_at = UTC_TIMESTAMP() WHERE email = ?",
    [passwordHash, email]
  );

  if (result.affectedRows === 0) {
    console.warn(`No user found with email: ${email}. Create the admin first (e.g. restart backend to run bootstrap).`);
  } else {
    console.log(`Password updated for ${email}. You can sign in with BOOTSTRAP_ADMIN_PASSWORD.`);
  }
  pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
