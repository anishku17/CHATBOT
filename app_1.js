// Simulated Nhost Auth and GraphQL functionality
class ChatbotApp {
  constructor() {
    this.currentUser = null;
    this.currentChat = null;
    this.chats = [];
    this.messages = {};
    this.isTyping = false;

    this.init();
  }

  init() {
    this.loadUserSession();
    this.bindEvents();
    this.checkAuthState();
  }

  // Authentication Methods
  loadUserSession() {
    const user = localStorage.getItem('chatbot_user');
    if (user) {
      try {
        this.currentUser = JSON.parse(user);
      } catch (e) {
        localStorage.removeItem('chatbot_user');
      }
    }
  }

  saveUserSession(user) {
    this.currentUser = user;
    localStorage.setItem('chatbot_user', JSON.stringify(user));
  }

  clearUserSession() {
    this.currentUser = null;
    localStorage.removeItem('chatbot_user');
    localStorage.removeItem('chatbot_chats');
    localStorage.removeItem('chatbot_messages');
  }

  async signUp(email, password, confirmPassword) {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Simulate API call
    await this.delay(1000);

    // Check if user already exists
    const existingUsers = JSON.parse(localStorage.getItem('chatbot_users') || '[]');
    if (existingUsers.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const user = {
      id: this.generateId(),
      email,
      created_at: new Date().toISOString()
    };

    existingUsers.push({ ...user, password });
    localStorage.setItem('chatbot_users', JSON.stringify(existingUsers));

    this.saveUserSession(user);
    return user;
  }

  async signIn(email, password) {
    // Simulate API call
    await this.delay(1000);

    const existingUsers = JSON.parse(localStorage.getItem('chatbot_users') || '[]');
    const user = existingUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const userSession = {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    };

    this.saveUserSession(userSession);
    return userSession;
  }

  signOut() {
    this.clearUserSession();
    this.showAuthLayout();
  }

  // UI State Management
  checkAuthState() {
    if (this.currentUser) {
      this.showChatLayout();
      this.loadUserChats();
    } else {
      this.showAuthLayout();
    }
  }

  showAuthLayout() {
    const authLayout = document.getElementById('auth-layout');
    const chatLayout = document.getElementById('chat-layout');
    
    if (authLayout) authLayout.classList.remove('hidden');
    if (chatLayout) chatLayout.classList.add('hidden');
    
    this.clearErrors();
  }

  showChatLayout() {
    const authLayout = document.getElementById('auth-layout');
    const chatLayout = document.getElementById('chat-layout');
    const userEmailEl = document.getElementById('user-email');
    
    if (authLayout) authLayout.classList.add('hidden');
    if (chatLayout) chatLayout.classList.remove('hidden');
    if (userEmailEl && this.currentUser) {
      userEmailEl.textContent = this.currentUser.email;
    }
  }

  showLoading(show = true) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      if (show) {
        overlay.classList.remove('hidden');
      } else {
        overlay.classList.add('hidden');
      }
    }
  }

  // Chat Management
  async loadUserChats() {
    const savedChats = localStorage.getItem('chatbot_chats');
    const savedMessages = localStorage.getItem('chatbot_messages');

    if (savedChats) {
      try {
        const allChats = JSON.parse(savedChats);
        this.chats = allChats.filter(chat => chat.user_id === this.currentUser.id);
      } catch (e) {
        this.chats = [];
      }
    }

    if (savedMessages) {
      try {
        this.messages = JSON.parse(savedMessages);
      } catch (e) {
        this.messages = {};
      }
    }

    this.renderChatList();
  }

  async createChat() {
    const chat = {
      id: this.generateId(),
      user_id: this.currentUser.id,
      title: `Chat ${this.chats.length + 1}`,
      created_at: new Date().toISOString()
    };

    this.chats.unshift(chat);
    this.messages[chat.id] = [];
    
    this.saveChatData();
    this.renderChatList();
    this.selectChat(chat.id);

    this.showToast('New chat created', 'success');
    return chat;
  }

  selectChat(chatId) {
    this.currentChat = this.chats.find(c => c.id === chatId);
    if (!this.currentChat) return;

    // Update UI
    document.querySelectorAll('.chat-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (chatItem) {
      chatItem.classList.add('active');
    }

    this.showActiveChat();
    this.renderMessages();
  }

  async deleteChat(chatId) {
    if (!confirm('Are you sure you want to delete this chat?')) return;

    this.chats = this.chats.filter(c => c.id !== chatId);
    delete this.messages[chatId];

    if (this.currentChat && this.currentChat.id === chatId) {
      this.currentChat = null;
      this.showEmptyChat();
    }

    this.saveChatData();
    this.renderChatList();
    this.showToast('Chat deleted', 'success');
  }

  saveChatData() {
    try {
      const allChats = JSON.parse(localStorage.getItem('chatbot_chats') || '[]');
      const otherUserChats = allChats.filter(chat => chat.user_id !== this.currentUser.id);
      const updatedChats = [...otherUserChats, ...this.chats];
      
      localStorage.setItem('chatbot_chats', JSON.stringify(updatedChats));
      localStorage.setItem('chatbot_messages', JSON.stringify(this.messages));
    } catch (e) {
      console.error('Error saving chat data:', e);
    }
  }

  // Message Management
  async sendMessage(content) {
    if (!this.currentChat || !content.trim()) return;

    const userMessage = {
      id: this.generateId(),
      chat_id: this.currentChat.id,
      user_id: this.currentUser.id,
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString()
    };

    // Add user message
    this.messages[this.currentChat.id].push(userMessage);
    this.saveChatData();
    this.renderMessages();

    // Clear input
    const messageTextEl = document.getElementById('message-text');
    if (messageTextEl) {
      messageTextEl.value = '';
      this.updateSendButton();
      this.autoResizeTextarea(messageTextEl);
    }

    // Show typing indicator
    this.showTypingIndicator();

    // Simulate AI response
    await this.delay(1500 + Math.random() * 2000);
    
    const aiResponse = this.generateAIResponse(content);
    const assistantMessage = {
      id: this.generateId(),
      chat_id: this.currentChat.id,
      user_id: this.currentUser.id,
      role: 'assistant',
      content: aiResponse,
      created_at: new Date().toISOString()
    };

    this.hideTypingIndicator();
    this.messages[this.currentChat.id].push(assistantMessage);
    this.saveChatData();
    this.renderMessages();

    // Update chat title if it's the first message
    if (this.messages[this.currentChat.id].length === 2) {
      this.updateChatTitle(content);
    }
  }

  generateAIResponse(userMessage) {
    const responses = [
      "I understand what you're saying. Let me help you with that.",
      "That's an interesting question. Here's what I think:",
      "I'd be happy to help you with that. Let me break it down:",
      "Thanks for asking! Here's my perspective on that:",
      "That's a great point. Let me provide some insights:",
      "I can definitely help you with that. Here's what you should know:",
      "Good question! Let me explain that for you:",
      "I see what you're getting at. Here's my thoughts:"
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Simple keyword-based responses
    const message = userMessage.toLowerCase();
    
    if (message.includes('hello') || message.includes('hi')) {
      return "Hello! How can I help you today?";
    }
    
    if (message.includes('help')) {
      return "I'm here to help! You can ask me questions about various topics, and I'll do my best to provide useful information.";
    }
    
    if (message.includes('weather')) {
      return "I don't have access to real-time weather data, but you can check weather apps or websites for current conditions in your area.";
    }
    
    if (message.includes('time')) {
      return `The current time is ${new Date().toLocaleTimeString()}.`;
    }
    
    return `${randomResponse} ${this.generateContextualResponse(message)}`;
  }

  generateContextualResponse(message) {
    const contextResponses = [
      "Based on what you've shared, I think the best approach would be to break this down into smaller steps.",
      "This is definitely something worth exploring further. Have you considered different perspectives on this?",
      "There are several ways to approach this. What specific aspect would you like to focus on?",
      "That's a complex topic. Let me share some thoughts that might be helpful.",
      "I can see why this would be important to you. Here are some things to consider:"
    ];
    
    return contextResponses[Math.floor(Math.random() * contextResponses.length)];
  }

  updateChatTitle(firstMessage) {
    const title = firstMessage.length > 30 ? 
      firstMessage.substring(0, 30) + '...' : 
      firstMessage;
    
    this.currentChat.title = title;
    this.saveChatData();
    this.renderChatList();
    
    const chatTitleEl = document.getElementById('chat-title');
    if (chatTitleEl) {
      chatTitleEl.textContent = title;
    }
  }

  showTypingIndicator() {
    this.isTyping = true;
    const messagesList = document.getElementById('messages-list');
    
    if (!messagesList) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    
    messagesList.appendChild(indicator);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.isTyping = false;
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // UI Rendering
  renderChatList() {
    const chatListItems = document.getElementById('chat-list-items');
    const emptyState = document.getElementById('chat-list-empty');

    if (!chatListItems || !emptyState) return;

    if (this.chats.length === 0) {
      emptyState.classList.remove('hidden');
      chatListItems.innerHTML = '';
      return;
    }

    emptyState.classList.add('hidden');
    chatListItems.innerHTML = this.chats.map(chat => `
      <div class="chat-item" data-chat-id="${chat.id}">
        <div class="chat-item-title">${this.escapeHtml(chat.title)}</div>
        <div class="chat-item-time">${this.formatTime(chat.created_at)}</div>
      </div>
    `).join('');

    // Add click events
    chatListItems.querySelectorAll('.chat-item').forEach(item => {
      item.addEventListener('click', () => {
        const chatId = item.dataset.chatId;
        this.selectChat(chatId);
      });
    });
  }

  showActiveChat() {
    const chatEmpty = document.getElementById('chat-empty');
    const chatActive = document.getElementById('chat-active');
    const chatTitle = document.getElementById('chat-title');
    
    if (chatEmpty) chatEmpty.classList.add('hidden');
    if (chatActive) chatActive.classList.remove('hidden');
    if (chatTitle && this.currentChat) {
      chatTitle.textContent = this.currentChat.title;
    }
  }

  showEmptyChat() {
    const chatEmpty = document.getElementById('chat-empty');
    const chatActive = document.getElementById('chat-active');
    
    if (chatEmpty) chatEmpty.classList.remove('hidden');
    if (chatActive) chatActive.classList.add('hidden');
  }

  renderMessages() {
    if (!this.currentChat) return;

    const messagesList = document.getElementById('messages-list');
    if (!messagesList) return;

    const messages = this.messages[this.currentChat.id] || [];

    messagesList.innerHTML = messages.map(message => `
      <div class="message ${message.role}">
        <div class="message-avatar">
          <i class="fas fa-${message.role === 'user' ? 'user' : 'robot'}"></i>
        </div>
        <div class="message-body">
          <div class="message-content">${this.escapeHtml(message.content)}</div>
          <div class="message-time">${this.formatTime(message.created_at)}</div>
        </div>
      </div>
    `).join('');

    this.scrollToBottom();
  }

  scrollToBottom() {
    const messagesList = document.getElementById('messages-list');
    if (messagesList) {
      setTimeout(() => {
        messagesList.scrollTop = messagesList.scrollHeight;
      }, 100);
    }
  }

  // Event Handlers
  bindEvents() {
    // Wait for DOM to be ready
    setTimeout(() => {
      this.setupAuthEvents();
      this.setupChatEvents();
      this.setupMessageEvents();
    }, 100);
  }

  setupAuthEvents() {
    // Authentication form toggles
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    
    if (showSignupLink) {
      showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSignupForm();
      });
    }

    if (showLoginLink) {
      showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLoginForm();
      });
    }

    // Authentication forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
      const form = loginForm.querySelector('form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleLogin();
        });
      }
    }

    if (signupForm) {
      const form = signupForm.querySelector('form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSignup();
        });
      }
    }
  }

  setupChatEvents() {
    // Chat actions
    const newChatBtn = document.getElementById('new-chat-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const deleteChatBtn = document.getElementById('delete-chat-btn');

    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        this.createChat();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.signOut();
      });
    }

    if (deleteChatBtn) {
      deleteChatBtn.addEventListener('click', () => {
        if (this.currentChat) {
          this.deleteChat(this.currentChat.id);
        }
      });
    }
  }

  setupMessageEvents() {
    // Message input
    const messageText = document.getElementById('message-text');
    const sendBtn = document.getElementById('send-btn');

    if (messageText) {
      messageText.addEventListener('input', () => {
        this.updateSendButton();
        this.autoResizeTextarea(messageText);
      });

      messageText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        this.handleSendMessage();
      });
    }
  }

  showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) loginForm.classList.remove('hidden');
    if (signupForm) signupForm.classList.add('hidden');
    
    this.clearErrors();
  }

  showSignupForm() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) loginForm.classList.add('hidden');
    if (signupForm) signupForm.classList.remove('hidden');
    
    this.clearErrors();
  }

  async handleLogin() {
    const emailEl = document.getElementById('login-email');
    const passwordEl = document.getElementById('login-password');
    const errorDiv = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-btn');
    
    if (!emailEl || !passwordEl || !errorDiv || !submitBtn) return;

    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const spinner = submitBtn.querySelector('.loading-spinner');
    const text = submitBtn.querySelector('span');

    if (!email || !password) {
      this.showError(errorDiv, 'Please enter both email and password');
      return;
    }

    this.setButtonLoading(submitBtn, spinner, text, true);
    errorDiv.classList.add('hidden');

    try {
      await this.signIn(email, password);
      this.showChatLayout();
      this.loadUserChats();
      this.showToast('Welcome back!', 'success');
    } catch (error) {
      this.showError(errorDiv, error.message);
    } finally {
      this.setButtonLoading(submitBtn, spinner, text, false);
    }
  }

  async handleSignup() {
    const emailEl = document.getElementById('signup-email');
    const passwordEl = document.getElementById('signup-password');
    const confirmEl = document.getElementById('signup-confirm');
    const errorDiv = document.getElementById('signup-error');
    const submitBtn = document.getElementById('signup-btn');
    
    if (!emailEl || !passwordEl || !confirmEl || !errorDiv || !submitBtn) return;

    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const confirmPassword = confirmEl.value;
    const spinner = submitBtn.querySelector('.loading-spinner');
    const text = submitBtn.querySelector('span');

    if (!email || !password || !confirmPassword) {
      this.showError(errorDiv, 'Please fill in all fields');
      return;
    }

    this.setButtonLoading(submitBtn, spinner, text, true);
    errorDiv.classList.add('hidden');

    try {
      await this.signUp(email, password, confirmPassword);
      this.showChatLayout();
      this.loadUserChats();
      this.showToast('Account created successfully!', 'success');
    } catch (error) {
      this.showError(errorDiv, error.message);
    } finally {
      this.setButtonLoading(submitBtn, spinner, text, false);
    }
  }

  handleSendMessage() {
    const messageText = document.getElementById('message-text');
    if (!messageText) return;
    
    const content = messageText.value.trim();
    
    if (content && this.currentChat) {
      this.sendMessage(content);
    }
  }

  updateSendButton() {
    const messageText = document.getElementById('message-text');
    const sendBtn = document.getElementById('send-btn');
    
    if (!messageText || !sendBtn) return;
    
    const hasContent = messageText.value.trim().length > 0;
    sendBtn.disabled = !hasContent || !this.currentChat;
  }

  autoResizeTextarea(textarea) {
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  // Utility Methods
  setButtonLoading(button, spinner, text, loading) {
    if (!button) return;
    
    if (loading) {
      button.disabled = true;
      if (spinner) spinner.classList.remove('hidden');
      if (text) text.style.opacity = '0';
    } else {
      button.disabled = false;
      if (spinner) spinner.classList.add('hidden');
      if (text) text.style.opacity = '1';
    }
  }

  showError(errorDiv, message) {
    if (!errorDiv) return;
    
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  clearErrors() {
    document.querySelectorAll('.error-message').forEach(div => {
      div.classList.add('hidden');
    });
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.chatbotApp = new ChatbotApp();
});