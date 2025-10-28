-- Create documents table
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content TEXT DEFAULT '',
  chat_history JSONB DEFAULT '[]'::jsonb, -- Store AI chat history as JSONB
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "documents_select_policy" ON public.documents
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "documents_insert_policy" ON public.documents
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_update_policy" ON public.documents
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "documents_delete_policy" ON public.documents
FOR DELETE TO authenticated USING (auth.uid() = user_id);