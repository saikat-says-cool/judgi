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
  const LANGSEARCH_API_URL = import.meta.env.VITE_SUPABASE_URL; // Assuming this is the base URL for initial search
  const LANGSEARCH_RERANK_ENDPOINT = "https://api.langsearch.com/v1/rerank"; // Specific Rerank API endpoint

  if (!LANGSEARCH_API_KEY || !LANGSEARCH_API_URL) {
    console.error("Langsearch API Key or URL is not set. Please add VITE_LANGSEARCH_API_KEY and VITE_SUPABASE_URL to your .env.local file.");
    throw new Error("Langsearch API credentials are missing.");
  }
  return { LANGSEARCH_API_KEY, LANGSEARCH_API_URL, LANGSEARCH_RERANK_ENDPOINT };
};

const performRerank = async (query: string, documents: string[], top_n: number, apiKey: string): Promise<{ index: number; document: { text: string }; relevance_score: number }[]> => {
  const { LANGSEARCH_RERANK_ENDPOINT } = getLangsearchCredentials();
  
  if (documents.length === 0) return [];

  const response = await fetch(LANGSEARCH_RERANK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "langsearch-reranker-v1",
      query: query,
      documents: documents,
      top_n: top_n,
      return_documents: true, // We need the document text back to re-associate
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error from Langsearch ReRank API:", errorData);
    throw new Error(`Langsearch ReRank API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
};

export const searchLegalDocuments = async (query: string, count: number = 5, country: string | null = null): Promise<LegalDocument[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    const { LANGSEARCH_API_KEY, LANGSEARCH_API_URL } = getLangsearchCredentials();

    let initialQuery = query;
    if (country === 'India') {
      initialQuery = `Indian legal cases and statutes about ${query}`;
    } else if (country) {
      initialQuery = `${query} in ${country} law`;
    }

    // Step 1: Perform initial broad search to get candidate documents
    const initialResponse = await fetch(LANGSEARCH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LANGSEARCH_API_KEY}`,
      },
      body: JSON.stringify({ 
        query: initialQuery,
        count: 10, // Get more candidates for reranking
        summary: true 
      }),
    });

    if (!initialResponse.ok) {
      const errorData = await initialResponse.json();
      console.error("Error from Langsearch initial API:", errorData);
      throw new Error(`Langsearch initial API error: ${initialResponse.statusText}`);
    }

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
      return [];
    }

    // Step 2: Extract content for reranking
    const documentTexts = candidateDocuments.map(doc => doc.content);

    // Step 3: Perform semantic reranking
    const rerankedResults = await performRerank(initialQuery, documentTexts, count, LANGSEARCH_API_KEY);

    // Step 4: Reconstruct LegalDocument objects based on reranked order
    const finalLegalDocuments: LegalDocument[] = rerankedResults.map(rerankedDoc => {
      // Find the original document using its text (assuming text is unique enough for this purpose)
      // A more robust solution might involve passing original IDs through the reranker if supported
      const originalDoc = candidateDocuments.find(doc => doc.content === rerankedDoc.document.text);
      return originalDoc ? { ...originalDoc, relevance_score: rerankedDoc.relevance_score } : null;
    }).filter(doc => doc !== null) as LegalDocument[];

    return finalLegalDocuments;
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

    let initialQuery = `current news about ${query}`;
    if (country === 'India') {
      initialQuery = `current Indian legal news about ${query}`;
    } else if (country) {
      initialQuery = `current news about ${query} in ${country}`;
    }

    // Step 1: Perform initial broad search for news
    const initialResponse = await fetch(LANGSEARCH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LANGSEARCH_API_KEY}`,
      },
      body: JSON.stringify({ 
        query: initialQuery,
        freshness: "oneDay",
        count: 5, // Get more candidates for reranking
        summary: false
      }),
    });

    if (!initialResponse.ok) {
      const errorData = await initialResponse.json();
      console.error("Error from Langsearch initial API (news search):", errorData);
      throw new Error(`Langsearch initial API error (news search): ${initialResponse.statusText}`);
    }

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
      return [];
    }

    // Step 2: Extract content for reranking
    const documentTexts = candidateNews.map(doc => doc.content);

    // Step 3: Perform semantic reranking
    const rerankedResults = await performRerank(initialQuery, documentTexts, count, LANGSEARCH_API_KEY);

    // Step 4: Reconstruct LegalDocument objects based on reranked order
    const finalNewsDocuments: LegalDocument[] = rerankedResults.map(rerankedDoc => {
      const originalDoc = candidateNews.find(doc => doc.content === rerankedDoc.document.text);
      return originalDoc ? { ...originalDoc, relevance_score: rerankedDoc.relevance_score } : null;
    }).filter(doc => doc !== null) as LegalDocument[];

    return finalNewsDocuments;
  } catch (error) {
    console.error("Error in searchCurrentNews with Langsearch:", error);
    throw error;
  }
};