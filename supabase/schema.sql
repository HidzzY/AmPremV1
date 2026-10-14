-- ==============================================================================
-- ALIGHT PRO - PRODUCTION SUPABASE DATABASE SCHEMA
-- Creator: Alca W44 (https://whatsapp.com/channel/0029Vb82nkLEwEjtLSQ49I44)
-- SuperAdmin Email: wahidrahmannn1324@gmail.com
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'vip', 'admin')),
  daily_limit INT NOT NULL DEFAULT 5,
  used_limit_today INT NOT NULL DEFAULT 0,
  last_limit_reset TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. ALIGHT MOTION LOGS (am_logs)
CREATE TABLE IF NOT EXISTS public.am_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_am_logs_user_id ON public.am_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_am_logs_created_at ON public.am_logs(created_at DESC);

-- 4. REDEEM CODES (redeem_codes)
CREATE TABLE IF NOT EXISTS public.redeem_codes (
  code TEXT PRIMARY KEY,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  limit_reward INT NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. REFERRALS (referrals)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_referred UNIQUE (referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

-- 6. PRESETS SHARING (presets)
CREATE TABLE IF NOT EXISTS public.presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  preset_link TEXT NOT NULL,
  preview_url TEXT,
  category TEXT DEFAULT 'Jedag Jedug',
  downloads INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_presets_created_at ON public.presets(created_at DESC);

-- 7. LIVE COMMUNITY CHATS (chats)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at ASC);

-- 8. AM GALLERY SHOWCASE (gallery)
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  likes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON public.gallery(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.am_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read profiles (for avatars/usernames), owner or admin can update
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- AM Logs: Users can view their own logs; admins can view all
CREATE POLICY "Users can view own AM logs" ON public.am_logs
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own AM logs" ON public.am_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Presets: Anyone can view; creator can insert/update/delete
CREATE POLICY "Presets are viewable by all" ON public.presets
  FOR SELECT USING (true);

CREATE POLICY "Users can create presets" ON public.presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presets" ON public.presets
  FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Chats: Anyone can view; authenticated users can send
CREATE POLICY "Chats are viewable by all" ON public.chats
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post chat messages" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Gallery: Anyone can view; creator can insert
CREATE POLICY "Gallery items viewable by all" ON public.gallery
  FOR SELECT USING (true);

CREATE POLICY "Users can upload to gallery" ON public.gallery
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Redeem codes: Read active codes, admin full manage
CREATE POLICY "Anyone can view active redeem codes" ON public.redeem_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage redeem codes" ON public.redeem_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Referrals: View own referrals
CREATE POLICY "Users can view referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS
-- SuperAdmin Rule: wahidrahmannn1324@gmail.com is ALWAYS granted role = 'admin'
-- Email Domain Whitelist: Rejects signups not matching allowed domains
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_role TEXT := 'free';
  v_limit INT := 5;
  v_email_domain TEXT;
BEGIN
  -- Strict Email Domain Validation
  v_email_domain := lower(split_part(new.email, '@', 2));
  IF v_email_domain NOT IN ('gmail.com', 'yahoo.com', 'yahoo.co.id', 'outlook.com', 'hotmail.com', 'icloud.com') THEN
    RAISE EXCEPTION 'Domain email tidak diizinkan. Hanya menerima Gmail, Yahoo, Outlook, Hotmail, dan iCloud.';
  END IF;

  -- Extract username from metadata or email username prefix
  v_username := COALESCE(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );

  -- SuperAdmin Check for wahidrahmannn1324@gmail.com
  IF lower(new.email) = 'wahidrahmannn1324@gmail.com' THEN
    v_role := 'admin';
    v_limit := 9999;
    v_username := 'SuperAdmin_Alca';
  END IF;

  INSERT INTO public.profiles (
    id, 
    email, 
    username, 
    avatar_url, 
    role, 
    daily_limit, 
    used_limit_today, 
    last_limit_reset,
    created_at
  )
  VALUES (
    new.id,
    new.email,
    v_username,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || v_username),
    v_role,
    v_limit,
    0,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN lower(EXCLUDED.email) = 'wahidrahmannn1324@gmail.com' THEN 'admin' ELSE public.profiles.role END,
    daily_limit = CASE WHEN lower(EXCLUDED.email) = 'wahidrahmannn1324@gmail.com' THEN 9999 ELSE public.profiles.daily_limit END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 24-HOUR RESET FUNCTION & PG_CRON TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.reset_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET used_limit_today = 0,
      last_limit_reset = now()
  WHERE last_limit_reset < (now() - interval '24 hours')
     OR date_trunc('day', last_limit_reset AT TIME ZONE 'Asia/Jakarta') < date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cron job to run automatically every midnight (WIB / UTC+7 = 17:00 UTC)
-- Note: pg_cron is supported on Supabase Pro or can be run via lazy check/Edge Function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'daily-limit-reset',
      '0 17 * * *',
      'SELECT public.reset_daily_limits()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ==============================================================================
-- DEFAULT SEED DATA (Event Redeem Codes)
-- ==============================================================================
INSERT INTO public.redeem_codes (code, limit_reward, is_active)
VALUES 
  ('ALCAPREM2026', 10, true),
  ('RAMADHANVIP', 25, true),
  ('ALCAW44SPECIAL', 50, true)
ON CONFLICT (code) DO NOTHING;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.presets;
