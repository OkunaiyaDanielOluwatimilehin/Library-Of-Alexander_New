-- Run this SQL in your Supabase Dashboard (SQL Editor) to create the required tables

-- 1. Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id text NOT NULL,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. Create policies to allow public access (since users are unauthenticated in this demo)
CREATE POLICY "Allow public read access on ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on ratings" ON public.ratings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- 5. Create shelf_progress table
CREATE TABLE IF NOT EXISTS public.shelf_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('want_to_read', 'reading', 'completed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.shelf_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on shelf_progress" ON public.shelf_progress FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on shelf_progress" ON public.shelf_progress FOR INSERT WITH CHECK (true);
