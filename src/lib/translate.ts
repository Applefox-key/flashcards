import type { LangCode } from "@/lib/userSettings";

function toMyMemoryCode(lang: LangCode): string {
  return lang ? lang.slice(0, 2) : "en";
}

export async function translateText(text: string, targetLang: LangCode, sourceLangCode = "en"): Promise<string> {
  const target = toMyMemoryCode(targetLang);
  const source = sourceLangCode === target ? "en" : sourceLangCode;
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as {
    responseStatus: number;
    responseMessage?: string;
    responseData: { translatedText: string };
  };
  if (data.responseStatus !== 200) throw new Error(data.responseMessage ?? "Translation failed");
  return data.responseData.translatedText;
}
