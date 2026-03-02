import Database from 'better-sqlite3';
const db = new Database('dp.sqlite');
const info = db.prepare("PRAGMA table_info(receipt_configurations)").all();
console.log(JSON.stringify(info, null, 2));
db.close();
