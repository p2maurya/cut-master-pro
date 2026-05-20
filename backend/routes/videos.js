const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Video = require('../models/Video');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Setup upload directory
const uploadDir = path.join(__dirname, '../uploads/videos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|mov|avi|mkv|webm|wmv|flv|m4v/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only video files allowed'));
  }
});

// @GET /api/videos - Get all user videos
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const videos = await Video.find({ user: req.user.id })
      .sort(sort).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Video.countDocuments({ user: req.user.id });
    res.json({ success: true, count: videos.length, total, videos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/videos/upload - Upload video
router.post('/upload', protect, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No video file' });
    const user = req.user;
    if (user.storageUsed + req.file.size > user.getStorageLimit()) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Storage limit exceeded. Upgrade plan.' });
    }
    const video = await Video.create({
      user: user.id, title: req.body.title || req.file.originalname,
      filename: req.file.filename, originalName: req.file.originalname,
      filepath: `/uploads/videos/${req.file.filename}`,
      size: req.file.size, status: 'ready',
      format: path.extname(req.file.originalname).replace('.','')
    });
    await User.findByIdAndUpdate(user.id, {
      $inc: { storageUsed: req.file.size, videosCount: 1 }
    });
    res.status(201).json({ success: true, message: 'Video uploaded!', video });
  } catch (err) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/videos/:id - Get single video
router.get('/:id', protect, async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, user: req.user.id });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/videos/:id - Update video metadata
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, tags, isPublic } = req.body;
    const video = await Video.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, description, tags, isPublic }, { new: true, runValidators: true }
    );
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, video });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @DELETE /api/videos/:id - Delete video
router.delete('/:id', protect, async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, user: req.user.id });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    const filePath = path.join(__dirname, '..', video.filepath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await video.deleteOne();
    await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: -video.size, videosCount: -1 } });
    res.json({ success: true, message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
