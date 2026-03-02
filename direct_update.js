import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'hr_system.db'));

const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
const info = stmt.run('123', 2);
console.log(info);

const user = db.prepare('SELECT email, password FROM users WHERE id = 2').get();
console.log(user);
