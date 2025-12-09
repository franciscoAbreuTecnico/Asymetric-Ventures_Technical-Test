const axios = require('axios');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

// Lazy load transformers to avoid loading if not needed
let pipeline = null;
let generator = null;

/**
 * Generate an article using local model, Ollama, OpenRouter, Hugging Face API, or faker fallback.
 *
 * Supports five modes:
 * 1. Local (in-container): Set AI_PROVIDER=local
 * 2. Ollama (host machine): Set AI_PROVIDER=ollama, AI_API_URL=http://host.docker.internal:11434
 * 3. OpenRouter (cloud): Set AI_PROVIDER=openrouter, AI_API_KEY=your_key
 * 4. Hugging Face: Set AI_PROVIDER=huggingface, AI_API_KEY=your_hf_token
 * 5. Fallback: Uses faker to generate random content
 *
 * @returns {Promise<{title: string, content: string}>}
 */
async function generateArticle() {
  const provider = process.env.AI_PROVIDER || 'faker';
  const apiUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;

  console.log(`[AI] Provider: ${provider}`);

  // Try Local Model (runs inside container)
  if (provider === 'local') {
    console.log('[AI] Attempting local model (Xenova Transformers)');
    try {
      if (!pipeline) {
        const { pipeline: pipelineLoader } = await import('@xenova/transformers');
        pipeline = pipelineLoader;
      }
      
      if (!generator) {
        console.log('[AI] Loading text generation model (first time may take a minute)...');
        generator = await pipeline('text-generation', 'Xenova/distilgpt2');
      }
      
      // DistilGPT2 is a completion model, not an instruction model
      // Give it a strong starting point to continue from
      const titlePrompt = 'Blog Post Title: The Future of';
      const titleResult = await generator(titlePrompt, { 
        max_new_tokens: 20,
        temperature: 0.8,
        do_sample: true,
        top_k: 50,
        num_return_sequences: 1
      });
      
      if (titleResult && titleResult[0] && titleResult[0].generated_text) {
        const fullTitleText = titleResult[0].generated_text.replace(titlePrompt, '').trim();
        const title = ('The Future of ' + fullTitleText).split('\n')[0].substring(0, 100);
        
        // Now generate content based on the title
        const contentPrompt = `${title}\n\nIn today's rapidly evolving world,`;
        const contentResult = await generator(contentPrompt, {
          max_new_tokens: 200,
          temperature: 0.8,
          do_sample: true,
          top_k: 50,
          num_return_sequences: 1
        });
        
        if (contentResult && contentResult[0]) {
          const content = contentResult[0].generated_text.replace(contentPrompt, '').trim() || 
                         'Technology continues to shape our lives in unprecedented ways.';
          console.log(`[AI] Local model success: ${title.substring(0, 50)}...`);
          return { title, content };
        }
      }
    } catch (err) {
      console.warn('[AI] Local model failed, falling back to faker:', err.message);
    }
  }

  console.log(`[AI] Provider: ${provider}`);

  // Try Ollama (local AI)
  if (provider === 'ollama' && apiUrl) {
    console.log(`[AI] Attempting Ollama at ${apiUrl}`);
    try {
      const prompt = 'Write a concise blog post about recent technology innovations. Format: Title on first line, then content.';
      const res = await axios.post(
        `${apiUrl}/api/generate`,
        {
          model: process.env.OLLAMA_MODEL || 'llama3.2',
          prompt: prompt,
          stream: false,
        },
        { timeout: 30000 }
      );
      
      if (res.data && res.data.response) {
        const lines = res.data.response.trim().split('\n');
        const title = lines[0].replace(/^#+\s*/, '').trim();
        const content = lines.slice(1).join('\n').trim();
        return { title, content };
      }
    } catch (err) {
      console.warn('Ollama API call failed, falling back to faker:', err.message);
    }
  }

  // Try OpenRouter API
  if (provider === 'openrouter' && apiKey) {
    const model = process.env.OPENROUTER_MODEL || 'google/gemma-2-9b-it:free';
    console.log(`[AI] Attempting OpenRouter with model: ${model}`);
    try {
      const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Write a short blog post about recent technology innovations. Format: First line is the title, then 2-3 paragraphs of content.'
            }
          ],
          max_tokens: 400,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'Auto Blog Generator'
          },
          timeout: 30000
        }
      );

      if (res.data?.choices?.[0]?.message?.content) {
        const generatedText = res.data.choices[0].message.content.trim();
        const lines = generatedText.split('\n').filter(l => l.trim());
        const title = lines[0].replace(/^#+\s*/, '').replace(/^["']|["']$/g, '').trim().substring(0, 150);
        const content = lines.slice(1).join('\n').trim() || faker.lorem.paragraphs(2);
        console.log(`[AI] OpenRouter success: ${title.substring(0, 50)}...`);
        return { title, content };
      }
    } catch (err) {
      console.warn('[AI] OpenRouter API call failed, falling back to faker. Status:', err.response?.status, 'Message:', err.message);
      if (err.response?.data) {
        console.warn('[AI] Response data:', JSON.stringify(err.response.data).substring(0, 300));
      }
    }
  }

  // Try Hugging Face Inference API
  if (provider === 'huggingface' && apiKey) {
    console.log(`[AI] Attempting Hugging Face with model: ${process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2'}`);
    try {
      const model = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
      const prompt = 'Write a concise blog post about technology innovations. Include a title and 2-3 paragraphs.';
      
      // Use the new Hugging Face Serverless Inference API endpoint
      const res = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        { 
          inputs: prompt,
          parameters: { 
            max_new_tokens: 250,
            temperature: 0.8,
            return_full_text: false
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 60000,
        }
      );
      
      console.log(`[AI] HF Response:`, JSON.stringify(res.data).substring(0, 200));
      
      // Handle different response formats
      let generatedText = '';
      if (Array.isArray(res.data) && res.data[0]?.generated_text) {
        generatedText = res.data[0].generated_text;
      } else if (res.data?.generated_text) {
        generatedText = res.data.generated_text;
      } else if (typeof res.data === 'string') {
        generatedText = res.data;
      }
      
      if (generatedText) {
        const text = generatedText.replace(prompt, '').trim();
        const lines = text.split('\n').filter(l => l.trim());
        const title = (lines[0] || faker.company.catchPhrase()).replace(/^#+\s*/, '').trim().substring(0, 100);
        const content = lines.slice(1).join('\n').trim() || faker.lorem.paragraphs(2);
        console.log(`[AI] Hugging Face success: ${title.substring(0, 50)}...`);
        return { title, content };
      }
    } catch (err) {
      console.warn('[AI] Hugging Face API call failed, falling back to faker. Status:', err.response?.status, 'Message:', err.message);
      if (err.response?.data) {
        console.warn('[AI] Response data:', JSON.stringify(err.response.data).substring(0, 200));
      }
    }
  }

  // Fallback: generate pseudo‑random content using faker
  console.log('[AI] Using faker fallback');
  const title = faker.company.catchPhrase();
  const content = faker.lorem.paragraphs(3, '\n\n');
  return { title, content };
}

module.exports = { generateArticle };