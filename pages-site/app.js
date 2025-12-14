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
     * 
     * TODO: Implement actual API calls when user provides endpoint details
     * Expected flow:
     * 1. Call Durham Region address lookup API
     * 2. Extract Place ID from response
     * 3. Return configuration object
     * 
     * @param {string} address - User's Durham Region address
     * @returns {Promise<Object|null>} Configuration object or null if not found
     */
    async function fetchConfiguration(address) {
        // PLACEHOLDER IMPLEMENTATION
        // This will be replaced with actual API calls
        
        console.log('Fetching configuration for address:', address);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Example response structure (for development/testing)
        // User will provide actual API endpoint and parsing logic
        
        // For demonstration purposes, return mock data if address contains "Oshawa"
        if (address.toLowerCase().includes('oshawa')) {
            return {
                placeId: '918DB048-D91A-11E8-B83E-68F5AF88FEB0',
                serviceId: '257',
                displayAddress: address
            };
        }
        
        // Return null if no configuration found
        return null;
        
        /* 
        ACTUAL IMPLEMENTATION STRUCTURE (to be filled in):
        
        try {
            // Step 1: Call Durham Region address search API
            const searchResponse = await fetch('API_ENDPOINT_HERE', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address })
            });
            
            if (!searchResponse.ok) {
                throw new Error('Address lookup failed');
            }
            
            const searchData = await searchResponse.json();
            
            // Step 2: Extract Place ID from response
            const placeId = searchData.place_id; // Adjust based on actual response structure
            
            if (!placeId) {
                return null;
            }
            
            // Step 3: Return configuration
            return {
                placeId: placeId,
                serviceId: '257', // Durham Region default
                displayAddress: searchData.formatted_address || address
            };
            
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
        */
    }
});
