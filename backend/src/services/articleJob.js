const cron = require('node-cron');
const { generateArticle } = require('./aiClient');
const articleModel = require('../models/articleModel');

/**
 * Initialise the article creation job.
 *
 * On startup this function ensures at least three articles exist.  If fewer
 * articles are present it generates the difference.  It then schedules a
 * cron job to run once per day (at midnight) to create a new article.  You
 * can change the schedule by editing the cron expression below.
 */
function initArticleJob() {
  // Generate initial articles if needed
  const existing = articleModel.countArticles();
  const needed = 3 - existing;
  if (needed > 0) {
    console.log(`Generating ${needed} initial articles...`);
    (async () => {
      for (let i = 0; i < needed; i++) {
        const article = await generateArticle();
        articleModel.createArticle(article);
      }
    })();
  }

  // Schedule daily job at midnight: '0 0 * * *'
  cron.schedule('0 0 * * *', async () => {
    console.log('Daily cron: generating a new article');
    const article = await generateArticle();
    articleModel.createArticle(article);
  });
}

module.exports = { initArticleJob };