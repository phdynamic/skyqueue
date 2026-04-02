const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');
const { resolveHandle, login, clearSession } = require('../lib/atproto');

// List all accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        handle: true,
        did: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add account
router.post('/', async (req, res) => {
  try {
    const { label, handle, appPassword } = req.body;

    if (!handle || !appPassword) {
      return res.status(400).json({ error: 'handle and appPassword are required' });
    }

    // Strip leading @ if present
    const cleanHandle = handle.replace(/^@/, '');

    // Resolve DID and test login
    const did = await resolveHandle(cleanHandle);

    // Test that credentials work
    const testAccount = { id: -1, handle: cleanHandle, appPassword };
    await login(testAccount);
    clearSession(-1);

    const account = await prisma.account.create({
      data: {
        label: label || cleanHandle,
        handle: cleanHandle,
        did,
        appPassword,
      },
    });

    res.status(201).json({
      id: account.id,
      label: account.label,
      handle: account.handle,
      did: account.did,
      createdAt: account.createdAt,
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Account already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

// Delete account
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    clearSession(id);
    await prisma.account.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: 'Account not found' });
  }
});

module.exports = router;
