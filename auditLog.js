/**
 * auditLog.js
 * Exports a text-based audit log for an answer.
 */

(function() {
    /**
     * Builds and downloads the audit log file.
     * @param {string} question 
     * @param {string} answerText 
     * @param {Object} result 
     */
    function exportAuditLog(question, answerText, result) {
        const timestamp = new Date().toISOString();
        let log = '========================================\n';
        log += 'ANSWER CONFIDENCE AUDIT LOG\n';
        log += '========================================\n';
        log += `Generated: ${timestamp}\n`;
        log += `Query: ${question}\n\n`;

        log += 'CONFIDENCE RESULT\n';
        log += `Level: ${result.level}\n`;
        log += `Explanation: ${result.explanation}\n`;
        log += `Total Sources: ${result.sourceCount}\n`;
        log += `Primary Sources: ${result.primaryCount}\n`;
        log += `Recent Sources: ${result.recentCount}\n`;
        log += `Conflict Flag: ${result.conflictDetected ? 'TRUE' : 'FALSE'}\n\n`;

        log += 'SOURCE DETAILS\n';
        result.enrichedSources.forEach((source, index) => {
            log += `[${index + 1}] ${source.domain}\n`;
            log += `    Type: ${source.sourceType}\n`;
            log += `    URL: ${source.url}\n`;
            log += `    Date: ${source.date || 'Unknown'}\n`;
        });

        log += '\n----------------------------------------\n';
        log += 'Confidence score reflects source quality not factual guarantee.';

        const blob = new Blob([log], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_log_${new Date().getTime()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Attach to window
    window.auditLog = {
        exportAuditLog
    };
})();
