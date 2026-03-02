import Database from 'better-sqlite3';
const db = new Database('hr_system.db');
const rows = db.prepare("SELECT * FROM receipt_configurations").all();
console.log(JSON.stringify(rows[0] || "No rows", null, 2));
db.close();
