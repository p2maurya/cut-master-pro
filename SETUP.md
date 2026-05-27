# CutMaster Pro - Setup & Run Guide

## 🚀 Quick Setup (5 Minutes)

### Prerequisites
- Node.js v14+ (https://nodejs.org)
- MongoDB running locally or Atlas connection
- Git (optional)

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Setup Environment Variables

Create `.env` file in `backend/` folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cutmaster-pro
JWT_SECRET=your-super-secret-key-change-this
NODE_ENV=development
FRONTEND_URL=http://localhost:5000
```

**For MongoDB Atlas** (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cutmaster-pro
```

### Step 3: Start MongoDB (if local)

**Windows:**
```bash
mongod
```

**Mac:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### Step 4: Start Backend Server

```bash
cd backend
npm start
```

Expected output:
```
🚀 Server running on http://localhost:5000
✓ Connected to MongoDB
```

### Step 5: Access Frontend

**Option A: Live Server (VS Code)**
1. Right-click `index.html`
2. Select "Open with Live Server"
3. Opens on http://localhost:5500

**Option B: Direct File**
- Open `index.html` directly in browser
- Or use Python: `python -m http.server 5500`

**Option C: Serve via Backend**
```bash
# Backend will serve static files from /frontend
# Open http://localhost:5000
```

---

## 📋 Complete Project Structure

```
cutmaster-pro/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Video.js
│   │   └── Template.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── videos.js
│   │   ├── templates.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── controllers/
│   ├── uploads/
│   │   └── videos/
│   ├── server.js
│   ├── package.json
│   └── .env (create this)
│
├── frontend/
│   ├── js/
│   │   ├── api.js (API client)
│   │   └── editor.js (NEW - Timeline & editing)
│   ├── pages/
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   └── editor.html
│   ├── css/ (if any)
│   └── index.html (landing page)
│
├── index.html (main entry)
├── EDITOR_GUIDE.md (NEW - User guide)
└── package.json (root - runs backend)
```

---

## 🔑 First Time Usage

### 1. Create Account

1. Go to `http://localhost:5000` (or http://localhost:5500)
2. Click "Sign Up"
3. Enter name, email, password
4. Click "Create Account"
5. You're logged in!

### 2. Create First Project

1. Click "Create New Project"
2. Choose aspect ratio (9:16 recommended for mobile)
3. Give project a name
4. Click "Create"
5. Opens editor automatically

### 3. Edit Your First Video

1. **Upload Video**: Click "M" (Media) → "Upload Video" → Select file
2. **Add to Timeline**: Click "+Add" on uploaded video
3. **Add Text**: Click "T" → Type text → Click "Add Text"
4. **Add Effect**: Click "FX" → Select effect
5. **Add Music**: Click "BG" → Select music → Click "Add Music"
6. **Export**: Click "Export" → Choose settings → Click "Export Now"

---

## ⚙️ Configuration

### Backend Port (5000)

To change port, modify `backend/server.js`:

```javascript
const PORT = process.env.PORT || 3000; // Change 3000 to your port
```

Or in `.env`:
```env
PORT=3000
```

### Database

**Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/cutmaster-pro
```

**Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/cutmaster-pro?retryWrites=true&w=majority
```

### File Uploads

Videos uploaded to: `backend/uploads/videos/`

To change location, modify `backend/server.js`:
```javascript
const uploadDir = path.join(__dirname, 'uploads/videos');
```

Max file size: 10MB (configurable in `server.js`)

---

## 🐛 Troubleshooting

### "Cannot GET /"
- Backend not running on port 5000
- Check if `npm start` is working
- Try http://localhost:5500 instead

### "Network error. Is the server running?"
- Backend server stopped
- Run `npm start` in backend folder
- Check console for errors

### "CORS blocked origin"
- Frontend URL not in allowed list
- Update `backend/server.js` allowedOrigins:
```javascript
const allowedOrigins = new Set([
  'http://localhost:3000', // Add your URL
  'http://127.0.0.1:5000',
  'http://localhost:5500'
]);
```

### "Cannot connect to MongoDB"
- MongoDB not running
- Wrong connection string
- Check MONGODB_URI in `.env`

### Videos won't upload
- Check file size (max 10MB)
- Ensure `backend/uploads/videos/` folder exists
- Check backend console for errors

### Editor loads but no videos appear
- Videos uploaded correctly
- Try refreshing page
- Check browser console (F12) for errors
- Verify media API endpoint working

---

## 📊 Available API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Videos
- `GET /api/videos` - List videos
- `POST /api/videos/upload` - Upload video
- `DELETE /api/videos/:id` - Delete video

### Templates
- `GET /api/templates` - List templates
- `GET /api/templates/featured` - Featured templates

---

## 🎯 Features Overview

### ✅ Working Features
- User authentication (register/login)
- Create multiple projects
- Upload videos (H.264 codec)
- Timeline editing interface
- Text overlay with styling
- Effects & transitions
- Audio/music tracks
- Color grading
- Speed control
- Export video settings UI
- Auto-save
- Undo/redo

### 🔄 Backend Features Needed for Full Export
- FFmpeg integration for actual video rendering
- AWS S3 or similar for video hosting
- WebSocket for real-time collaboration

### 🚀 Enhancement Ideas
- AI-powered captions
- Beat-sync cutting
- Background removal
- Super resolution upscaling
- Voice effects
- Picture-in-picture
- Keyframe animations

---

## 📱 Testing on Mobile

### Local Network Access

Get your computer IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Access from phone on same network:
```
http://YOUR_IP:5000
```

Example: `http://192.168.1.100:5000`

---

## 🔐 Security Notes

**Before Production:**

1. Change JWT_SECRET in `.env`
2. Set NODE_ENV=production
3. Use HTTPS (not HTTP)
4. Set strong database password
5. Enable rate limiting
6. Sanitize file uploads
7. Add content moderation

---

## 📦 Deployment

### Heroku

```bash
cd backend
heroku login
heroku create cutmaster-pro
git push heroku main
```

### Railway / Render / Vercel

Follow platform-specific docs. Generally:
1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically on push

### Docker

Create `Dockerfile`:
```dockerfile
FROM node:16
WORKDIR /app
COPY backend/ .
RUN npm install
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 📞 Support

If you encounter issues:

1. Check browser console (F12)
2. Check backend console
3. Verify all services running
4. Check `.env` file
5. Restart backend server

Common errors documented in EDITOR_GUIDE.md

---

**Ready to start? Run:**

```bash
cd backend && npm start
```

Then visit http://localhost:5000

**Happy editing! 🎬**
