// Hardcoded AssemblyAI API keys
const ASSEMBLYAI_API_KEYS: string[] = [
  "423b13e0543d494ba19bf307da601665",
  // Add more keys here if available for rotation
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