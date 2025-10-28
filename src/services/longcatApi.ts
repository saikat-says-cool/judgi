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
    // Fetch user's country from profiles table (still useful for general context if needed, but not for legal focus)
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
    let legalDocuments: any[] = [];
    let newsDocuments: any[] = [];

    if (latestUserMessage) {
      if (researchMode === 'none') {
        // Only current news, fewer articles
        newsDocuments = await searchCurrentNews(latestUserMessage, 3, userCountry);
      } else {
        // Fetch both legal documents and current news for 'medium' and 'max' modes
        const legalDocCount = researchMode === 'medium' ? 10 : 20; // More retrievals
        const newsDocCount = researchMode === 'medium' ? 3 : 5; // More news articles

        legalDocuments = await searchLegalDocuments(latestUserMessage, legalDocCount, userCountry);
        newsDocuments = await searchCurrentNews(latestUserMessage, newsDocCount, userCountry);
      }

      if (legalDocuments.length > 0) {
        context += "Based on the following documents:\n\n";
        legalDocuments.forEach((doc, index) => {
          // Increased content length for more detail
          context += `Document ${index + 1}:\nTitle: ${doc.title}\nCitation: ${doc.citation || 'N/A'}\nContent: ${doc.content.substring(0, 1500)}...\n\n`;
        });
      }

      if (newsDocuments.length > 0) {
        if (legalDocuments.length > 0) context += "\n"; // Add a separator if both are present
        context += "Based on the following current news articles:\n\n";
        newsDocuments.forEach((doc, index) => {
          context += `News Article ${index + 1}:\nTitle: ${doc.title}\nURL: ${doc.citation || 'N/A'}\nSnippet: ${doc.content}\n\n`;
        });
      }

      if (context) {
        context += "Please answer the user's question, incorporating this information.\n\n";
      }
    }

    const model = deepthinkMode ? "LongCat-Flash-Thinking" : "LongCat-Flash-Chat";

    // Construct the system prompt for a normal assistant
    let systemPrompt = "You are a helpful and friendly AI assistant. Provide clear, concise, and accurate information. ";
    // Removed country-specific legal focus. User country can still be used for general context if desired by the AI.
    if (userCountry) {
      systemPrompt += `Consider the user's location in ${userCountry} for general context, but do not assume a legal focus unless explicitly asked.`;
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
      max_tokens: 4096, // Max tokens remains high for long responses
      temperature: 0.7,
      top_p: 1.0, // Explicitly setting top_p for normal-like behavior
    });
    return response.choices[0].message?.content || "No response from AI.";
  } catch (error) {
    console.error("Error calling LongCat API:", error);
    throw new Error("Failed to get AI response. Please check your API key and network connection.");
  }
};