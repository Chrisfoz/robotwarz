# 🚂 Railway Deployment Guide for Battle Bots: Arena Evolution

## 📋 Prerequisites

1. **GitHub Account** with your Battle Bots repository
2. **Railway Account** (sign up at https://railway.app)
3. **Railway CLI** (optional, for advanced deployment)

## 🚀 Quick Start Deployment (Via Railway Dashboard)

### Step 1: Connect GitHub to Railway
1. Log in to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your `battlebots` repository

### Step 2: Configure Service
1. Railway will auto-detect the Node.js project
2. Service will be named automatically (you can rename to `battlebots-game`)
3. Railway will use the `nixpacks.toml` configuration we created

### Step 3: Set Environment Variables (if needed)
```
NODE_ENV=production
# Railway automatically sets PORT
```

### Step 4: Deploy
1. Railway will automatically deploy on push to main branch
2. First deployment will take 2-3 minutes
3. Access your game at: `https://[your-app-name].up.railway.app`

## 🔧 Advanced Configuration

### Custom Domain Setup
1. In Railway dashboard, go to your service settings
2. Click on **"Settings"** → **"Domains"**
3. Add custom domain (e.g., `battlebots.yourdomain.com`)
4. Update your DNS records:
   ```
   Type: CNAME
   Name: battlebots (or your subdomain)
   Value: [your-app-name].up.railway.app
   ```

### Performance Optimizations

#### 1. Enable CDN/Caching Headers
Add to `nixpacks.toml`:
```toml
[start]
cmd = "serve . -l $PORT --single --cors --no-clipboard -c '{\"public\":\"public\",\"headers\":[{\"source\":\"**/*.js\",\"headers\":[{\"key\":\"Cache-Control\",\"value\":\"public, max-age=31536000, immutable\"}]},{\"source\":\"**/*.css\",\"headers\":[{\"key\":\"Cache-Control\",\"value\":\"public, max-age=31536000, immutable\"}]},{\"source\":\"**/*.html\",\"headers\":[{\"key\":\"Cache-Control\",\"value\":\"public, max-age=0, must-revalidate\"}]}]}'"
```

#### 2. Enable Compression
The `serve` package automatically enables gzip compression for better performance.

#### 3. Resource Limits
In Railway dashboard → Service Settings → Resources:
- **Memory**: 512MB (sufficient for static serving)
- **CPU**: 0.5 vCPU (adequate for static files)

## 🔄 GitHub Actions Deployment

### Step 1: Get Railway Token
1. Go to Railway Dashboard → Account Settings
2. Click **"Tokens"** → **"Create Token"**
3. Name it `GITHUB_ACTIONS_DEPLOY`
4. Copy the token

### Step 2: Add Token to GitHub
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click **"New repository secret"**
4. Name: `RAILWAY_TOKEN`
5. Value: Paste your Railway token

### Step 3: Deploy
The GitHub Actions workflow will now:
- Run tests on every push
- Deploy to Railway on push to main branch
- Create preview environments for PRs

## 🎮 Testing Your Deployment

### Verify Core Functionality
1. **Game Loads**: Navigate to your Railway URL
2. **Canvas Renders**: Game should display properly
3. **Controls Work**: Test WASD movement and mouse aim
4. **ES6 Modules Load**: Check browser console for errors
5. **Assets Load**: All game graphics appear

### Performance Checklist
- [ ] Initial load time < 3 seconds
- [ ] Smooth 60 FPS gameplay
- [ ] No console errors
- [ ] Responsive controls (< 100ms input lag)

## 🔌 Adding Multiplayer Signaling Server

### Step 1: Create Separate Service
1. In Railway dashboard, click **"New"** → **"Empty Service"**
2. Name it `battlebots-signaling`
3. Connect to same GitHub repo

### Step 2: Configure for Server Directory
Create `railway.json` in `/server` directory:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm install"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Step 3: Set Environment Variables
```
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://your-game-url.railway.app
```

### Step 4: Update Game Configuration
In your game code, update WebRTC signaling URL:
```javascript
const SIGNALING_SERVER = process.env.NODE_ENV === 'production' 
  ? 'wss://battlebots-signaling.railway.app'
  : 'ws://localhost:3000';
```

## 🔍 Monitoring & Debugging

### View Logs
1. Railway Dashboard → Your Service → **"Logs"**
2. Or use Railway CLI: `railway logs`

### Common Issues & Solutions

#### Issue: Game doesn't load
**Solution**: Check browser console for module loading errors. Ensure all paths in `import` statements are relative.

#### Issue: CORS errors
**Solution**: The `--cors` flag in serve command should handle this. If persisting, check browser console for specific domain issues.

#### Issue: Slow initial load
**Solution**: 
1. Check total asset size in Railway logs
2. Consider implementing lazy loading for non-critical assets
3. Enable browser caching with proper headers

#### Issue: WebSocket connection fails (multiplayer)
**Solution**: 
1. Ensure signaling server is running
2. Check WebSocket URL uses `wss://` for HTTPS
3. Verify CORS settings on signaling server

## 📊 Performance Metrics

Railway provides built-in metrics:
1. Go to Service → **"Metrics"**
2. Monitor:
   - Request count
   - Response times
   - Memory usage
   - CPU usage

### Recommended Thresholds
- **Response Time**: < 200ms for static files
- **Memory Usage**: < 256MB for static server
- **CPU Usage**: < 25% average

## 🔄 Rollback Procedure

If deployment fails or introduces bugs:

### Via Dashboard
1. Go to Service → **"Deployments"**
2. Find previous working deployment
3. Click **"⋮"** → **"Redeploy"**

### Via CLI
```bash
railway rollback
```

## 🛡️ Security Best Practices

1. **Environment Variables**: Never commit sensitive data
2. **CORS**: Configured via `--cors` flag in serve
3. **Rate Limiting**: Railway provides basic DDoS protection
4. **HTTPS**: Automatically enabled on Railway domains

## 📈 Scaling Considerations

### When to Scale
- Concurrent users > 1000
- Response times > 500ms consistently
- Memory usage > 80%

### Scaling Options
1. **Horizontal Scaling**: Add more replicas in Railway
2. **CDN Integration**: Use Cloudflare for static assets
3. **Asset Optimization**: Implement bundling if needed

## 🎯 Next Steps

1. **Deploy the game** using the quick start guide
2. **Set up custom domain** for professional appearance
3. **Configure GitHub Actions** for automated deployment
4. **Add multiplayer server** when ready
5. **Monitor performance** and optimize as needed

## 📞 Getting Help

- **Railway Discord**: https://discord.gg/railway
- **Railway Docs**: https://docs.railway.app
- **Game Issues**: Create issue in GitHub repository

---

## 🚦 Deployment Status Checklist

- [x] Static file server configured (`nixpacks.toml`)
- [x] Railway configuration (`railway.json`)
- [x] GitHub Actions workflow
- [x] Bug fixed (EffectsSystem canvas initialization)
- [ ] Deploy to Railway
- [ ] Verify game functionality
- [ ] Set up custom domain (optional)
- [ ] Deploy signaling server (future)

## 📝 Configuration Files Created

1. **`railway.json`** - Railway service configuration
2. **`nixpacks.toml`** - Build and deployment settings
3. **`.github/workflows/railway-deploy.yml`** - CI/CD pipeline
4. **`package.json`** - Updated with serve dependency

Your game is now ready for deployment to Railway! 🎮🚀