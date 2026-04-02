import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTemplates, deleteTemplate } from '../api';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    await deleteTemplate(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h2>Templates</h2>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : templates.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          No templates yet. Save one from the Composer.
        </p>
      ) : (
        templates.map((t) => (
          <div key={t.id} className="card template-item">
            <div>
              <strong>{t.name}</strong>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginTop: 2,
                }}
              >
                {t.threads[0]?.text?.slice(0, 80) || '(empty)'}
                {t.threads.length > 1 && ` (+${t.threads.length - 1} more)`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn-primary"
                onClick={() => navigate('/compose')}
              >
                Use
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDelete(t.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
