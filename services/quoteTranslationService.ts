import { LanguageCode } from '../locales';
import { storageService } from './storageService';

const inFlightRequests = new Map<string, Promise<string>>();

/**
 * Strips wrapping quotes and excessive whitespace from a quote string.
 */
function cleanQuoteText(text: string): string {
  return text.trim().replace(/^["'«“]/, '').replace(/["'»”]$/, '').trim();
}

/**
 * Translates text via the key-free Google Translate web endpoint.
 * Requires zero API keys or authentication.
 */
export async function translateWithFreeEndpoint(
  text: string,
  targetLang: 'en' | 'ar'
): Promise<string> {
  const clean = cleanQuoteText(text);
  if (!clean) return text;

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=tr&tl=${targetLang}&dt=t&q=${encodeURIComponent(
    clean
  )}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Free translation failed with status: ${response.status}`);
  }

  const json = await response.json();
  if (Array.isArray(json) && Array.isArray(json[0])) {
    const translated = json[0]
      .map((item: unknown) => (Array.isArray(item) && typeof item[0] === 'string' ? item[0] : ''))
      .join('')
      .trim();

    if (translated) {
      return translated;
    }
  }

  throw new Error('Could not parse free translation response');
}

/**
 * Translates text using Google Gemini API (gemini-2.5-flash).
 * Used when an API key is provided via env or settings.
 */
export async function translateWithGemini(
  text: string,
  targetLang: 'en' | 'ar',
  apiKey: string
): Promise<string> {
  const clean = cleanQuoteText(text);
  if (!clean) return text;

  const langName = targetLang === 'ar' ? 'Arabic' : 'English';
  const prompt = `You are a specialist translator for daily Islamic wisdom quotes and spiritual aphorisms. Translate the following Turkish quote into ${langName}. Preserve spiritual depth, dignity, and eloquence. Return ONLY the translated text without quotation marks, author name, or commentary.\n\nQuote: "${clean}"`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const rawText: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (rawText && typeof rawText === 'string') {
    const cleaned = cleanQuoteText(rawText);
    if (cleaned) return cleaned;
  }

  throw new Error('Empty or invalid Gemini translation response');
}

/**
 * Orchestrates quote translation with a cache-first strategy:
 * 1. Returns original if lang is 'tr' or text is empty.
 * 2. Checks local AsyncStorage cache; returns instantly if found.
 * 3. Uses Gemini if API key is configured.
 * 4. Falls back to key-free Google Translate web endpoint.
 * 5. Caches successful result to AsyncStorage keyed by date and language.
 * 6. Returns original text if all networks/APIs fail.
 */
export async function getOrTranslateQuote(
  rawQuote: string,
  dateKey: string,
  targetLang: LanguageCode
): Promise<string> {
  if (!rawQuote || typeof rawQuote !== 'string' || !rawQuote.trim()) {
    return rawQuote;
  }

  // Turkish is the source language; no translation needed
  if (targetLang === 'tr') {
    return rawQuote;
  }

  const clean = cleanQuoteText(rawQuote);
  if (!clean) return rawQuote;

  // 1. Cache Check
  try {
    const cached = await storageService.getCachedQuoteTranslation(dateKey, targetLang);
    if (cached && cached.trim().length > 0) {
      return cached;
    }
  } catch (err) {
    console.warn('Failed to read quote cache:', err);
  }

  // Deduplicate concurrent requests for the exact same date & language
  const requestKey = `${dateKey}_${targetLang}`;
  const inFlight = inFlightRequests.get(requestKey);
  if (inFlight) {
    return inFlight;
  }

  const translationPromise = (async (): Promise<string> => {
    // 2. Check for optional Gemini API Key
    let geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!geminiKey) {
      try {
        const storedKey = await storageService.getGeminiApiKey();
        if (storedKey) geminiKey = storedKey;
      } catch {
        // ignore
      }
    }

    // Try Gemini if key exists
    if (geminiKey) {
      try {
        const geminiResult = await translateWithGemini(clean, targetLang, geminiKey);
        if (geminiResult) {
          await storageService.setCachedQuoteTranslation(dateKey, targetLang, geminiResult);
          return geminiResult;
        }
      } catch (geminiError) {
        console.warn('Gemini translation failed, falling back to key-free translator:', geminiError);
      }
    }

    // 3. Fall back to free keyless translator
    try {
      const freeResult = await translateWithFreeEndpoint(clean, targetLang);
      if (freeResult) {
        await storageService.setCachedQuoteTranslation(dateKey, targetLang, freeResult);
        return freeResult;
      }
    } catch (freeError) {
      console.warn('Key-free translation failed:', freeError);
    }

    // 4. Fallback to original text on total failure
    return rawQuote;
  })();

  inFlightRequests.set(requestKey, translationPromise);
  try {
    return await translationPromise;
  } finally {
    inFlightRequests.delete(requestKey);
  }
}

export const quoteTranslationService = {
  getOrTranslateQuote,
  translateWithFreeEndpoint,
  translateWithGemini,
};
