const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Determine the database file path.  When running inside Docker this will
// reside in the container's filesystem.  In development you can delete
// data.db to reset the state.
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/data/data.db' 
  : path.resolve(__dirname, '..', '..', 'data.db');

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

/**
 * Initialise the articles table if it does not exist.
 */
function initDb() {
  const stmt = `CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`;
  db.exec(stmt);
}

/**
 * Return the total number of articles stored.
 * @returns {number}
 */
function countArticles() {
  const row = db.prepare('SELECT COUNT(*) as count FROM articles').get();
  return row.count;
}

/**
 * Insert a new article into the database.
 * @param {{title: string, content: string}} article
 */
function createArticle(article) {
  const stmt = db.prepare('INSERT INTO articles (title, content, created_at) VALUES (?, ?, ?)');
  stmt.run(article.title, article.content, new Date().toISOString());
}

/**
 * Retrieve all articles sorted by creation date descending.
 * @returns {Array<{id:number, title:string, content:string, created_at:string}>}
 */
function getAllArticles() {
  const stmt = db.prepare('SELECT id, title, content, created_at FROM articles ORDER BY datetime(created_at) DESC');
  return stmt.all();
}

/**
 * Retrieve a single article by its ID.
 * @param {number} id
 * @returns {Object|null}
 */
function getArticleById(id) {
  const stmt = db.prepare('SELECT id, title, content, created_at FROM articles WHERE id = ?');
  return stmt.get(id);
}

module.exports = {
  initDb,
  countArticles,
  createArticle,
  getAllArticles,
  getArticleById,
};