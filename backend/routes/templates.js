const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const { protect } = require('../middleware/auth');

// @GET /api/templates - Browse templates (public)
router.get('/', async (req, res) => {
  try {
    const { category, isPro, page = 1, limit = 24, sort = '-uses', search } = req.query;
    const query = {};
    if (category && category !== 'all') query.category = category;
    if (isPro !== undefined) query.isPro = isPro === 'true';
    if (search) query.title = { $regex: search, $options: 'i' };
    const templates = await Template.find(query)
      .sort(sort).skip((page-1)*limit).limit(parseInt(limit))
      .select('-data');
    const total = await Template.countDocuments(query);
    res.json({ success: true, total, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/templates/featured
router.get('/featured', async (req, res) => {
  try {
    const templates = await Template.find({ isFeatured: true }).limit(8).select('-data');
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/templates/:id - Get template with full data
router.get('/:id', protect, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    if (template.isPro && !['pro','business'].includes(req.user.plan)) {
      return res.status(403).json({ success: false, message: 'Pro plan required for this template', upgradeRequired: true });
    }
    await Template.findByIdAndUpdate(req.params.id, { $inc: { uses: 1 } });
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/templates/seed - Seed sample templates (dev only)
router.post('/seed', async (req, res) => {
  if (process.env.NODE_ENV !== 'development')
    return res.status(403).json({ success: false, message: 'Dev only' });
  try {
    await Template.deleteMany({});
    const templates = [
      { title: 'Cinematic Vlog', category: 'vlog', isPro: true, isFeatured: true, uses: 2300000, aspectRatio: '9:16', duration: 30, tags: ['cinematic','vlog','travel'], platform: ['instagram','youtube'] },
      { title: 'Dance Transitions', category: 'dance', isPro: false, isFeatured: true, uses: 5100000, aspectRatio: '9:16', duration: 15, tags: ['dance','transition','trending'], platform: ['tiktok','instagram'] },
      { title: 'Travel Montage', category: 'travel', isPro: true, isFeatured: true, uses: 1800000, aspectRatio: '16:9', duration: 60, tags: ['travel','montage','cinematic'], platform: ['youtube'] },
      { title: 'Aesthetic Reels', category: 'reels', isPro: false, isFeatured: true, uses: 7200000, aspectRatio: '9:16', duration: 15, tags: ['aesthetic','reels','viral'], platform: ['instagram','tiktok'] },
      { title: 'Gaming Highlights', category: 'gaming', isPro: true, isFeatured: false, uses: 3400000, aspectRatio: '16:9', duration: 45, tags: ['gaming','highlights','twitch'] },
      { title: 'Fashion Lookbook', category: 'fashion', isPro: false, isFeatured: true, uses: 2900000, aspectRatio: '9:16', duration: 20, tags: ['fashion','lookbook','style'] },
      { title: 'Food Recipe', category: 'food', isPro: true, isFeatured: false, uses: 1200000, aspectRatio: '9:16', duration: 60, tags: ['food','recipe','cooking'] },
      { title: 'Education Reel', category: 'education', isPro: false, isFeatured: false, uses: 4100000, aspectRatio: '9:16', duration: 30, tags: ['education','tutorial','tips'] },
      { title: 'Business Promo', category: 'business', isPro: true, isFeatured: true, uses: 890000, aspectRatio: '16:9', duration: 30, tags: ['business','promo','brand'] },
      { title: 'Music Lyric Video', category: 'music', isPro: true, isFeatured: false, uses: 1500000, aspectRatio: '9:16', duration: 180, tags: ['music','lyrics','audio'] },
    ];
    await Template.insertMany(templates);
    res.json({ success: true, message: `Seeded ${templates.length} templates` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
