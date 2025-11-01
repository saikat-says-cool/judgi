"use client";

interface DocumentUpdate {
  type: 'append' | 'replace';
  content: string;
}

/**
 * Parses the full AI response string to extract the chat-facing content
 * and any document update commands.
 * @param fullAIResponse The raw string received from the AI.
 * @returns An object containing the chatResponse (content for the chat UI)
 *          and documentUpdate (details for modifying the canvas, if present).
 */
export const parseAIResponse = (fullAIResponse: string) => {
  let chatResponse = fullAIResponse;
  let documentUpdate: DocumentUpdate | null = null;

  // Regex to find a complete <DOCUMENT_REPLACE>...</DOCUMENT_REPLACE> block
  const completeReplaceRegex = /<DOCUMENT_REPLACE>(.*?)<\/DOCUMENT_REPLACE>/s;
  const completeReplaceMatch = fullAIResponse.match(completeReplaceRegex);

  // Regex to find a complete <DOCUMENT_WRITE>...</DOCUMENT_WRITE> block
  const completeWriteRegex = /<DOCUMENT_WRITE>(.*?)<\/DOCUMENT_WRITE>/s;
  const completeWriteMatch = fullAIResponse.match(completeWriteRegex);

  if (completeReplaceMatch && completeReplaceMatch[1]) {
    documentUpdate = { type: 'replace', content: completeReplaceMatch[1].trim() };
    chatResponse = fullAIResponse.replace(completeReplaceRegex, '').trim();
  } else if (completeWriteMatch && completeWriteMatch[1]) {
    documentUpdate = { type: 'append', content: completeWriteMatch[1].trim() };
    chatResponse = fullAIResponse.replace(completeWriteRegex, '').trim();
  }

  // Additionally, for streaming, we need to remove any *partial* document tags and their content
  // This regex will match:
  // 1. An opening <DOCUMENT_REPLACE> tag and everything after it until the end of the string
  // 2. An opening <DOCUMENT_WRITE> tag and everything after it until the end of the string
  // This ensures that during streaming, the raw tag content doesn't show up in the chat.
  const partialTagStripRegex = /<(DOCUMENT_REPLACE|DOCUMENT_WRITE)>[\s\S]*$/;
  chatResponse = chatResponse.replace(partialTagStripRegex, '').trim();

  return { chatResponse, documentUpdate };
};