"use client";

import OpenAI from "openai";

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
    const response = await longcatClient.chat.completions.create({
      model: "LongCat-Flash-Chat", // Using the recommended model
      messages: messages,
      max_tokens: 1000, // Limit response length
      temperature: 0.7, // Adjust creativity
    });
    return response.choices[0].message?.content || "No response from AI.";
  } catch (error) {
    console.error("Error calling LongCat API:", error);
    // You might want to use a toast notification here for user feedback
    throw new Error("Failed to get AI response. Please check your API key and network connection.");
  }
};