const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// @GET /api/users/dashboard - Dashboard stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    const user = req.user;
    const [videosCount, projectsCount, recentProjects, recentVideos] = await Promise.all([
      Video.countDocuments({ user: user.id }),
      Project.countDocuments({ user: user.id }),
      Project.find({ user: user.id }).sort('-lastEditedAt').limit(5).select('title thumbnail lastEditedAt status aspectRatio'),
      Video.find({ user: user.id }).sort('-createdAt').limit(5).select('title filepath size duration createdAt')
    ]);
    res.json({
      success: true,
      stats: {
        videosCount, projectsCount,
        storageUsed: user.storageUsed,
        storageLimit: user.getStorageLimit(),
        storagePercent: Math.round((user.storageUsed / user.getStorageLimit()) * 100),
        plan: user.plan, aiUsageToday: user.aiUsageToday,
        aiLimit: user.plan === 'free' ? 3 : '∞'
      },
      recentProjects, recentVideos
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
