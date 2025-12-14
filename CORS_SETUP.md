# CORS Proxy Setup Guide

## Problem
The Durham Region Recollect API blocks cross-origin requests from GitHub Pages, causing CORS errors in the browser.

## Solution
Deploy a Cloudflare Worker that acts as a CORS proxy.

---

## Step-by-Step Setup

### 1. Deploy Cloudflare Worker (5 minutes)

1. **Sign up for Cloudflare Workers** (Free)
   - Go to: https://workers.cloudflare.com/
   - Click "Sign Up" (free tier: 100,000 requests/day)

2. **Create a new Worker**
   - Click "Create a Service"
   - Name: `durham-waste-api-proxy`
   - Click "Create service"

3. **Deploy the proxy code**
   - Click "Quick edit" button
   - Copy ALL code from: `cloudflare-worker/worker.js`
   - Paste into the editor (replace existing code)
   - Click "Save and Deploy"

4. **Copy your Worker URL**
   ```
   https://durham-waste-api-proxy.YOUR-SUBDOMAIN.workers.dev
   ```
   
   Example:
   ```
   https://durham-waste-api-proxy.hossainkhan.workers.dev
   ```

### 2. Update the App (2 minutes)

1. **Open** `pages-site/app.js` in your editor

2. **Find this line** (around line 136):
   ```javascript
   const apiUrl = `https://api.recollect.net/api/areas/Durham/services/257/address-suggest?q=${encodedAddress}&locale=en`;
   ```

3. **Replace with your Worker URL**:
   ```javascript
   const apiUrl = `https://durham-waste-api-proxy.YOUR-SUBDOMAIN.workers.dev/api/address-suggest?q=${encodedAddress}`;
   ```

4. **Remove** the `&locale=en` parameter (worker handles this)

### 3. Test & Deploy

1. **Test your worker directly:**
   ```bash
   curl "https://durham-waste-api-proxy.YOUR-SUBDOMAIN.workers.dev/api/address-suggest?q=563+Ritson+Rd"
   ```
   
   Should return JSON with `place_id`, `service_id`, etc.

2. **Commit and push:**
   ```bash
   git add pages-site/app.js
   git commit -m "fix: use Cloudflare Worker proxy to bypass CORS"
   git push
   ```

3. **Wait 1-2 minutes** for GitHub Pages to deploy

4. **Test on your site:**
   - Go to: https://hossain-khan.github.io/trmnl-next-pickup-plugin/
   - Enter an address: "563 Ritson Rd S"
   - Click "Get Configuration"
   - Should now work! ✅

---

## Quick Reference

### Worker Configuration
- **File**: `cloudflare-worker/worker.js`
- **Endpoint**: `/api/address-suggest?q={address}`
- **Method**: GET only
- **CORS**: Enabled for all origins
- **Cache**: 1 hour
- **Rate Limit**: 100,000 requests/day (free tier)

### App Update
**Before:**
```javascript
const apiUrl = `https://api.recollect.net/api/areas/Durham/services/257/address-suggest?q=${encodedAddress}&locale=en`;
```

**After:**
```javascript
const apiUrl = `https://YOUR-WORKER-URL.workers.dev/api/address-suggest?q=${encodedAddress}`;
```

---

## Troubleshooting

### "Worker not found" error
- Make sure worker is deployed and active in Cloudflare dashboard
- Check the URL is correct (no typos)

### CORS error still happening
- Verify you're using the worker URL, not the direct API URL
- Clear browser cache and hard refresh (Cmd+Shift+R)

### "Invalid response" error
- Test the worker URL directly in browser
- Check Cloudflare Worker logs for errors

---

## Alternative Solution (Advanced)

If you prefer not to use Cloudflare, you can:
1. Use Netlify Functions or Vercel Edge Functions
2. Set up your own proxy server
3. Contact Durham Region to whitelist your domain

But Cloudflare Workers is the easiest and fastest solution.

---

## Cost

**Cloudflare Workers Free Tier:**
- ✅ 100,000 requests/day
- ✅ No credit card required
- ✅ Unlimited workers
- ✅ Fast edge network

For this use case, the free tier is more than sufficient.
