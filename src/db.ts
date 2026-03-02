import { Database } from 'better-sqlite3';
import DatabaseConstructor from 'better-sqlite3';

import path from 'path';
const db = new DatabaseConstructor(path.join(process.cwd(), 'hr_system.db'));

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
    interview_notes_2 TEXT,
    resume_url TEXT,
    match_score INTEGER,
    match_reason TEXT,
    archive_reason TEXT,
    observations TEXT,
    status_updated_at DATETIME,
    disc_profile TEXT,
    docs_delivered INTEGER DEFAULT 0,
    vt_delivered INTEGER DEFAULT 0,
    department TEXT,
    onboarding_date TEXT,
    feedback_30 TEXT,
    feedback_60 TEXT,
    feedback_90 TEXT,
    contract_start_date TEXT,
    contract_alert_acknowledged INTEGER DEFAULT 0,
    phone TEXT,
    termination_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS job_openings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    open_positions INTEGER NOT NULL,
    department TEXT NOT NULL,
    skills TEXT NOT NULL,
    salary REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Usuario', -- Gestor, Usuario
    allowed BOOLEAN DEFAULT 0,
    area TEXT,
    allowed_menus TEXT,
    requiresPasswordChange BOOLEAN DEFAULT 0,
    approver BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS candidate_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT, -- Email or Name of the user
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lawsuit_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lawsuit_id INTEGER NOT NULL,
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    uploadType TEXT NOT NULL, -- procuracao or preposto
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lawsuit_id) REFERENCES lawsuits(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS receipt_configurations (
    receipt_id TEXT PRIMARY KEY,
    company_id INTEGER,
    supplier_name TEXT,
    supplier_document TEXT, -- CPF or CNPJ
    payment_reason TEXT,
    has_template BOOLEAN DEFAULT 0,
    requires_approval BOOLEAN DEFAULT 0,
    approver_id INTEGER,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
  );
`);


try {
  db.exec("ALTER TABLE users ADD COLUMN allowed_menus TEXT");
} catch (e) { }

try {
  db.exec("ALTER TABLE candidates ADD COLUMN status_updated_at DATETIME");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN resume_url TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN match_score INTEGER");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN match_reason TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN archive_reason TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN observations TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN disc_profile TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN interview_notes_2 TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN docs_delivered INTEGER DEFAULT 0");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN vt_delivered INTEGER DEFAULT 0");
} catch (e) {
  // Column already exists, ignore
}
try {
  db.exec("ALTER TABLE candidates ADD COLUMN department TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN onboarding_date TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN feedback_30 TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN feedback_60 TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN feedback_90 TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN contract_start_date TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN contract_alert_acknowledged INTEGER DEFAULT 0");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN phone TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE candidates ADD COLUMN termination_date TEXT");
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec("ALTER TABLE users ADD COLUMN approver BOOLEAN DEFAULT 0");
} catch (e) { }

// Ensure new tables are created if they were missed
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cnpj TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
} catch (e) { }

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS receipt_configurations (
      receipt_id TEXT PRIMARY KEY,
      company_id INTEGER,
      supplier_name TEXT,
      supplier_document TEXT,
      payment_reason TEXT,
      value REAL,
      date TEXT,
      has_template BOOLEAN DEFAULT 0,
      template_url TEXT,
      requires_approval BOOLEAN DEFAULT 0,
      approver_id INTEGER,
      is_approved BOOLEAN DEFAULT 0,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (approver_id) REFERENCES users(id)
    );
  `);
} catch (e) { }

try {
  db.exec("ALTER TABLE receipt_configurations ADD COLUMN history_json TEXT");
} catch (e) { }

try {
  db.exec(`ALTER TABLE receipt_configurations ADD COLUMN is_approved BOOLEAN DEFAULT 0`);
} catch (e) { }

try {
  db.exec("ALTER TABLE receipt_configurations ADD COLUMN template_url TEXT");
} catch (e) { }

try {
  db.exec("ALTER TABLE receipt_configurations ADD COLUMN value REAL");
} catch (e) { }

try {
  db.exec("ALTER TABLE receipt_configurations ADD COLUMN date TEXT");
} catch (e) { }

try {
  db.exec("ALTER TABLE receipt_configurations ADD COLUMN pix_key TEXT");
} catch (e) { }

try {
  db.exec("ALTER TABLE receipt_configurations ADD COLUMN items_json TEXT");
} catch (e) { }

try {
  db.exec("ALTER TABLE receipt_configurations ADD COLUMN requester TEXT");
} catch (e) { }

try {
  db.exec("ALTER TABLE receipt_configurations ADD COLUMN custom_id TEXT");
} catch (e) { }

export default db;
