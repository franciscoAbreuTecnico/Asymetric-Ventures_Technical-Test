import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client.js';

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/articles/${id}`)
      .then((res) => {
        setArticle(res.data);
      })
      .catch(() => {
        setError('Article not found');
      });
  }, [id]);

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <Link to="/">Back to list</Link>
      </div>
    );
  }

  if (!article) {
    return <p>Loading…</p>;
  }

  return (
    <div>
      <h2>{article.title}</h2>
      <p style={{ color: '#777' }}>
        Published {new Date(article.created_at).toLocaleString()}
      </p>
      <div style={{ whiteSpace: 'pre-line', marginTop: '1rem' }}>{article.content}</div>
      <p style={{ marginTop: '2rem' }}>
        <Link to="/">← Back to all articles</Link>
      </p>
    </div>
  );
}