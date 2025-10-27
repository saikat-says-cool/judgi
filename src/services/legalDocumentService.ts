"use client";

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

const getLangsearchCredentials = () => {
  const LANGSEARCH_API_KEY = import.meta.env.VITE_LANGSEARCH_API_KEY;
  const LANGSEARCH_API_URL = import.meta.env.VITE_LANGSEARCH_API_URL;

  if (!LANGSEARCH_API_KEY || !LANGSEARCH_API_URL) {
    console.error("Langsearch API Key or URL is not set. Please add VITE_LANGSEARCH_API_KEY and VITE_LANGSEARCH_API_URL to your .env.local file.");
    throw new Error("Langsearch API credentials are missing.");
  }
  return { LANGSEARCH_API_KEY, LANGSEARCH_API_URL };
};

export const searchLegalDocuments = async (query: string, count: number = 5, country: string | null = null): Promise<LegalDocument[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    const { LANGSEARCH_API_KEY, LANGSEARCH_API_URL } = getLangsearchCredentials();

    const fullQuery = country ? `${query} in ${country} law` : query; // Append country to query

    const response = await fetch(LANGSEARCH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LANGSEARCH_API_KEY}`,
      },
      body: JSON.stringify({ 
        query: fullQuery, // Use the fullQuery
        count: count, 
        summary: true 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from Langsearch API:", errorData);
      throw new Error(`Langsearch API error: ${response.statusText}`);
    }

    const data = await response.json();

    const legalDocuments: LegalDocument[] = data.data.webPages.value.map((doc: any) => ({
      id: doc.id || Math.random().toString(36).substring(2, 15),
      title: doc.name || "Untitled Document",
      content: doc.summary || doc.snippet || "",
      citation: doc.url || null,
      case_id: null,
      document_type: "web_page",
      publication_date: doc.datePublished || null,
      author: null,
      keywords: null,
    }));

    return legalDocuments;
  } catch (error) {
    console.error("Error in searchLegalDocuments with Langsearch:", error);
    throw error;
  }
};

export const searchCurrentNews = async (query: string, count: number = 2, country: string | null = null): Promise<LegalDocument[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    const { LANGSEARCH_API_KEY, LANGSEARCH_API_URL } = getLangsearchCredentials();

    const fullQuery = country ? `current news about ${query} in ${country}` : `current news about ${query}`;

    const response = await fetch(LANGSEARCH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LANGSEARCH_API_KEY}`,
      },
      body: JSON.stringify({ 
        query: fullQuery, // Use the fullQuery
        freshness: "oneDay",
        count: count,
        summary: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from Langsearch API (news search):", errorData);
      throw new Error(`Langsearch API error (news search): ${response.statusText}`);
    }

    const data = await response.json();

    const newsDocuments: LegalDocument[] = data.data.webPages.value.map((doc: any) => ({
      id: doc.id || Math.random().toString(36).substring(2, 15),
      title: doc.name || "Untitled News",
      content: doc.snippet || "",
      citation: doc.url || null,
      case_id: null,
      document_type: "news_article",
      publication_date: doc.datePublished || null,
      author: null,
      keywords: null,
    }));

    return newsDocuments;
  } catch (error) {
    console.error("Error in searchCurrentNews with Langsearch:", error);
    throw error;
  }
};