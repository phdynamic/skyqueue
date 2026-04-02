import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getAccounts,
  getPost,
  createPost,
  updatePost,
  uploadImages,
  getTemplates,
  createTemplate,
} from '../api';

function graphemeLength(text) {
  try {
    return [...new Intl.Segmenter().segment(text)].length;
  } catch {
    return text.length;
  }
}

const emptySegment = () => ({ text: '', images: [], localFiles: [] });

export default function Composer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [threads, setThreads] = useState([emptySegment()]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    getAccounts().then((data) => {
      setAccounts(data);
      if (data.length && !accountId) setAccountId(String(data[0].id));
    });
  }, []);

  useEffect(() => {
    if (id) {
      getPost(id).then((post) => {
        setAccountId(String(post.accountId));
        setThreads(
          post.threads.map((t) => ({
            text: t.text,
            images: t.images || [],
            localFiles: [],
          }))
        );
        if (post.scheduledAt) {
          const d = new Date(post.scheduledAt);
          setScheduleDate(d.toISOString().slice(0, 10));
          setScheduleTime(d.toTimeString().slice(0, 5));
        }
      });
    }
  }, [id]);

  const updateThread = (index, field, value) => {
    setThreads((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addSegment = () => setThreads((prev) => [...prev, emptySegment()]);

  const removeSegment = (index) => {
    if (threads.length <= 1) return;
    setThreads((prev) => prev.filter((_, i) => i !== index));
  };

  const moveSegment = (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= threads.length) return;
    setThreads((prev) => {
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
  };

  const handleImageUpload = async (index, files) => {
    const current = threads[index].images.length;
    const allowed = 4 - current;
    if (allowed <= 0) return;

    const toUpload = Array.from(files).slice(0, allowed);
    try {
      const uploaded = await uploadImages(toUpload);
      updateThread(index, 'images', [
        ...threads[index].images,
        ...uploaded.map((u) => ({
          path: u.path,
          altText: '',
          filename: u.filename,
        })),
      ]);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeImage = (threadIdx, imgIdx) => {
    updateThread(
      threadIdx,
      'images',
      threads[threadIdx].images.filter((_, i) => i !== imgIdx)
    );
  };

  const updateAltText = (threadIdx, imgIdx, alt) => {
    const imgs = [...threads[threadIdx].images];
    imgs[imgIdx] = { ...imgs[imgIdx], altText: alt };
    updateThread(threadIdx, 'images', imgs);
  };

  const buildScheduledAt = () => {
    if (!scheduleDate || !scheduleTime) return null;
    return new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
  };

  const save = async (asDraft) => {
    setError('');
    setSaving(true);
    try {
      const scheduledAt = asDraft ? null : buildScheduledAt();
      if (!asDraft && !scheduledAt) {
        setError('Please set a date and time to schedule.');
        setSaving(false);
        return;
      }

      const payload = {
        accountId: parseInt(accountId),
        status: asDraft ? 'draft' : 'scheduled',
        scheduledAt,
        threads: threads.map((t, i) => ({
          position: i,
          text: t.text,
          images: t.images.map((img, j) => ({
            path: img.path,
            altText: img.altText || '',
            position: j,
          })),
        })),
      };

      if (id) {
        await updatePost(id, payload);
      } else {
        await createPost(payload);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const loadTemplates = async () => {
    const data = await getTemplates();
    setTemplates(data);
    setShowTemplateModal(true);
  };

  const applyTemplate = (template) => {
    setThreads(
      template.threads.map((t) => ({
        text: t.text || '',
        images: [],
        localFiles: [],
      }))
    );
    setShowTemplateModal(false);
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) return;
    await createTemplate({
      name: templateName,
      threads: threads.map((t, i) => ({
        position: i,
        text: t.text,
      })),
    });
    setTemplateName('');
    setError('');
    alert('Template saved!');
  };

  return (
    <div>
      <div className="page-header">
        <h2>{id ? 'Edit Post' : 'Compose'}</h2>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</div>
      )}

      <div className="composer-form">
        <div className="form-group">
          <label>Account</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                @{a.handle} ({a.label})
              </option>
            ))}
          </select>
        </div>

        {threads.map((segment, index) => {
          const count = graphemeLength(segment.text);
          return (
            <div key={index} className="card thread-segment">
              <div className="segment-header">
                <span>
                  {threads.length > 1
                    ? `Thread ${index + 1} of ${threads.length}`
                    : 'Post'}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn-secondary"
                    onClick={() => moveSegment(index, -1)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => moveSegment(index, 1)}
                    disabled={index === threads.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => removeSegment(index)}
                    disabled={threads.length <= 1}
                    title="Remove segment"
                  >
                    ×
                  </button>
                </div>
              </div>
              <textarea
                value={segment.text}
                onChange={(e) => updateThread(index, 'text', e.target.value)}
                placeholder="What's on your mind?"
                maxLength={350}
              />
              <div
                className={`char-count ${count > 300 ? 'over' : count > 280 ? 'warn' : ''}`}
              >
                {count}/300
              </div>

              <div className="image-uploads">
                {segment.images.map((img, imgIdx) => (
                  <div key={imgIdx} className="image-upload-item">
                    <img
                      src={`/uploads/${img.filename || img.path?.split('/').pop()}`}
                      alt={img.altText}
                    />
                    <button
                      className="remove-img"
                      onClick={() => removeImage(index, imgIdx)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {segment.images.length < 4 && (
                  <label
                    className="image-upload-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: 'var(--bg)',
                      fontSize: '1.5rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    +
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(index, e.target.files)}
                    />
                  </label>
                )}
              </div>

              {segment.images.map((img, imgIdx) => (
                <div key={imgIdx} className="form-group" style={{ marginTop: 6 }}>
                  <input
                    type="text"
                    placeholder={`Alt text for image ${imgIdx + 1}`}
                    value={img.altText}
                    onChange={(e) => updateAltText(index, imgIdx, e.target.value)}
                  />
                </div>
              ))}
            </div>
          );
        })}

        <button className="btn-secondary" onClick={addSegment}>
          + Add to thread
        </button>

        <div className="schedule-row">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>
        </div>

        <div className="button-row">
          <button
            className="btn-primary"
            onClick={() => save(false)}
            disabled={saving}
          >
            {saving ? 'Saving...' : id ? 'Update Schedule' : 'Schedule'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => save(true)}
            disabled={saving}
          >
            Save as Draft
          </button>
          <button className="btn-secondary" onClick={loadTemplates}>
            Load Template
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              const name = prompt('Template name:');
              if (name) {
                setTemplateName(name);
                setTimeout(() => saveAsTemplate(), 0);
              }
            }}
          >
            Save as Template
          </button>
        </div>
      </div>

      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Load Template</h3>
            {templates.length === 0 ? (
              <p>No templates saved yet.</p>
            ) : (
              templates.map((t) => (
                <div
                  key={t.id}
                  className="card"
                  style={{ marginBottom: 8, cursor: 'pointer' }}
                  onClick={() => applyTemplate(t)}
                >
                  <strong>{t.name}</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {t.threads[0]?.text?.slice(0, 80) || '(empty)'}
                  </p>
                </div>
              ))
            )}
            <button
              className="btn-secondary"
              style={{ marginTop: 12 }}
              onClick={() => setShowTemplateModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
