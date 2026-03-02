import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'hr_system.db'));

const users = db.prepare('SELECT id, email, password, allowed FROM users').all();
console.log(JSON.stringify(users, null, 2));
