const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require login
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authenticated. Please login.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    if (!req.user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated' });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Authorize plan levels
exports.requirePro = (req, res, next) => {
  if (!['pro', 'business'].includes(req.user.plan)) {
    return res.status(403).json({ success: false, message: 'Pro plan required. Upgrade to access this feature.' });
  }
  next();
};

exports.requireBusiness = (req, res, next) => {
  if (req.user.plan !== 'business') {
    return res.status(403).json({ success: false, message: 'Business plan required.' });
  }
  next();
};

// Check AI usage limit
exports.checkAILimit = async (req, res, next) => {
  if (!req.user.canUseAI()) {
    return res.status(429).json({
      success: false,
      message: 'Daily AI limit reached (3/day on Free). Upgrade to Pro for unlimited AI.',
      upgradeRequired: true
    });
  }
  req.user.aiUsageToday += 1;
  await req.user.save({ validateBeforeSave: false });
  next();
};
