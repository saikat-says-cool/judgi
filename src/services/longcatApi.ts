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
  currentDocumentContent?: string; // New: Pass current document content for AI context
}

interface LongCatCompletionResponse {
  chatResponse: string;
  documentWriteContent: string | null;
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
    let systemPrompt = "You are JudgiAI, an intelligent legal assistant. You are currently assisting a user in drafting a legal document. ";
    systemPrompt += "Your primary goal is to help the user write the document on the left panel, while also engaging in a conversational chat on the right panel. ";
    systemPrompt += "When you want to add content directly to the user's document, wrap that content in <DOCUMENT_WRITE> and </DOCUMENT_WRITE> tags. ";
    systemPrompt += "Only write to the document when it makes sense to progress the drafting, otherwise, respond conversationally. ";
    systemPrompt += "Do not include the <DOCUMENT_WRITE> tags in your conversational responses. ";
    systemPrompt += "If the user asks you to write something, put that content inside the <DOCUMENT_WRITE> tags. ";
    systemPrompt += "If the user is asking for clarification or discussion, respond conversationally. ";
    systemPrompt += "Always keep your conversational responses concise and helpful. ";

    if (userCountry) {
      systemPrompt += `Consider the user's location in ${userCountry} for general context, but do not assume a legal focus unless explicitly asked.`;
    }

    // Add current document content to the system prompt for context
    if (currentDocumentContent) {
      systemPrompt += `\n\nHere is the current content of the document you are helping to write:\n<CURRENT_DOCUMENT_CONTENT>\n${currentDocumentContent}\n</CURRENT_DOCUMENT_CONTENT>\n`;
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

    // Parse the AI's response for document content
    const documentWriteRegex = /<DOCUMENT_WRITE>(.*?)<\/DOCUMENT_WRITE>/s;
    const match = fullAIResponse.match(documentWriteRegex);

    let documentWriteContent: string | null = null;
    let chatResponse = fullAIResponse;

    if (match && match[1]) {
      documentWriteContent = match[1].trim();
      // Remove the document write tags and content from the chat response
      chatResponse = fullAIResponse.replace(documentWriteRegex, '').trim();
    }

    return { chatResponse, documentWriteContent };

  } catch (error) {
    console.error("Error calling LongCat API:", error);
    throw new Error("Failed to get AI response. Please check your API key and network connection.");
  }
};