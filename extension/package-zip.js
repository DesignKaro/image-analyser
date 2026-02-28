#!/usr/bin/env node
/**
 * Creates a zip archive of the extension dist/ for Chrome Web Store upload.
 */

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const EXT_DIR = path.resolve(__dirname);
const DIST_DIR = path.join(EXT_DIR, "dist");
const ZIP_NAME = "image-to-prompt-extension.zip";

if (!fs.existsSync(DIST_DIR)) {
  console.error("Run 'npm run build' first.");
  process.exit(1);
}

const zipPath = path.join(EXT_DIR, ZIP_NAME);
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

const output = fs.createWriteStream(zipPath);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  console.log(`\nPackage ready: ${ZIP_NAME} (${(archive.pointer() / 1024).toFixed(1)} KB)`);
});

archive.on("error", (err) => {
  console.error("Zip error:", err);
  process.exit(1);
});

archive.pipe(output);
archive.directory(DIST_DIR, false);
archive.finalize();
