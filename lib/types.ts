export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role?: 'admin' | 'client'
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id?: string
  legal_name: string
  commercial_name: string | null
  nit: string
  dpi: string | null
  person_type: 'individual' | 'juridica'
  contributor_type: string | null
  economic_activity: string | null
  fiscal_address: string | null
  department: string | null
  municipality: string | null
  phone: string | null
  email: string | null
  start_date: string | null
  fiscal_status: 'active' | 'suspended' | 'inactive'
  created_at: string
  updated_at: string

  // Computed/joined properties from some queries
  name?: string // Alias for legal_name or commercial_name for UI compatibility
}

export interface FiscalData {
  id: string
  client_id: string
  tax_regime: string | null
  obligations: string[] | null
  declaration_frequency: 'monthly' | 'quarterly' | 'annual' | null
  sat_user: string | null
  last_declaration_date: string | null
  observations: string | null
  created_at: string
  updated_at: string
}

export interface LegalData {
  id: string
  client_id: string
  legal_representative: string | null
  representative_dpi: string | null
  position: string | null
  appointment_date: string | null
  constitution_file_path: string | null
  commerce_patent_path: string | null
  documents_expiry: string | null
  created_at: string
  updated_at: string
}

export interface BankingData {
  id: string
  client_id: string
  bank: string
  account_type: 'checking' | 'savings' | 'monetaria' | null
  account_number: string | null
  currency: 'GTQ' | 'USD' | 'EUR' | null
  accounting_use: string | null
  notes: string | null
  created_at: string
  updated_at: string

  // UI aliases
  is_primary?: boolean // Not in schema? Schema doesn't have is_primary.
  bank_name?: string // Alias for bank
}

export interface AccountingData {
  id: string
  client_id: string
  fiscal_year: number
  accounting_method: 'cash' | 'accrual' | null
  accounting_type: 'simplified' | 'general' | 'special' | null
  responsible: string | null
  status: 'open' | 'closed' | 'pending' | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  client_id: string
  name: string
  document_type: 'invoice' | 'declaration' | 'financial_statement' | 'contract' | 'deed' | 'patent' | 'receipt' | 'other'
  fiscal_year: number | null
  file_path: string
  file_size: number | null
  mime_type: string | null
  version: number
  uploaded_by: string | null
  is_folder: boolean
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  client_id: string
  title: string
  content: string
  user_id: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string

  // Joins
  clients?: {
    id: string
    commercial_name: string | null
    legal_name: string
  } | null
}

export interface ClientWithDetails extends Client {
  fiscal_data?: FiscalData | null
  legal_data?: LegalData | null
  banking_data?: BankingData[]
  accounting_data?: AccountingData | null
  documents?: Document[]
  notes?: Note[]
}

export interface Notification {
  id: string
  user_id: string
  actor_id?: string | null
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  link: string | null
  created_at: string

  // Join for UI
  actor_profile?: {
    full_name: string | null
    role: string
  } | null
}

export interface ActivityLog {
  id: string
  actor_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  details: any
  created_at: string

  // Joins
  profiles?: {
    full_name: string | null
    role?: string
  } | null
}
