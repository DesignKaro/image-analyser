# Image Analyser Mobile

Mobile app shell for Image Analyser tools using Expo + Expo Router.

## Scope

- Matches the web app visual style (rounded nav, bordered cards, gradient CTA).
- Uses the same backend base URL strategy as web/extension.
- Keeps tool screens UI-only for now (no content processing flow).

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Available variable:

- `EXPO_PUBLIC_BACKEND_URL` (default: `https://img.connectiqworld.cloud/backend`)

## Run

```bash
npm install
npm run start
```

Then open in Expo Go / iOS simulator / Android emulator.
