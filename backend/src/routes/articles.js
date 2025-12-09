const express = require('express');
const rateLimit = require('express-rate-limit');
const articleModel = require('../models/articleModel');
const { generateArticle } = require('../services/aiClient');

const router = express.Router();

// Rate limiter for AI generation endpoint - max 5 requests per hour per IP
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 requests per hour
  message: { error: 'Too many article generation requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// API key middleware for generation endpoint (optional but recommended)
const apiKeyAuth = (req, res, next) => {
  const apiKey = process.env.API_KEY;
  
  // If API_KEY is not set in environment, skip authentication (backward compatible)
  if (!apiKey) {
    return next();
  }
  
  const providedKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (providedKey !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  
  next();
};

// GET /articles - list all articles (public, read-only)
router.get('/', (req, res) => {
  const articles = articleModel.getAllArticles();
  res.json(articles);
});

// GET /articles/:id - fetch a single article by ID (public, read-only)
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid article id' });
  }
  const article = articleModel.getArticleById(id);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json(article);
});

// POST /articles/generate - manually generate a new article
// Protected by: rate limiting (5/hour) + optional API key
router.post('/generate', generateLimiter, apiKeyAuth, async (req, res) => {
  try {
    const article = await generateArticle();
    articleModel.createArticle(article);
    res.json({ success: true, article });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;