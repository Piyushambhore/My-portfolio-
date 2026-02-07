-- =====================================================
-- SUPABASE SETUP SQL FOR PIYUSH'S PORTFOLIO
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Posts table for journey entries
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}',
    detected_skills TEXT[] DEFAULT '{}',
    edited_at TIMESTAMPTZ
);

-- 2. Visitors table for visitor count
CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_count INTEGER DEFAULT 0
);

-- Insert initial visitor record
INSERT INTO visitors (id, total_count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- 3. Reactions table for likes/loves
CREATE TABLE IF NOT EXISTS reactions (
    project_id TEXT PRIMARY KEY,
    likes INTEGER DEFAULT 0,
    loves INTEGER DEFAULT 0
);

-- 4. Feedback table for visitor feedback
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    message TEXT,
    rating INTEGER,
    emoji TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - allows public read/write through API
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (API will handle auth)
CREATE POLICY "Allow public read" ON posts FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON posts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON posts FOR DELETE USING (true);

CREATE POLICY "Allow public read" ON visitors FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON visitors FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON reactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON reactions FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON feedback FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON feedback FOR INSERT WITH CHECK (true);

-- Done! Your database is ready 🎉
