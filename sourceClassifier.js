/**
 * sourceClassifier.js
 * Classifies source URLs into primary, secondary, or unknown.
 */

(function() {
    /**
     * Extracts domain from URL (removes www.).
     * @param {string} url 
     * @returns {string} 
     */
    function extractDomain(url) {
        try {
            const parsed = new URL(url);
            let hostname = parsed.hostname;
            if (hostname.startsWith('www.')) {
                hostname = hostname.substring(4);
            }
            return hostname;
        } catch (e) {
            return url;
        }
    }

    /**
     * Classifies source type based on domain/URL.
     * @param {string} url 
     * @returns {string} primary, secondary, or unknown
     */
    function classifySourceType(url) {
        if (!url) return 'unknown';

        const domain = extractDomain(url);
        if (domain === url) return 'unknown'; // Parse error fallback

        const primaryDomains = ['.gov', '.edu', '.ac.uk', '.ac.in', '.mil'];
        const primaryKeywords = [
            'pubmed', 'scholar.google', 'nature.com', 'sciencedirect', 
            'reuters.com', 'apnews.com', 'bbc.com', 'bloomberg.com', 
            'wsj.com', 'ft.com', 'who.int', 'cdc.gov', 'nih.gov', 
            'economist.com', 'ieee.org', 'arxiv.org'
        ];

        // Check extensions
        if (primaryDomains.some(ext => domain.endsWith(ext))) {
            return 'primary';
        }

        // Check keywords
        if (primaryKeywords.some(kw => domain.includes(kw))) {
            return 'primary';
        }

        return 'secondary';
    }

    // Attach to window
    window.sourceClassifier = {
        classifySourceType,
        extractDomain
    };
})();
