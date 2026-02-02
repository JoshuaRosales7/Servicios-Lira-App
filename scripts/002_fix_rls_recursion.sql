-- Fix infinite recursion by using a security definer function for role checks

-- 1. Create a secure function to check admin status
-- This function runs with the privileges of the creator (SECURITY DEFINER),
-- bypassing RLS on the profiles table to avoid recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 2. Update profiles policies to use the new function
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles 
  FOR SELECT USING (
    (auth.uid() = id) OR public.is_admin()
  );

-- 3. Update all other table policies that depend on admin checks
-- Clients
DROP POLICY IF EXISTS "clients_admin_all" ON public.clients;
CREATE POLICY "clients_admin_all" ON public.clients
  FOR ALL USING (public.is_admin());

-- Fiscal Data
DROP POLICY IF EXISTS "fiscal_data_admin_all" ON public.fiscal_data;
CREATE POLICY "fiscal_data_admin_all" ON public.fiscal_data
  FOR ALL USING (public.is_admin());

-- Legal Data
DROP POLICY IF EXISTS "legal_data_admin_all" ON public.legal_data;
CREATE POLICY "legal_data_admin_all" ON public.legal_data
  FOR ALL USING (public.is_admin());

-- Banking Data
DROP POLICY IF EXISTS "banking_data_admin_all" ON public.banking_data;
CREATE POLICY "banking_data_admin_all" ON public.banking_data
  FOR ALL USING (public.is_admin());

-- Accounting Data
DROP POLICY IF EXISTS "accounting_data_admin_all" ON public.accounting_data;
CREATE POLICY "accounting_data_admin_all" ON public.accounting_data
  FOR ALL USING (public.is_admin());

-- Documents
DROP POLICY IF EXISTS "documents_admin_all" ON public.documents;
CREATE POLICY "documents_admin_all" ON public.documents
  FOR ALL USING (public.is_admin());

-- Notes
DROP POLICY IF EXISTS "notes_admin_all" ON public.notes;
CREATE POLICY "notes_admin_all" ON public.notes
  FOR ALL USING (public.is_admin());
