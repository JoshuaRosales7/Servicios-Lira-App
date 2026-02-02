-- ==============================================================================
-- DEVELOPMENT MODE: PERMISSIVE RLS
-- ==============================================================================
-- This script allows ANY logged-in user to View, Create, Edit, and Delete data.
-- Run this if you are getting "violates row-level security policy" errors
-- and just want to get the app working for development.
-- ==============================================================================

-- 1. Helper function (optional, but good practice)
-- Ensures we just check if user is logged in
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT (auth.role() = 'authenticated');
$$;

-- 2. CLIENTS: Allow all authenticated users
DROP POLICY IF EXISTS "clients_admin_all" ON public.clients;
DROP POLICY IF EXISTS "clients_own_select" ON public.clients;
CREATE POLICY "clients_dev_all" ON public.clients
  FOR ALL USING (public.is_authenticated());

-- 3. FISCAL DATA
DROP POLICY IF EXISTS "fiscal_data_admin_all" ON public.fiscal_data;
DROP POLICY IF EXISTS "fiscal_data_client_select" ON public.fiscal_data;
CREATE POLICY "fiscal_data_dev_all" ON public.fiscal_data
  FOR ALL USING (public.is_authenticated());

-- 4. LEGAL DATA
DROP POLICY IF EXISTS "legal_data_admin_all" ON public.legal_data;
DROP POLICY IF EXISTS "legal_data_client_select" ON public.legal_data;
CREATE POLICY "legal_data_dev_all" ON public.legal_data
  FOR ALL USING (public.is_authenticated());

-- 5. BANKING DATA
DROP POLICY IF EXISTS "banking_data_admin_all" ON public.banking_data;
DROP POLICY IF EXISTS "banking_data_client_select" ON public.banking_data;
CREATE POLICY "banking_data_dev_all" ON public.banking_data
  FOR ALL USING (public.is_authenticated());

-- 6. ACCOUNTING DATA
DROP POLICY IF EXISTS "accounting_data_admin_all" ON public.accounting_data;
DROP POLICY IF EXISTS "accounting_data_client_select" ON public.accounting_data;
CREATE POLICY "accounting_data_dev_all" ON public.accounting_data
  FOR ALL USING (public.is_authenticated());

-- 7. DOCUMENTS
DROP POLICY IF EXISTS "documents_admin_all" ON public.documents;
DROP POLICY IF EXISTS "documents_client_select" ON public.documents;
DROP POLICY IF EXISTS "documents_client_insert" ON public.documents;
CREATE POLICY "documents_dev_all" ON public.documents
  FOR ALL USING (public.is_authenticated());

-- 8. NOTES
DROP POLICY IF EXISTS "notes_admin_all" ON public.notes;
CREATE POLICY "notes_dev_all" ON public.notes
  FOR ALL USING (public.is_authenticated());

-- 9. PROFILES
-- Allow users to see all profiles (useful for listing users in dev)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_dev_select_all" ON public.profiles
  FOR SELECT USING (public.is_authenticated());

-- Allow users to update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_dev_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (trigger usually handles this, but good to have)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_dev_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
