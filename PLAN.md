# Image Analyser Plan (Extension + Backend)

## Objective
Build a clean two-directory architecture:

1. `extension/` for browser-side UX and image click handling
2. `backend/` for OpenAI processing and API key storage

## Final Architecture

### `extension/`
- `manifest.json` (MV3 setup)
- `background.js`
  - validates backend URL
  - resolves clicked image data
  - calls backend endpoint
  - supports backend health check
- `content.js` + `content.css`
  - listens for image clicks
  - shows loading/result overlay
- `popup.html/js/css`
  - enable/disable analysis
  - configure backend URL
  - test backend connection

### `backend/`
- `server.mjs`
  - `GET /health`
  - `POST /api/describe-image`
  - OpenAI call (server-side key)
  - CORS for extension requests
- `package.json`
- `.env.example`
- `store-key.sh`

## Local Testing Plan

1. Start backend on `http://127.0.0.1:8787`
2. Load unpacked extension from `extension/`
3. Use popup **Test backend**
4. Enable analysis
5. Click multiple image types (`img`, picture, background-image)
6. Verify result/error overlays

## VPS Rollout Plan

1. Deploy `backend/` on VPS
2. Set `OPENAI_API_KEY`, `HOST=0.0.0.0`, `PORT`
3. Put HTTPS reverse proxy in front
4. Set extension popup backend URL to VPS domain
5. Re-test from multiple client machines

## Quality Checklist

- Clear separation of concerns (frontend extension vs backend API)
- No API key in extension files
- Backend URL configurable from popup (no rebuild needed)
- Localhost defaults work out-of-box
- Health check endpoint available for quick diagnostics
