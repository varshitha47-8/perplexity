/**
 * confidenceUI.js
 * Handles UI generation and updates for the confidence system.
 */

(function() {
    let answerCounter = 0;

    /**
     * Generates a unique ID for each answer.
     * @returns {string} unique ID
     */
    function generateAnswerId() {
        answerCounter++;
        return `answer-${answerCounter}`;
    }

    /**
     * Applies confidence result details to the badge and panel elements.
     * @param {string} id 
     * @param {Object} result 
     * @param {string} question 
     * @param {string} answerText 
     */
    function applyConfidenceResult(id, result, question, answerText) {
        const badge = document.getElementById(`badge-${id}`);
        const breakdown = document.getElementById(`breakdown-${id}`);
        if (!badge || !breakdown) return;

        // Update badge variables and style
        badge.style.setProperty('--badge-color', result.color);
        const dot = badge.querySelector('.confidence-dot');
        if (dot) dot.style.background = result.color;

        const labelMapping = {
            'HIGH': 'High Confidence',
            'MEDIUM': 'Medium Confidence',
            'LOW': 'Low Confidence',
            'UNVERIFIABLE': 'Unverifiable'
        };

        const label = badge.querySelector('.confidence-label');
        if (label) label.textContent = labelMapping[result.level] || result.level;

        // Update breakdown header and explanation
        const breakdownLevel = breakdown.querySelector('.breakdown-level');
        if (breakdownLevel) {
            breakdownLevel.textContent = labelMapping[result.level] || result.level;
            breakdownLevel.style.color = result.color;
        }

        const breakdownExplain = breakdown.querySelector('.breakdown-explanation');
        if (breakdownExplain) breakdownExplain.textContent = result.explanation;

        // Update stats
        const statTotal = document.getElementById(`stat-total-${id}`);
        const statPrimary = document.getElementById(`stat-primary-${id}`);
        const statSecondary = document.getElementById(`stat-secondary-${id}`);
        const statRecent = document.getElementById(`stat-recent-${id}`);
        if (statTotal) statTotal.textContent = result.sourceCount;
        if (statPrimary) statPrimary.textContent = result.primaryCount;
        if (statSecondary) statSecondary.textContent = result.secondaryCount || 0;
        if (statRecent) statRecent.textContent = result.recentCount;

        // Update conflict warning
        const conflictWarning = breakdown.querySelector('.conflict-warning');
        if (conflictWarning) {
            if (result.conflictDetected) {
                conflictWarning.classList.remove('hidden');
            } else {
                conflictWarning.classList.add('hidden');
            }
        }

        // Build source list
        const sourceList = breakdown.querySelector('.source-list');
        if (sourceList) {
            const html = result.enrichedSources.map(source => {
                const typeColor = source.sourceType === 'primary' ? '#2B9348' : (source.sourceType === 'secondary' ? '#E9A825' : '#888888');
                return `
                    <div class="source-item">
                        <img class="source-favicon" width="16" height="16" 
                             src="https://www.google.com/s2/favicons?domain=${source.domain}&sz=32" 
                             alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🌐</text></svg>'">
                        <a href="${source.url}" target="_blank" class="source-domain">${source.domain}</a>
                        <span class="source-type-badge" style="color: ${typeColor}; border-color: ${typeColor}">
                            ${source.sourceType.charAt(0).toUpperCase() + source.sourceType.slice(1)}
                        </span>
                    </div>
                `;
            }).join('');
            sourceList.innerHTML = html;
        }

        // Store data for audit log download
        badge.dataset.question = question;
        badge.dataset.answer = answerText;
        badge.dataset.result = JSON.stringify(result);
    }

    /**
     * Toggles the visibility of the breakdown panel.
     * @param {string} id 
     */
    function toggleBreakdown(id) {
        const breakdown = document.getElementById(`breakdown-${id}`);
        if (breakdown) {
            breakdown.classList.toggle('hidden');
        }
    }

    /**
     * Triggers audit log export.
     * @param {string} id 
     */
    function downloadAudit(id) {
        const badge = document.getElementById(`badge-${id}`);
        if (badge && badge.dataset.question && badge.dataset.answer && badge.dataset.result) {
            window.auditLog.exportAuditLog(
                badge.dataset.question,
                badge.dataset.answer,
                JSON.parse(badge.dataset.result)
            );
        }
    }

    /**
     * Builds the initial HTML for answer card confidence components.
     * @param {string} id 
     * @returns {string} HTML string
     */
    function buildAnswerCardHTML(id) {
        return `
            <div class="confidence-wrapper">
                <button class="confidence-badge" id="badge-${id}" onclick="window.confidenceUI.toggleBreakdown('${id}')">
                    <span class="confidence-dot"></span>
                    <span class="confidence-label">Analyzing...</span>
                    <span class="confidence-icon">&#9432;</span>
                </button>
            </div>
            
            <div class="source-breakdown hidden" id="breakdown-${id}">
                <div class="breakdown-header">
                    <span class="breakdown-level"></span>
                    <button class="breakdown-close" onclick="window.confidenceUI.toggleBreakdown('${id}')">&times;</button>
                </div>
                
                <p class="breakdown-explanation"></p>
                
                <div class="breakdown-stats">
                    <div class="stat">
                        <span class="stat-num" id="stat-total-${id}">0</span>
                        <span class="stat-label">Total</span>
                    </div>
                    <div class="stat">
                        <span class="stat-num" id="stat-primary-${id}">0</span>
                        <span class="stat-label">Primary</span>
                    </div>
                    <div class="stat">
                        <span class="stat-num" id="stat-secondary-${id}">0</span>
                        <span class="stat-label">Secondary</span>
                    </div>
                    <div class="stat">
                        <span class="stat-num" id="stat-recent-${id}">0</span>
                        <span class="stat-label">Recent</span>
                    </div>
                </div>
                
                <div class="conflict-warning hidden">
                    Sources contain conflicting information and manual review is recommended.
                </div>
                
                <div class="source-list"></div>
                
                <button class="audit-btn" onclick="window.confidenceUI.downloadAudit('${id}')">Download Audit Log</button>
            </div>
        `;
    }

    // Attach to window
    window.confidenceUI = {
        generateAnswerId,
        applyConfidenceResult,
        toggleBreakdown,
        downloadAudit,
        buildAnswerCardHTML
    };
})();
