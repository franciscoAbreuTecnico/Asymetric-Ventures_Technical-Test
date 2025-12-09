# Backend

Express API for the auto-generated blog. Provides REST endpoints for article management, automatic AI-powered article generation, and SQLite persistence.

## Setup

Development mode (requires Node 18+):

```bash
cd backend
npm install
npm run dev
```

API runs at http://localhost:3001

Docker mode:

```bash
docker build -t auto-blog-backend .
docker run -p 3001:3001 -e AI_PROVIDER=local auto-blog-backend
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /articles | List all articles |
| GET | /articles/:id | Get single article |
| POST | /articles/generate | Generate new article (rate limited) |

Article schema:

```json
{
  "id": 1,
  "title": "Article title",
  "content": "Article content...",
  "created_at": "2025-12-09T17:00:00.000Z"
}
```

## Article Generation

The system ensures at least 3 articles exist on startup. A cron job creates one new article daily at 8 AM.

AI provider is configurable via `AI_PROVIDER` environment variable:

- `local`: distilgpt2 model via @xenova/transformers (default for production)
- `faker`: Random text via @faker-js/faker (fallback)
- `openrouter`: OpenRouter API (requires API_KEY)
- `huggingface`: Hugging Face Inference API (requires API_KEY)
- `ollama`: Local Ollama instance

## Environment Variables

- `PORT`: Server port (default: 3001)
- `AI_PROVIDER`: AI provider selection (default: faker)
- `API_KEY`: Optional API key for generation endpoint protection
- `OPENROUTER_API_KEY`: OpenRouter API key (if using openrouter provider)
- `HUGGINGFACE_API_KEY`: Hugging Face API key (if using huggingface provider)

## Database

SQLite database stored at /data/data.db inside container. Mount a volume for persistence:

```bash
docker run -v /path/to/data:/data auto-blog-backend
```

## Rate Limiting

POST /articles/generate is rate limited to 5 requests per hour per IP address to prevent abuse.

## File Structure

```
backend/
├── src/
│   ├── index.js              Main server
│   ├── routes/
│   │   └── articles.js       API endpoints
│   ├── models/
│   │   └── articleModel.js   Database operations
│   └── services/
│       ├── aiClient.js       AI text generation
│       └── articleJob.js     Daily cron job
├── Dockerfile
└── package.json
```
