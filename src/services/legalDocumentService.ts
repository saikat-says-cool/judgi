"use client";

// import { supabase } from "@/integrations/supabase/client"; // No longer needed for search

interface LegalDocument {
  id: string;
  title: string;
  content: string;
  citation: string | null;
  case_id: string | null;
  document_type: string | null;
  publication_date: string | null;
  author: string | null;
  keywords: string[] | null;
}

export const searchLegalDocuments = async (query: string): Promise<LegalDocument[]> => {
  if (!query.trim()) {
    return [];
  }

  const LANGSEARCH_API_KEY = import.meta.env.VITE_LANGSEARCH_API_KEY;
  const LANGSEARCH_API_URL = import.meta.env.VITE_LANGSEARCH_API_URL;

  if (!LANGSEARCH_API_KEY || !LANGSEARCH_API_URL) {
    console.error("Langsearch API Key or URL is not set. Please add VITE_LANGSEARCH_API_KEY and VITE_LANGSEARCH_API_URL to your .env.local file.");
    throw new Error("Langsearch API credentials are missing.");
  }

  try {
    const response = await fetch(LANGSEARCH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LANGSEARCH_API_KEY}`,
      },
      body: JSON.stringify({ 
        query, 
        count: 5, // Changed from 'limit' to 'count' as per documentation
        summary: true // Requesting full summaries for better context
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from Langsearch API:", errorData);
      throw new Error(`Langsearch API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Map Langsearch Web Search response to LegalDocument interface
    const legalDocuments: LegalDocument[] = data.data.webPages.value.map((doc: any) => ({
      id: doc.id || Math.random().toString(36).substring(2, 15), // Use existing ID or generate one
      title: doc.name || "Untitled Document", // 'name' from Langsearch maps to 'title'
      content: doc.summary || doc.snippet || "", // Prefer 'summary' if available, otherwise 'snippet'
      citation: doc.url || null, // Using URL as a form of citation for web results
      case_id: null, // Not available from web search
      document_type: "web_page", // Explicitly set type for web search results
      publication_date: doc.datePublished || null,
      author: null, // Not available from web search
      keywords: null, // Not available from web search
    }));

    return legalDocuments;
  } catch (error) {
    console.error("Error in searchLegalDocuments with Langsearch:", error);
    throw error;
  }
};