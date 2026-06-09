/* ═══════════════════════════════════════════
    EKA AI — script.js
   General-purpose AI assistant frontend
   No school/college dependency
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ══════════════════════════════
  // 🔧 DOM REFS
  // ══════════════════════════════
  const chat             = document.getElementById('chat');
  const msg              = document.getElementById('msg');
  const send             = document.getElementById('send');
  const mic              = document.getElementById('mic');
  const micStatus        = document.getElementById('mic-status');
  const themeToggle      = document.getElementById('themeToggle');
  const muteToggle       = document.getElementById('muteToggle');
  const voiceOnlyToggle  = document.getElementById('voiceOnlyToggle');
  const languageToggle   = document.getElementById('languageToggle');
  const webToggle        = document.getElementById('webToggle');
  const chips            = document.querySelectorAll('.chip');
  const listeningAnim    = document.getElementById('listeningAnimation');
  const wakeMicButton    = document.getElementById('wakeMicButton');
  const historyList      = document.getElementById('historyList');
  const historyEmpty     = document.getElementById('historyEmpty');
  const clearChatBtn     = document.getElementById('clearChat');
  const clearHistoryBtn  = document.getElementById('clearHistory');
  const sidebarToggle    = document.getElementById('sidebarToggle');
  const sidebar          = document.getElementById('sidebar');
  const hstatDot         = document.querySelector('.hstatus-dot');
  const headerStatusText = document.querySelector('.header-status');

  // ══════════════════════════════
  // 🧠 STATE
  // ══════════════════════════════
  let chatHistory       = [];
  let isMuted           = false;
  let voiceOnly         = false;
  let webSearchEnabled  = false;
  let recognition       = null;
  let isThinking        = false;

  // ══════════════════════════════
  // 🎨 PARTICLE CANVAS BACKGROUND
  // ══════════════════════════════
  (function initCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;

    const dust = [];
    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
      dust.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.3 + 0.04,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.18,
        hue: Math.random() < 0.6 ? 42 : 28,
      });
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      // Vignette
      const vg = ctx.createRadialGradient(W/2,H/2,0, W/2,H/2, Math.max(W,H)*0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      // Dust
      for (const p of dust) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},70%,65%,${p.a})`;
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    frame();
  })();

  // ══════════════════════════════
  // 📱 MOBILE SIDEBAR
  // ══════════════════════════════
  let overlay = null;

  function openSidebar() {
    sidebar.classList.add('open');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', closeSidebar);
    }
    overlay.classList.add('show');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay?.classList.remove('show');
  }

  sidebarToggle?.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  // ══════════════════════════════
  // 🌐 WEB SEARCH TOGGLE
  // ══════════════════════════════
  webToggle?.addEventListener('click', () => {
    webSearchEnabled = !webSearchEnabled;
    webToggle.classList.toggle('active', webSearchEnabled);
    webToggle.setAttribute('aria-pressed', webSearchEnabled);
    webToggle.title = `Web Search (${webSearchEnabled ? 'ON' : 'OFF'})`;
    showToast(webSearchEnabled ? '🌐 Web search enabled' : 'Web search disabled');
  });

  // ══════════════════════════════
  // 🔇 MUTE TOGGLE
  // ══════════════════════════════
  muteToggle?.addEventListener('click', () => {
    isMuted = !isMuted;
    muteToggle.classList.toggle('active', isMuted);
    muteToggle.setAttribute('aria-pressed', isMuted);
    muteToggle.title = isMuted ? 'Unmute voice' : 'Mute voice';
    if (isMuted) speechSynthesis.cancel();
    showToast(isMuted ? '🔇 Voice muted' : '🔊 Voice unmuted');
  });

  // ══════════════════════════════
  // 🎙 VOICE-ONLY MODE
  // ══════════════════════════════
  voiceOnlyToggle?.addEventListener('click', () => {
    voiceOnly = !voiceOnly;
    document.body.classList.toggle('voice-only', voiceOnly);
    voiceOnlyToggle.classList.toggle('active', voiceOnly);
    voiceOnlyToggle.setAttribute('aria-pressed', voiceOnly);

    if (voiceOnly) {
      wakeMicButton.style.display = 'flex';
      speak("Hello, I'm EKA. Tap the mic to speak.");
    } else {
      wakeMicButton.style.display = 'none';
      msg.focus();
    }
    showToast(voiceOnly ? '🎙 Voice-only mode on' : 'Voice-only mode off');
  });

  // ══════════════════════════════
  // 🌙 THEME TOGGLE
  // ══════════════════════════════
  const savedTheme = localStorage.getItem('EKA-theme') || 'dark';
  document.body.classList.toggle('light', savedTheme === 'light');
  document.body.classList.toggle('dark', savedTheme !== 'light');

  themeToggle?.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    document.body.classList.toggle('dark', !isLight);
    localStorage.setItem('EKA-theme', isLight ? 'light' : 'dark');
    updateThemeIcon(isLight);
  });

  function updateThemeIcon(isLight) {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    icon.innerHTML = isLight
      ? `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`
      : `<circle cx="12" cy="12" r="5"/>
         <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
         <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
         <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
         <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  }
  updateThemeIcon(savedTheme === 'light');

  // ══════════════════════════════
  // 🗑️ CLEAR ACTIONS
  // ══════════════════════════════
  clearHistoryBtn?.addEventListener('click', () => {
    chatHistory = [];
    renderHistory();
    showToast('History cleared');
  });

  clearChatBtn?.addEventListener('click', () => {
    chat.innerHTML = '';
    addBubble('Chat cleared. How can I help you?', 'bot', '', true);
    if (!isMuted) speak('Chat cleared. How can I help you?');
  });

  // ══════════════════════════════
  // 📜 HISTORY SIDEBAR
  // ══════════════════════════════
  function renderHistory() {
    historyList.innerHTML = '';
    const userMessages = chatHistory.filter(m => m.role === 'user');
    historyEmpty.style.display = userMessages.length ? 'none' : 'block';

    userMessages.slice(-12).reverse().forEach(m => {
      const li = document.createElement('li');
      li.textContent = m.content.length > 42 ? m.content.slice(0, 42) + '…' : m.content;
      li.title = m.content;
      li.addEventListener('click', () => {
        msg.value = m.content;
        msg.focus();
        closeSidebar();
      });
      historyList.appendChild(li);
    });
  }

  // ══════════════════════════════
  // 💬 ADD CHAT BUBBLE
  // ══════════════════════════════
  function addBubble(text, who = 'bot', source = '', animate = false) {
    if (voiceOnly) return;

    const bubble = document.createElement('div');
    bubble.className = `bubble ${who}`;

    const content = document.createElement('div');
    content.className = 'ai-text';
    bubble.appendChild(content);

    const finalize = () => {
      if (source) {
        const meta = document.createElement('div');
        meta.className = 'meta';
        const badge = document.createElement('span');
        badge.className = 'meta-badge';
        badge.textContent = source;
        meta.appendChild(badge);
        meta.appendChild(document.createTextNode(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })));
        bubble.appendChild(meta);
      }
    };

    if (animate && who === 'bot') {
      let i = 0;
      const raw = text;
      const timer = setInterval(() => {
        if (i < raw.length) {
          i++;
          content.innerHTML = typeof marked !== 'undefined'
            ? marked.parse(raw.slice(0, i))
            : raw.slice(0, i);
          chat.scrollTop = chat.scrollHeight;
        } else {
          clearInterval(timer);
          finalize();
        }
      }, 18);
    } else {
      content.innerHTML = typeof marked !== 'undefined'
        ? marked.parse(text)
        : text;
      finalize();
    }

    chat.appendChild(bubble);
    chat.scrollTop = chat.scrollHeight;
  }

  // ══════════════════════════════
  // ⌨️ TYPING INDICATOR
  // ══════════════════════════════
  function addTyping() {
    if (voiceOnly) return;
    const t = document.createElement('div');
    t.className = 'bubble bot typing';
    t.innerHTML = `<div class="typing-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    t.id = 'typingIndicator';
    chat.appendChild(t);
    chat.scrollTop = chat.scrollHeight;
  }

  function removeTyping() {
    document.getElementById('typingIndicator')?.remove();
  }

  // ══════════════════════════════
  // 🔄 HEADER STATUS
  // ══════════════════════════════
  function setStatus(state) {
    // state: 'ready' | 'thinking' | 'speaking'
    const dot = document.querySelector('.hstatus-dot');
    const label = document.querySelector('.header-status');
    if (!dot || !label) return;
    dot.className = 'hstatus-dot' + (state !== 'ready' ? ` ${state}` : '');
    const map = { ready: 'Ready', thinking: 'Thinking…', speaking: 'Speaking…' };
    // Preserve the dot element, update text node
    label.innerHTML = '';
    label.appendChild(dot);
    label.appendChild(document.createTextNode(' ' + (map[state] || 'Ready')));
  }

  // ══════════════════════════════
  // 📤 SEND MESSAGE
  // ══════════════════════════════
  async function sendMessage(text) {
    const cleaned = text.trim();
    if (!cleaned || isThinking) return;

    chatHistory.push({ role: 'user', content: cleaned });
    renderHistory();
    addBubble(cleaned, 'user', '', false);
    msg.value = '';
    addTyping();
    isThinking = true;
    setStatus('thinking');

    try {
      const res = await fetch('https://eka-dev1.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleaned,
          history: chatHistory,
          wiki: webSearchEnabled
        })
      }).then(r => r.json());

      removeTyping();
      isThinking = false;

      const sourceLabel =
        res.source === 'web+ai' ? '🌐 Web + AI' :
        res.source === 'local'  ? '📁 Cached'  : '🤖 AI';

      chatHistory.push({ role: 'assistant', content: res.reply });
      renderHistory();

      setTimeout(() => {
        addBubble(res.reply, 'bot', sourceLabel, true);
        setStatus('speaking');
        const plainReply = res.reply
          .replace(/(\*\*|__|\*|_|`)/g, '')
          .replace(/<[^>]*>/g, '')
          .replace(/[^\p{L}\p{N}\s.,!?]/gu, '')
          .trim();
        speak(plainReply, () => setStatus('ready'));
      }, 200);

    } catch (err) {
      removeTyping();
      isThinking = false;
      setStatus('ready');
      addBubble('Something went wrong. Please try again.', 'bot');
    }
  }

  // ══════════════════════════════
  // 🔊 TEXT TO SPEECH
  // ══════════════════════════════
  function speak(text, onEnd = null) {
    if (!text || isMuted || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.05;

    const isHindi = /[\u0900-\u097F]/.test(text);
    utter.lang =
      languageToggle.value === 'hi' ? 'hi-IN' :
      languageToggle.value === 'en' ? 'en-GB' :
      isHindi ? 'hi-IN' : 'en-GB';

    utter.onstart = () => {
      listeningAnim.style.display = 'block';
    };
    utter.onend = () => {
      listeningAnim.style.display = 'none';
      if (voiceOnly) wakeMicButton.style.display = 'flex';
      else msg.focus();
      onEnd?.();
    };
    utter.onerror = () => {
      listeningAnim.style.display = 'none';
      onEnd?.();
    };

    speechSynthesis.speak(utter);
  }

  // ══════════════════════════════
  // 🎤 SPEECH RECOGNITION
  // ══════════════════════════════
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      mic.classList.add('mic-active');
      micStatus.textContent = 'Listening…';
      listeningAnim.style.display = 'block';
    };

    recognition.onresult = e => {
      const transcript = e.results[0][0].transcript;
      micStatus.textContent = '';
      sendMessage(transcript);
    };

    recognition.onend = () => {
      mic.classList.remove('mic-active');
      micStatus.textContent = '';
      listeningAnim.style.display = 'none';
      if (!voiceOnly) msg.focus();
    };

    recognition.onerror = () => {
      mic.classList.remove('mic-active');
      micStatus.textContent = '';
      listeningAnim.style.display = 'none';
    };

    mic.addEventListener('click', () => {
      try { recognition.start(); }
      catch (e) { /* already running */ }
    });

    wakeMicButton?.addEventListener('click', () => {
      wakeMicButton.style.display = 'none';
      try { recognition.start(); }
      catch (e) { /* already running */ }
    });
  } else {
    mic.style.display = 'none';
  }

  // ══════════════════════════════
  // 🍞 TOAST NOTIFICATION
  // ══════════════════════════════
  let toastTimer = null;
  function showToast(message) {
    let t = document.getElementById('EKA-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'EKA-toast';
      t.style.cssText = `
        position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(20px);
        background:rgba(30,20,32,0.95); border:1px solid rgba(201,168,76,0.3);
        color:#C9A84C; font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:500;
        padding:9px 20px; border-radius:99px; opacity:0;
        transition:opacity 0.25s ease, transform 0.25s ease;
        pointer-events:none; z-index:9999; white-space:nowrap;
        box-shadow:0 4px 20px rgba(0,0,0,0.4);
      `;
      document.body.appendChild(t);
    }
    t.textContent = message;
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(12px)';
    }, 2400);
  }

  // ══════════════════════════════
  // 🎛️ EVENT BINDINGS
  // ══════════════════════════════
  send.addEventListener('click', () => sendMessage(msg.value));

  msg.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(msg.value);
    }
  });

  chips.forEach(c => c.addEventListener('click', () => {
    sendMessage(c.dataset.q);
    closeSidebar();
  }));

  // Focus recovery — but skip if select or sidebar is targeted
  document.addEventListener('click', e => {
    if (
      !voiceOnly &&
      e.target !== languageToggle &&
      !languageToggle?.contains(e.target) &&
      !sidebar?.contains(e.target) &&
      document.activeElement !== msg
    ) {
      msg.focus();
    }
  });

  // ══════════════════════════════
  // 👋 GREETING
  // ══════════════════════════════
  addBubble(
    `Hello! I'm **EKA**, your AI assistant. ✦\n\nAsk me anything — I can answer questions, explain topics, write content, help with code, or just have a conversation. How can I help you today?`,
    'bot',
    '',
    true
  );

  msg.focus();
  renderHistory();

});
