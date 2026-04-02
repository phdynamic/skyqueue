const { BskyAgent } = require('@atproto/api');
const fs = require('fs');
const path = require('path');

// In-memory session cache keyed by accountId
const sessions = new Map();

async function login(account) {
  const cached = sessions.get(account.id);
  if (cached) {
    return cached;
  }

  const agent = new BskyAgent({ service: 'https://bsky.social' });
  await agent.login({
    identifier: account.handle,
    password: account.appPassword,
  });

  sessions.set(account.id, agent);
  return agent;
}

function clearSession(accountId) {
  sessions.delete(accountId);
}

async function getAgent(account) {
  try {
    const agent = await login(account);
    return agent;
  } catch (err) {
    // If cached session expired, clear and retry once
    clearSession(account.id);
    const agent = await login(account);
    return agent;
  }
}

async function uploadBlob(agent, filePath, mimeType) {
  const fileBytes = fs.readFileSync(filePath);
  const response = await agent.uploadBlob(fileBytes, { encoding: mimeType });
  return response.data.blob;
}

async function sendPost(post) {
  const agent = await getAgent(post.account);

  // Sort threads by position
  const threads = [...post.threads].sort((a, b) => a.position - b.position);

  let rootRef = null;
  let parentRef = null;

  for (const thread of threads) {
    // Upload images if any
    let embed = undefined;
    if (thread.images && thread.images.length > 0) {
      const sortedImages = [...thread.images].sort(
        (a, b) => a.position - b.position
      );
      const imageBlobs = [];

      for (const img of sortedImages) {
        const fullPath = path.resolve(img.path);
        const ext = path.extname(img.path).toLowerCase();
        const mimeMap = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
        };
        const mimeType = mimeMap[ext] || 'image/jpeg';
        const blob = await uploadBlob(agent, fullPath, mimeType);
        imageBlobs.push({
          alt: img.altText || '',
          image: blob,
          aspectRatio: undefined,
        });
      }

      embed = {
        $type: 'app.bsky.embed.images',
        images: imageBlobs,
      };
    }

    // Build post record
    const record = {
      text: thread.text,
      createdAt: new Date().toISOString(),
    };

    if (embed) {
      record.embed = embed;
    }

    // Add reply reference for thread continuations
    if (parentRef) {
      record.reply = {
        root: rootRef,
        parent: parentRef,
      };
    }

    const response = await agent.post(record);

    const ref = {
      uri: response.uri,
      cid: response.cid,
    };

    if (!rootRef) {
      rootRef = ref;
    }
    parentRef = ref;
  }
}

async function resolveHandle(handle) {
  const agent = new BskyAgent({ service: 'https://bsky.social' });
  const response = await agent.resolveHandle({ handle });
  return response.data.did;
}

module.exports = { login, getAgent, sendPost, resolveHandle, clearSession };
