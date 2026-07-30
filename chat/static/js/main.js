document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chatForm');
    const userPrompt = document.getElementById('userPrompt');
    const sendBtn = document.getElementById('sendBtn');
    const chatFeed = document.getElementById('chatFeed');
    const welcomeContainer = document.getElementById('welcomeContainer');
    const typingIndicator = document.getElementById('typingIndicator');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const modelSelect = document.getElementById('modelSelect');

    // Sidebar & Modal Elements
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const settingsModal = document.getElementById('settingsModal');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const toggleKeyVis = document.getElementById('toggleKeyVis');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const clearKeyBtn = document.getElementById('clearKeyBtn');
    const keyStatusDot = document.getElementById('keyStatusDot');
    const toastContainer = document.getElementById('toastContainer');

    // Configure Marked.js renderer for custom code blocks
    const renderer = new marked.Renderer();
    renderer.code = function({ text, lang }) {
        const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
        const highlighted = hljs.highlight(text, { language: validLang }).value;
        return `
            <div class="code-block-wrapper">
                <div class="code-header">
                    <span>${validLang.toUpperCase()}</span>
                    <button class="btn-copy-code" onclick="copyCodeSnippet(this)">
                        <i class="fa-regular fa-copy"></i> Sao chép
                    </button>
                </div>
                <pre><code class="hljs ${validLang}">${highlighted}</code></pre>
            </div>
        `;
    };
    marked.setOptions({ renderer: renderer });

    // Load saved API Key from localStorage
    let savedApiKey = localStorage.getItem('gemini_api_key') || '';
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        keyStatusDot.classList.add('active');
    }

    // Toggle Mobile Sidebar
    if (openSidebarBtn) openSidebarBtn.addEventListener('click', () => sidebar.classList.add('active'));
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('active'));

    // Modal Control
    openSettingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
    closeModalBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove('active');
    });

    // Toggle API Key visibility
    toggleKeyVis.addEventListener('click', () => {
        const type = apiKeyInput.type === 'password' ? 'text' : 'password';
        apiKeyInput.type = type;
        toggleKeyVis.innerHTML = type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
    });

    // Save API Key
    saveKeyBtn.addEventListener('click', () => {
        const val = apiKeyInput.value.strip ? apiKeyInput.value.strip() : apiKeyInput.value.trim();
        if (val) {
            localStorage.setItem('gemini_api_key', val);
            savedApiKey = val;
            keyStatusDot.classList.add('active');
            showToast('Đã lưu Gemini API Key thành công!', 'success');
        } else {
            localStorage.removeItem('gemini_api_key');
            savedApiKey = '';
            keyStatusDot.classList.remove('active');
            showToast('Đã xoá API Key khỏi bộ nhớ trình duyệt', 'info');
        }
        settingsModal.classList.remove('active');
    });

    // Clear API Key
    clearKeyBtn.addEventListener('click', () => {
        apiKeyInput.value = '';
        localStorage.removeItem('gemini_api_key');
        savedApiKey = '';
        keyStatusDot.classList.remove('active');
        showToast('Đã xoá API Key', 'info');
    });

    // Auto-resize Textarea
    userPrompt.addEventListener('input', () => {
        userPrompt.style.height = 'auto';
        userPrompt.style.height = Math.min(userPrompt.scrollHeight, 150) + 'px';
    });

    // Shift + Enter for newline, Enter to send
    userPrompt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    // Prompt Chips Click Event
    document.querySelectorAll('.prompt-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const promptText = chip.getAttribute('data-prompt');
            if (promptText) {
                userPrompt.value = promptText;
                userPrompt.style.height = 'auto';
                userPrompt.style.height = Math.min(userPrompt.scrollHeight, 150) + 'px';
                if (window.innerWidth <= 768) sidebar.classList.remove('active');
                chatForm.dispatchEvent(new Event('submit'));
            }
        });
    });

    // Handle Submit
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = userPrompt.value.trim();
        if (!text) return;

        // Hide welcome screen if present
        if (welcomeContainer) welcomeContainer.style.display = 'none';

        // Append User Message to Chat Feed
        appendMessage('user', text);
        userPrompt.value = '';
        userPrompt.style.height = 'auto';
        sendBtn.disabled = true;

        // Show typing indicator
        typingIndicator.style.display = 'flex';
        scrollToBottom();

        try {
            const currentApiKey = localStorage.getItem('gemini_api_key') || (apiKeyInput ? apiKeyInput.value.trim() : '') || '';
            const response = await fetch('/api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: text,
                    api_key: currentApiKey,
                    model: modelSelect.value
                })
            });

            const data = await response.json();

            // Hide typing indicator
            typingIndicator.style.display = 'none';

            if (data.success) {
                appendMessage('ai', data.reply);
            } else {
                appendErrorMessage(data.error || 'Có lỗi xảy ra khi xử lý phản hồi từ AI');
                showToast(data.error || 'Lỗi API', 'error');
            }
        } catch (err) {
            typingIndicator.style.display = 'none';
            appendErrorMessage('Không thể kết nối đến máy chủ Django backend.');
            showToast('Lỗi kết nối mạng', 'error');
        } finally {
            sendBtn.disabled = false;
            scrollToBottom();
        }
    });

    // Clear Chat Event
    const handleClearChat = async () => {
        try {
            await fetch('/api/clear/', { method: 'POST' });
            chatFeed.innerHTML = '';
            chatFeed.appendChild(welcomeContainer);
            welcomeContainer.style.display = 'block';
            showToast('Đã làm mới cuộc trò chuyện', 'success');
        } catch (e) {
            showToast('Lỗi khi xoá chat', 'error');
        }
    };

    clearChatBtn.addEventListener('click', handleClearChat);
    newChatBtn.addEventListener('click', () => {
        handleClearChat();
        if (window.innerWidth <= 768) sidebar.classList.remove('active');
    });

    // Append Chat Bubble
    function appendMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

        const content = document.createElement('div');
        content.className = 'message-content';

        if (sender === 'ai') {
            content.innerHTML = marked.parse(text);
        } else {
            content.textContent = text;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatFeed.appendChild(messageDiv);
        scrollToBottom();
    }

    function appendErrorMessage(errorMsg) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message ai-message';

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        content.style.background = 'rgba(239, 68, 68, 0.1)';
        
        let formattedMsg = `<strong style="color: #f87171;"><i class="fa-solid fa-circle-xmark"></i> Lỗi:</strong> ${errorMsg}`;
        if (errorMsg.includes('API Key')) {
            formattedMsg += `<br><button type="button" class="btn-primary" style="margin-top: 10px; padding: 6px 14px; font-size: 12px;" onclick="document.getElementById('settingsModal').classList.add('active')"><i class="fa-solid fa-key"></i> Mở Bảng Nhập API Key Ngay</button>`;
        }
        
        content.innerHTML = formattedMsg;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatFeed.appendChild(messageDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatFeed.scrollTop = chatFeed.scrollHeight;
    }

    // Toast Notification helper
    function showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info');
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${msg}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3500);
    }
});

// Copy Code Snippet Handler
function copyCodeSnippet(btn) {
    const codeBlock = btn.closest('.code-block-wrapper').querySelector('code');
    const textToCopy = codeBlock.textContent;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check" style="color: #10b981;"></i> Đã chép!';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 2000);
    }).catch(err => {
        alert('Không thể sao chép code: ' + err);
    });
}
