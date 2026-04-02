import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts, deletePost, updatePost } from '../api';

const TABS = ['scheduled', 'draft', 'sent', 'failed'];

export default function Queue() {
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('scheduled');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPosts({ status: tab === 'draft' ? 'draft' : tab });
      setPosts(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tab]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return;
    await deletePost(id);
    load();
  };

  const handlePostNow = async (id) => {
    await updatePost(id, { scheduledAt: new Date().toISOString(), status: 'scheduled' });
    load();
  };

  const handleRetry = async (id) => {
    await updatePost(id, { status: 'scheduled', scheduledAt: new Date().toISOString() });
    load();
  };

  const formatTime = (iso) => {
    if (!iso) return 'No date';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  };

  return (
    <div>
      <div className="page-header">
        <h2>Post Queue</h2>
        <button className="btn-primary" onClick={() => navigate('/compose')}>
          + New Post
        </button>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : posts.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>
          No {tab} posts.
        </p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="card post-card">
            <div className="post-info">
              <div className="post-meta">
                <span>@{post.account?.handle}</span>
                <span>{formatTime(post.scheduledAt || post.sentAt)}</span>
                {post.threads.length > 1 && (
                  <span className="badge badge-thread">
                    {post.threads.length} thread
                  </span>
                )}
                {post.threads.reduce((sum, t) => sum + (t.images?.length || 0), 0) > 0 && (
                  <span className="badge badge-images">
                    {post.threads.reduce((sum, t) => sum + (t.images?.length || 0), 0)} img
                  </span>
                )}
              </div>
              <div className="post-preview">
                {post.threads[0]?.text?.slice(0, 100) || '(empty)'}
              </div>
              {post.status === 'failed' && post.errorMsg && (
                <div className="error-msg">{post.errorMsg}</div>
              )}
            </div>
            <div className="post-actions">
              {(tab === 'scheduled' || tab === 'draft' || tab === 'failed') && (
                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/compose/${post.id}`)}
                >
                  Edit
                </button>
              )}
              {tab === 'draft' && (
                <button className="btn-primary" onClick={() => handlePostNow(post.id)}>
                  Post Now
                </button>
              )}
              {tab === 'failed' && (
                <button className="btn-primary" onClick={() => handleRetry(post.id)}>
                  Retry
                </button>
              )}
              <button className="btn-danger" onClick={() => handleDelete(post.id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
