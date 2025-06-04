const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'wheel_fortune.db');

// Инициализация БД
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Таблица пользователей
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      verification_code TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      subscription_type TEXT DEFAULT NULL,
      subscription_expiry DATE DEFAULT NULL
    )`);

    // Таблица победителей колеса
    db.run(`CREATE TABLE IF NOT EXISTS winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      prize TEXT NOT NULL,
      promo_code TEXT NOT NULL,
      claimed INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Таблица блога
    db.run(`CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Таблица отзывов
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      rating INTEGER NOT NULL,
      text TEXT NOT NULL,
      approved INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Таблица FAQ
    db.run(`CREATE TABLE IF NOT EXISTS faq (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Таблица настроек колеса фортуны
    db.run(`CREATE TABLE IF NOT EXISTS wheel_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sections TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Таблица статистики
    db.run(`CREATE TABLE IF NOT EXISTS site_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visits INTEGER DEFAULT 0,
      date DATE UNIQUE NOT NULL
    )`);

    // Создаем админа по умолчанию
    db.get("SELECT id FROM users WHERE email = 'admin@dogovorip.ru'", (err, row) => {
      if (!row) {
        db.run("INSERT INTO users (email, password, verified, subscription_type) VALUES (?, ?, 1, 'admin')",
          ['admin@dogovorip.ru', 'D0000GOVOr!P(-_-)']);
      }
    });
  });
}

module.exports = db;

// Блог
function getBlogPosts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM blog_posts ORDER BY publish_date DESC', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function addBlogPost(title, content, image, publishDate) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO blog_posts (title, content, image, publish_date) VALUES (?, ?, ?, ?)',
      [title, content, image, publishDate || new Date().toISOString()],
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

// Колесо фортуны
function getWheelSettings() {
  return new Promise((resolve, reject) => {
    db.get('SELECT sections FROM wheel_settings ORDER BY id DESC LIMIT 1', [], (err, row) => {
      if (err) return reject(err);
      resolve(row ? JSON.parse(row.sections) : null);
    });
  });
}

function saveWheelSettings(sections) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO wheel_settings (sections) VALUES (?)',
      [JSON.stringify(sections)],
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

// Отзывы
function getReviews() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM reviews ORDER BY created_at DESC', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function addReview(author, rating, text) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO reviews (author, rating, text) VALUES (?, ?, ?)',
      [author, rating, text],
      function(err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

// Экспортируем все функции
module.exports = {
  db,
  getBlogPosts,
  addBlogPost,
  getWheelSettings,
  saveWheelSettings,
  getReviews,
  addReview
};