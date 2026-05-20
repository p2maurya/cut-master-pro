const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @GET /api/projects - All user projects
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const projects = await Project.find({ user: req.user.id })
      .sort('-lastEditedAt').skip((page-1)*limit).limit(parseInt(limit))
      .select('-tracks'); // Don't send heavy track data in list
    const total = await Project.countDocuments({ user: req.user.id });
    res.json({ success: true, total, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/projects - Create project
router.post('/', protect, async (req, res) => {
  try {
    const { title, aspectRatio, fps, template } = req.body;
    const project = await Project.create({
      user: req.user.id, title: title || 'Untitled Project',
      aspectRatio, fps, template
    });
    await User.findByIdAndUpdate(req.user.id, { $inc: { projectsCount: 1 } });
    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @GET /api/projects/:id - Get full project (for editor)
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/projects/:id - Save/auto-save project
router.put('/:id', protect, async (req, res) => {
  try {
    const updates = { ...req.body, lastEditedAt: new Date() };
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates, { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Saved ✓', project });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @DELETE /api/projects/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await User.findByIdAndUpdate(req.user.id, { $inc: { projectsCount: -1 } });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/projects/:id/duplicate
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const original = await Project.findOne({ _id: req.params.id, user: req.user.id });
    if (!original) return res.status(404).json({ success: false, message: 'Project not found' });
    const copy = original.toObject();
    delete copy._id; delete copy.createdAt; delete copy.updatedAt;
    copy.title = copy.title + ' (Copy)'; copy.status = 'draft';
    copy.lastEditedAt = new Date();
    const newProject = await Project.create(copy);
    await User.findByIdAndUpdate(req.user.id, { $inc: { projectsCount: 1 } });
    res.status(201).json({ success: true, project: newProject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
