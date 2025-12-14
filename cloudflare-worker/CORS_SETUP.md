# CORS Proxy Setup Guide

## Problem
The Durham Region Recollect API blocks cross-origin requests from GitHub Pages, causing CORS errors in the browser.

### Why Direct API Calls Fail

When your JavaScript on GitHub Pages tries to call the Durham API, the browser blocks it due to CORS (Cross-Origin Resource Sharing) policy:

1. **Browser sends OPTIONS request** (preflight check) to verify CORS is allowed
2. **Durham API doesn't respond with CORS headers**
3. **Browser blocks the request** before it even happens

This is a security feature to prevent malicious websites from accessing APIs on your behalf.

## Solution
Deploy a Cloudflare Worker that acts as a CORS proxy.

### How the Proxy Works

```
GitHub Pages → Cloudflare Worker → Durham API
   ✅              ✅                  ✅
(Browser)      (Server-side)      (Server-side)

The worker:
1. Handles OPTIONS preflight requests with proper CORS headers
2. Forwards GET requests to Durham API
3. Returns data with CORS headers added
```

**Key Point:** The worker handles **both OPTIONS and GET requests**. The OPTIONS request is critical - it's how browsers check if CORS is allowed before sending the actual request.

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
   
   **Important:** The worker code includes handling for both:
   - **OPTIONS requests** (preflight CORS check)
   - **GET requests** (actual data fetching)
   
   Without OPTIONS handling, you'll see CORS errors even with the proxy!

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

### CORS error still happening (preflight request doesn't pass)
**Most Common Issue:** Worker doesn't handle OPTIONS requests properly
- Make sure you copied the LATEST `cloudflare-worker/worker.js` code
- The worker MUST include this at the top of `handleRequest()`:
  ```javascript
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept'
      }
    })
  }
  ```
- Redeploy the worker after adding OPTIONS handling
- Clear browser cache and hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Still getting CORS errors after adding OPTIONS
- Verify you're using the worker URL, not the direct API URL in `app.js`
- Check browser console - should see OPTIONS request with status 204
- Test worker directly: `curl -X OPTIONS https://your-worker.workers.dev/api/address-suggest`

### "Invalid response" error
- Test the worker URL directly in browser
- Check Cloudflare Worker logs for errors
- Verify Durham Region API is responding (test in browser: https://api.recollect.net/api/areas/Durham/services/257/address-suggest?q=563+Ritson+Rd&locale=en)

---

## Understanding CORS and Preflight

### What is CORS?
Cross-Origin Resource Sharing (CORS) is a browser security feature that prevents websites from making requests to different domains unless explicitly allowed.

### The Preflight Request
When you make a cross-origin request with custom headers (like `Content-Type: application/json`), browsers send two requests:

1. **OPTIONS request (preflight)** - "Is this origin allowed?"
2. **GET request (actual)** - "Get the data"

If the OPTIONS request fails (no CORS headers), the browser blocks the GET request entirely.

### Why Our Worker Works
- **Handles OPTIONS:** Returns 204 status with CORS headers
- **Handles GET:** Fetches from Durham API and adds CORS headers
- **Server-to-server:** Worker can call Durham API without CORS restrictions
- **Adds CORS headers:** Browser sees proper headers and allows the response

```
Browser → Worker (OPTIONS) → Worker responds with CORS headers ✅
Browser → Worker (GET) → Durham API → Worker adds CORS headers → Browser ✅
```

Without OPTIONS handling, the flow breaks at step 1.

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
