import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ArticleList from './components/ArticleList.jsx';
import ArticleDetail from './components/ArticleDetail.jsx';

export default function App() {
  return (
    <div style={{ margin: '0 auto', maxWidth: '700px', padding: '1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Auto Generated Blog</h1>
        <nav>
          <Link to="/">Home</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<ArticleList />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
      </Routes>
    </div>
  );
}