// ============================================
// User Model - Database Schema
// ============================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Name required'], trim: true,
    minlength: [2, 'Min 2 chars'], maxlength: [50, 'Max 50 chars']
  },
  email: {
    type: String, required: [true, 'Email required'],
    unique: true, lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String, required: [true, 'Password required'],
    minlength: [6, 'Min 6 chars'], select: false
  },
  avatar: { type: String, default: '' },
  plan: {
    type: String, enum: ['free', 'pro', 'business'], default: 'free'
  },
  planExpiry: { type: Date },
  aiUsageToday: { type: Number, default: 0 },
  aiUsageDate: { type: Date, default: Date.now },
  storageUsed: { type: Number, default: 0 }, // bytes
  storageLimit: { type: Number, default: 1073741824 }, // 1GB free
  videosCount: { type: Number, default: 0 },
  projectsCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate JWT token
UserSchema.methods.getSignedToken = function() {
  return jwt.sign({ id: this._id, plan: this.plan }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Compare password
UserSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

// Check AI usage limit
UserSchema.methods.canUseAI = function() {
  const today = new Date().toDateString();
  const usageDate = new Date(this.aiUsageDate).toDateString();
  if (today !== usageDate) { this.aiUsageToday = 0; this.aiUsageDate = new Date(); }
  if (this.plan === 'pro' || this.plan === 'business') return true;
  return this.aiUsageToday < 3;
};

// Storage limit based on plan
UserSchema.methods.getStorageLimit = function() {
  const limits = { free: 1073741824, pro: 53687091200, business: 536870912000 };
  return limits[this.plan] || limits.free;
};

module.exports = mongoose.model('User', UserSchema);
