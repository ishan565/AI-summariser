-- Drop old tables if they exist to avoid conflicts
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS summaries;
DROP TABLE IF EXISTS pdfs;
DROP TABLE IF EXISTS users;

-- A simple user table (managed by Supabase Auth, but good for reference)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT
);

-- Updated summaries table with user_id and filename
CREATE TABLE summaries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT,
  summary_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for the summaries table
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert summaries for themselves
CREATE POLICY "Users can insert their own summaries" ON summaries
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own summaries
CREATE POLICY "Users can view their own summaries" ON summaries
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can delete their own summaries
CREATE POLICY "Users can delete their own summaries" ON summaries
FOR DELETE USING (auth.uid() = user_id);