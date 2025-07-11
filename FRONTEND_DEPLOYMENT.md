# 🚀 Frontend Deployment Guide for Render

## ✅ **Frontend Ready for Deployment!**

Your frontend is now configured to connect to your live backend at `https://backend-6wqj.onrender.com`.

### **Quick Deployment Steps:**

## 1. **Create Frontend Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → **"Web Service"** (NOT Static Site)
   - Connect your GitHub repository
   - Select your repository (`RESPV2`)

## 2. **Configure Service Settings**
   ```
   Name: tournament-frontend
   Environment: Node
   Region: [Choose closest to you]
   Branch: main
   Root Directory: landing
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

## 3. **Set Environment Variables**
   In the "Environment" section, add:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://backend-6wqj.onrender.com
   ```

## 4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your frontend will be available at: `https://your-frontend-name.onrender.com`

## 5. **Update Backend CORS**
   After frontend deployment, update your backend environment variable:
   ```
   FRONTEND_URL=https://your-frontend-name.onrender.com
   ```

---

## ✅ **What's Been Fixed for Production:**

### **Environment Configuration**
- ✅ Created `.env.production` with your backend URL
- ✅ Created `src/lib/api.ts` for dynamic API configuration
- ✅ Updated all API calls to use `API_BASE_URL` environment variable

### **Package Configuration**
- ✅ Updated `package.json` name to `tournament-frontend`
- ✅ Added Node.js engine specification (`>=18.0.0`)
- ✅ Verified all required dependencies are installed

### **Build Fixes**
- ✅ Fixed component import paths (`@/components/Navbar`, `@/components/TopBar`)
- ✅ Moved Navbar and TopBar to correct locations
- ✅ Fixed TypeScript errors in tournament types
- ✅ Simplified bracket component to avoid build conflicts

### **API Integration**
- ✅ Updated tournaments page to use dynamic API URLs
- ✅ Updated authentication flows to use backend URL
- ✅ Configured CORS-friendly requests with credentials

---

## 📋 **File Changes Made:**

### **New Files:**
- `landing/.env.production` - Production environment variables
- `landing/src/lib/api.ts` - API configuration helper
- `landing/src/components/Navbar.tsx` - Moved from app/components
- `landing/src/components/TopBar.tsx` - Moved from app/components

### **Updated Files:**
- `landing/package.json` - Name and engine specification
- `landing/src/app/tournaments/page.tsx` - Dynamic API URLs
- `landing/src/app/bracket-demo/page.tsx` - Fixed TypeScript errors
- `landing/src/app/tournament/[id]/bracket/components/Bracket.tsx` - Simplified

---

## 🔧 **Important Notes:**

1. **Your Backend is Live**: `https://backend-6wqj.onrender.com`
2. **Frontend will auto-connect**: No code changes needed for API calls
3. **CORS Configuration**: Remember to update `FRONTEND_URL` in backend after frontend deployment
4. **Free Tier**: Services may sleep after 15 minutes of inactivity
5. **Build Time**: First deployment takes 5-10 minutes

---

## 🚀 **Ready to Deploy!**

Your frontend is now production-ready and will automatically connect to your live backend. Just follow the deployment steps above and you'll have a fully functional tournament platform!

After deployment, test:
- ✅ User registration/login
- ✅ Tournament listing
- ✅ Tournament creation (if you're an admin)
- ✅ Bracket viewing
