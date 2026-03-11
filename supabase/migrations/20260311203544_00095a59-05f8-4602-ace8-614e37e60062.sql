
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  text text NOT NULL,
  is_user boolean NOT NULL DEFAULT true,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat messages" ON public.chat_messages FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert chat messages" ON public.chat_messages FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update chat messages" ON public.chat_messages FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete chat messages" ON public.chat_messages FOR DELETE TO public USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
