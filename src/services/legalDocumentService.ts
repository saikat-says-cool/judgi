"use client";

import { supabase } from "@/integrations/supabase/client";

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

  try {
    // Perform a basic keyword search across title and content
    // In a real-world scenario, you'd likely use full-text search or vector embeddings
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(5); // Limit the number of documents retrieved to keep context manageable

    if (error) {
      console.error("Error searching legal documents:", error);
      throw new Error("Failed to search legal documents.");
    }

    return data || [];
  } catch (error) {
    console.error("Error in searchLegalDocuments:", error);
    throw error;
  }
};