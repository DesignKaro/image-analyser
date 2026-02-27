import type { Locale } from "./locales";

export type MessageKey = keyof typeof MESSAGES_EN;

const MESSAGES_EN = {
  "footer.tagline":
    "Turn any image into AI-ready prompts for ChatGPT, Gemini, Grok, Leonardo, and more.",
  "footer.brandMain": "Image to Prompt",
  "footer.brandSub": "AI Image Prompt Generator",
  "footer.newsletterTitle": "Subscribe to our newsletter",
  "footer.emailPlaceholder": "Enter your email",
  "footer.subscribe": "Subscribe",
  "footer.linkHome": "Image to Prompt",
  "footer.linkBulk": "Bulk Image to Prompt",
  "footer.linkPricing": "Pricing",
  "footer.linkExtension": "Chrome Extension",
  "footer.linkFaqs": "FAQs",
  "footer.linkContact": "Contact",
  "footer.linkHelp": "Help Center",
  "footer.linkAbout": "About",
  "footer.linkPrivacy": "Privacy Policy",
  "footer.linkTerms": "Terms of Service",
  "footer.linkCookies": "Cookie Settings",
  "footer.linkAccessibility": "Accessibility",
  "footer.linkSecurity": "Security",
  "footer.copy1":
    "Image to Prompt Generator helps creators, marketers, and product teams turn visuals into structured prompts faster. Upload one image and produce reusable text instructions optimized for modern AI models.",
  "footer.copy2":
    "Use our image to prompt workflow to generate high-quality AI prompt from image inputs, streamline creative iteration, and maintain consistent output quality across ChatGPT, Gemini, Grok, Leonardo, and more.",
  "footer.copyright": "© 2026 Image to Prompt Generator. All rights reserved.",
  "footer.selectLanguage": "Select language"
} as const;

/** English (India) – default */
const en_IN = MESSAGES_EN;

/** Hindi – add translated values here; fallback to en for missing keys */
const hi_IN: Record<MessageKey, string> = {
  ...MESSAGES_EN,
  "footer.tagline":
    "ChatGPT, Gemini, Grok, Leonardo आदि के लिए किसी भी छवि को AI-तैयार प्रॉम्प्ट में बदलें।",
  "footer.brandMain": "Image to Prompt",
  "footer.brandSub": "AI इमेज प्रॉम्प्ट जनरेटर",
  "footer.newsletterTitle": "हमारे न्यूज़लेटर की सदस्यता लें",
  "footer.emailPlaceholder": "अपना ईमेल दर्ज करें",
  "footer.subscribe": "सब्सक्राइब",
  "footer.linkHome": "Image to Prompt",
  "footer.linkBulk": "बल्क इमेज टू प्रॉम्प्ट",
  "footer.linkPricing": "मूल्य निर्धारण",
  "footer.linkExtension": "Chrome एक्सटेंशन",
  "footer.linkFaqs": "पूछे जाने वाले प्रश्न",
  "footer.linkContact": "संपर्क",
  "footer.linkHelp": "सहायता केंद्र",
  "footer.linkAbout": "हमारे बारे में",
  "footer.linkPrivacy": "गोपनीयता नीति",
  "footer.linkTerms": "सेवा की शर्तें",
  "footer.linkCookies": "कुकी सेटिंग्स",
  "footer.linkAccessibility": "पहुंच",
  "footer.linkSecurity": "सुरक्षा",
  "footer.copy1":
    "Image to Prompt जनरेटर क्रिएटर्स, मार्केटर्स और प्रोडक्ट टीम्स को विज़ुअल्स को स्ट्रक्चर्ड प्रॉम्प्ट्स में तेज़ी से बदलने में मदद करता है। एक इमेज अपलोड करें और आधुनिक AI मॉडल के लिए अनुकूलित पुन: प्रयोज्य टेक्स्ट निर्देश प्राप्त करें।",
  "footer.copy2":
    "हमारे इमेज टू प्रॉम्प्ट वर्कफ़्लो का उपयोग करके हाई-क्वालिटी AI प्रॉम्प्ट जनरेट करें, क्रिएटिव इटरेशन को सुव्यवस्थित करें और ChatGPT, Gemini, Grok, Leonardo आदि में सुसंगत आउटपुट क्वालिटी बनाए रखें।",
  "footer.copyright": "© 2026 Image to Prompt Generator. सर्वाधिकार सुरक्षित।",
  "footer.selectLanguage": "भाषा चुनें"
};

/** Other locales: use English for now; add translations later */
const fallbackToEn = (): Record<MessageKey, string> => ({ ...MESSAGES_EN });

const id_ID = fallbackToEn();
const es_ES = fallbackToEn();
const pt_BR = fallbackToEn();
const fr_FR = fallbackToEn();
const de_DE = fallbackToEn();
const ar_SA = fallbackToEn();
const ja_JP = fallbackToEn();

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  "en-IN": en_IN,
  "hi-IN": hi_IN,
  "id-ID": id_ID,
  "es-ES": es_ES,
  "pt-BR": pt_BR,
  "fr-FR": fr_FR,
  "de-DE": de_DE,
  "ar-SA": ar_SA,
  "ja-JP": ja_JP
};

export function getMessage(
  locale: Locale,
  key: MessageKey
): string {
  const messages = MESSAGES[locale] ?? MESSAGES["en-IN"];
  return messages[key] ?? MESSAGES["en-IN"][key] ?? String(key);
}
