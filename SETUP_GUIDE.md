# 🎬 CutMaster Pro — Complete Setup Guide
## Node.js + MongoDB Atlas (Free Cloud)

---

## ✅ STEP 1 — MongoDB Atlas FREE Account Banao (5 min)

1. Browser mein jaao: **https://mongodb.com/atlas**
2. **"Try Free"** button dabao
3. Google ya Email se register karo (bilkul free)
4. Organization name: `CutMasterPro` → Continue
5. **"M0 FREE"** plan select karo (credit card NAHI chahiye)
6. Cloud provider: **AWS** → Region: **Mumbai (ap-south-1)** → **Create Cluster**

### 🔑 Database User Banao:
1. Left sidebar → **"Database Access"**
2. **"Add New Database User"** → Click
3. Username: `cutmaster`
4. Password: `CutMaster2024!` (ya apna strong password)
5. Role: **"Atlas admin"** select karo
6. **"Add User"** click karo

### 🌐 Network Access:
1. Left sidebar → **"Network Access"**
2. **"Add IP Address"** → **"Allow Access from Anywhere"** (0.0.0.0/0)
3. **"Confirm"** click karo

### 📋 Connection String Copy Karo:
1. Left sidebar → **"Database"** → **"Connect"**
2. **"Drivers"** select karo
3. Connection string copy karo — kuch aisa dikhega:
   ```
   mongodb+srv://cutmaster:CutMaster2024!@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Is string ko note kar lo — Step 3 mein chahiye

---

## ✅ STEP 2 — Project Files Setup Karo

### 📁 Folder Structure:
```
cutmaster-pro/
├── backend/          ← Server files
│   ├── server.js
│   ├── package.json
│   ├── .env          ← YE FILE BANANI HAI
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── uploads/      ← YE FOLDER BANAO
└── frontend/
    ├── pages/
    └── js/
```

### 📂 Uploads Folder Banao:
Windows mein `backend` folder ke andar `uploads` naam ka folder banao
(Ya terminal mein: `mkdir backend/uploads`)

---

## ✅ STEP 3 — .env File Banao (IMPORTANT!)

`backend` folder ke andar `.env` naam ki file banao aur ye content daalo:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://cutmaster:CutMaster2024!@cluster0.XXXXX.mongodb.net/cutmaster_pro?retryWrites=true&w=majority
JWT_SECRET=CutMasterProSuperSecretKey2024XYZ123
JWT_EXPIRE=30d
MAX_FILE_SIZE=524288000
UPLOAD_PATH=./uploads
FRONTEND_URL=http://localhost:5000
```

⚠️ **IMPORTANT:** `MONGODB_URI` mein apna actual connection string daalo jo Step 1 mein copy kiya tha!

---

## ✅ STEP 4 — Dependencies Install Karo

Terminal/Command Prompt kholo aur ye commands chalao:

```bash
# backend folder mein jao
cd cutmaster-pro/backend

# sab packages install karo (ek baar hi karna hai)
npm install
```

Thoda time lagega — 1-2 minute. End mein `added XXX packages` dikhega.

---

## ✅ STEP 5 — Server Start Karo

```bash
# backend folder mein (agar nahi ho toh)
cd cutmaster-pro/backend

# SERVER START KARO
npm run dev
```

### ✅ Success dikhega agar ye aaye:
```
✅ MongoDB Connected
🚀 CutMaster Pro Server running on http://localhost:5000
📺 Frontend: http://localhost:5000
🔌 API: http://localhost:5000/api
```

---

## ✅ STEP 6 — Templates Seed Karo (Sample data)

Server chalte hue, **naya terminal** kholo:

```bash
# Ye command chalao (ek baar hi)
curl -X POST http://localhost:5000/api/templates/seed
```

Ya browser mein jaao:
**http://localhost:5000/api/health**
→ `{"status":"OK","message":"CutMaster Pro API Running 🚀"}` dikhna chahiye

---

## ✅ STEP 7 — App Open Karo!

Browser mein jaao: **http://localhost:5000**

### 🎉 Pages:
| Page | URL |
|------|-----|
| 🏠 Landing Page | http://localhost:5000 |
| 🔐 Login/Register | http://localhost:5000/frontend/pages/login.html |
| 📊 Dashboard | http://localhost:5000/dashboard |
| ✂️ Editor | http://localhost:5000/editor |

---

## 🚀 STEP 8 — Pehli Baar Use Karo

1. **http://localhost:5000/frontend/pages/login.html** kholo
2. **"Create Account"** tab → apna naam, email, password daalo
3. Register karo → automatic Dashboard pe jaoge
4. **"+ New Project"** → aspect ratio choose → Editor khulega!
5. Upload karo video → Timeline mein add karo → Edit karo!

---

## 🛑 Common Errors & Fix:

### ❌ "MongoDB connection failed"
→ `.env` file mein `MONGODB_URI` check karo
→ MongoDB Atlas mein Network Access mein `0.0.0.0/0` allow hai?
→ Username/password sahi hai?

### ❌ "npm not found" ya "node not found"
→ Node.js dobara install karo: **https://nodejs.org** (LTS version)
→ Terminal band karke dubara kholo

### ❌ "Port 5000 already in use"
→ `.env` mein `PORT=5001` kar do
→ Browser mein `http://localhost:5001` kholo

### ❌ Frontend files nahi dikh rahe
→ Server `backend` folder se start karna hai, `cutmaster-pro` folder se nahi

---

## 📡 API Endpoints (Reference):

```
POST   /api/auth/register      → Account banao
POST   /api/auth/login         → Login karo
GET    /api/auth/me            → Apni info
GET    /api/users/dashboard    → Dashboard stats
GET    /api/projects           → Saare projects
POST   /api/projects           → Naya project
PUT    /api/projects/:id       → Project save
GET    /api/videos             → Saare videos
POST   /api/videos/upload      → Video upload
GET    /api/templates          → Templates browse
GET    /api/health             → Server status
```

---

## 🌐 Production Deploy (Free) — Optional:

### Railway.app pe deploy karo (bilkul free):
1. **https://railway.app** → GitHub se login
2. "New Project" → "Deploy from GitHub repo"
3. Environment variables mein `.env` ka content daalo
4. Auto deploy ho jaega!

### Vercel pe Frontend:
1. **https://vercel.com** → Frontend folder upload karo

---

## 📞 Support:
- Server logs terminal mein dekhte raho
- Koi error aaye toh error message copy karke poochho

**Happy Editing! 🎬✨**
