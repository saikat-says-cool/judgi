-- Create conversations table
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation on conversations
CREATE POLICY "conversations_select_policy" ON public.conversations
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "conversations_insert_policy" ON public.conversations
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversations_update_policy" ON public.conversations
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "conversations_delete_policy" ON public.conversations
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add conversation_id to existing chats table
ALTER TABLE public.chats
ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Update existing chat messages to belong to a default conversation (optional, but good for existing data)
-- For simplicity, we'll assume new chats will always have a conversation_id.
-- If you have existing 'chats' data, you might want to create a default conversation for each user
-- and assign their existing messages to it. For this MVP, we'll focus on new data.

-- Update RLS for chats table to include conversation_id
-- Existing policies:
-- CREATE POLICY "Users can view their own chat messages" ON chats FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert their own chat messages" ON chats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can delete their own chat messages" ON chats FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- CREATE POLICY "Users can update their own chat messages" ON chats FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- We need to ensure that a user can only access chat messages that belong to *their* conversations.
-- The existing policies already check `auth.uid() = user_id`, which is sufficient if `user_id` in `chats`
-- is correctly set and `conversation_id` is linked to a conversation owned by that `user_id`.
-- However, to be explicit and robust, we can add a check for `conversation_id` ownership.

-- Re-create policies for chats to explicitly include conversation_id ownership check
DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.chats;
CREATE POLICY "Users can view their own chat messages" ON public.chats
FOR SELECT TO authenticated USING (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own chat messages" ON public.chats;
CREATE POLICY "Users can insert their own chat messages" ON public.chats
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update their own chat messages" ON public.chats;
CREATE POLICY "Users can update their own chat messages" ON public.chats
FOR UPDATE TO authenticated USING (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete their own chat messages" ON public.chats;
CREATE POLICY "Users can delete their own chat messages" ON public.chats
FOR DELETE TO authenticated USING (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid())
);