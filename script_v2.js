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

    // New Interactive Elements
    const focusBtn = document.getElementById('focus-btn');
    const focusMenu = document.getElementById('focus-menu');
    const focusText = document.getElementById('focus-text');
    const modelDropdown = document.getElementById('model-dropdown');
    const modelMenu = document.getElementById('model-menu');
    const tabs = document.querySelectorAll('.tab');
    const suggestionList = document.getElementById('suggestion-list');

    let chatHistory = [];
    let currentFile = null;
    let selectedFocus = 'all';
    let selectedModel = 'gemini-2.5-flash';

    const suggestionData = {
        learn: [
            "Create a study guide for a certification or exam",
            "Help me deeply understand a confusing topic",
            "Teach me a new skill with weekly check-ins",
            "Quiz me until I can recall it confidently",
            "Turn my notes into a polished write-up"
        ],
        monitor: [
            "Track the status of my online orders",
            "Alert me when a specific event happens",
            "Watch for price drops on these items",
            "Check for new updates on this project",
            "Summarize news about a specific person/event"
        ],
        prototype: [
            "Build a simple landing page for my app",
            "Create a Python script to automate tasks",
            "Design a database schema for a blog",
            "Write a React component for a dashboard",
            "Generate an API documentation template"
        ],
        organize: [
            "Categorize these notes into groups",
            "Create a workout plan for the week",
            "Plan a 3-day itinerary for my trip",
            "Structure my project tasks into a list",
            "Generate a shopping list from these recipes"
        ]
    };

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
                    use_context: !!currentFile,
                    focus: selectedFocus,
                    model: selectedModel
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

    // --- Interactive Feature Logic ---

    // 1. Suggestion Tabs
    function updateSuggestions(tabKey) {
        suggestionList.classList.add('fade-out');
        
        setTimeout(() => {
            suggestionList.innerHTML = '';
            const items = suggestionData[tabKey] || [];
            
            items.forEach(text => {
                const li = document.createElement('li');
                li.textContent = text;
                li.addEventListener('click', () => {
                    userInput.value = text;
                    userInput.focus();
                    userInput.style.height = 'auto';
                    userInput.style.height = (userInput.scrollHeight) + 'px';
                });
                suggestionList.appendChild(li);
            });
            
            suggestionList.classList.remove('fade-out');
        }, 200);
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateSuggestions(tab.dataset.tab);
        });
    });

    // Initialize suggestions
    updateSuggestions('learn');

    // 2. Focus Dropdown
    focusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        focusMenu.classList.toggle('show');
        modelMenu.classList.remove('show');
    });

    focusMenu.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedFocus = item.dataset.focus;
            focusText.textContent = item.textContent.trim();
            focusMenu.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            focusMenu.classList.remove('show');
        });
    });

    // 3. Model Dropdown
    modelDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        modelMenu.classList.toggle('show');
        focusMenu.classList.remove('show');
    });

    modelMenu.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedModel = item.dataset.model;
            modelDropdown.innerHTML = `${item.textContent.trim()} <i class="fa-solid fa-chevron-down ml-1"></i>`;
            modelMenu.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            modelMenu.classList.remove('show');
        });
    });

    // Close menus on click outside
    document.addEventListener('click', () => {
        focusMenu.classList.remove('show');
        modelMenu.classList.remove('show');
    });

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
