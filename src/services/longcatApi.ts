"use client";

import OpenAI from "openai";
import { searchLegalDocuments, searchCurrentNews } from "./legalDocumentService";
import { supabase } from "@/integrations/supabase/client"; // Import supabase client

// Ensure VITE_LONGCAT_API_KEY is defined in your .env.local file
const longcatClient = new OpenAI({
  apiKey: import.meta.env.VITE_LONGCAT_API_KEY,
  baseURL: "https://api.longcat.chat/openai",
  dangerouslyAllowBrowser: true,
});

interface LongCatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface GetLongCatCompletionOptions {
  researchMode: 'none' | 'medium' | 'max';
  deepthinkMode: boolean;
  userId: string; // Pass userId to fetch country
  currentDocumentContent?: string; // New: Pass current document content for AI context (now Markdown)
}

interface LongCatCompletionResponse {
  chatResponse: string;
  documentUpdate: {
    type: 'append' | 'replace';
    content: string; // This content is expected to be Markdown
  } | null;
}

export const getLongCatCompletion = async (
  messages: LongCatMessage[],
  options: GetLongCatCompletionOptions
): Promise<LongCatCompletionResponse> => {
  const { researchMode, deepthinkMode, userId, currentDocumentContent } = options;

  if (!import.meta.env.VITE_LONGCAT_API_KEY) {
    console.error("LongCat API Key is not set. Please add VITE_LONGCAT_API_KEY to your .env.local file.");
    throw new Error("LongCat API Key is missing.");
  }

  try {
    let userCountry: string | null = null;
    if (userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user country:", error);
      } else if (data) {
        userCountry = data.country;
      }
    }

    let context = "";
    // Temporarily detaching Langsearch calls as per MVP_PROGRESS.md
    // if (latestUserMessage) { ... }

    const model = deepthinkMode ? "LongCat-Flash-Thinking" : "LongCat-Flash-Chat";

    // Construct the system prompt for a normal assistant
    let systemPrompt = "You are JudgiAI, an intelligent legal assistant. You are currently assisting a user in drafting a legal document. Your primary goal is to help the user write the document on the left panel, while also engaging in a conversational chat on the right panel. ";
    systemPrompt += "You have full control over the document on the left. When the user asks you to modify the document, you MUST perform the requested action. ";
    systemPrompt += "When you want to **replace the entire content of the user's document** (e.g., to polish, restructure, make significant edits, delete parts, shorten, insert in the middle, or any non-append operation), wrap the *entire new document content* in `<DOCUMENT_REPLACE>` and `</DOCUMENT_REPLACE>` tags. This will completely overwrite the current document. ";
    systemPrompt += "When you want to **add new content to the end of the user's document**, wrap that content in `<DOCUMENT_WRITE>` and `</DOCUMENT_WRITE>` tags. This will append to the current document. ";
    systemPrompt += "Only use one type of document tag per response. If you use `<DOCUMENT_REPLACE>`, do not use `<DOCUMENT_WRITE>`. ";
    systemPrompt += "If you perform a document update (either replace or append), you MUST also include a concise, conversational message in your chat response explaining what you have done to the document. For example: 'I've polished the document for you.', 'I've added a new paragraph to the end.', or 'I've removed the requested section.' ";
    systemPrompt += "If the user asks for clarification or discussion, respond conversationally without any document tags. Always keep your conversational responses concise and helpful. ";
    systemPrompt += "All document updates (within <DOCUMENT_REPLACE> or <DOCUMENT_WRITE>) and chat responses should be in Markdown format. "; // Explicitly tell AI to use Markdown

    if (userCountry) {
      systemPrompt += `Consider the user's location in ${userCountry} for general context, but do not assume a legal focus unless explicitly asked.`;
    }

    // Add current document content to the system prompt for context
    if (currentDocumentContent) {
      systemPrompt += `\n\nHere is the current content of the document you are helping to write (in Markdown format):\n<CURRENT_DOCUMENT_CONTENT>\n${currentDocumentContent}\n</CURRENT_DOCUMENT_CONTENT>\n`;
    }

    const messagesForAI: LongCatMessage[] = [{ role: "system", content: systemPrompt }];
    messagesForAI.push(...messages); // Add existing chat messages

    const response = await longcatClient.chat.completions.create({
      model: model,
      messages: messagesForAI,
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 1.0,
    });

    const fullAIResponse = response.choices[0].message?.content || "No response from AI.";

    let documentUpdate: LongCatCompletionResponse['documentUpdate'] = null;
    let chatResponse = fullAIResponse;

    // Parse for DOCUMENT_REPLACE first
    const documentReplaceRegex = /<DOCUMENT_REPLACE>(.*?)<\/DOCUMENT_REPLACE>/s;
    const replaceMatch = fullAIResponse.match(documentReplaceRegex);

    if (replaceMatch && replaceMatch[1]) {
      documentUpdate = { type: 'replace', content: replaceMatch[1].trim() };
      chatResponse = fullAIResponse.replace(documentReplaceRegex, '').trim();
    } else {
      // If no DOCUMENT_REPLACE, then parse for DOCUMENT_WRITE
      const documentWriteRegex = /<DOCUMENT_WRITE>(.*?)<\/DOCUMENT_WRITE>/s;
      const writeMatch = fullAIResponse.match(documentWriteRegex);
      if (writeMatch && writeMatch[1]) {
        documentUpdate = { type: 'append', content: writeMatch[1].trim() };
        chatResponse = fullAIResponse.replace(documentWriteRegex, '').trim();
      }
    }

    return { chatResponse, documentUpdate };

  } catch (error) {
    console.error("Error calling LongCat API:", error);
    throw new Error("Failed to get AI response. Please check your API key and network connection.");
  }
};