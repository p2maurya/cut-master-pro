# 🚀 Quick Reference - CutMaster Pro

## Start in 30 Seconds

```bash
# Terminal 1: Start Backend
cd backend
npm install  # (first time only)
npm start
# → Server running on http://localhost:5000

# Terminal 2: Open Frontend (if needed)
# Open http://localhost:5000 in browser
```

---

## Main Files You Need to Know

| File | Purpose | Key Info |
|------|---------|----------|
| `backend/server.js` | API server | Port 5000, Express.js |
| `frontend/pages/editor.html` | Video editor UI | 3590 lines, all features |
| `frontend/js/editor.js` | Timeline logic | NEW, 520 lines, manages state |
| `frontend/js/api.js` | API client | Fetch wrapper with auth |
| `.env` | Configuration | Create in backend/ folder |

---

## Create .env (First Time)

**File: `backend/.env`**

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cutmaster-pro
JWT_SECRET=super-secret-key-change-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:5000
```

---

## User Quick-Start

1. **Sign Up** → Email, name, password
2. **Create Project** → Choose aspect ratio (9:16 recommended)
3. **Upload Video** → Media tab → Upload button
4. **Add to Timeline** → Click "+Add"
5. **Add Effects** → FX tab → Pick effect
6. **Add Text** → T tab → Type & color
7. **Add Music** → BG tab → Select track
8. **Export** → Click Export button → Download

**Total time: 3-5 minutes per video**

---

## Editor Features Reference

### Left Panel (Tools)
| Icon | Name | What It Does |
|------|------|-------------|
| M | Media | Upload/browse videos |
| BG | Background | Add music & change background |
| T | Text | Add text with styling |
| FX | Effects | Apply visual effects |
| TR | Transitions | Add transitions between clips |
| S | Stickers | Add emoji/sticker overlays |
| A | Audio | Add sound effects |
| AI | AI Tools | Future: captions, background removal |
| TP | Templates | Pre-made editing templates |

### Available Effects
**Visual**: Glitch, Zoom, Shake, Flash, RGB Split, VHS, Film Grain, Neon

**Transitions**: Cut, Fade, Dissolve, Zoom In/Out, Spin, Slide Left/Right, Whip Pan, Glitch

**Filters**: None, Cinematic, Moody, Warm, Cool, Vintage, Teal&Orange, B&W, Neon

---

## API Endpoints Quick Ref

```javascript
// Auth
POST   /api/auth/register         { name, email, password }
POST   /api/auth/login            { email, password }
GET    /api/auth/me               
POST   /api/auth/logout           

// Projects
GET    /api/projects              
POST   /api/projects              { name, aspectRatio, ... }
GET    /api/projects/:id          
PUT    /api/projects/:id          { data to update }
DELETE /api/projects/:id          

// Videos
GET    /api/videos                
POST   /api/videos/upload         (form-data: file, title)
DELETE /api/videos/:id            

// Templates
GET    /api/templates             
GET    /api/templates/featured    
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Space** | Play/Pause video |
| **Ctrl+Z** | Undo |
| **Ctrl+Y** | Redo |
| **Ctrl+S** | Save project |
| **Delete** | Remove selected clip |

---

## File Structure Explained

```
backend/
├── server.js              ← Main Express app
├── models/
│   ├── User.js           ← User schema
│   ├── Project.js        ← Video project
│   ├── Video.js          ← Uploaded videos
│   └── Template.js       ← Editing templates
├── routes/
│   ├── auth.js           ← Login/register
│   ├── projects.js       ← CRUD projects
│   ├── videos.js         ← Upload/manage videos
│   └── users.js          ← User profiles
├── middleware/
│   └── auth.js           ← JWT verification
└── uploads/
    └── videos/           ← Stored video files

frontend/
├── index.html            ← Landing page
├── js/
│   ├── api.js            ← API client
│   └── editor.js         ← Timeline & editing (NEW!)
└── pages/
    ├── login.html        ← Auth page
    ├── dashboard.html    ← Project list
    └── editor.html       ← Video editor (3590 lines)
```

---

## Troubleshooting Checklist

