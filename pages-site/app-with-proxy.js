/**
 * Configuration for Durham Region API proxy
 * 
 * SETUP REQUIRED:
 * 1. Deploy the Cloudflare Worker from /cloudflare-worker/worker.js
 * 2. Replace PROXY_URL below with your worker URL
 * 3. Commit and push changes
 */

// TODO: Replace this with your Cloudflare Worker URL after deployment
// Example: https://durham-waste-api-proxy.hossainkhan.workers.dev
const PROXY_URL = 'YOUR_CLOUDFLARE_WORKER_URL_HERE';

/**
 * Fetch configuration from Durham Region API via CORS proxy
 * Uses Cloudflare Worker to bypass CORS restrictions
 * 
 * @param {string} address - User's Durham Region address
 * @returns {Promise<Object|null>} Configuration object or null if not found
 */
async function fetchConfiguration(address) {
    if (!address || address.trim().length < 3) {
        throw new Error('Please enter a valid address (at least 3 characters)');
    }

    const encodedAddress = encodeURIComponent(address.trim());
    
    // Use the Cloudflare Worker proxy instead of calling API directly
    const apiUrl = `${PROXY_URL}/api/address-suggest?q=${encodedAddress}`;

    console.log('Fetching configuration for:', address);

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const results = await response.json();

        // Check if we got any results
        if (!results || !Array.isArray(results) || results.length === 0) {
            return null; // No addresses found
        }

        // Take the first result (most relevant match)
        const firstResult = results[0];

        // Validate required fields
        if (!firstResult.place_id || !firstResult.service_id) {
            throw new Error('Invalid response from API. Missing required fields.');
        }

        // Return configuration in the format expected by the form handler
        return {
            placeId: firstResult.place_id,
            serviceId: String(firstResult.service_id),
            displayAddress: firstResult.name || address
        };

    } catch (error) {
        // Network or parsing errors
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error. Please check your connection and try again.');
        }
        throw error;
    }
}
