-- Create legal_documents table
CREATE TABLE public.legal_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  citation TEXT,
  case_id TEXT UNIQUE, -- Unique identifier for a case, if applicable
  document_type TEXT, -- e.g., 'judgment', 'statute', 'article'
  publication_date DATE,
  author TEXT, -- e.g., 'Supreme Court of India', 'High Court of Bombay'
  keywords TEXT[], -- Array of keywords for search
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Policies for legal_documents:
-- Assuming legal documents are publicly readable for all authenticated users
CREATE POLICY "Allow authenticated users to read legal documents" ON public.legal_documents
FOR SELECT TO authenticated USING (true);

-- No INSERT, UPDATE, DELETE policies for users, as this data will be managed by administrators.
-- If you need to allow specific users (e.g., admins) to manage this data,
-- you would create policies for them based on roles or specific user IDs.