```
❓ Backend won't start
☐ Port 5000 free? (try different port)
☐ MongoDB running? (mongod command)
☐ Node.js installed? (node -v)
☐ Dependencies? (npm install)

❓ Backend running but no connection
☐ Check CORS origin in server.js
☐ Check .env FRONTEND_URL
☐ Try: http://localhost:5000

❓ Upload fails
☐ File < 10MB?
☐ Video format (MP4, WebM)?
☐ Check uploads/ folder exists?

❓ Timeline not working
☐ Browser refresh (Ctrl+R)
☐ Clear cache (Ctrl+Shift+Delete)
☐ Check F12 console for errors
```

---

## Performance Tips

### For Smooth Editing
1. Keep videos under 50MB
2. Use 720p or 1080p resolution
3. Don't add too many effects (3-5 max)
4. Export at 1080p max (unless 4K needed)

### For Faster Processing
1. Use modern browser (Chrome/Edge/Firefox)
2. Close other tabs
3. Ensure backend on local machine
4. Use SSD (not HDD)

---

## Customization Commands

```bash
# Change app name everywhere
find . -type f -name "*.html" -o -name "*.js" | xargs sed -i 's/CutMaster Pro/YourName/g'

# Change primary color (pink to blue)
sed -i 's/#ff3e6c/#0066ff/g' frontend/pages/editor.html

# Reset database
rm backend/uploads/videos/*  # Clear videos
# Or connect fresh MongoDB database
```

---

## Deploy to Production

### Simple Deploy (Heroku)
```bash
heroku login
heroku create myapp-name
git push heroku main
heroku open
```

### Docker Deploy
```dockerfile
FROM node:16
WORKDIR /app
COPY backend/ .
RUN npm install
EXPOSE 5000
CMD ["npm", "start"]
```

---

## Common Code Locations

| Need to change... | Location |
|-------------------|----------|
| App name | `frontend/pages/editor.html` line ~10 |
| Primary color | `frontend/pages/editor.html` CSS variables |
| Max video size | `backend/server.js` upload middleware |
| Database URL | `.env` MONGODB_URI |
| Port | `.env` PORT or `backend/server.js` |
| API timeout | `frontend/js/api.js` fetch timeout |
| Available effects | `frontend/pages/editor.html` line ~1750 |

---

## Import/Export Project

### Export current project
1. Open browser DevTools (F12)
2. Go to Application → LocalStorage
3. Copy `cm_token` and `cm_user`
4. Right-click editor → Save As → `.html`

### Import to new machine
1. Start fresh backend/frontend
2. Create account
3. Open DevTools → Application → LocalStorage
4. Paste `cm_token` and `cm_user` values
5. Refresh page

---

## Useful Commands

```bash
# Check Node/npm versions
node -v && npm -v

# List processes using port 5000
lsof -i :5000  (Mac/Linux)
netstat -ano | findstr :5000  (Windows)

# Kill process on port 5000
killall node  (Mac/Linux)
taskkill /F /IM node.exe  (Windows)

# Install specific package version
npm install express@4.18.2

# Update all packages
npm update

# Clear npm cache
npm cache clean --force
```

---

## Learning Path

1. **Week 1**: Get it running, edit 3 videos
2. **Week 2**: Customize colors & add effects
3. **Week 3**: Understand backend routes
4. **Week 4**: Deploy to production
5. **Week 5+**: Add new features!

---

## Resources

| Topic | Link |
|-------|------|
| JavaScript | https://developer.mozilla.org/en-US/docs/Web/JavaScript |
| Node.js | https://nodejs.org/en/docs/ |
| Express | https://expressjs.com/en/api.html |
| MongoDB | https://docs.mongodb.com |
| FFmpeg | https://ffmpeg.org/documentation.html |
| HTML5 Canvas | https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API |

---

## Success Checklist

✅ Backend starts on http://localhost:5000  
✅ Can sign up account  
✅ Can create project  
✅ Can upload video  
✅ Timeline shows video  
✅ Can add text  
✅ Can apply effects  
✅ Can export  

**If all ✅, you're ready to use! 🎉**

---

**Pro Tip**: Star this repo and share with friends! 😊

---

*Last updated: May 27, 2024*
