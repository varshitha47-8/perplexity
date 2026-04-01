document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const mainContent = document.querySelector('.center-wrapper');
    const tryComputerSection = document.querySelector('.try-computer-section');
    const logo = document.querySelector('.logo');
    const fileInput = document.getElementById('file-input');
    const attachBtn = document.getElementById('attach-btn');
    const fileBadge = document.getElementById('file-badge');
    const fileNameSpan = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file');

    let chatHistory = [];
    let currentFile = null;

    function appendMessage(role, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = text.replace(/\n/g, '<br>');
        
        messageDiv.appendChild(contentDiv);
        
        // Find or create chat-container
        let chatContainer = document.getElementById('chat-container');
        if (!chatContainer) {
            chatContainer = document.createElement('div');
            chatContainer.id = 'chat-container';
            // Insert before search-container
            const searchContainer = document.querySelector('.search-container');
            mainContent.insertBefore(chatContainer, searchContainer);
            
            // Adjust layout for chat
            mainContent.style.justifyContent = 'flex-start';
            mainContent.style.paddingTop = '40px';
            logo.style.fontSize = '24px';
            logo.style.marginBottom = '20px';
            if (tryComputerSection) tryComputerSection.style.display = 'none';
        }
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function handleSendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Clear input and auto-resize
        userInput.value = '';
        userInput.style.height = 'auto';

        // Add user message to UI
        appendMessage('user', message);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: chatHistory,
                    use_context: !!currentFile
                })
            });

            const data = await response.json();
            
            if (data.error) {
                appendMessage('ai', '<b>Error:</b> ' + data.error);
            } else {
                appendMessage('ai', data.response);
                chatHistory.push({ role: 'user', text: message });
                chatHistory.push({ role: 'ai', text: data.response });
            }

        } catch (error) {
            console.error('Error:', error);
            appendMessage('ai', '<b>Error:</b> Failed to connect to the server. Please check if the Flask app is running.');
        }
    }

    // File Upload Logic
    attachBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.pdf')) {
            alert('Please select a PDF file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            attachBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.error) {
                alert('Upload failed: ' + data.error);
            } else {
                currentFile = data.filename;
                fileNameSpan.textContent = data.filename;
                fileBadge.style.display = 'flex';
                attachBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading file.');
        } finally {
            attachBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
            fileInput.value = ''; // Reset input
        }
    });

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileBadge.style.display = 'none';
        attachBtn.style.display = 'flex';
    });

    sendBtn.addEventListener('click', handleSendMessage);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
});
