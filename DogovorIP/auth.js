const db = require('./database');
const nodemailer = require('nodemailer');

// Настройки почтового сервера (пример для Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_password'
  }
});

// Генерация случайного кода
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Регистрация нового пользователя
async function register(email, password) {
  return new Promise((resolve, reject) => {
    const verificationCode = generateVerificationCode();

    db.run(
      'INSERT INTO users (email, password, verification_code) VALUES (?, ?, ?)',
      [email, password, verificationCode],
      function(err) {
        if (err) return reject(err);

        // Отправка письма с кодом подтверждения
        const mailOptions = {
          from: 'your_email@gmail.com',
          to: email,
          subject: 'Подтверждение регистрации',
          text: `Ваш код подтверждения: ${verificationCode}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) return reject(error);
          resolve({ userId: this.lastID });
        });
      }
    );
  });
}

// Подтверждение email
function verifyEmail(email, code) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM users WHERE email = ? AND verification_code = ?',
      [email, code],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return reject(new Error('Неверный код подтверждения'));

        db.run(
          'UPDATE users SET verified = 1, verification_code = NULL WHERE id = ?',
          [row.id],
          (err) => {
            if (err) return reject(err);
            resolve(true);
          }
        );
      }
    );
  });
}

// Авторизация пользователя
function login(email, password) {
  return new Promise((resolve, reject) => {
    // Проверка админских учетных данных
    if (email === 'admin@dogovorip.ru' && password === 'D0000GOVOr!P(-_-)') {
      resolve({
        id: 1,
        email: email,
        isAdmin: true,
        subscription: 'admin'
      });
      return;
    }

    // Проверка обычных пользователей
    db.get(
      'SELECT id, email, verified, subscription_type FROM users WHERE email = ? AND password = ?',
      [email, password],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return reject(new Error('Неверный email или пароль'));
        if (!row.verified) return reject(new Error('Email не подтвержден'));

        resolve({
          id: row.id,
          email: row.email,
          isAdmin: false,
          subscription: row.subscription_type
        });
      }
    );
  });
}

// Получение списка пользователей
function getUsers() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, email, verified, subscription_type, subscription_expiry FROM users',
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
}

// Обновление подписки пользователя
function updateUserSubscription(userId, subscriptionType, expiryDate) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET subscription_type = ?, subscription_expiry = ? WHERE id = ?',
      [subscriptionType, expiryDate, userId],
      (err) => {
        if (err) return reject(err);
        resolve(true);
      }
    );
  });
}

module.exports = {
  register,
  verifyEmail,
  login,
  getUsers,
  updateUserSubscription
};