const cron = require('node-cron');
const prisma = require('./lib/db');
const { sendPost } = require('./lib/atproto');

function startScheduler() {
  console.log('[cron] Post scheduler started — checking every minute');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const duePosts = await prisma.post.findMany({
        where: {
          status: 'scheduled',
          scheduledAt: { lte: now },
        },
        include: {
          threads: {
            include: { images: true },
            orderBy: { position: 'asc' },
          },
          account: true,
        },
      });

      if (duePosts.length > 0) {
        console.log(`[cron] Found ${duePosts.length} due post(s)`);
      }

      for (const post of duePosts) {
        try {
          await sendPost(post);
          await prisma.post.update({
            where: { id: post.id },
            data: { status: 'sent', sentAt: new Date() },
          });
          console.log(`[cron] Post ${post.id} sent successfully`);
        } catch (err) {
          await prisma.post.update({
            where: { id: post.id },
            data: { status: 'failed', errorMsg: err.message },
          });
          console.error(`[cron] Post ${post.id} failed: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('[cron] Scheduler error:', err.message);
    }
  });
}

module.exports = { startScheduler };
