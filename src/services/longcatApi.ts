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
  role: "user" | "assistant";
  content: string;
}

interface GetLongCatCompletionOptions {
  researchMode: 'none' | 'medium' | 'max';
  deepthinkMode: boolean;
  userId: string; // Pass userId to fetch country
}

export const getLongCatCompletion = async (
  messages: LongCatMessage[],
  options: GetLongCatCompletionOptions
): Promise<string> => {
  const { researchMode, deepthinkMode, userId } = options;

  if (!import.meta.env.VITE_LONGCAT_API_KEY) {
    console.error("LongCat API Key is not set. Please add VITE_LONGCAT_API_KEY to your .env.local file.");
    throw new Error("LongCat API Key is missing.");
  }

  try {
    // Fetch user's country from profiles table
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

    const latestUserMessage = messages.findLast(msg => msg.role === "user")?.content || "";
    let context = "";
    let documents: any[] = [];

    if (latestUserMessage) {
      if (researchMode === 'none') {
        documents = await searchCurrentNews(latestUserMessage, 2);
        if (documents.length > 0) {
          context += "Based on the following current news articles:\n\n";
          documents.forEach((doc, index) => {
            context += `News Article ${index + 1}:\nTitle: ${doc.title}\nURL: ${doc.citation || 'N/A'}\nSnippet: ${doc.content}\n\n`;
          });
          context += "Please answer the user's question, incorporating this recent information.\n\n";
        }
      } else {
        const count = researchMode === 'medium' ? 3 : 10;
        documents = await searchLegalDocuments(latestUserMessage, count, userCountry); // Pass userCountry
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

    // Construct the system prompt with country context
    let systemPrompt = "You are JudgiAI, an expert legal assistant. Provide accurate and concise legal information. Always cite sources when possible. ";
    if (userCountry) {
      systemPrompt += `Unless explicitly stated otherwise in the user's query, assume all legal discussions and research should be focused on the laws and precedents of ${userCountry}.`;
    }

    const messagesWithContext = [...messages];
    if (context) {
      // Prepend context to the system message if it exists, otherwise create one
      const existingSystemMessageIndex = messagesWithContext.findIndex(msg => msg.role === "system");
      if (existingSystemMessageIndex !== -1) {
        messagesWithContext[existingSystemMessageIndex].content = `${systemPrompt}\n${context}\n${messagesWithContext[existingSystemMessageIndex].content}`;
      } else {
        messagesWithContext.unshift({ role: "system", content: `${systemPrompt}\n${context}` });
      }
    } else {
      // If no search context, just add the system prompt
      messagesWithContext.unshift({ role: "system", content: systemPrompt });
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