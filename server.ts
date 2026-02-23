import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db';

const app = express();
const PORT = 3000;

app.use(express.json());

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

// Candidates
app.get('/api/candidates', (req, res) => {
  const stmt = db.prepare('SELECT * FROM candidates ORDER BY created_at DESC');
  const candidates = stmt.all();
  res.json(candidates);
});

app.post('/api/candidates', (req, res) => {
  const { name, position, email } = req.body;
  const stmt = db.prepare('INSERT INTO candidates (name, position, email) VALUES (?, ?, ?)');
  const info = stmt.run(name, position, email);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/candidates/:id/status', (req, res) => {
  const { status, interview_notes } = req.body;
  const { id } = req.params;

  if (interview_notes) {
    const stmt = db.prepare('UPDATE candidates SET status = ?, interview_notes = ? WHERE id = ?');
    stmt.run(status, interview_notes, id);
  } else {
    const stmt = db.prepare('UPDATE candidates SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }
  res.json({ success: true });
});


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
