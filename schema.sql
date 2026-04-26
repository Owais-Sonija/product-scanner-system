-- PRODUCT SCANNER SYSTEM - DATABASE SCHEMA
-- This schema should be fully run in Supabase SQL Editor

-- 1. Enable pgcrypto for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- TABLES
-- ==========================================

-- 2. Locations Table
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  manufacturer TEXT,
  source_url TEXT,
  country TEXT,
  notes TEXT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  field_01 BOOLEAN DEFAULT FALSE,
  field_02 BOOLEAN DEFAULT FALSE,
  field_03 BOOLEAN DEFAULT FALSE,
  field_04 BOOLEAN DEFAULT FALSE,
  field_05 BOOLEAN DEFAULT FALSE,
  field_06 BOOLEAN DEFAULT FALSE,
  field_07 BOOLEAN DEFAULT FALSE,
  field_08 BOOLEAN DEFAULT FALSE,
  field_09 BOOLEAN DEFAULT FALSE,
  field_10 BOOLEAN DEFAULT FALSE,
  field_11 BOOLEAN DEFAULT FALSE,
  field_12 BOOLEAN DEFAULT FALSE,
  field_13 BOOLEAN DEFAULT FALSE,
  field_14 BOOLEAN DEFAULT FALSE,
  field_15 BOOLEAN DEFAULT FALSE,
  field_16 BOOLEAN DEFAULT FALSE,
  field_17 BOOLEAN DEFAULT FALSE,
  field_18 BOOLEAN DEFAULT FALSE,
  field_19 BOOLEAN DEFAULT FALSE,
  field_20 BOOLEAN DEFAULT FALSE,
  field_21 BOOLEAN DEFAULT FALSE,
  field_22 BOOLEAN DEFAULT FALSE,
  field_23 BOOLEAN DEFAULT FALSE,
  field_24 BOOLEAN DEFAULT FALSE,
  field_25 BOOLEAN DEFAULT FALSE,
  field_26 BOOLEAN DEFAULT FALSE,
  field_27 BOOLEAN DEFAULT FALSE,
  field_28 BOOLEAN DEFAULT FALSE
);

-- 5. Confirmation Logs Table
CREATE TABLE IF NOT EXISTS public.confirmation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  confirmation_1_at TIMESTAMP WITH TIME ZONE,
  confirmation_2_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmation_logs ENABLE ROW LEVEL SECURITY;

-- Locations: Any authenticated user can read. Admins can all.
CREATE POLICY "Enable read access for all authenticated users" ON public.locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for admins" ON public.locations FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND role = 'admin')
);

-- Profiles: Authenticated users can read all (needed for staff view). Users can edit themselves. Admins can edit all.
CREATE POLICY "admin_read_all_profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "admins_all_profiles" ON public.profiles FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Products: Admins can do all. Staff can insert (for register) and read. 
CREATE POLICY "Enable read access for authenticated users" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for admins" ON public.products FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Enable delete for admins" ON public.products FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND role = 'admin')
);

-- Confirmation Logs: Admins can do all. Staff can read and insert logs they created.
CREATE POLICY "Enable read access for authenticated users" ON public.confirmation_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.confirmation_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = staff_id);
CREATE POLICY "Enable all for admins" ON public.confirmation_logs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND role = 'admin')
);

-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Function to handle new user signups via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'staff'); 
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_modtime
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- SEED DATA
-- ==========================================

-- Default Store Locations
INSERT INTO public.locations (name, code)
VALUES 
  ('Main Warehouse', 'MWH'),
  ('Downtown Store', 'DT01'),
  ('Northside Retail', 'NR02'),
  ('South Mall', 'SM03')
ON CONFLICT (code) DO NOTHING;

-- DB Size & Free Tier Cleanup Function
CREATE OR REPLACE FUNCTION cleanup_old_confirmation_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  log_count INT;
BEGIN
  -- Check total count
  SELECT count(*) INTO log_count FROM confirmation_logs;
  
  -- If over 200, delete the oldest 50
  IF log_count > 200 THEN
    DELETE FROM confirmation_logs
    WHERE id IN (
      SELECT id FROM confirmation_logs
      ORDER BY created_at ASC
      LIMIT 50
    );
  END IF;
END;
$$;
