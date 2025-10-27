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
      method: 'POST', // Assuming a POST request for search
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LANGSEARCH_API_KEY}`,
      },
      body: JSON.stringify({ query, limit: 5 }), // Sending the query and a limit
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from Langsearch API:", errorData);
      throw new Error(`Langsearch API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Assuming Langsearch returns an array of documents with similar structure
    // You might need to adjust this mapping based on the actual Langsearch response format
    const legalDocuments: LegalDocument[] = data.results.map((doc: any) => ({
      id: doc.id || doc.document_id || Math.random().toString(36).substring(2, 15), // Use existing ID or generate one
      title: doc.title || "Untitled Document",
      content: doc.content || doc.text || "",
      citation: doc.citation || null,
      case_id: doc.case_id || null,
      document_type: doc.document_type || null,
      publication_date: doc.publication_date || null,
      author: doc.author || null,
      keywords: doc.keywords || null,
    }));

    return legalDocuments;
  } catch (error) {
    console.error("Error in searchLegalDocuments with Langsearch:", error);
    throw error;
  }
};