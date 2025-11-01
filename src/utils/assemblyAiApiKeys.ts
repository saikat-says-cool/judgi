// Hardcoded AssemblyAI API keys
const ASSEMBLYAI_API_KEYS: string[] = [
  "423b13e0543d494ba19bf307da601665",
  "aab3043373c64ed1ab847b7b042d5842",
  "7763ab46f71b482ab99b0e89e82af886",
  "030ba214fc8443348935c27fd786c59f",
  "287d8bc4fab746ec9e9b09cb46e10ddf",
];

let currentAssemblyAIKeyIndex = 0;

export const getAssemblyAiApiKey = (): string => {
  if (ASSEMBLYAI_API_KEYS.length === 0) {
    throw new Error("No AssemblyAI API keys configured.");
  }
  return ASSEMBLYAI_API_KEYS[currentAssemblyAIKeyIndex];
};

export const rotateAssemblyAiApiKey = (): void => {
  currentAssemblyAIKeyIndex = (currentAssemblyAIKeyIndex + 1) % ASSEMBLYAI_API_KEYS.length;
  console.warn(`AssemblyAI API key rotated. New key index: ${currentAssemblyAIKeyIndex}`);
  if (currentAssemblyAIKeyIndex === 0) {
    console.error("All AssemblyAI API keys have been tried. You might be hitting global rate limits or all keys are exhausted.");
  }
};

export const getAssemblyAiApiKeyCount = (): number => {
  return ASSEMBLYAI_API_KEYS.length;
};