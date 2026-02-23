import { Database } from 'better-sqlite3';
import DatabaseConstructor from 'better-sqlite3';

const db = new DatabaseConstructor('hr_system.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS discounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name TEXT NOT NULL,
    type TEXT NOT NULL, -- Adiantamento or Gratificação
    original_value REAL DEFAULT 0,
    value REAL NOT NULL, -- Amount to be discounted
    installments INTEGER DEFAULT 1,
    status TEXT DEFAULT 'step1_validation', -- step1_validation, step2_manager, step3_authorize, step4_report, step5_kardex, completed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lawsuits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Identificação
    case_number TEXT NOT NULL,
    claimant_name TEXT NOT NULL,
    respondent_name TEXT,
    labor_court TEXT,
    tribunal TEXT,
    
    -- 1. Fase de Conhecimento
    distribution_date TEXT,       -- Petição Inicial
    citation_date TEXT,           -- Notificação
    initial_hearing_date TEXT,    -- Audiência Inicial
    defense_deadline TEXT,        -- Contestação
    reply_deadline TEXT,          -- Réplica
    expert_analysis_date TEXT,    -- Perícia
    instruction_hearing_date TEXT,-- Audiência Instrução
    final_arguments_date TEXT,    -- Razões Finais
    sentence_publication_date TEXT,-- Sentença
    sentence_result TEXT,         -- Procedente, Improcedente, Parcial
    
    -- 2. Fase Recursal
    appeal_deadline TEXT,         -- Prazo Recursal Geral
    ro_filing_date TEXT,          -- Recurso Ordinário
    rr_filing_date TEXT,          -- Recurso de Revista
    
    -- 3. Fase de Execução
    liquidation_date TEXT,        -- Liquidação de Sentença
    payment_citation_date TEXT,   -- Citação para Pagamento
    asset_seizure_date TEXT,      -- Atos de Penhora
    payment_date TEXT,            -- Pagamento
    archived_date TEXT,           -- Arquivamento
    
    -- Conteúdo & Financeiro (Mantidos para contexto)
    main_claims TEXT,
    admission_date TEXT,
    termination_date TEXT,
    last_salary REAL,
    cause_value REAL,
    condemnation_value REAL,
    appeal_deposit REAL,
    risk_provision TEXT,
    court_costs REAL,
    
    -- Status Geral
    current_phase TEXT, 
    last_progress TEXT,
    next_action TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'applied', -- applied, interview1, interview2, offer, hired
    interview_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
