"use client";

import { getLangsearchApiKey, rotateLangsearchApiKey, getLangsearchApiKeyCount } from "@/utils/langsearchApiKeys";

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

const LANGSEARCH_SEARCH_API_URL = "https://api.langsearch.com/v1/web-search"; // Hardcoded as per documentation
const LANGSEARCH_RERANK_ENDPOINT = "https://api.langsearch.com/v1/rerank"; // Specific Rerank API endpoint

const makeLangsearchRequest = async (
  url: string,
  body: any,
  maxRetries: number = getLangsearchApiKeyCount()
): Promise<Response> => {
  for (let i = 0; i < maxRetries; i++) {
    const apiKey = getLangsearchApiKey();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        console.warn(`Langsearch API rate limit hit for key. Retrying with next key... (Attempt ${i + 1}/${maxRetries})`);
        rotateLangsearchApiKey();
        // Add a small delay before retrying to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error from Langsearch API (${url}, Status: ${response.status}):`, errorData);
        if (response.status === 401) {
          throw new Error("Authentication failed with Langsearch API. Please check your API key.");
        } else {
          throw new Error(`Langsearch API error: ${response.statusText} - ${errorData.message || 'Unknown error'}`);
        }
      }

      return response;
    } catch (error: any) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // This is a network error (e.g., offline, CORS issue, invalid URL)
        console.error(`Network error during Langsearch API request to ${url}:`, error.message);
        throw new Error(`Network error during Langsearch API request. Please check your internet connection or API URL.`);
      } else {
        // Re-throw other errors, including those from response.json() or custom errors
        throw error;
      }
    }
  }
  throw new Error("All Langsearch API keys exhausted or persistent rate limits encountered. Please try again later.");
};

const performRerank = async (query: string, documents: string[], top_n: number): Promise<{ index: number; document: { text: string }; relevance_score: number }[]> => {
  if (documents.length === 0) return [];

  const body = {
    model: "langsearch-reranker-v1",
    query: query,
    documents: documents,
    top_n: top_n,
    return_documents: true,
  };

  const response = await makeLangsearchRequest(LANGSEARCH_RERANK_ENDPOINT, body);
  const data = await response.json();
  return data.results;
};

export const searchLegalDocuments = async (query: string, count: number = 5, country: string | null = null): Promise<LegalDocument[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    let initialQuery = query;
    if (country === 'India') {
      initialQuery = `Indian legal cases and statutes about ${query}`;
    } else if (country) {
      initialQuery = `${query} in ${country} law`;
    }

    // Step 1: Perform initial broad search to get candidate documents
    const initialBody = { 
      query: initialQuery,
      count: 10, // Get more candidates for reranking (max 10 for web-search)
      summary: true 
    };
    const initialResponse = await makeLangsearchRequest(LANGSEARCH_SEARCH_API_URL, initialBody);
    const initialData = await initialResponse.json();
    
    const candidateDocuments: LegalDocument[] = initialData.data.webPages.value.map((doc: any) => ({
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

    if (candidateDocuments.length === 0) {
      console.warn("No candidate documents found for legal search query:", initialQuery);
      return [];
    }

    // Step 2: Extract content for reranking
    const documentTexts = candidateDocuments.map(doc => doc.content);

    // Step 3: Perform semantic reranking
    const rerankedResults = await performRerank(initialQuery, documentTexts, count);

    // Step 4: Reconstruct LegalDocument objects based on reranked order
    const finalLegalDocuments: LegalDocument[] = rerankedResults.map(rerankedDoc => {
      const originalDoc = candidateDocuments.find(doc => doc.content === rerankedDoc.document.text);
      return originalDoc ? { ...originalDoc, relevance_score: rerankedDoc.relevance_score } : null;
    }).filter(doc => doc !== null) as LegalDocument[];

    return finalLegalDocuments;
  } catch (error) {
    console.error("Error in searchLegalDocuments with Langsearch:", error);
    throw error; // Re-throw to be caught by the calling function (getLongCatCompletion)
  }
};

export const searchCurrentNews = async (query: string, count: number = 2, country: string | null = null): Promise<LegalDocument[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    let initialQuery = `current news about ${query}`;
    if (country === 'India') {
      initialQuery = `current Indian legal news about ${query}`;
    } else if (country) {
      initialQuery = `current news about ${query} in ${country}`;
    }

    // Step 1: Perform initial broad search for news
    const initialBody = { 
      query: initialQuery,
      freshness: "oneDay",
      count: 5, // Get more candidates for reranking (max 10 for web-search)
      summary: false
    };
    const initialResponse = await makeLangsearchRequest(LANGSEARCH_SEARCH_API_URL, initialBody);
    const initialData = await initialResponse.json();
    
    const candidateNews: LegalDocument[] = initialData.data.webPages.value.map((doc: any) => ({
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

    if (candidateNews.length === 0) {
      console.warn("No candidate news articles found for query:", initialQuery);
      return [];
    }

    // Step 2: Extract content for reranking
    const documentTexts = candidateNews.map(doc => doc.content);

    // Step 3: Perform semantic reranking
    const rerankedResults = await performRerank(initialQuery, documentTexts, count);

    // Step 4: Reconstruct LegalDocument objects based on reranked order
    const finalNewsDocuments: LegalDocument[] = rerankedResults.map(rerankedDoc => {
      const originalDoc = candidateNews.find(doc => doc.content === rerankedDoc.document.text);
      return originalDoc ? { ...originalDoc, relevance_score: rerankedDoc.relevance_score } : null;
    }).filter(doc => doc !== null) as LegalDocument[];

    return finalNewsDocuments;
  } catch (error) {
    console.error("Error in searchCurrentNews with Langsearch:", error);
    throw error; // Re-throw to be caught by the calling function (getLongCatCompletion)
  }
};