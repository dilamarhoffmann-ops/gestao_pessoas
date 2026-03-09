import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { OpenAI } from 'openai';
import { createRequire } from 'module';
import { uploadFile } from './src/lib/s3';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const app = express();
const PORT = 3000;

// Setup Supabase Admin Client
const supabaseAdminUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseAdminUrl, supabaseServiceKey || 'dummy_key', {
  auth: { autoRefreshToken: false, persistSession: false }
});

app.use(express.json());

// Force create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
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
    pix_key TEXT,
    requester TEXT,
    custom_id TEXT,
    items_json TEXT,
    history_json TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
  )
`);
} catch (e) {
  // Attempt migrations if table exists
  try {
    db.exec('ALTER TABLE receipt_configurations ADD COLUMN pix_key TEXT');
  } catch (err) { }
  try {
    db.exec("ALTER TABLE receipt_configurations ADD COLUMN requester TEXT");
  } catch (e) { }
  try {
    db.exec('ALTER TABLE receipt_configurations ADD COLUMN items_json TEXT');
  } catch (err) { }
  try {
    db.exec("ALTER TABLE receipt_configurations ADD COLUMN custom_id TEXT");
  } catch (e) { }
  try {
    db.exec("ALTER TABLE receipt_configurations ADD COLUMN template_url TEXT");
  } catch (e) { }
  try {
    db.exec("ALTER TABLE receipt_configurations ADD COLUMN is_approved BOOLEAN DEFAULT 0");
  } catch (e) { }
  try {
    db.exec("ALTER TABLE receipt_configurations ADD COLUMN history_json TEXT");
  } catch (e) { }
}

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage for S3 uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const lawsuitUpload = multer({ storage: storage });
const templateUpload = multer({ storage: storage });


app.use('/uploads', express.static(uploadDir));

// --- API Routes ---

// Discounts
app.get('/api/discounts', (req, res) => {
  const stmt = db.prepare('SELECT * FROM discounts ORDER BY created_at DESC');
  const discounts = stmt.all();
  res.json(discounts);
});

app.post('/api/discounts', (req, res) => {
  const { employee_name, type, original_value, value, installments } = req.body;
  const stmt = db.prepare('INSERT INTO discounts (employee_name, type, original_value, value, installments) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(employee_name, type, original_value, value, installments);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/discounts/:id/status', (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const stmt = db.prepare('UPDATE discounts SET status = ? WHERE id = ?');
  stmt.run(status, id);
  res.json({ success: true });
});

// Lawsuits
app.get('/api/lawsuits', (req, res) => {
  const stmt = db.prepare('SELECT * FROM lawsuits ORDER BY created_at DESC');
  const lawsuits = stmt.all();
  res.json(lawsuits);
});

app.post('/api/lawsuits', (req, res) => {
  const {
    case_number = null, claimant_name = null, respondent_name = null, labor_court = null, tribunal = null,
    distribution_date = null, citation_date = null, initial_hearing_date = null, defense_deadline = null,
    reply_deadline = null, expert_analysis_date = null, instruction_hearing_date = null,
    final_arguments_date = null, sentence_publication_date = null, sentence_result = null,
    appeal_deadline = null, ro_filing_date = null, rr_filing_date = null,
    liquidation_date = null, payment_citation_date = null, asset_seizure_date = null, payment_date = null, archived_date = null,
    main_claims = null, admission_date = null, termination_date = null, last_salary = null,
    cause_value = null, condemnation_value = null, appeal_deposit = null, risk_provision = null, court_costs = null,
    current_phase = null, last_progress = null, next_action = null
  } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO lawsuits (
        case_number, claimant_name, respondent_name, labor_court, tribunal,
        distribution_date, citation_date, initial_hearing_date, defense_deadline,
        reply_deadline, expert_analysis_date, instruction_hearing_date,
        final_arguments_date, sentence_publication_date, sentence_result,
        appeal_deadline, ro_filing_date, rr_filing_date,
        liquidation_date, payment_citation_date, asset_seizure_date, payment_date, archived_date,
        main_claims, admission_date, termination_date, last_salary,
        cause_value, condemnation_value, appeal_deposit, risk_provision, court_costs,
        current_phase, last_progress, next_action
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )`);
    stmt.run(
      case_number, claimant_name, respondent_name, labor_court, tribunal,
      distribution_date, citation_date, initial_hearing_date, defense_deadline,
      reply_deadline, expert_analysis_date, instruction_hearing_date,
      final_arguments_date, sentence_publication_date, sentence_result,
      appeal_deadline, ro_filing_date, rr_filing_date,
      liquidation_date, payment_citation_date, asset_seizure_date, payment_date, archived_date,
      main_claims, admission_date, termination_date, last_salary,
      cause_value, condemnation_value, appeal_deposit, risk_provision, court_costs,
      current_phase, last_progress, next_action
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating lawsuit:', error);
    res.status(500).json({ error: 'Failed to create lawsuit' });
  }
});

