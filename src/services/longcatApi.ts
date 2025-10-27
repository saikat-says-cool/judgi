"use client";

import OpenAI from "openai";
import { searchLegalDocuments } from "./legalDocumentService"; // Import the new service

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

export const getLongCatCompletion = async (messages: LongCatMessage[]): Promise<string> => {
  if (!import.meta.env.VITE_LONGCAT_API_KEY) {
    console.error("LongCat API Key is not set. Please add VITE_LONGCAT_API_KEY to your .env.local file.");
    throw new Error("LongCat API Key is missing.");
  }

  try {
    // Extract the latest user message for searching legal documents
    const latestUserMessage = messages.findLast(msg => msg.role === "user")?.content || "";

    let context = "";
    if (latestUserMessage) {
      const relevantDocuments = await searchLegalDocuments(latestUserMessage);
      if (relevantDocuments.length > 0) {
        context = "Based on the following legal documents:\n\n";
        relevantDocuments.forEach((doc, index) => {
          context += `Document ${index + 1}:\nTitle: ${doc.title}\nCitation: ${doc.citation || 'N/A'}\nContent: ${doc.content.substring(0, 500)}...\n\n`; // Limit content to 500 chars for brevity
        });
        context += "Please answer the user's question using this information.\n\n";
      }
    }

    // Prepend the context to the first user message or create a new system message
    const messagesWithContext = [...messages];
    if (context) {
      // If there's already a system message, append context. Otherwise, create one.
      const systemMessageIndex = messagesWithContext.findIndex(msg => msg.role === "system");
      if (systemMessageIndex !== -1) {
        messagesWithContext[systemMessageIndex].content = `${context}\n${messagesWithContext[systemMessageIndex].content}`;
      } else {
        messagesWithContext.unshift({ role: "system", content: context });
      }
    }

    const response = await longcatClient.chat.completions.create({
      model: "LongCat-Flash-Chat", // Using the recommended model
      messages: messagesWithContext, // Use messages with added context
      max_tokens: 1000, // Limit response length
      temperature: 0.7, // Adjust creativity
    });
    return response.choices[0].message?.content || "No response from AI.";
  } catch (error) {
    console.error("Error calling LongCat API:", error);
    throw new Error("Failed to get AI response. Please check your API key and network connection.");
  }
};