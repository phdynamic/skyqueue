const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Accounts
export const getAccounts = () => request('/accounts');
export const createAccount = (data) =>
  request('/accounts', { method: 'POST', body: JSON.stringify(data) });
export const deleteAccount = (id) =>
  request(`/accounts/${id}`, { method: 'DELETE' });

// Posts
export const getPosts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/posts${qs ? `?${qs}` : ''}`);
};
export const getPost = (id) => request(`/posts/${id}`);
export const createPost = (data) =>
  request('/posts', { method: 'POST', body: JSON.stringify(data) });
export const updatePost = (id, data) =>
  request(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePost = (id) =>
  request(`/posts/${id}`, { method: 'DELETE' });

// Templates
export const getTemplates = () => request('/templates');
export const createTemplate = (data) =>
  request('/templates', { method: 'POST', body: JSON.stringify(data) });
export const deleteTemplate = (id) =>
  request(`/templates/${id}`, { method: 'DELETE' });

// Uploads
export async function uploadImages(files) {
  const formData = new FormData();
  files.forEach((f) => formData.append('images', f));
  const res = await fetch(`${BASE}/uploads`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Upload failed');
  }
  return res.json();
}

export const deleteUpload = (filePath) =>
  request('/uploads', {
    method: 'DELETE',
    body: JSON.stringify({ filePath }),
  });
