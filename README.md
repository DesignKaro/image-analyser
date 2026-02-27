# Image Analyser

Clean two-part setup:

- `extension/` Chrome extension (image click + UI)
- `backend/` Node API (OpenAI vision call)
- `web/` Next.js website (landing page + upload + prompt flow)

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
├── web/
│   ├── app/
│   ├── public/
│   ├── package.json
│   └── .env.example
└── backend/
    ├── server.mjs
    ├── schema.sql
    ├── package.json
    ├── .env.example
    └── store-key.sh
```

## Localhost Setup

### 1. Start backend

```bash
cd /Users/abhisheksingh/Desktop/Image\ Analyser/backend
cp .env.example .env
# edit .env and add OPENAI_API_KEY + MySQL + AUTH_SECRET
npm start
```

Backend default URL: `http://127.0.0.1:8787`

### Phase 1 SaaS env values

Required in `backend/.env`:

- `OPENAI_API_KEY`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `AUTH_SECRET`

Optional:

- `SAAS_AUTH_REQUIRED=false` (set `true` to force login)
- `GUEST_MONTHLY_LIMIT=20`
- `TOKEN_TTL_SECONDS=2592000` (minimum enforced to 7 days)
- `GUEST_KEY_SALT=...`
- `GOOGLE_CLIENT_ID=...` (required only for Google login)
- `BASE_PATH=/backend` (optional, when reverse-proxying backend under a path)

Razorpay billing (required for paid checkout):

- `APP_BASE_URL=https://your-frontend-domain.com`
- `RAZORPAY_KEY_ID=...`
- `RAZORPAY_KEY_SECRET=...`

Optional Razorpay billing values:

- `RAZORPAY_API_BASE=https://api.razorpay.com/v1`
- `RAZORPAY_WEBHOOK_SECRET=...`
- `RAZORPAY_CURRENCY=USD`
- `RAZORPAY_PRO_AMOUNT_SUBUNITS=2000`
- `RAZORPAY_UNLIMITED_AMOUNT_SUBUNITS=6000`
- `RAZORPAY_PRO_ANNUAL_AMOUNT_SUBUNITS=19200`
- `RAZORPAY_UNLIMITED_ANNUAL_AMOUNT_SUBUNITS=57600`

The backend auto-applies `backend/schema.sql` on startup.

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
2. Backend defaults to `http://127.0.0.1:8787`
3. Sign up, sign in, or use **Continue with Google** from the popup
4. Google button opens the web app login; after login there, extension auto-syncs that session
5. Local web login target is `http://localhost:3000` (not `127.0.0.1`)
6. Keep web app and extension pointed to the same backend URL
7. Enable **click-to-prompt**
8. Open any page and click an image to show the generated prompt
9. Credits update after each generation (`remaining • used/limit`) in popup and overlay
10. In result overlay header, use **save** (stores prompt) and **copy** (copies prompt).
11. Open **Saved prompts** in popup to view/copy previously generated prompts (signed-in users).

### 4. Run the web app

```bash
cd /Users/abhisheksingh/Desktop/Image\ Analyser/web
cp .env.example .env.local
# set NEXT_PUBLIC_BACKEND_URL if needed
npm install
npm run dev
```

Web app default backend URL: `https://img.connectiqworld.cloud/backend`  
Local backend example: `http://127.0.0.1:8787`

After signing in on web, generate a prompt, click **Save** in the result modal, then open the profile dropdown (top-right) and click **Saved prompts** to open the dedicated saved-prompts page.

## Deploy Backend on VPS

1. Deploy only the `backend/` folder.
2. Set env vars on VPS:
   - `OPENAI_API_KEY=...`
   - `HOST=0.0.0.0`
   - `PORT=8787` (or your server port)
3. Put it behind HTTPS (Nginx/Caddy recommended).
4. Update extension backend default in `extension/background.js` (`DEFAULT_BACKEND_URL`) to your VPS URL.

## API Endpoints

- `GET /health`
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/auth/google/config`
- `GET /api/auth/google/bridge` (extension Google login bridge)
- `POST /api/auth/google`
- `GET /api/me`
- `GET /api/usage`
- `GET /api/prompts/saved` (auth, list saved generated prompts)
- `POST /api/prompts/saved` (auth, save generated prompt manually)
- `POST /api/subscription/plan` (self plan change)
- `POST /api/billing/checkout-session` (auth, paid plans, supports `billingCycle: monthly|annual`)
- `POST /api/billing/verify-payment` (auth, Razorpay signature verify)
- `POST /api/billing/portal-session` (auth)
- `POST /api/billing/webhook` (Razorpay webhook, optional)
- `GET /api/admin/users` (admin+)
- `POST /api/admin/users/:id/plan` (admin+)
- `POST /api/admin/users/:id/role` (superadmin)
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

`POST /api/describe-image` now enforces Phase 1 usage policy:

- Guest: `20` monthly uses (configurable)
- Free: `20` monthly uses
- Pro: `200` monthly uses
- Unlimited: no monthly cap

Prompts are only saved when user explicitly calls `POST /api/prompts/saved` (web save button / extension save icon).

Auth token format: `Authorization: Bearer <token>`

Razorpay webhook target (optional):

- `POST https://your-backend-domain.com/api/billing/webhook`
- Header: `X-Razorpay-Signature`

### Bootstrap first admin/superadmin

After first signup (subscriber), promote role in MySQL:

```sql
UPDATE users
SET role = 'superadmin'
WHERE email = 'you@example.com';
```

## Pushing to GitHub

The project is already a git repo with an initial commit. To create a new GitHub repository and push:

1. **Log in to GitHub CLI** (one-time):
   ```bash
   gh auth login
   ```
   Follow the prompts (browser or token).

2. **Create the repo and push** from the project root:
   ```bash
   cd "/Users/abhisheksingh/Desktop/Image Analyser"
   gh repo create image-analyser --public --source=. --remote=origin --push
   ```
   Or create a repo manually on [github.com/new](https://github.com/new) named `image-analyser`, then:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/image-analyser.git
   git branch -M main
   git push -u origin main
   ```

## Troubleshooting

- If you see `Extension context invalidated`, reload the web page once (or open the page in a new tab) and try again.
- This usually happens after reloading/updating the unpacked extension while old tabs are still open.
- If Google popup says `Can't continue with google.com` on local:
  - In Google Cloud Console OAuth client (Web application), add Authorized JavaScript origin: `http://localhost:3000`
  - Ensure `web/.env.local` `NEXT_PUBLIC_GOOGLE_CLIENT_ID` equals `backend/.env` `GOOGLE_CLIENT_ID`
  - Restart web (`npm run dev`) and backend (`npm start`) after env changes
