# Image to Prompt – Chrome Extension

Click any image on the web to generate AI prompts. Connects to the Image to Prompt backend.

## Development

Load the `extension/` folder in Chrome (chrome://extensions → Load unpacked) to test with source files.

## Production Build

```bash
cd extension
npm install
npm run build
```

Output: `extension/dist/` – minified JS and CSS, ready to load or package.

## Packaging for Chrome Web Store

```bash
npm run package
```

Creates `image-to-prompt-extension.zip` in the extension folder. Upload this to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

## Loading the Built Extension

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/dist` folder
