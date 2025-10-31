// Hardcoded LongCat API keys
const LONGCAT_API_KEYS: string[] = [
  "ak_1ZT5QN3iq4fp2lh54j9BH1rW1Ai7v",
  "ak_1Xt5vz8fh7go0WM5UG5qH1tZ7717J",
  "ak_1tn5Db5nh7Ro6mU78e38a8DT62q5M",
  "ak_1kP69v1S20W75nD0Rg1qp1Dq1xX0l",
  "ak_1iV6O22pL7PP9Pc6MZ4AL41t8NM02",
  "ak_1mV6g611i9FE94Y2GS2pj7Dg22Z3Q",
  "ak_1Hs6ON2Kg3dg7N69YY4tl8Nv1Vh5E",
  "ak_1t96Cv6b528y8oC6fx37E7Vp9Gh2C",
  "ak_1ZP6tv7jZ1CT6ri5Fw2jB0uX6jW84",
  "ak_1By6G582R2fo7UW30k8Hy85U8H56c",
  "ak_1Ir7Hz8ME8Js4OS03c5mn0PC71H2X",
  "ak_1YS76u2Qg7xn6xa6UN5JW3BL9QK7K",
  "ak_1RN7kW08e3XR0hI8xw8QJ5os82133",
  "ak_1hv7ql7Q85vr45n42U1xD8Gj6Ms1z",
  "ak_1Bm8Fn89i1Xv4W70IV10T5LK19u1C",
];

let currentLongCatKeyIndex = 0;

export const getLongCatApiKey = (): string => {
  if (LONGCAT_API_KEYS.length === 0) {
    throw new Error("No LongCat API keys configured.");
  }
  return LONGCAT_API_KEYS[currentLongCatKeyIndex];
};

export const rotateLongCatApiKey = (): void => {
  currentLongCatKeyIndex = (currentLongCatKeyIndex + 1) % LONGCAT_API_KEYS.length;
  console.warn(`LongCat API key rotated. New key index: ${currentLongCatKeyIndex}`);
  if (currentLongCatKeyIndex === 0) {
    console.error("All LongCat API keys have been tried. You might be hitting global rate limits or all keys are exhausted.");
  }
};

export const getLongCatApiKeyCount = (): number => {
  return LONGCAT_API_KEYS.length;
};