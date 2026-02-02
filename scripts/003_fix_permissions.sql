-- ==============================================================================
-- FIX RLS INFINITE RECURSION & PERMISSIONS
-- ==============================================================================

-- 1. Create a Secure Function to Check Admin Status
-- This prevents infinite recursion by using SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
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

-- 2. Update Profiles Policies (Fixes the 500 Infinite Recursion)
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles 
  FOR SELECT USING (
    -- Users can see their own profile OR admins can see everyone
    id = auth.uid() OR public.is_admin()
  );

-- 3. Update Clients Policies (Fixes 403 Forbidden for Insert/Update)
DROP POLICY IF EXISTS "clients_admin_all" ON public.clients;
CREATE POLICY "clients_admin_all" ON public.clients
  FOR ALL USING (public.is_admin());

-- Allow regular clients to insert their own records if expected (optional, depends on logic)
-- For now, assuming only Admins manage clients.

-- 4. Apply is_admin() check to other tables to ensure consistency
DROP POLICY IF EXISTS "fiscal_data_admin_all" ON public.fiscal_data;
CREATE POLICY "fiscal_data_admin_all" ON public.fiscal_data FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "legal_data_admin_all" ON public.legal_data;
CREATE POLICY "legal_data_admin_all" ON public.legal_data FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "banking_data_admin_all" ON public.banking_data;
CREATE POLICY "banking_data_admin_all" ON public.banking_data FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "accounting_data_admin_all" ON public.accounting_data;
CREATE POLICY "accounting_data_admin_all" ON public.accounting_data FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "documents_admin_all" ON public.documents;
CREATE POLICY "documents_admin_all" ON public.documents FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "notes_admin_all" ON public.notes;
CREATE POLICY "notes_admin_all" ON public.notes FOR ALL USING (public.is_admin());

-- ==============================================================================
-- IMPORTANT: MAKE YOURSELF AN ADMIN
-- Run the line below (uncommented) with your email address to grant admin rights
-- ==============================================================================

-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id IN (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');
