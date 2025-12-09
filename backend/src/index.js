const express = require('express');
const cors = require('cors');
const path = require('path');
const articlesRouter = require('./routes/articles');
const { initDb } = require('./models/articleModel');
const { initArticleJob } = require('./services/articleJob');

// Load environment variables from .env if present
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Initialise the database and article scheduler
initDb();
initArticleJob();

// API routes
app.use('/articles', articlesRouter);

// Root endpoint for basic health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Auto blog backend is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});