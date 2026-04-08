-- Run this in Supabase SQL Editor

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  text TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  is_superadmin BOOLEAN DEFAULT FALSE,
  is_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- If table already exists, add is_ai column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT FALSE;

-- IMPORTANT: Disable Row Level Security or add policies
-- Option 1: Disable RLS (simpler for this use case)
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Option 2: Or enable RLS with permissive policies (if you want RLS)
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow all operations" ON messages
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);

