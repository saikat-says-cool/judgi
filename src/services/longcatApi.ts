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

// The streaming function will now yield raw string chunks
export const getLongCatCompletion = async function* (
  messages: LongCatMessage[],
  options: GetLongCatCompletionOptions
): AsyncGenerator<string, void, unknown> { // Changed return type to AsyncGenerator<string>
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
      systemPrompt += `\nConsider the user's location in ${userCountry} for general context, but do not assume a legal focus unless explicitly asked.`;
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
      stream: true, // Enable streaming
    });

    for await (const chunk of response) {
      const deltaContent = chunk.choices[0]?.delta?.content || '';
      if (deltaContent) {
        yield deltaContent; // Yield raw content chunks
      }
    }

  } catch (error) {
    console.error("Error calling LongCat API:", error);
    throw new Error("Failed to get AI response. Please check your API key and network connection.");
  }
};