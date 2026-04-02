import React, { useState, useEffect } from 'react';
import { getAccounts, createAccount, deleteAccount } from '../api';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '', handle: '', appPassword: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createAccount(form);
      setForm({ label: '', handle: '', appPassword: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id, postCount) => {
    const msg = postCount
      ? `This account has ${postCount} post(s). Delete anyway?`
      : 'Delete this account?';
    if (!confirm(msg)) return;
    await deleteAccount(id);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h2>Accounts</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Account'}
        </button>
      </div>

      <p style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Generate app passwords at{' '}
        <a
          href="https://bsky.app/settings/app-passwords"
          target="_blank"
          rel="noreferrer"
        >
          bsky.app/settings/app-passwords
        </a>
      </p>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="card"
          style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
          <div className="form-group">
            <label>Label</label>
            <input
              type="text"
              placeholder="e.g. Personal"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Handle</label>
            <input
              type="text"
              placeholder="e.g. yourname.bsky.social"
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>App Password</label>
            <input
              type="password"
              placeholder="xxxx-xxxx-xxxx-xxxx"
              value={form.appPassword}
              onChange={(e) => setForm({ ...form, appPassword: e.target.value })}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Connecting...' : 'Add Account'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : accounts.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          No accounts added yet.
        </p>
      ) : (
        accounts.map((a) => (
          <div key={a.id} className="card account-item">
            <div className="account-info">
              <div className="handle">
                @{a.handle}{' '}
                <span
                  style={{
                    fontWeight: 'normal',
                    color: 'var(--text-secondary)',
                  }}
                >
                  ({a.label})
                </span>
              </div>
              <div className="did">{a.did}</div>
            </div>
            <button
              className="btn-danger"
              onClick={() => handleDelete(a.id, a._count?.posts)}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}
