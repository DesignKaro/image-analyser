#!/usr/bin/env node
/**
 * Production build for the Image to Prompt Chrome extension.
 * Minifies JS and CSS, outputs to dist/
 */

const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
const CleanCSS = require("clean-css");

const EXT_DIR = path.resolve(__dirname);
const DIST_DIR = path.join(EXT_DIR, "dist");

const JS_FILES = ["background.js", "content.js", "popup.js"];
const CSS_FILES = ["content.css", "popup.css"];
const STATIC_FILES = ["manifest.json", "popup.html"];
const STATIC_DIRS = ["icons"];

// Font files (geo-wf-*.woff2) - keep if present
const FONT_FILES = ["geo-wf-3 (1).woff2", "geo-wf-4 (1).woff2", "geo-wf-5 (1).woff2", "geo-wf-6 (1).woff2"];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  ensureDir(destDir);
  for (const name of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, name);
    const destPath = path.join(destDir, name);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

async function minifyJs() {
  for (const file of JS_FILES) {
    const entry = path.join(EXT_DIR, file);
    const outfile = path.join(DIST_DIR, file);
    await esbuild.build({
      entryPoints: [entry],
      outfile,
      minify: true,
      treeShaking: true,
      format: "iife",
      bundle: false,
      target: ["chrome90"]
    });
    console.log(`  ✓ ${file}`);
  }
}

function minifyCss() {
  const cleanCss = new CleanCSS({ level: 2 });
  for (const file of CSS_FILES) {
    const srcPath = path.join(EXT_DIR, file);
    const destPath = path.join(DIST_DIR, file);
    const input = fs.readFileSync(srcPath, "utf8");
    const { styles } = cleanCss.minify(input);
    fs.writeFileSync(destPath, styles);
    console.log(`  ✓ ${file}`);
  }
}

function copyStatic() {
  for (const file of STATIC_FILES) {
    copyFile(path.join(EXT_DIR, file), path.join(DIST_DIR, file));
    console.log(`  ✓ ${file}`);
  }
  for (const dir of STATIC_DIRS) {
    const srcDir = path.join(EXT_DIR, dir);
    if (fs.existsSync(srcDir)) {
      copyDir(srcDir, path.join(DIST_DIR, dir));
      console.log(`  ✓ ${dir}/`);
    }
  }
  for (const font of FONT_FILES) {
    const srcPath = path.join(EXT_DIR, font);
    if (fs.existsSync(srcPath)) {
      copyFile(srcPath, path.join(DIST_DIR, font));
      console.log(`  ✓ ${font}`);
    }
  }
}

async function build() {
  console.log("Building Image to Prompt extension...\n");
  ensureDir(DIST_DIR);

  console.log("Minifying JavaScript:");
  await minifyJs();

  console.log("\nMinifying CSS:");
  minifyCss();

  console.log("\nCopying static assets:");
  copyStatic();

  console.log("\nBuild complete. Output: extension/dist/");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
