"use client";

import OpenAI from "openai";
import { searchLegalDocuments, searchCurrentNews } from "./legalDocumentService"; // Import both search functions

// Ensure VITE_LONGCAT_API_KEY is defined in your .env.local file
const longcatClient = new OpenAI({
  apiKey: import.meta.env.VITE_LONGCAT_API_KEY,
  baseURL: "https://api.longcat.chat/openai",
  dangerouslyAllowBrowser: true, // <--- Added this line to allow client-side calls
});

interface LongCatMessage {
  role: "user" | "assistant";
  content: string;
}

interface GetLongCatCompletionOptions {
  researchMode: 'none' | 'medium' | 'max';
  deepthinkMode: boolean;
}

export const getLongCatCompletion = async (
  messages: LongCatMessage[],
  options: GetLongCatCompletionOptions
): Promise<string> => {
  const { researchMode, deepthinkMode } = options;

  if (!import.meta.env.VITE_LONGCAT_API_KEY) {
    console.error("LongCat API Key is not set. Please add VITE_LONGCAT_API_KEY to your .env.local file.");
    throw new Error("LongCat API Key is missing.");
  }

  try {
    const latestUserMessage = messages.findLast(msg => msg.role === "user")?.content || "";
    let context = "";
    let documents: any[] = [];

    if (latestUserMessage) {
      if (researchMode === 'none') {
        // Slight API calls for current relevant news
        documents = await searchCurrentNews(latestUserMessage, 2); // 2 news articles
        if (documents.length > 0) {
          context += "Based on the following current news articles:\n\n";
          documents.forEach((doc, index) => {
            context += `News Article ${index + 1}:\nTitle: ${doc.title}\nURL: ${doc.citation || 'N/A'}\nSnippet: ${doc.content}\n\n`;
          });
          context += "Please answer the user's question, incorporating this recent information.\n\n";
        }
      } else {
        // Medium or Max legal research
        const count = researchMode === 'medium' ? 3 : 10; // 3 for medium, 10 for max
        documents = await searchLegalDocuments(latestUserMessage, count);
        if (documents.length > 0) {
          context += "Based on the following legal documents:\n\n";
          documents.forEach((doc, index) => {
            context += `Document ${index + 1}:\nTitle: ${doc.title}\nCitation: ${doc.citation || 'N/A'}\nContent: ${doc.content.substring(0, 500)}...\n\n`;
          });
          context += "Please answer the user's question using this information.\n\n";
        }
      }
    }

    const model = deepthinkMode ? "LongCat-Flash-Thinking" : "LongCat-Flash-Chat";

    const messagesWithContext = [...messages];
    if (context) {
      const systemMessageIndex = messagesWithContext.findIndex(msg => msg.role === "system");
      if (systemMessageIndex !== -1) {
        messagesWithContext[systemMessageIndex].content = `${context}\n${messagesWithContext[systemMessageIndex].content}`;
      } else {
        messagesWithContext.unshift({ role: "system", content: context });
      }
    }

    const response = await longcatClient.chat.completions.create({
      model: model,
      messages: messagesWithContext,
      max_tokens: 1000,
      temperature: 0.7,
    });
    return response.choices[0].message?.content || "No response from AI.";
  } catch (error) {
    console.error("Error calling LongCat API:", error);
    throw new Error("Failed to get AI response. Please check your API key and network connection.");
  }
};