import Database from 'better-sqlite3';
const db = new Database('hr_system.db');

const columns = [
    'ALTER TABLE receipt_configurations ADD COLUMN pix_key TEXT',
    'ALTER TABLE receipt_configurations ADD COLUMN requester TEXT',
    'ALTER TABLE receipt_configurations ADD COLUMN items_json TEXT',
    'ALTER TABLE receipt_configurations ADD COLUMN custom_id TEXT',
    'ALTER TABLE receipt_configurations ADD COLUMN template_url TEXT',
    'ALTER TABLE receipt_configurations ADD COLUMN is_approved BOOLEAN DEFAULT 0',
    'ALTER TABLE receipt_configurations ADD COLUMN history_json TEXT'
];

for (const col of columns) {
    try {
        db.exec(col);
        console.log(`Success: ${col}`);
    } catch (e) {
        console.log(`Error: ${col} - ${e.message}`);
    }
}

db.close();
