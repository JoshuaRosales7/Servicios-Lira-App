-- ================================================
-- ACCOUNTING PLATFORM DATABASE SCHEMA
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- PROFILES TABLE (extends auth.users)
-- ================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- CLIENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  legal_name TEXT NOT NULL,
  commercial_name TEXT,
  nit TEXT UNIQUE NOT NULL,
  dpi TEXT,
  person_type TEXT CHECK (person_type IN ('individual', 'juridica')),
  contributor_type TEXT,
  economic_activity TEXT,
  fiscal_address TEXT,
  department TEXT,
  municipality TEXT,
  phone TEXT,
  email TEXT,
  start_date DATE,
  fiscal_status TEXT DEFAULT 'active' CHECK (fiscal_status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ================================================
-- FISCAL DATA TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.fiscal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tax_regime TEXT,
  obligations TEXT[], -- Array of obligations like IVA, ISR, etc.
  declaration_frequency TEXT CHECK (declaration_frequency IN ('monthly', 'quarterly', 'annual')),
  sat_user TEXT,
  last_declaration_date DATE,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- LEGAL DATA TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.legal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  legal_representative TEXT,
  representative_dpi TEXT,
  position TEXT,
  appointment_date DATE,
  constitution_file_path TEXT,
  commerce_patent_path TEXT,
  documents_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- BANKING DATA TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.banking_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  bank TEXT NOT NULL,
  account_type TEXT CHECK (account_type IN ('checking', 'savings', 'monetaria')),
  account_number TEXT,
  currency TEXT DEFAULT 'GTQ' CHECK (currency IN ('GTQ', 'USD', 'EUR')),
  accounting_use TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ACCOUNTING DATA TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.accounting_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  accounting_method TEXT CHECK (accounting_method IN ('cash', 'accrual')),
  accounting_type TEXT CHECK (accounting_type IN ('simplified', 'general', 'special')),
  responsible TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, fiscal_year)
);

-- ================================================
-- DOCUMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'invoice', 'declaration', 'financial_statement', 'contract', 
    'deed', 'patent', 'receipt', 'other'
  )),
  fiscal_year INTEGER,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  version INTEGER DEFAULT 1,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- NOTES TABLE (Admin only)
-- ================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================
CREATE INDEX IF NOT EXISTS idx_clients_nit ON public.clients(nit);
CREATE INDEX IF NOT EXISTS idx_clients_fiscal_status ON public.clients(fiscal_status);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_fiscal_year ON public.documents(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_notes_client_id ON public.notes(client_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_data_client_id ON public.fiscal_data(client_id);
CREATE INDEX IF NOT EXISTS idx_legal_data_client_id ON public.legal_data(client_id);
CREATE INDEX IF NOT EXISTS idx_banking_data_client_id ON public.banking_data(client_id);
CREATE INDEX IF NOT EXISTS idx_accounting_data_client_id ON public.accounting_data(client_id);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- ================================================
-- PROFILES POLICIES
-- ================================================
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Admin can see all profiles
CREATE POLICY "profiles_admin_select" ON public.profiles 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ================================================
-- CLIENTS POLICIES
-- ================================================
-- Admin can do everything with clients
CREATE POLICY "clients_admin_all" ON public.clients 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Clients can only see their own record
CREATE POLICY "clients_own_select" ON public.clients 
  FOR SELECT USING (user_id = auth.uid());

-- ================================================
-- FISCAL DATA POLICIES
-- ================================================
CREATE POLICY "fiscal_data_admin_all" ON public.fiscal_data 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "fiscal_data_client_select" ON public.fiscal_data 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid())
  );

-- ================================================
-- LEGAL DATA POLICIES
-- ================================================
CREATE POLICY "legal_data_admin_all" ON public.legal_data 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "legal_data_client_select" ON public.legal_data 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid())
  );

-- ================================================
-- BANKING DATA POLICIES
-- ================================================
CREATE POLICY "banking_data_admin_all" ON public.banking_data 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "banking_data_client_select" ON public.banking_data 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid())
  );

-- ================================================
-- ACCOUNTING DATA POLICIES
-- ================================================
CREATE POLICY "accounting_data_admin_all" ON public.accounting_data 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "accounting_data_client_select" ON public.accounting_data 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid())
  );

-- ================================================
-- DOCUMENTS POLICIES
-- ================================================
CREATE POLICY "documents_admin_all" ON public.documents 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "documents_client_select" ON public.documents 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid())
  );

CREATE POLICY "documents_client_insert" ON public.documents 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid())
  );

-- ================================================
-- NOTES POLICIES (Admin only)
-- ================================================
CREATE POLICY "notes_admin_all" ON public.notes 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ================================================
-- TRIGGER FOR AUTO-CREATING PROFILE ON SIGNUP
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fiscal_data_updated_at BEFORE UPDATE ON public.fiscal_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_data_updated_at BEFORE UPDATE ON public.legal_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_banking_data_updated_at BEFORE UPDATE ON public.banking_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounting_data_updated_at BEFORE UPDATE ON public.accounting_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
