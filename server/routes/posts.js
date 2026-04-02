const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');

const postInclude = {
  threads: {
    include: { images: true },
    orderBy: { position: 'asc' },
  },
  account: {
    select: { id: true, label: true, handle: true },
  },
};

// List posts with optional filters
router.get('/', async (req, res) => {
  try {
    const { status, accountId, from, to } = req.query;
    const where = {};

    if (status) where.status = status;
    if (accountId) where.accountId = parseInt(accountId);
    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }

    const posts = await prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: { scheduledAt: 'asc' },
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(req.params.id) },
      include: postInclude,
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create post
router.post('/', async (req, res) => {
  try {
    const { accountId, scheduledAt, threads, status } = req.body;

    if (!accountId || !threads || !threads.length) {
      return res.status(400).json({ error: 'accountId and threads are required' });
    }

    const post = await prisma.post.create({
      data: {
        accountId: parseInt(accountId),
        status: status || (scheduledAt ? 'scheduled' : 'draft'),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        threads: {
          create: threads.map((t, i) => ({
            position: t.position ?? i,
            text: t.text || '',
            images: t.images?.length
              ? {
                  create: t.images.map((img, j) => ({
                    path: img.path,
                    altText: img.altText || '',
                    position: img.position ?? j,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: postInclude,
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update post
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { scheduledAt, status, threads } = req.body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }

    // If threads are provided, delete old ones and recreate
    if (threads) {
      await prisma.thread.deleteMany({ where: { postId: id } });

      await prisma.post.update({
        where: { id },
        data: {
          ...updateData,
          threads: {
            create: threads.map((t, i) => ({
              position: t.position ?? i,
              text: t.text || '',
              images: t.images?.length
                ? {
                    create: t.images.map((img, j) => ({
                      path: img.path,
                      altText: img.altText || '',
                      position: img.position ?? j,
                    })),
                  }
                : undefined,
            })),
          },
        },
      });
    } else {
      await prisma.post.update({
        where: { id },
        data: updateData,
      });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      include: postInclude,
    });

    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete post
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.post.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: 'Post not found' });
  }
});

module.exports = router;
