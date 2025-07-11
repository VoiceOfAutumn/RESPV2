# Frontend Deployment Guide for Render

## Prerequisites
- Backend already deployed at: https://backend-6wqj.onrender.com
- Frontend build successful (✓ verified)

## Deployment Steps

### 1. Environment Configuration
- `.env.production` is already configured with the backend URL
- `api.ts` helper created for dynamic API configuration

### 2. Build Verification
- Frontend build passes: ✓ Compiled successfully
- All TypeScript errors resolved: ✓
- Component import paths fixed: ✓

### 3. Deploy to Render

1. **Create New Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configuration Settings:**
   ```
   Name: tournament-frontend (or your preferred name)
   Environment: Node
   Region: Oregon (US West) or your preferred region
   Branch: main (or your deployment branch)
   Build Command: npm run build
   Start Command: npm start
   ```

3. **Environment Variables:**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://backend-6wqj.onrender.com
   ```

4. **Advanced Settings:**
   - Node Version: 18.x or higher
   - Auto-Deploy: Yes (recommended)

### 4. Post-Deployment
- Verify frontend can connect to backend API
- Test authentication flow
- Test tournament creation and bracket functionality

## Files Modified for Deployment
- `landing/.env.production` - Production environment config
- `landing/src/lib/api.ts` - API configuration helper
- `landing/src/app/tournaments/page.tsx` - Updated API calls
- `landing/src/app/bracket-demo/page.tsx` - Fixed component imports
- `landing/src/app/tournament/[id]/bracket/components/Bracket.tsx` - Fixed TypeScript errors

## Backend Integration
- Backend bcrypt → bcryptjs migration completed
- Backend endpoint: https://backend-6wqj.onrender.com
- Authentication and tournament APIs ready

Your codebase is now fully prepared for Render deployment! 🚀
