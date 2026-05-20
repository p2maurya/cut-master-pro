const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema({
  id: String, type: { type: String, enum: ['video','audio','text','sticker','fx','overlay'] },
  name: String, src: String, startTime: Number, endTime: Number,
  duration: Number, trackIndex: Number, volume: Number,
  opacity: Number, speed: Number, filters: [Object],
  keyframes: [Object], transform: Object, locked: Boolean, muted: Boolean
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, default: 'Untitled Project', maxlength: 100 },
  thumbnail: String,
  aspectRatio: { type: String, default: '9:16', enum: ['9:16','16:9','1:1','4:5','21:9'] },
  duration: { type: Number, default: 0 },
  fps: { type: Number, default: 30 },
  resolution: { width: { type: Number, default: 1080 }, height: { type: Number, default: 1920 } },
  tracks: [TrackSchema],
  timeline: { currentTime: { type: Number, default: 0 }, zoom: { type: Number, default: 1 } },
  colorGrade: {
    brightness: Number, contrast: Number, saturation: Number,
    highlights: Number, shadows: Number, temperature: Number,
    tint: Number, vignette: Number, lut: String
  },
  audio: { masterVolume: Number, tracks: [Object] },
  template: { type: mongoose.Schema.ObjectId, ref: 'Template' },
  status: { type: String, enum: ['draft','exporting','exported'], default: 'draft' },
  exportedVideo: String,
  isAutoSaved: { type: Boolean, default: true },
  lastEditedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

ProjectSchema.index({ user: 1, lastEditedAt: -1 });

module.exports = mongoose.model('Project', ProjectSchema);
