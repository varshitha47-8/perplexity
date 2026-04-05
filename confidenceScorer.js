/**
 * confidenceScorer.js
 * Calculates confidence score based on source array.
 */

(function() {
    /**
     * Calculates the confidence score object from sources.
     * @param {Array} sources 
     * @returns {Object} Confidence result
     */
    function calculateConfidenceScore(sources = []) {
        let primaryCount = 0;
        let recentCount = 0;
        let conflictDetected = false;
        
        const now = new Date();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);

        const pairs = [
            ['rise', 'fall'],
            ['increase', 'decrease'],
            ['safe', 'unsafe'],
            ['approved', 'banned'],
            ['confirmed', 'denied']
        ];

        let allText = '';

        const enrichedSources = (sources || []).map(source => {
            const domain = window.sourceClassifier.extractDomain(source.url);
            const sourceType = window.sourceClassifier.classifySourceType(source.url);
            
            if (sourceType === 'primary') primaryCount++;

            // Check for date field (if it exists)
            let isRecent = false;
            if (source.date) {
                const sourceDate = new Date(source.date);
                if (!isNaN(sourceDate.getTime()) && sourceDate >= ninetyDaysAgo) {
                    isRecent = true;
                    recentCount++;
                }
            }

            // Collect text for conflict check (using title and content/snippet)
            // Backend in app_v2.py uses 'title', search results could have 'snippet' or 'content'
            const textToAnalyze = (source.title || '') + ' ' + (source.snippet || source.content || '');
            allText += ' ' + textToAnalyze.toLowerCase();

            return {
                ...source,
                domain,
                sourceType,
                isRecent
            };
        });

        // Perform conflict check
        pairs.forEach(([w1, w2]) => {
            if (allText.includes(w1) && allText.includes(w2)) {
                conflictDetected = true;
            }
        });

        const totalCount = enrichedSources.length;
        let level = 'LOW';
        let color = '#C84B31';
        let explanation = '';

        if (totalCount === 0) {
            level = 'UNVERIFIABLE';
            color = '#888888';
            explanation = 'No web sources were retrieved and the answer is based on AI knowledge only and should not be used for critical decisions.';
        } else if (totalCount >= 6 && primaryCount >= 3 && !conflictDetected) {
            level = 'HIGH';
            color = '#2B9348';
            explanation = `Supported by ${totalCount} sources including ${primaryCount} primary sources. These sources agree and it is safe to act on this answer.`;
        } else if (totalCount >= 3 && !conflictDetected) {
            level = 'MEDIUM';
            color = '#E9A825';
            explanation = `Based on ${totalCount} sources. Sources are a mix of primary and secondary, and it is recommended to verify key figures before acting.`;
        } else {
            // LOW cases
            level = 'LOW';
            color = '#C84B31';
            if (conflictDetected) {
                explanation = 'Sources contain conflicting information and the user should not use this for decisions without manual review.';
            } else {
                explanation = `Based on only ${totalCount} sources. There are not enough sources to confirm this answer reliably.`;
            }
        }

        return {
            level,
            color,
            explanation,
            sourceCount: totalCount,
            primaryCount,
            recentCount,
            conflictDetected,
            enrichedSources
        };
    }

    // Attach to window
    window.confidenceScorer = {
        calculateConfidenceScore
    };
})();
