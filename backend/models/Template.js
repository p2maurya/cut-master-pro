const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 300 },
  thumbnail: String,
  category: {
    type: String,
    enum: ['vlog','reels','travel','dance','gaming','fashion','food','education','business','music','sports','other'],
    default: 'reels'
  },
  tags: [String],
  isPro: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  duration: Number,
  aspectRatio: { type: String, default: '9:16' },
  uses: { type: Number, default: 0 },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  data: { type: Object }, // Full project JSON
  author: { type: mongoose.Schema.ObjectId, ref: 'User' },
  platform: [{ type: String, enum: ['instagram','tiktok','youtube','facebook','twitter'] }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

TemplateSchema.index({ category: 1, uses: -1 });
TemplateSchema.index({ isPro: 1, isFeatured: 1 });

module.exports = mongoose.model('Template', TemplateSchema);
