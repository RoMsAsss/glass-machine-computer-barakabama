const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const auth = require('./auth');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// API для пользователей
app.get('/api/users', async (req, res) => {
  try {
    const users = await auth.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/update-subscription', async (req, res) => {
  try {
    const { userId, subscriptionType, expiryDate } = req.body;
    await auth.updateUserSubscription(userId, subscriptionType, expiryDate);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для блога
app.get('/api/blog', async (req, res) => {
  try {
    const posts = await db.getBlogPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/blog', async (req, res) => {
  try {
    const { title, content, image, publishDate } = req.body;
    const postId = await db.addBlogPost(title, content, image, publishDate);
    res.json({ id: postId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для колеса фортуны
app.get('/api/wheel', async (req, res) => {
  try {
    const settings = await db.getWheelSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wheel', async (req, res) => {
  try {
    const { sections } = req.body;
    await db.saveWheelSettings(sections);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для отзывов
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await db.getReviews();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { author, rating, text } = req.body;
    const reviewId = await db.addReview(author, rating, text);
    res.json({ id: reviewId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const { uploadTemplate, getTemplates } = require('./templates');

const app = express();

// Middleware
app.use(express.json());
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

// Маршруты для шаблонов
app.post('/api/templates/upload', uploadTemplate);
app.get('/api/templates', getTemplates);
app.get('/api/templates/:id', async (req, res) => {
  try {
    // В реальном проекте получаем из БД
    const template = [...templatesDB.free, ...templatesDB.premium].find(t => t.id === req.params.id);

    if (!template) {
      return res.status(404).json({ error: 'Шаблон не найден' });
    }

    return res.json(template);
  } catch (error) {
    console.error('Error getting template:', error);
    return res.status(500).json({ error: 'Ошибка получения шаблона' });
  }
});

// Маршрут для скачивания файлов
app.get('/templates/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'templates', req.params.filename);

  if (req.query.download) {
    res.download(filePath);
  } else {
    res.sendFile(filePath);
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});