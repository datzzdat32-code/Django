document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chatForm');
    const userPrompt = document.getElementById('userPrompt');
    const sendBtn = document.getElementById('sendBtn');
    const micBtn = document.getElementById('micBtn');
    const clearInputBtn = document.getElementById('clearInputBtn');
    const chatFeed = document.getElementById('chatFeed');
    const welcomeContainer = document.getElementById('welcomeContainer');
    const typingIndicator = document.getElementById('typingIndicator');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const modelSelect = document.getElementById('modelSelect');
    const turnCounter = document.getElementById('turnCounter');

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

    let totalTurns = 0;

    // Configure Marked.js renderer for custom code blocks
    const renderer = new marked.Renderer();
    renderer.code = function({ text, lang }) {
        const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
        const highlighted = hljs.highlight(text, { language: validLang }).value;
        return `
            <div class="code-block-wrapper">
                <div class="code-header">
                    <span><i class="fa-solid fa-code"></i> ${validLang.toUpperCase()}</span>
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

    // Voice Input (Web Speech Recognition API)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isListening = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'vi-VN';
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            micBtn.classList.add('mic-active');
            micBtn.innerHTML = '<i class="fa-solid fa-waveform"></i>';
            showToast('Đang lắng nghe giọng nói tiếng Việt...', 'info');
        };

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            userPrompt.value += (userPrompt.value ? ' ' : '') + transcript;
            userPrompt.dispatchEvent(new Event('input'));
            showToast('Đã nhận diện giọng nói!', 'success');
        };

        recognition.onerror = (e) => {
            showToast('Không nhận diện được giọng nói. Thử lại!', 'error');
            stopListening();
        };

        recognition.onend = () => {
            stopListening();
        };

        micBtn.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        micBtn.addEventListener('click', () => {
            showToast('Trình duyệt của bạn không hỗ trợ Nhập liệu giọng nói.', 'info');
        });
    }

    function stopListening() {
        isListening = false;
        micBtn.classList.remove('mic-active');
        micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
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
        const val = apiKeyInput.value.trim();
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

    // Auto-resize Textarea & Clear Input Button
    userPrompt.addEventListener('input', () => {
        userPrompt.style.height = 'auto';
        userPrompt.style.height = Math.min(userPrompt.scrollHeight, 150) + 'px';
        clearInputBtn.style.display = userPrompt.value.trim() ? 'block' : 'none';
    });

    if (clearInputBtn) {
        clearInputBtn.addEventListener('click', () => {
            userPrompt.value = '';
            userPrompt.style.height = 'auto';
            clearInputBtn.style.display = 'none';
        });
    }

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
                userPrompt.dispatchEvent(new Event('input'));
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
        if (clearInputBtn) clearInputBtn.style.display = 'none';
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
                totalTurns++;
                if (turnCounter) turnCounter.textContent = `${totalTurns} lượt chat`;
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
            totalTurns = 0;
            if (turnCounter) turnCounter.textContent = `0 lượt chat`;
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
        avatar.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user-astronaut"></i>' : '<i class="fa-solid fa-robot"></i>';

        const content = document.createElement('div');
        content.className = 'message-content';

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        if (sender === 'ai') {
            const markdownBody = marked.parse(text);
            content.innerHTML = `
                <div class="message-body">${markdownBody}</div>
                <div class="message-actions">
                    <button class="action-btn" onclick="copyMessageText(this)" title="Sao chép nội dung">
                        <i class="fa-regular fa-copy"></i> Copy
                    </button>
                    <button class="action-btn" onclick="speakMessageText(this)" title="Đọc phản hồi bằng giọng nói">
                        <i class="fa-solid fa-volume-high"></i> Đọc
                    </button>
                    <span class="message-time"><i class="fa-regular fa-clock"></i> ${timeStr}</span>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="message-body">${escapeHtml(text)}</div>
                <div class="message-actions" style="justify-content: flex-end;">
                    <span class="message-time"><i class="fa-regular fa-clock"></i> ${timeStr}</span>
                </div>
            `;
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
        content.style.background = 'rgba(239, 68, 68, 0.12)';
        
        let formattedMsg = `<strong style="color: #f87171;"><i class="fa-solid fa-circle-xmark"></i> Lỗi xử lý:</strong> ${errorMsg}`;
        if (errorMsg.includes('API Key')) {
            formattedMsg += `<br><button type="button" class="btn-primary" style="margin-top: 10px; padding: 6px 14px; font-size: 12px;" onclick="document.getElementById('settingsModal').classList.add('active')"><i class="fa-solid fa-key"></i> Mở Bảng Cấu Hình API Key</button>`;
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

    function escapeHtml(string) {
        return String(string).replace(/[&<>"']/g, function (s) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[s];
        });
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

// Copy Full Message Text Handler
function copyMessageText(btn) {
    const body = btn.closest('.message-content').querySelector('.message-body');
    const text = body.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check" style="color: #10b981;"></i> Đã chép!';
        setTimeout(() => btn.innerHTML = original, 2000);
    });
}

// Text to Speech Handler
function speakMessageText(btn) {
    const body = btn.closest('.message-content').querySelector('.message-body');
    const text = body.textContent;

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any active speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        
        btn.innerHTML = '<i class="fa-solid fa-volume-high" style="color: #10b981;"></i> Đang đọc...';
        utterance.onend = () => {
            btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Đọc';
        };
        utterance.onerror = () => {
            btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Đọc';
        };
        
        window.speechSynthesis.speak(utterance);
    } else {
        alert('Trình duyệt không hỗ trợ Đọc bằng giọng nói.');
    }
}