app.put('/api/lawsuits/:id', (req, res) => {
  const { id } = req.params;
  const {
    case_number = null, claimant_name = null, respondent_name = null, labor_court = null, tribunal = null,
    distribution_date = null, citation_date = null, initial_hearing_date = null, defense_deadline = null,
    reply_deadline = null, expert_analysis_date = null, instruction_hearing_date = null,
    final_arguments_date = null, sentence_publication_date = null, sentence_result = null,
    appeal_deadline = null, ro_filing_date = null, rr_filing_date = null,
    liquidation_date = null, payment_citation_date = null, asset_seizure_date = null, payment_date = null, archived_date = null,
    main_claims = null, admission_date = null, termination_date = null, last_salary = null,
    cause_value = null, condemnation_value = null, appeal_deposit = null, risk_provision = null, court_costs = null,
    current_phase = null, last_progress = null, next_action = null
  } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE lawsuits SET
        case_number = ?, claimant_name = ?, respondent_name = ?, labor_court = ?, tribunal = ?,
        distribution_date = ?, citation_date = ?, initial_hearing_date = ?, defense_deadline = ?,
        reply_deadline = ?, expert_analysis_date = ?, instruction_hearing_date = ?,
        final_arguments_date = ?, sentence_publication_date = ?, sentence_result = ?,
        appeal_deadline = ?, ro_filing_date = ?, rr_filing_date = ?,
        liquidation_date = ?, payment_citation_date = ?, asset_seizure_date = ?, payment_date = ?, archived_date = ?,
        main_claims = ?, admission_date = ?, termination_date = ?, last_salary = ?,
        cause_value = ?, condemnation_value = ?, appeal_deposit = ?, risk_provision = ?, court_costs = ?,
        current_phase = ?, last_progress = ?, next_action = ?
      WHERE id = ?
    `);

    stmt.run(
      case_number, claimant_name, respondent_name, labor_court, tribunal,
      distribution_date, citation_date, initial_hearing_date, defense_deadline,
      reply_deadline, expert_analysis_date, instruction_hearing_date,
      final_arguments_date, sentence_publication_date, sentence_result,
      appeal_deadline, ro_filing_date, rr_filing_date,
      liquidation_date, payment_citation_date, asset_seizure_date, payment_date, archived_date,
      main_claims, admission_date, termination_date, last_salary,
      cause_value, condemnation_value, appeal_deposit, risk_provision, court_costs,
      current_phase, last_progress, next_action,
      id
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating lawsuit:', error);
    res.status(500).json({ error: 'Failed to update lawsuit' });
  }
});

app.delete('/api/lawsuits/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM lawsuits WHERE id = ?');
    stmt.run(Number(id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting lawsuit:', error);
    res.status(500).json({ error: 'Failed to delete lawsuit' });
  }
});

// Lawsuit Documents
app.get('/api/lawsuits/:id/documents', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM lawsuit_documents WHERE lawsuit_id = ? ORDER BY created_at DESC');
    const docs = stmt.all(id);
    res.json(docs);
  } catch (error) {
    console.error('Error fetching lawsuit documents:', error);
    res.status(500).json({ error: 'Failed to fetch lawsuit documents' });
  }
});

app.post('/api/lawsuits/:id/documents', lawsuitUpload.single('file'), async (req: any, res: any) => {
  const { id } = req.params;
  const { uploadType } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = req.file.originalname;
    const fileKey = `lawsuit-${uniqueSuffix}${path.extname(fileName)}`;

    // Upload to S3
    const s3Url = await uploadFile(req.file.buffer, fileKey, req.file.mimetype);

    const stmt = db.prepare('INSERT INTO lawsuit_documents (lawsuit_id, fileName, filePath, uploadType) VALUES (?, ?, ?, ?)');
    const info = stmt.run(id, fileName, s3Url, uploadType);
    res.json({ id: info.lastInsertRowid, fileName, filePath: s3Url, uploadType });
  } catch (error) {
    console.error('Error uploading lawsuit document:', error);
    res.status(500).json({ error: 'Failed to upload lawsuit document' });
  }
});

app.delete('/api/lawsuits/:id/documents/:docId', (req, res) => {
  const { docId } = req.params;
  try {
    const doc = db.prepare('SELECT filePath FROM lawsuit_documents WHERE id = ?').get(docId) as any;
    if (doc) {
      // Se não for uma URL S3, tenta deletar do disco local
      if (!doc.filePath.startsWith('http')) {
        const fullPath = path.join(process.cwd(), doc.filePath);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (e) {
            console.error('Error deleting file from disk:', e);
          }
        }
      }
    }
    const stmt = db.prepare('DELETE FROM lawsuit_documents WHERE id = ?');
    stmt.run(docId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting lawsuit document:', error);
    res.status(500).json({ error: 'Failed to delete lawsuit document' });
  }
});


// Candidates
app.get('/api/candidates', (req, res) => {
  console.log('GET ALL CANDIDATES CALLED');
  const stmt = db.prepare('SELECT * FROM candidates ORDER BY created_at DESC');
  const candidates = stmt.all();
  res.json(candidates);
});

app.post('/api/candidates', upload.single('curriculo'), async (req: any, res: any) => {
  const { name, position, email, observations, contract_start_date, phone } = req.body;
  let resume_url = null;

  if (req.file) {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileKey = `curriculo-${uniqueSuffix}${path.extname(req.file.originalname)}`;
      resume_url = await uploadFile(req.file.buffer, fileKey, req.file.mimetype);
    } catch (err) {
      console.error('Error uploading to S3:', err);
      return res.status(500).json({ error: 'Erro ao fazer upload para nuvem.' });
    }
  }

  const stmt = db.prepare('INSERT INTO candidates (name, position, email, resume_url, observations, contract_start_date, phone, termination_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(name, position, email, resume_url, observations || null, contract_start_date || null, phone || null, null);
  res.json({ id: info.lastInsertRowid, resume_url });
});

app.put('/api/candidates/:id', upload.single('curriculo'), async (req: any, res: any) => {
  const {
    name, position, email, archive_reason, observations, interview_notes,
    interview_notes_2, docs_delivered, vt_delivered, onboarding_date,
    feedback_30, feedback_60, feedback_90,
    contract_start_date, contract_alert_acknowledged, phone, termination_date
  } = req.body;
  const { id } = req.params;
  console.log('FULL UPDATE REQUEST FOR:', id, req.body);

  const docsVal = docs_delivered === 'true' || docs_delivered === '1' ? 1 : 0;
  const vtVal = vt_delivered === 'true' || vt_delivered === '1' ? 1 : 0;
  const acknowledgedVal = contract_alert_acknowledged === 'true' || contract_alert_acknowledged === '1' ? 1 : 0;

  // Fallback to existing values if not provided
  const existing = db.prepare('SELECT contract_start_date, phone, termination_date, resume_url FROM candidates WHERE id = ?').get(id) as any;
  const final_contract_start_date = contract_start_date !== undefined ? contract_start_date : (existing?.contract_start_date || null);
  const final_phone = phone !== undefined ? (phone || null) : (existing?.phone || null);
  const final_termination_date = termination_date !== undefined ? (termination_date || null) : (existing?.termination_date || null);
  let final_resume_url = existing?.resume_url || null;

  if (req.file) {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileKey = `curriculo-${uniqueSuffix}${path.extname(req.file.originalname)}`;
      final_resume_url = await uploadFile(req.file.buffer, fileKey, req.file.mimetype);
    } catch (err) {
      console.error('Error uploading to S3:', err);
      // Keep existing URL if upload fails, or fail the request
    }
  }

  const stmt = db.prepare('UPDATE candidates SET name = ?, position = ?, email = ?, resume_url = ?, archive_reason = ?, observations = ?, interview_notes = ?, interview_notes_2 = ?, docs_delivered = ?, vt_delivered = ?, onboarding_date = ?, feedback_30 = ?, feedback_60 = ?, feedback_90 = ?, contract_start_date = ?, contract_alert_acknowledged = ?, phone = ?, termination_date = ? WHERE id = ?');
  stmt.run(name, position, email, final_resume_url, archive_reason || null, observations || null, interview_notes || null, interview_notes_2 || null, docsVal, vtVal, onboarding_date || null, feedback_30 || null, feedback_60 || null, feedback_90 || null, final_contract_start_date, acknowledgedVal, final_phone, final_termination_date, id);

  res.json({ success: true, resume_url: final_resume_url });
});

app.put('/api/candidates/:id/status', (req, res) => {
  const { status, interview_notes, interview_notes_2, archive_reason, termination_date } = req.body;
  const { id } = req.params;
  console.log('RAW BODY:', req.body);

  console.log(`[API] Updating candidate ${id} status to ${status}`, { archive_reason, interview_notes, interview_notes_2 });

  try {
    let query = 'UPDATE candidates SET status = ?';
    const params = [status];

    if (status === 'archived' || status === 'applied') {
      query += ', match_score = NULL, match_reason = NULL';
    }

    if (archive_reason !== undefined && archive_reason !== null) {
      query += ', archive_reason = ?';
      params.push(archive_reason);
    }

    if (interview_notes !== undefined && interview_notes !== null) {
      query += ', interview_notes = ?';
      params.push(interview_notes);
    }

    if (interview_notes_2 !== undefined && interview_notes_2 !== null) {
      query += ', interview_notes_2 = ?';
      params.push(interview_notes_2);
    }

    if (termination_date !== undefined && termination_date !== null) {
      query += ', termination_date = ?';
      params.push(termination_date);
    }

    query += ' WHERE id = ?';
    params.push(id);

    console.log(`[DEBUG] Final SQL: ${query}`);
    console.log(`[DEBUG] Final Params:`, params);

    const stmt = db.prepare(query);
    const info = stmt.run(...params);

    console.log(`[API] Candidate ${id} updated successfully. Changes: ${info.changes}`);
    res.json({ success: true, changes: info.changes });
  } catch (error) {
    console.error(`[API] Error updating candidate ${id}:`, error);
    res.status(500).json({ error: 'Failed to update candidate status' });
  }
});

app.delete('/api/candidates/:id', (req, res) => {
  const { id } = req.params;
  console.log('DELETE REQUEST FOR:', id);
  try {
    const stmt = db.prepare('DELETE FROM candidates WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

app.post('/api/candidates/:id/disc', (req, res) => {
  const { profile } = req.body;
  const { id } = req.params;

  if (!profile) {
    return res.status(400).json({ error: "Missing profile string" });
  }

  try {
    const stmt = db.prepare('UPDATE candidates SET disc_profile = ? WHERE id = ?');
    stmt.run(profile, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating candidate DISC:', error);
    res.status(500).json({ error: 'Failed to update candidate DISC profile' });
  }
});

app.post('/api/candidates/:id/match', async (req, res) => {
  const { id } = req.params;
  try {
    const candidateStmt = db.prepare('SELECT * FROM candidates WHERE id = ?');
    const candidate = candidateStmt.get(id);

    if (!candidate || !candidate.resume_url) {
      return res.status(400).json({ error: 'Candidate or resume missing' });
    }

    const jobStmt = db.prepare('SELECT * FROM job_openings WHERE title = ?');
    const job = jobStmt.get(candidate.position);

    if (!job) {
      return res.status(400).json({ error: 'Job opening not found for this candidate' });
    }

    let fileSource: any;
    if (candidate.resume_url.startsWith('http')) {
      const response = await fetch(candidate.resume_url);
      if (!response.ok) throw new Error('Falha ao baixar currículo do S3');
      const arrayBuffer = await response.arrayBuffer();
      // Converte para Buffer e usa form-data compatível com OpenAI
      fileSource = new File([arrayBuffer], 'curriculo.pdf', { type: 'application/pdf' });
    } else {
      const filePath = path.join(process.cwd(), candidate.resume_url);
      if (!fs.existsSync(filePath)) {
        return res.status(400).json({ error: 'Resume file missing on disk' });
      }
      fileSource = fs.createReadStream(filePath);
    }

    console.log('Using OpenAI API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10));
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log('Uploading file to OpenAI for advanced analysis (OCR/Vision)...');
    const file = await openai.files.create({
      file: fileSource,
      purpose: 'assistants'
    });

    console.log('Initiating AI match for candidate:', id, 'using model: gpt-4o with file:', file.id);

    const skillsList = job.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    const skillsInstruction = skillsList.map((s: string, i: number) => `  ${i + 1}. "${s}"`).join('\n');

    const prompt = `Analise o currículo anexo em relação à vaga e habilidades exigidas usando o método de pontuação abaixo.

VAGA: ${job.title} (${job.department})

HABILIDADES EXIGIDAS (avalie CADA uma individualmente):
${skillsInstruction}

MÉTODO DE PONTUAÇÃO OBRIGATÓRIO:
Para CADA habilidade listada acima, atribua uma nota de 0 a 100:
- 100: Habilidade explicitamente mencionada com experiência comprovada
- 75: Habilidade mencionada mas sem detalhamento de experiência
- 50: Habilidade indiretamente relacionada a algo mencionado no currículo
- 25: Habilidade vagamente inferível pelo contexto geral
- 0: Habilidade não mencionada nem inferível

O "score" final é a MÉDIA ARITMÉTICA das notas individuais, arredondada para inteiro.

Retorne APENAS um JSON válido com:
- "skills_evaluation": array de objetos com { "skill": string, "points": number }
- "score": número inteiro (média das notas acima)
- "reason": justificativa de até 2 frases informando os principais acertos e faltas em relação às habilidades exigidas`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      seed: 42,
      messages: [
        { role: "system", content: "Você é um sistema de pontuação de RH. Seja estritamente objetivo e determinístico. Avalie APENAS o que está escrito no currículo, sem inferir ou supor habilidades não mencionadas. Siga o método de pontuação fornecido sem desvios." },
        {
          role: "user", content: [
            { type: "text", text: prompt },
            { type: "file", file: { file_id: file.id } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiText = completion.choices[0].message.content || '';

    // Cleanup temporary file from OpenAI
    try {
      await openai.files.delete(file.id);
    } catch (e) {
      console.warn('Could not delete OpenAI file:', file.id);
    }

    let matchScore = 0;
    let matchReason = "Análise concluída, porém sem justificativa estruturada.";

    if (aiText) {
      try {
        const parsed = JSON.parse(aiText);
        matchScore = typeof parsed.score === 'number' ? parsed.score : parseInt(parsed.score, 10) || 0;
        matchReason = parsed.reason || matchReason;
      } catch (err) {
        console.error('Failed to parse match JSON:', err);
        console.log('AI Raw text:', aiText);
      }
    }

    const updateStmt = db.prepare('UPDATE candidates SET match_score = ?, match_reason = ? WHERE id = ?');
    updateStmt.run(matchScore, matchReason, id);

    res.json({ success: true, match_score: matchScore, match_reason: matchReason });
  } catch (err) {
    console.error('Error calculating match:', err);
    res.status(500).json({ error: 'Erro técnico no motor de IA.' });
  }
});

// Job Openings
app.get('/api/job-openings', (req, res) => {
  const stmt = db.prepare('SELECT * FROM job_openings ORDER BY created_at DESC');
  const jobs = stmt.all();
  res.json(jobs);
});

app.post('/api/job-openings', (req, res) => {
  try {
    const { title, open_positions, department, skills, salary } = req.body;
    const stmt = db.prepare('INSERT INTO job_openings (title, open_positions, department, skills, salary) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(title, open_positions, department, skills, salary);
    res.json({ id: info.lastInsertRowid });
  } catch (error) {
    console.error('Error creating job opening:', error);
    res.status(500).json({ error: 'Failed to create job opening' });
  }
});

app.put('/api/job-openings/:id', (req, res) => {
  try {
    const { title, open_positions, department, skills, salary } = req.body;
    const { id } = req.params;
    const stmt = db.prepare('UPDATE job_openings SET title = ?, open_positions = ?, department = ?, skills = ?, salary = ? WHERE id = ?');
    stmt.run(title, open_positions, department, skills, salary, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating job opening:', error);
    res.status(500).json({ error: 'Failed to update job opening' });
  }
});

app.delete('/api/job-openings/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM job_openings WHERE id = ?');
  stmt.run(id);
  res.json({ success: true });
});

// Empregare Proxy
app.get('/api/empregare/proxy', async (req, res) => {
  const EMPREGARE_TOKEN = process.env.VITE_EMPREGARE_TOKEN;
  const EMPREGARE_EMPRESA_ID = process.env.VITE_EMPREGARE_EMPRESA_ID;

  if (!EMPREGARE_TOKEN || !EMPREGARE_EMPRESA_ID) {
    return res.status(500).json({ error: 'Credenciais da Empregare ausentes no servidor.' });
  }

  try {
    const { endpoint = 'Pessoas', pagina = '1', itensPorPagina = '10', idVaga, quantidade } = req.query;

    // 1. Obter Token de Sessão (Empregare requer isso para a maioria dos endpoints)
    const authRes = await fetch('https://corporate.empregare.com/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Token: EMPREGARE_TOKEN, EmpresaID: EMPREGARE_EMPRESA_ID })
    });

    const authData = await authRes.json();
    if (!authData.sucesso) {
      throw new Error(`Autenticação Empregare falhou: ${authData.mensagem}`);
    }
    const token = authData.token;

    // 2. Construir URL alvo
    const params = new URLSearchParams();
    if (endpoint === 'Pessoas') {
      params.set('idEmpresa', EMPREGARE_EMPRESA_ID);
      params.set('pagina', pagina as string);
      params.set('itensPorPagina', itensPorPagina as string);
      if (idVaga) params.set('idVaga', idVaga as string);
    } else {
      // Repassar outros parâmetros para endpoints genéricos (ex: vaga/listar)
      Object.keys(req.query).forEach(key => {
        if (key !== 'endpoint') params.set(key, req.query[key] as string);
      });
    }

    const apiUrl = `https://corporate.empregare.com/api/${endpoint}?${params}`;
    console.log(`[Proxy] Chamando: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return res.status(response.status).json(data);
      } catch {
        // Fallback apenas para Pessoas se falhar
        if (endpoint === 'Pessoas') {
          const mockDataPath = path.join(process.cwd(), 'candidato_fake_empregare.json');
          if (fs.existsSync(mockDataPath)) {
            const mockJson = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
            return res.status(200).json({ pessoas: mockJson.pessoas });
          }
        }
        return res.status(500).json({ error: `A API Empregare (${endpoint}) retornou formato inválido.`, details: text.slice(0, 200) });
      }
    }

    const data = await response.json();

    // Filtro de nulls específico para lista de pessoas
    if (endpoint === 'Pessoas' && data.pessoas && Array.isArray(data.pessoas)) {
      data.pessoas = data.pessoas.filter((p: any) => p !== null && typeof p === 'object');
    }

    res.status(response.status).json(data);
  } catch (err: any) {
    console.error('[Proxy Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Companies
app.get('/api/companies', (req, res) => {
  const stmt = db.prepare('SELECT * FROM companies ORDER BY name ASC');
  const companies = stmt.all();
  res.json(companies);
});

app.post('/api/companies', (req, res) => {
  const { name, cnpj } = req.body;
  console.log('[API] Cadastrando empresa:', { name, cnpj });
  try {
    const stmt = db.prepare('INSERT INTO companies (name, cnpj) VALUES (?, ?)');
    const info = stmt.run(name, cnpj);
    console.log('[API] Empresa cadastrada com ID:', info.lastInsertRowid);
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    console.error('[API] Erro ao cadastrar empresa:', err);
    res.status(400).json({ error: 'Erro ao cadastrar empresa. Detalhes: ' + (err as Error).message });
  }
});

app.delete('/api/companies/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM companies WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir empresa.' });
  }
});

// Users Profile / Management overrides
app.post('/api/users/:id/force-reset', async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!supabaseServiceKey || supabaseServiceKey === 'dummy_key') {
    return res.status(500).json({ error: 'Falta a variável SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_SERVICE_ROLE_KEY no .env do servidor.' });
  }

  try {
    // 1. Update Password in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: newPassword
    });

    if (authError) throw authError;

    // 2. Set 'must_change_password' to true in profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', id);

    if (profileError) throw profileError;

    res.json({ success: true });
  } catch (err: any) {
    console.error('[API] Erro ao resetar a senha:', err);
    res.status(500).json({ error: err.message || 'Erro ao forçar o reset de senha' });
  }
});

app.delete('/api/users/:id/auth', async (req, res) => {
  const { id } = req.params;
  if (!supabaseServiceKey || supabaseServiceKey === 'dummy_key') {
    return res.status(500).json({ error: 'Falta a chave SUPABASE_SERVICE_ROLE_KEY no backend para deletar usuários do Auth.' });
  }

  try {
    // Apaga do auth.users (isso também pode apagar em cascata da tabela profiles dependendo da sua configuração do banco, mas podemos apagar do profile antes por garantia)
    const { error: deleteProfileError } = await supabaseAdmin.from('profiles').delete().eq('id', id);
    // Mesmo se der erro no profile (ex: não existir), tentamos deletar do auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) throw authError;

    res.json({ success: true });
  } catch (err: any) {
    console.error('[API] Erro ao deletar o usuário do Auth:', err);
    res.status(500).json({ error: err.message || 'Erro ao deletar o usuário do sistema' });
  }
});

// Receipt Configurations
app.get('/api/receipt-configurations/:receiptId', (req, res) => {
  const { receiptId } = req.params;
  const stmt = db.prepare(`
    SELECT rc.*, c.name as company_name 
    FROM receipt_configurations rc 
    LEFT JOIN companies c ON rc.company_id = c.id 
    WHERE rc.receipt_id = ?
  `);
  const config = stmt.get(receiptId);
  res.json(config || null);
});

app.get('/api/receipt-configurations', (req, res) => {
  const stmt = db.prepare('SELECT * FROM receipt_configurations');
  const configs = stmt.all();
  res.json(configs);
});

app.post('/api/receipt-templates/upload', templateUpload.single('file'), async (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileKey = `template-${uniqueSuffix}${path.extname(req.file.originalname)}`;
    const s3Url = await uploadFile(req.file.buffer, fileKey, req.file.mimetype);
    res.json({ url: s3Url, fileName: req.file.originalname });
  } catch (err) {
    console.error('Error uploading receipt template to S3:', err);
    res.status(500).json({ error: 'Erro ao fazer upload do modelo.' });
  }
});

app.post('/api/receipt-configurations', (req, res) => {
  const {
    receipt_id,
    company_id,
    supplier_name,
    supplier_document,
    payment_reason,
    value,
    date,
    has_template,
    template_url,
    requires_approval,
    approver_id,
    is_approved,
    pix_key,
    items,
    requester,
    custom_id
  } = req.body;

  try {
    const items_json = items ? JSON.stringify(items) : null;
    const stmt = db.prepare(`
      INSERT INTO receipt_configurations
      (receipt_id, company_id, supplier_name, supplier_document, payment_reason, value, date, has_template, template_url, requires_approval, approver_id, is_approved, pix_key, items_json, requester, custom_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(receipt_id) DO UPDATE SET
        company_id = excluded.company_id,
        supplier_name = excluded.supplier_name,
        supplier_document = excluded.supplier_document,
        payment_reason = excluded.payment_reason,
        value = excluded.value,
        date = excluded.date,
        has_template = excluded.has_template,
        template_url = excluded.template_url,
        requires_approval = excluded.requires_approval,
        approver_id = excluded.approver_id,
        is_approved = excluded.is_approved,
        pix_key = excluded.pix_key,
        items_json = excluded.items_json,
        requester = excluded.requester,
        custom_id = excluded.custom_id
    `);
    stmt.run(
      receipt_id, company_id || null, supplier_name || null, supplier_document || null,
      payment_reason || null, value || null, date || null,
      has_template ? 1 : 0, template_url || null,
      requires_approval ? 1 : 0, approver_id || null, is_approved ? 1 : 0,
      pix_key || null, items_json, requester || null, custom_id || null
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving receipt config:', err);
    res.status(500).json({ error: 'Erro ao salvar configurações do recibo.' });
  }
});

app.post('/api/receipts/emit', (req, res) => {
  const { receipt_id, value, supplier_name, date, company_id, items, pix_key, requester, custom_id } = req.body;

  try {
    const config = db.prepare('SELECT history_json, requires_approval, is_approved FROM receipt_configurations WHERE receipt_id = ?').get(receipt_id) as any;
    let history = [];
    if (config && config.history_json) {
      try {
        history = JSON.parse(config.history_json);
      } catch (e) {
        history = [];
      }
    }

    const newEntry = {
      id: Date.now().toString(),
      requires_approval: !!config?.requires_approval,
      is_approved: !!config?.is_approved,
      value,
      supplier_name,
      date: date || new Date().toISOString(),
      company_id,
      emitted_at: new Date().toISOString(),
      items,
      pix_key,
      requester,
      custom_id
    };

    history.unshift(newEntry);
    // Keep only last 50 entries
    if (history.length > 50) history = history.slice(0, 50);

    const stmt = db.prepare('UPDATE receipt_configurations SET history_json = ? WHERE receipt_id = ?');
    stmt.run(JSON.stringify(history), receipt_id);

    res.json({ success: true, entry: newEntry });
  } catch (err) {
    console.error('Error emitting receipt:', err);
    res.status(500).json({ error: 'Erro ao registrar emissão do recibo.' });
  }
});
app.delete('/api/receipts/history/:receiptId/:entryId', (req, res) => {
  const { receiptId, entryId } = req.params;
  try {
    const config = db.prepare('SELECT history_json FROM receipt_configurations WHERE receipt_id = ?').get(receiptId) as any;
    if (config && config.history_json) {
      let history = [];
      try {
        history = JSON.parse(config.history_json);
      } catch (e) {
        history = [];
      }

      if (Array.isArray(history)) {
        const initialLength = history.length;
        history = history.filter((e: any) => e.id !== entryId);

        if (history.length !== initialLength) {
          const stmt = db.prepare('UPDATE receipt_configurations SET history_json = ? WHERE receipt_id = ?');
          stmt.run(JSON.stringify(history), receiptId);
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting receipt history entry:', err);
    res.status(500).json({ error: 'Erro ao excluir registro histórico.' });
  }
});


app.post('/api/receipt-configurations/approve', (req, res) => {
  const { receipt_id } = req.body;
  try {
    const stmt = db.prepare('UPDATE receipt_configurations SET is_approved = 1 WHERE receipt_id = ?');
    stmt.run(receipt_id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error approving receipt:', err);
    res.status(500).json({ error: 'Erro ao aprovar recibo.' });
  }
});

// User Management & Auth (login_apoio)
app.get('/api/users', (req, res) => {
  const stmt = db.prepare('SELECT id, name, email, role, allowed, area, allowed_menus, requiresPasswordChange, approver, created_at FROM users ORDER BY created_at DESC');
  const users = stmt.all().map((u: any) => ({
    ...u,
    allowed: !!u.allowed,
    requiresPasswordChange: !!u.requiresPasswordChange,
    approver: !!u.approver
  }));
  res.json(users);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { allowed, role, area, allowed_menus, requiresPasswordChange, approver, password } = req.body;

  if (allowed !== undefined) {
    const stmt = db.prepare('UPDATE users SET allowed = ? WHERE id = ?');
    stmt.run(allowed ? 1 : 0, id);
  }

  if (role !== undefined) {
    const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    stmt.run(role, id);
  }

  if (area !== undefined) {
    const stmt = db.prepare('UPDATE users SET area = ? WHERE id = ?');
    stmt.run(area, id);
  }

  if (allowed_menus !== undefined) {
    const stmt = db.prepare('UPDATE users SET allowed_menus = ? WHERE id = ?');
    stmt.run(allowed_menus, id);
  }

  if (requiresPasswordChange !== undefined) {
    const stmt = db.prepare('UPDATE users SET requiresPasswordChange = ? WHERE id = ?');
    stmt.run(requiresPasswordChange ? 1 : 0, id);
  }

  if (password !== undefined) {
    const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
    stmt.run(password, id);
  }

  if (approver !== undefined) {
    const stmt = db.prepare('UPDATE users SET approver = ? WHERE id = ?');
    stmt.run(approver ? 1 : 0, id);
  }

  res.json({ success: true });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.run(id);
  res.json({ success: true });
});

// Basic Auth Endpoints for login_apoio
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, area, role, allowed, allowed_menus, approver } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO users (name, email, password, role, allowed, area, allowed_menus, approver) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(name, email.toLowerCase().trim(), password, role || 'Usuario', allowed ? 1 : 0, area, allowed_menus || null, approver ? 1 : 0);
    res.json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ error: 'E-mail já cadastrado ou erro interno.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email.toLowerCase().trim());

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  if (!user.allowed) {
    return res.status(403).json({ error: 'Acesso pendente de aprovação por um gestor.' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      allowed_menus: user.allowed_menus,
      requiresPasswordChange: !!user.requiresPasswordChange,
      approver: !!user.approver
    }
  });
});

app.post('/api/auth/change-password', (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const stmt = db.prepare('UPDATE users SET password = ?, requiresPasswordChange = 0 WHERE email = ?');
    stmt.run(newPassword, email.toLowerCase().trim());
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

// --- Admin User Management Routes (Supabase) ---
app.post('/api/admin/users/create', async (req, res) => {
  const { email, password, name, role, allowed, area, allowed_menus, approver } = req.body;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, allowed }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (data.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        email: email,
        name: name,
        role: role,
        allowed: allowed,
        area: area,
        allowed_menus: allowed_menus,
        approver: approver,
        must_change_password: true
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Admin create user error:', err);
    res.status(500).json({ error: 'Erro ao processar registro.' });
  }
});

app.post('/api/admin/users/reset-password', async (req, res) => {
  const { id, newPassword } = req.body;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: newPassword
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    await supabaseAdmin.from('profiles').update({
      must_change_password: true
    }).eq('id', id);

    res.json({ success: true });
  } catch (err: any) {
    console.error('Admin reset password error:', err);
    res.status(500).json({ error: 'Erro ao processar alteração de senha.' });
  }
});

// --- Legacy Auth Routes (SQLite) ---

app.post('/api/auth/change-password', (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const stmt = db.prepare('UPDATE users SET password = ?, requiresPasswordChange = 0 WHERE email = ?');
    stmt.run(newPassword, email);
    res.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

// --- User Management Routes ---

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, allowed, area, approver, requiresPasswordChange, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, allowed, area, approver, allowed_menus } = req.body;
  try {
    const stmt = db.prepare('UPDATE users SET name = ?, role = ?, allowed = ?, area = ?, approver = ?, allowed_menus = ? WHERE id = ?');
    stmt.run(name, role, allowed, area, approver ? 1 : 0, allowed_menus || null, id);
    const updated = db.prepare('SELECT id, name, email, role, allowed, area, approver, requiresPasswordChange, created_at FROM users WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

// Seed Initial Admin
const checkAdmin = db.prepare('SELECT count(*) as count FROM users');
const { count } = checkAdmin.get() as any;
if (count === 0) {
  const seed = db.prepare('INSERT INTO users (name, email, password, role, allowed, area) VALUES (?, ?, ?, ?, ?, ?)');
  seed.run('Administrador Apoio', 'admin@apoio.com', 'admin123', 'Gestor', 1, 'TI');
}

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    // app.use(express.static('dist'));
    // app.get('*', (req, res) => res.sendFile(path.resolve('dist/index.html')));
    // For this environment, we rely on the dev setup mostly, but good to have structure
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
