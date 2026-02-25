# Image Analyser

Clean two-part setup:

- `extension/` Chrome extension (image click + UI)
- `backend/` Node API (OpenAI vision call)

## Directory Layout

```
Image Analyser/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── content.css
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
└── backend/
    ├── server.mjs
    ├── package.json
    ├── .env.example
    └── store-key.sh
```

## Localhost Setup

### 1. Start backend

```bash
cd /Users/abhisheksingh/Desktop/Image\ Analyser/backend
cp .env.example .env
# edit .env and add OPENAI_API_KEY
npm start
```

Backend default URL: `http://127.0.0.1:8787`

Health check:

```bash
curl http://127.0.0.1:8787/health
```

### 2. Load extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select: `/Users/abhisheksingh/Desktop/Image Analyser/extension`

### 3. Configure and test extension

1. Open extension popup
2. Keep backend URL as `http://127.0.0.1:8787`
3. Click **Test backend**
4. Enable **Image analysis**
5. Open any page and click an image

## Deploy Backend on VPS

1. Deploy only the `backend/` folder.
2. Set env vars on VPS:
   - `OPENAI_API_KEY=...`
   - `HOST=0.0.0.0`
   - `PORT=8787` (or your server port)
3. Put it behind HTTPS (Nginx/Caddy recommended).
4. In extension popup, change **Backend base URL** to your VPS URL, then click **Save**.

## API Endpoints

- `GET /health`
- `POST /api/describe-image`

Request body:

```json
{
  "model": "gpt-4o-mini",
  "prompt": "Describe this image",
  "imageDataUrl": "data:image/jpeg;base64,...",
  "imageUrl": "https://example.com/image.jpg"
}
```

`imageDataUrl` is preferred when available.

## Troubleshooting

- If you see `Extension context invalidated`, reload the web page once (or open the page in a new tab) and try again.
- This usually happens after reloading/updating the unpacked extension while old tabs are still open.
