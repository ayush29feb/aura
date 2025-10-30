-- Supabase Database Schema for Aura
-- Run this in the Supabase SQL Editor

-- 1. Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Products table (A&F products)
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY,
  name TEXT,
  price TEXT,
  gender TEXT,
  url TEXT,
  images JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User media table
CREATE TABLE IF NOT EXISTS user_media (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Products: Public read access (no authentication required)
CREATE POLICY "Public read access for products"
  ON products FOR SELECT
  USING (true);

-- Users: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- User media: Users can only read their own photos
CREATE POLICY "Users can read their own media"
  ON user_media FOR SELECT
  USING (auth.uid() = user_id);

-- User media: Users can insert their own photos
CREATE POLICY "Users can insert their own media"
  ON user_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User media: Users can update their own photos
CREATE POLICY "Users can update their own media"
  ON user_media FOR UPDATE
  USING (auth.uid() = user_id);

-- User media: Users can delete their own photos
CREATE POLICY "Users can delete their own media"
  ON user_media FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_media_user_id ON user_media(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_created_at ON user_media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);

-- 7. Storage bucket policies (run these separately in Storage > Policies)
-- Note: You must create the 'user-images' bucket first in the Supabase dashboard

-- Allow users to upload to their own folder
-- CREATE POLICY "Users can upload to own folder"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'user-images' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Allow users to read their own images
-- CREATE POLICY "Users can read own images"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'user-images' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Allow users to delete their own images
-- CREATE POLICY "Users can delete own images"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'user-images' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
