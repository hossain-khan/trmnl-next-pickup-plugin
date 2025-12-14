// Durham Region Waste Collection Plugin - Configuration Helper
// API integration will be implemented when user provides endpoint details

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('address-form');
    const addressInput = document.getElementById('address-input');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');
    const btnText = document.querySelector('.btn-text');
    const spinner = document.querySelector('.spinner');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Copy to clipboard functionality
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.getAttribute('data-copy');
            const targetElement = document.getElementById(targetId);
            const textToCopy = targetElement.textContent;

            try {
                await navigator.clipboard.writeText(textToCopy);
                const originalText = btn.textContent;
                btn.textContent = '✓ Copied';
                btn.classList.add('copied');
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                // Fallback for older browsers
                fallbackCopyToClipboard(textToCopy);
            }
        });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const address = addressInput.value.trim();
        if (!address) return;

        // Show loading state
        setLoading(true);
        hideMessages();

        try {
            // TODO: Replace with actual API call when user provides endpoint details
            // For now, this is a placeholder structure
            const config = await fetchConfiguration(address);
            
            if (config) {
                displayResults(config);
            } else {
                showError('Unable to find configuration for this address.');
            }
        } catch (error) {
            console.error('Error fetching configuration:', error);
            showError('An error occurred while looking up your address. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(loading) {
        submitBtn.disabled = loading;
        if (loading) {
            btnText.style.display = 'none';
            spinner.style.display = 'inline-block';
        } else {
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    }

    function hideMessages() {
        resultsDiv.style.display = 'none';
        errorDiv.style.display = 'none';
    }

    function displayResults(config) {
        document.getElementById('place-id').textContent = config.placeId;
        document.getElementById('service-id').textContent = config.serviceId || '257';
        document.getElementById('display-address').textContent = config.displayAddress || addressInput.value.trim();
        
        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showError(message) {
        document.getElementById('error-text').textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Fallback copy method for older browsers
    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    }

    /**
     * Fetch configuration from Durham Region API
     * Uses the Recollect API's address-suggest endpoint to find matching addresses
     * 
     * API Flow:
     * 1. Call address-suggest API with user's address query
     * 2. Extract place_id, service_id, and formatted name from first result
     * 3. Return configuration object for TRMNL plugin
     * 
     * @param {string} address - User's Durham Region address
     * @returns {Promise<Object|null>} Configuration object or null if not found
     */
    async function fetchConfiguration(address) {
        if (!address || address.trim().length < 3) {
            throw new Error('Please enter a valid address (at least 3 characters)');
        }

        const encodedAddress = encodeURIComponent(address.trim());
        const apiUrl = `https://durham-waste-api-proxy.hk-c91.workers.dev/api/address-suggest?q=${encodedAddress}`;

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
});
