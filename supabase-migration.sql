-- =============================================
-- MIGRAÇÃO COMPLETA: SQLite → Supabase PostgreSQL  
-- Executar no Supabase SQL Editor
-- =============================================

-- 1. Profiles (vinculado ao Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Usuario',
  allowed BOOLEAN DEFAULT false,
  area TEXT,
  allowed_menus TEXT,
  approver BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Discounts
CREATE TABLE IF NOT EXISTS discounts (
  id BIGSERIAL PRIMARY KEY,
  employee_name TEXT NOT NULL,
  type TEXT NOT NULL,
  original_value NUMERIC DEFAULT 0,
  value NUMERIC NOT NULL,
  installments INTEGER DEFAULT 1,
  status TEXT DEFAULT 'step1_validation',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Lawsuits
CREATE TABLE IF NOT EXISTS lawsuits (
  id BIGSERIAL PRIMARY KEY,
  case_number TEXT NOT NULL,
  claimant_name TEXT NOT NULL,
  respondent_name TEXT,
  labor_court TEXT,
  tribunal TEXT,
  distribution_date TEXT,
  citation_date TEXT,
  initial_hearing_date TEXT,
  defense_deadline TEXT,
  reply_deadline TEXT,
  expert_analysis_date TEXT,
  instruction_hearing_date TEXT,
  final_arguments_date TEXT,
  sentence_publication_date TEXT,
  sentence_result TEXT,
  appeal_deadline TEXT,
  ro_filing_date TEXT,
  rr_filing_date TEXT,
  liquidation_date TEXT,
  payment_citation_date TEXT,
  asset_seizure_date TEXT,
  payment_date TEXT,
  archived_date TEXT,
  main_claims TEXT,
  admission_date TEXT,
  termination_date TEXT,
  last_salary NUMERIC,
  cause_value NUMERIC,
  condemnation_value NUMERIC,
  appeal_deposit NUMERIC,
  risk_provision TEXT,
  court_costs NUMERIC,
  current_phase TEXT,
  last_progress TEXT,
  next_action TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Lawsuit Documents
CREATE TABLE IF NOT EXISTS lawsuit_documents (
  id BIGSERIAL PRIMARY KEY,
  lawsuit_id BIGINT NOT NULL REFERENCES lawsuits(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  upload_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Candidates
CREATE TABLE IF NOT EXISTS candidates (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'applied',
  interview_notes TEXT,
  interview_notes_2 TEXT,
  resume_url TEXT,
  match_score INTEGER,
  match_reason TEXT,
  archive_reason TEXT,
  observations TEXT,
  status_updated_at TIMESTAMPTZ,
  disc_profile TEXT,
  docs_delivered BOOLEAN DEFAULT false,
  vt_delivered BOOLEAN DEFAULT false,
  department TEXT,
  onboarding_date TEXT,
  feedback_30 TEXT,
  feedback_60 TEXT,
  feedback_90 TEXT,
  contract_start_date TEXT,
  contract_alert_acknowledged BOOLEAN DEFAULT false,
  phone TEXT,
  termination_date TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Candidate Status History
CREATE TABLE IF NOT EXISTS candidate_status_history (
  id BIGSERIAL PRIMARY KEY,
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Job Openings
CREATE TABLE IF NOT EXISTS job_openings (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  open_positions INTEGER NOT NULL,
  department TEXT NOT NULL,
  skills TEXT NOT NULL,
  salary NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Companies
CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Receipt Configurations
CREATE TABLE IF NOT EXISTS receipt_configurations (
  receipt_id TEXT PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id),
  supplier_name TEXT,
  supplier_document TEXT,
  payment_reason TEXT,
  value NUMERIC,
  date TEXT,
  has_template BOOLEAN DEFAULT false,
  template_url TEXT,
  requires_approval BOOLEAN DEFAULT false,
  approver_id UUID REFERENCES profiles(id),
  is_approved BOOLEAN DEFAULT false,
  pix_key TEXT,
  items_json JSONB,
  history_json JSONB,
  requester TEXT,
  custom_id TEXT
);

-- 10. Issued Receipts (Individual records)
CREATE TABLE IF NOT EXISTS issued_receipts (
  id BIGSERIAL PRIMARY KEY,
  receipt_type_id TEXT NOT NULL,
  company_id BIGINT REFERENCES companies(id),
  employee_name TEXT NOT NULL,
  employee_document TEXT,
  amount NUMERIC NOT NULL,
  payment_reason TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pix_key TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- =============================================
-- RLS (Row Level Security) Policies
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawsuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawsuit_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_receipts ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all for authenticated users
CREATE POLICY "Authenticated users full access" ON profiles FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON discounts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON lawsuits FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON lawsuit_documents FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON candidates FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON candidate_status_history FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON job_openings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON companies FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON receipt_configurations FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON issued_receipts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- Trigger: Auto-create profile on signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, allowed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Usuario'),
    COALESCE((NEW.raw_user_meta_data->>'allowed')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
