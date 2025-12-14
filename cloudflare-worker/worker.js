/**
 * Cloudflare Worker Proxy for Durham Region Recollect API
 * 
 * This worker acts as a CORS proxy to bypass browser restrictions
 * when calling the Recollect API from GitHub Pages.
 * 
 * Deploy to: https://workers.cloudflare.com/
 * Example URL: https://your-worker.workers.dev/api/address-suggest?q=563+Ritson+Rd
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Handle CORS preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: { 
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  // Parse the incoming URL
  const url = new URL(request.url)
  const path = url.pathname

  // Only allow the address-suggest endpoint
  if (path !== '/api/address-suggest') {
    return new Response('Not found', { 
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    })
  }

  // Get query parameter
  const query = url.searchParams.get('q')
  
  if (!query || query.trim().length < 3) {
    return new Response(JSON.stringify({ error: 'Query parameter "q" is required (min 3 characters)' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }

  try {
    // Build the Durham Region API URL
    const apiUrl = `https://api.recollect.net/api/areas/Durham/services/257/address-suggest?q=${encodeURIComponent(query)}&locale=en`
    
    // Forward the request to Durham Region API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'TRMNL-Durham-Waste-Helper/1.0'
      }
    })

    // Get the response body
    const data = await response.text()

    // Return with CORS headers
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch from Durham Region API',
      details: error.message 
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }
}
