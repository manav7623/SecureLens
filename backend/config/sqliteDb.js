const sqlite3 = require('sqlite3').verbose();

// Initialize in-memory database
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('❌ Error opening SQLite in-memory database:', err);
  } else {
    console.log('✅ SQLite in-memory database connected.');
  }
});

// Setup tables and mock data
function seedSqlite() {
  db.serialize(() => {
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT
      )
    `);

    // Create secrets table
    db.run(`
      CREATE TABLE IF NOT EXISTS system_secrets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        secret_key TEXT NOT NULL,
        description TEXT NOT NULL
      )
    `);

    // Create cards table
    db.run(`
      CREATE TABLE IF NOT EXISTS payment_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_name TEXT NOT NULL,
        card_number TEXT NOT NULL,
        expiry TEXT NOT NULL,
        cvv TEXT NOT NULL
      )
    `);

    // Seed mock users
    const userStmt = db.prepare("INSERT INTO users (username, password, role, email) VALUES (?, ?, ?, ?)");
    userStmt.run("admin", "AdminSecureLens2026!", "admin", "admin@securelens.local");
    userStmt.run("manav", "manavPassword789!", "user", "manav@securelens.local");
    userStmt.run("alice", "aliceSuperPass!", "user", "alice@securelens.local");
    userStmt.finalize();

    // Seed secrets
    const secretStmt = db.prepare("INSERT INTO system_secrets (secret_key, description) VALUES (?, ?)");
    secretStmt.run("FLAG{sql_injection_mastered_2026}", "Root application decryption key");
    secretStmt.run("SUPER_SECRET_TOKEN_XYZ_999", "JWT Backup Token secret");
    secretStmt.finalize();

    // Seed mock payment details
    const cardStmt = db.prepare("INSERT INTO payment_cards (owner_name, card_number, expiry, cvv) VALUES (?, ?, ?, ?)");
    cardStmt.run("Admin User", "4111-2222-3333-4444", "12/29", "123");
    cardStmt.run("Manav Patel", "5555-6666-7777-8888", "08/28", "987");
    cardStmt.finalize();

    console.log('✅ SQLite in-memory database seeded with mock challenge data.');
  });
}

// Promisified execution methods for route handlers
const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const queryGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

seedSqlite();

module.exports = {
  db,
  queryAll,
  queryGet
};
