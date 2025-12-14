# Cloudflare Worker CORS Proxy Setup

This directory contains a Cloudflare Worker that acts as a CORS proxy for the Durham Region Recollect API.

## Why This Is Needed

The Recollect API doesn't include CORS headers, which prevents browser-based requests from GitHub Pages. This worker:
- Forwards requests to the Durham Region API
- Adds proper CORS headers to allow cross-origin requests
- Validates input and provides error handling
- Caches responses for 1 hour to reduce API load

## Setup Instructions

### 1. Create Cloudflare Account
1. Go to https://workers.cloudflare.com/
2. Sign up for a free account (includes 100,000 requests/day)

### 2. Create New Worker
1. Click "Create a Service"
2. Name it: `durham-waste-api-proxy` (or your preferred name)
3. Click "Create service"

### 3. Deploy the Code
1. Click "Quick edit" on your new worker
2. Copy all the code from `worker.js`
3. Paste it into the editor (replacing the default code)
4. Click "Save and Deploy"

### 4. Get Your Worker URL
Your worker will be available at:
```
https://durham-waste-api-proxy.<your-subdomain>.workers.dev
```

Example:
```
https://durham-waste-api-proxy.hossainkhan.workers.dev/api/address-suggest?q=563+Ritson+Rd
```

### 5. Update Your App

Update `pages-site/app.js` to use your worker URL instead of calling the API directly:

```javascript
// Replace this line:
const apiUrl = `https://api.recollect.net/api/areas/Durham/services/257/address-suggest?q=${encodedAddress}&locale=en`;

// With your worker URL:
const apiUrl = `https://durham-waste-api-proxy.YOUR-SUBDOMAIN.workers.dev/api/address-suggest?q=${encodedAddress}`;
```

## Testing

Test your worker:
```bash
curl "https://your-worker.workers.dev/api/address-suggest?q=563+Ritson+Rd"
```

Expected response:
```json
[
  {
    "place_id": "8056320E-75FE-11E6-AFA6-9B077FAA243E",
    "service_id": 257,
    "name": "563 RITSON RD S, OSHAWA",
    "area_name": "Durham",
    ...
  }
]
```

## Features

- ✅ CORS headers enabled for all origins
- ✅ Only allows GET requests
- ✅ Validates query parameter
- ✅ 1-hour cache for responses
- ✅ Error handling with proper status codes
- ✅ Free tier: 100,000 requests/day

## Security Notes

- The worker only proxies the specific Durham Region API endpoint
- Input validation prevents abuse
- Rate limiting is handled by Cloudflare's free tier limits
- No authentication required (public API)

## Troubleshooting

**Worker not responding:**
- Check the worker is deployed and active in Cloudflare dashboard
- Verify the URL format is correct

**CORS still failing:**
- Make sure you're using the worker URL, not the direct API URL
- Check browser console for the actual error

**Invalid responses:**
- Test the worker URL directly in a browser or with curl
- Check Cloudflare Worker logs for errors

## Alternative: Custom Domain (Optional)

You can add a custom domain to your worker:
1. In Cloudflare Workers dashboard, click "Triggers"
2. Add a custom domain (requires Cloudflare DNS)
3. Example: `api.yourdomain.com/address-suggest`

This makes the URL cleaner and more professional.
