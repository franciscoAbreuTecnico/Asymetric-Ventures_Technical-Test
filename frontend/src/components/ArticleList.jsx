import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/articles')
      .then((res) => {
        setArticles(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load articles');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading articles…</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>Articles</h2>
      {articles.length === 0 ? (
        <p>No articles yet. Please check back later.</p>
      ) : (
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {articles.map((article) => (
            <li key={article.id} style={{ marginBottom: '0.5rem' }}>
              <Link to={`/articles/${article.id}`}>
                {article.title}
              </Link>
              <span style={{ marginLeft: '0.5rem', color: '#777' }}>
                ({new Date(article.created_at).toLocaleDateString()})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}