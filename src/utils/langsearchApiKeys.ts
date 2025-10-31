// Hardcoded Langsearch API keys
const LANGSEARCH_API_KEYS: string[] = [
  "sk-b523f81de2824c58b166ec0a6bd7a34f",
  "sk-dbfa94b2f94e4f16a2f075cba2b0a0a8",
  "sk-3cc37c168e2f4a2f8004511ad285e4d2",
  "sk-7afaeaa225a54826ab32e6d3d8a50b71",
  "sk-a875d42a3fda434a98e76d10b8eb0ede",
  "sk-977469c8a9854c6b806dea773334053c",
];

let currentLangsearchKeyIndex = 0;

export const getLangsearchApiKey = (): string => {
  if (LANGSEARCH_API_KEYS.length === 0) {
    throw new Error("No Langsearch API keys configured.");
  }
  return LANGSEARCH_API_KEYS[currentLangsearchKeyIndex];
};

export const rotateLangsearchApiKey = (): void => {
  currentLangsearchKeyIndex = (currentLangsearchKeyIndex + 1) % LANGSEARCH_API_KEYS.length;
  console.warn(`Langsearch API key rotated. New key index: ${currentLangsearchKeyIndex}`);
  if (currentLangsearchKeyIndex === 0) {
    console.error("All Langsearch API keys have been tried. You might be hitting global rate limits or all keys are exhausted.");
  }
};

export const getLangsearchApiKeyCount = (): number => {
  return LANGSEARCH_API_KEYS.length;
};