# Production Communication Setup

## URLs Configured:
- **Frontend**: https://respv2.onrender.com
- **Backend**: https://backend-6wqj.onrender.com

## Frontend Changes ✅

### Environment Configuration:
- `landing/.env.production` - Updated with both backend and frontend URLs
- All API calls already point to correct backend URL

### API Configuration:
- `landing/src/lib/api.ts` - Already configured with credentials for cross-origin requests

## Backend Changes ✅

### CORS Configuration:
- Updated to allow both development (`localhost:3001`) and production (`respv2.onrender.com`) origins
- Uses environment variable for flexibility

### Session Security:
- Enabled secure cookies for production (HTTPS)
- Set `sameSite: 'none'` for cross-origin session handling
- Added `httpOnly` for XSS protection

### Email Reset Links:
- Updated to use production frontend URL in password reset emails
- Uses environment variable for flexibility

### Environment Variables:
- `backend/.env.production` - Updated with correct frontend URL

## Key Production Settings:

### Backend Environment Variables (Set in Render):
```bash
NODE_ENV=production
FRONTEND_URL=https://respv2.onrender.com
SESSION_SECRET=your-strong-secret
RESEND_API_KEY=your-api-key
# ... database credentials
```

### Frontend Environment Variables (Set in Render):
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://backend-6wqj.onrender.com
NEXT_PUBLIC_FRONTEND_URL=https://respv2.onrender.com
```

## Security Features:
- ✅ HTTPS-only cookies in production
- ✅ Cross-origin cookie support
- ✅ XSS protection with httpOnly cookies
- ✅ Proper CORS configuration
- ✅ Environment-based configuration

## Ready for Production! 🚀
Both frontend and backend are now properly configured to communicate in production environment.
