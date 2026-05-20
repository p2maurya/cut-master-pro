const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  filename: { type: String, required: true },
  originalName: { type: String },
  filepath: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  size: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // seconds
  resolution: { width: Number, height: Number },
  fps: { type: Number },
  format: { type: String },
  status: { type: String, enum: ['uploading','processing','ready','error'], default: 'uploading' },
  isPublic: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  tags: [String],
  exportSettings: {
    resolution: { type: String, default: '1080p' },
    fps: { type: Number, default: 30 },
    format: { type: String, default: 'mp4' },
    quality: { type: String, default: 'high' }
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

VideoSchema.index({ user: 1, createdAt: -1 });
VideoSchema.index({ isPublic: 1, views: -1 });

module.exports = mongoose.model('Video', VideoSchema);
