document.addEventListener('DOMContentLoaded', () => {

  // ── DOM REFS ──
  const chat             = document.getElementById('chat');
  const msg              = document.getElementById('msg');
  const send             = document.getElementById('send');
  const mic              = document.getElementById('mic');
  const micStatus        = document.getElementById('mic-status');
  const muteToggle       = document.getElementById('muteToggle');
  const voiceOnlyToggle  = document.getElementById('voiceOnlyToggle');
  const languageToggle   = document.getElementById('languageToggle');
  const webToggle        = document.getElementById('webToggle');
  const themeToggle      = document.getElementById('themeToggle');
  const speakingAnim     = document.getElementById('speakingAnimation');
  const wakeMicButton    = document.getElementById('wakeMicButton');
  const clearChatBtn     = document.getElementById('clearChat');
  const sidebarToggle    = document.getElementById('sidebarToggle');
  const sidebar          = document.getElementById('sidebar');
  const openSettingsBtn  = document.getElementById('openSettings');
  const userCardBtn      = document.getElementById('userCardBtn');
  const settingsOverlay  = document.getElementById('settingsOverlay');
  const settingsClose    = document.getElementById('settingsClose');
  const userOverlay      = document.getElementById('userOverlay');
  const userClose        = document.getElementById('userClose');
  const settingMute      = document.getElementById('settingMute');
  const settingWeb       = document.getElementById('settingWeb');
  const settingLang      = document.getElementById('settingLang');
  const themeSwatches    = document.querySelectorAll('.theme-swatch');
  const profileName      = document.getElementById('profileName');
  const profileEmail     = document.getElementById('profileEmail');
  const profileAbout     = document.getElementById('profileAbout');
  const saveProfileBtn   = document.getElementById('saveProfile');
  const userAvatarBig    = document.getElementById('userAvatarBig');
  const userAvatarSmall  = document.getElementById('userAvatarSmall');
  const sidebarUserName  = document.getElementById('sidebarUserName');
  const sidebarUserEmail = document.getElementById('sidebarUserEmail');
  const avatarUploadZone = document.getElementById('avatarUploadZone');
  const avatarFileInput  = document.getElementById('avatarFileInput');
  const photoInput       = document.getElementById('photoInput');
  const attachBtn        = document.getElementById('attachBtn');
  const attachPreview    = document.getElementById('attachPreview');
  const attachThumb      = document.getElementById('attachThumb');
  const attachRemove     = document.getElementById('attachRemove');
  const sessionsList     = document.getElementById('sessionsList');
  const sessionsEmpty    = document.getElementById('sessionsEmpty');
  const newSessionBtn    = document.getElementById('newSessionBtn');
  const sessionCountEl   = document.getElementById('sessionCount');
  const clearAllSessions = document.getElementById('clearAllSessions');
  const onboardOverlay   = document.getElementById('onboardOverlay');
  const obSave           = document.getElementById('obSave');
  const obGuest          = document.getElementById('obGuest');
  const obName           = document.getElementById('obName');
  const obEmail          = document.getElementById('obEmail');

  // ── STATE ──
  let chatHistory      = [];
  let isMuted          = false;
  let voiceOnly        = false;
  let webSearchEnabled = false;
  let recognition      = null;
  let isThinking       = false;
  let attachedImage    = null; // base64 string
  let currentSessionId = null;

  // ══════════════════════════════
  // PARTICLE CANVAS
  // ══════════════════════════════
  (function initCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const dust = [];
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    for (let i = 0; i < 80; i++) dust.push({ x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight, r:Math.random()*1.2+0.3, a:Math.random()*0.3+0.04, vx:(Math.random()-0.5)*0.25, vy:(Math.random()-0.5)*0.18, hue:Math.random()<0.6?42:28 });
    function frame() {
      ctx.clearRect(0,0,W,H);
      const vg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.75);
      vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.65)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
      for (const p of dust) { p.x+=p.vx; p.y+=p.vy; if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=`hsla(${p.hue},70%,65%,${p.a})`; ctx.fill(); }
      requestAnimationFrame(frame);
    }
    frame();
  })();

  // ══════════════════════════════
  // DEFINITIVE SIDEBAR FIX
  // Root cause of persistent bug:
  // Both 'click' AND 'touchend' were bound, causing double-fire on mobile.
  // Solution: use ONLY 'click' for everything. On touch devices,
  // touchend → click fires naturally. Never bind both on the same element.
  // ══════════════════════════════
  let sidebarOverlay = null;
  let sidebarJustOpened = false;

  function openSidebar() {
    sidebar.classList.add('open');
    if (!sidebarOverlay) {
      sidebarOverlay = document.createElement('div');
      sidebarOverlay.className = 'sidebar-overlay';
      document.body.appendChild(sidebarOverlay);
      sidebarOverlay.addEventListener('click', (e) => {
        if (sidebarJustOpened) return;
        if (e.target === sidebarOverlay) closeSidebar();
      });
    }
    sidebarJustOpened = true;
    sidebarOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { sidebarJustOpened = false; }, 400);
  }

  function closeSidebar() {
    if (!sidebar.classList.contains('open')) return;
    sidebar.classList.remove('open');
    sidebarOverlay?.classList.remove('show');
    document.body.style.overflow = '';
  }

  // ── Sidebar toggle — CLICK ONLY ──
  sidebarToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  // ── Stop sidebar's OWN clicks from reaching the overlay ──
  sidebar.addEventListener('click', (e) => { e.stopPropagation(); });

  // ── Sidebar action buttons ──
  openSettingsBtn?.addEventListener('click', () => {
    settingMute.checked = isMuted;
    settingWeb.checked  = webSearchEnabled;
    settingLang.value   = languageToggle.value;
    updateSessionCount();
    openModal(settingsOverlay);
  });

  userCardBtn?.addEventListener('click', () => { openModal(userOverlay); });
  clearChatBtn?.addEventListener('click', () => { startNewSession(); });
  newSessionBtn?.addEventListener('click', () => { saveCurrentSession(); startNewSession(); });

  document.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => { sendMessage(c.dataset.q); });
  });

  // ══════════════════════════════
  // MODALS
  // ══════════════════════════════
  function openModal(el) { el.classList.add('open'); }
  function closeModal(el) { el.classList.remove('open'); }

  settingsClose?.addEventListener('click', () => closeModal(settingsOverlay));
  userClose?.addEventListener('click',     () => closeModal(userOverlay));
  settingsOverlay?.addEventListener('click', (e) => { if (e.target === settingsOverlay) closeModal(settingsOverlay); });
  userOverlay?.addEventListener('click',    (e) => { if (e.target === userOverlay) closeModal(userOverlay); });

  // ══════════════════════════════
  // ONBOARDING (first visit)
  // ══════════════════════════════
  function checkOnboarding() {
    const seen = localStorage.getItem('eka-onboarded');
    if (!seen) openModal(onboardOverlay);
  }

  obSave?.addEventListener('click', () => {
    const name  = obName.value.trim();
    const email = obEmail.value.trim();
    if (name) {
      const profile = { name, email };
      localStorage.setItem('eka-profile', JSON.stringify(profile));
      loadProfile();
    }
    localStorage.setItem('eka-onboarded', '1');
    closeModal(onboardOverlay);
    showGreeting();
  });

  obGuest?.addEventListener('click', () => {
    localStorage.setItem('eka-onboarded', '1');
    closeModal(onboardOverlay);
    showGreeting();
  });

  // ══════════════════════════════
  // THEMES
  // ══════════════════════════════
  const THEMES = ['dark','light','purple','grid'];
  function applyTheme(theme) {
    document.body.classList.remove(...THEMES);
    document.body.classList.add(theme);
    localStorage.setItem('eka-theme', theme);
    themeSwatches.forEach(s => s.classList.toggle('active', s.dataset.theme === theme));
    updateThemeIcon(theme === 'light');
  }
  applyTheme(localStorage.getItem('eka-theme') || 'dark');
  themeSwatches.forEach(s => s.addEventListener('click', () => applyTheme(s.dataset.theme)));
  themeToggle?.addEventListener('click', () => {
    const curr = document.body.classList.contains('light') ? 'light' : 'dark';
    applyTheme(curr === 'light' ? 'dark' : 'light');
    showToast(curr === 'light' ? '🌙 Dark mode' : '☀️ Light mode');
  });
  function updateThemeIcon(light) {
    const icon = document.getElementById('themeIcon'); if (!icon) return;
    icon.innerHTML = light
      ? `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`
      : `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  }

  // ══════════════════════════════
  // USER PROFILE + AVATAR PHOTO
  // ══════════════════════════════
  function loadProfile() {
    const p = JSON.parse(localStorage.getItem('eka-profile') || '{}');
    const photo = localStorage.getItem('eka-avatar');

    if (p.name) {
      if (profileName) profileName.value = p.name;
      sidebarUserName.textContent = p.name;
    }
    if (p.email) {
      if (profileEmail) profileEmail.value = p.email;
      sidebarUserEmail.textContent = p.email;
    }
    if (p.about && profileAbout) profileAbout.value = p.about;

    // Avatar: photo takes priority, else initial letter
    if (photo) {
      setAvatarPhoto(photo);
    } else if (p.name) {
      const init = p.name.trim()[0].toUpperCase();
      userAvatarBig.innerHTML = init;
      userAvatarSmall.innerHTML = init;
    }
  }

  function setAvatarPhoto(dataUrl) {
    userAvatarBig.innerHTML   = `<img src="${dataUrl}" alt="avatar" />`;
    userAvatarSmall.innerHTML = `<img src="${dataUrl}" alt="avatar" />`;
    if (document.getElementById('userAvatarBig')) userAvatarBig.innerHTML = `<img src="${dataUrl}" alt="avatar" />`;
  }

  // Tap avatar zone to upload photo
  avatarUploadZone?.addEventListener('click', () => avatarFileInput.click());
  avatarFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      localStorage.setItem('eka-avatar', data);
      setAvatarPhoto(data);
    };
    reader.readAsDataURL(file);
  });

  // Live initial preview
  profileName?.addEventListener('input', () => {
    const v = profileName.value.trim();
    if (!localStorage.getItem('eka-avatar'))
      userAvatarBig.innerHTML = v ? v[0].toUpperCase() : '?';
  });

  saveProfileBtn?.addEventListener('click', () => {
    localStorage.setItem('eka-profile', JSON.stringify({
      name: profileName.value.trim(),
      email: profileEmail.value.trim(),
      about: profileAbout?.value?.trim() || ''
    }));
    loadProfile();
    closeModal(userOverlay);
    showToast('✓ Profile saved');
  });

  loadProfile();

  // ══════════════════════════════
  // SETTINGS CONTROLS
  // ══════════════════════════════
  settingMute?.addEventListener('change', () => { isMuted = settingMute.checked; muteToggle?.classList.toggle('active', isMuted); if (isMuted) speechSynthesis.cancel(); showToast(isMuted ? '🔇 Muted' : '🔊 Unmuted'); });
  settingWeb?.addEventListener('change',  () => { webSearchEnabled = settingWeb.checked; webToggle?.classList.toggle('active', webSearchEnabled); showToast(webSearchEnabled ? '🌐 Web search on' : 'Web search off'); });
  settingLang?.addEventListener('change', () => { if (languageToggle) languageToggle.value = settingLang.value; });
  clearAllSessions?.addEventListener('click', () => { if (confirm('Delete all saved chat history?')) { clearAllChatSessions(); showToast('✓ All history cleared'); updateSessionCount(); } });
  muteToggle?.addEventListener('click', () => { isMuted = !isMuted; muteToggle.classList.toggle('active', isMuted); if (settingMute) settingMute.checked = isMuted; if (isMuted) speechSynthesis.cancel(); showToast(isMuted ? '🔇 Muted' : '🔊 Unmuted'); });
  webToggle?.addEventListener('click', () => { webSearchEnabled = !webSearchEnabled; webToggle.classList.toggle('active', webSearchEnabled); webToggle.setAttribute('aria-pressed', webSearchEnabled); if (settingWeb) settingWeb.checked = webSearchEnabled; showToast(webSearchEnabled ? '🌐 Web search on' : 'Web search off'); });
  voiceOnlyToggle?.addEventListener('click', () => { voiceOnly = !voiceOnly; document.body.classList.toggle('voice-only', voiceOnly); voiceOnlyToggle.classList.toggle('active', voiceOnly); if (voiceOnly) { wakeMicButton.style.display='flex'; speak("Hello, I'm EKA. Tap the mic."); } else { wakeMicButton.style.display='none'; msg.focus(); } showToast(voiceOnly ? '🎙 Voice-only on' : 'Voice-only off'); });

  // ══════════════════════════════
  // PHOTO ATTACH
  // ══════════════════════════════
  attachBtn?.addEventListener('click', () => photoInput.click());
  photoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      attachedImage = ev.target.result;
      attachThumb.src = attachedImage;
      attachPreview.style.display = 'flex';
      attachBtn.classList.add('has-file');
    };
    reader.readAsDataURL(file);
    photoInput.value = '';
  });
  attachRemove?.addEventListener('click', () => {
    attachedImage = null;
    attachPreview.style.display = 'none';
    attachBtn.classList.remove('has-file');
  });

  // ══════════════════════════════
  // CHAT SESSIONS (localStorage)
  // ══════════════════════════════
  function genId() { return 'ses_' + Date.now(); }

  function getAllSessions() {
    try { return JSON.parse(localStorage.getItem('eka-sessions') || '[]'); }
    catch { return []; }
  }

  function saveAllSessions(sessions) {
    localStorage.setItem('eka-sessions', JSON.stringify(sessions));
  }

  function clearAllChatSessions() {
    localStorage.removeItem('eka-sessions');
    renderSessionList();
  }

  function saveCurrentSession() {
    if (!chatHistory.length) return;
    const sessions = getAllSessions();
    const firstMsg  = chatHistory.find(m => m.role === 'user')?.content || 'New chat';
    const title     = firstMsg.slice(0, 40) + (firstMsg.length > 40 ? '…' : '');
    const existing  = sessions.findIndex(s => s.id === currentSessionId);
    const session   = { id: currentSessionId || genId(), title, date: Date.now(), history: chatHistory };
    if (existing >= 0) sessions[existing] = session;
    else sessions.unshift(session);
    saveAllSessions(sessions.slice(0, 30)); // keep max 30 sessions
    renderSessionList();
  }

  function loadSession(id) {
    const sessions = getAllSessions();
    const session  = sessions.find(s => s.id === id);
    if (!session) return;
    saveCurrentSession();
    currentSessionId = session.id;
    chatHistory = session.history || [];
    chat.innerHTML = '';
    chatHistory.forEach(m => {
      if (m.role === 'user')      addBubble(m.content, 'user', '', false);
      else if (m.role === 'assistant') addBubble(m.content, 'bot', '🤖 AI', false);
    });
    renderSessionList();
    closeSidebar();
  }

  function startNewSession() {
    saveCurrentSession();
    currentSessionId = genId();
    chatHistory = [];
    chat.innerHTML = '';
    showGreeting();
    renderSessionList();
  }

  function deleteSession(id, e) {
    e.stopPropagation();
    const sessions = getAllSessions().filter(s => s.id !== id);
    saveAllSessions(sessions);
    if (id === currentSessionId) startNewSession();
    else renderSessionList();
  }

  function renderSessionList() {
    sessionsList.innerHTML = '';
    const sessions = getAllSessions();
    sessionsEmpty.style.display = sessions.length ? 'none' : 'block';
    sessions.forEach(s => {
      const item = document.createElement('div');
      item.className = 'session-item' + (s.id === currentSessionId ? ' active' : '');
      const date = new Date(s.date).toLocaleDateString([], { month:'short', day:'numeric' });
      item.innerHTML = `<span class="session-title">${s.title}</span><span class="session-date">${date}</span><button class="session-del" title="Delete">✕</button>`;
      item.addEventListener('click', () => loadSession(s.id));
      item.querySelector('.session-del').addEventListener('click', (e) => deleteSession(s.id, e));
      sessionsList.appendChild(item);
    });
    updateSessionCount();
  }

  function updateSessionCount() {
    const n = getAllSessions().length;
    if (sessionCountEl) sessionCountEl.textContent = `${n} session${n !== 1 ? 's' : ''}`;
  }

  // Auto-save every message
  function autosave() { saveCurrentSession(); }

  // ══════════════════════════════
  // BUBBLE with action bar
  // ══════════════════════════════
  function addBubble(text, who = 'bot', source = '', animate = false, imgData = null) {
    if (voiceOnly) return;

    const row = document.createElement('div');
    row.className = `bubble-row ${who}`;

    const bubble = document.createElement('div');
    bubble.className = `bubble ${who}`;

    // Image (for user photo attachments)
    if (imgData) {
      const img = document.createElement('img');
      img.src = imgData; img.className = 'bubble-img'; img.alt = 'attached image';
      bubble.appendChild(img);
    }

    const content = document.createElement('div');
    content.className = 'ai-text';
    bubble.appendChild(content);

    const finalize = () => {
      if (source) {
        const meta = document.createElement('div'); meta.className = 'meta';
        const badge = document.createElement('span'); badge.className = 'meta-badge'; badge.textContent = source;
        meta.appendChild(badge);
        meta.appendChild(document.createTextNode(new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })));
        bubble.appendChild(meta);
      }
    };

    if (animate && who === 'bot') {
      let i = 0; const raw = text;
      const timer = setInterval(() => {
        if (i < raw.length) { i++; content.innerHTML = typeof marked !== 'undefined' ? marked.parse(raw.slice(0,i)) : raw.slice(0,i); chat.scrollTop = chat.scrollHeight; }
        else { clearInterval(timer); finalize(); }
      }, 16);
    } else {
      content.innerHTML = typeof marked !== 'undefined' ? marked.parse(text) : text;
      finalize();
    }

    row.appendChild(bubble);

    // Action bar: copy + thumbs (only for bot), copy for user
    const actions = document.createElement('div');
    actions.className = 'bubble-actions';

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'bact-btn'; copyBtn.title = 'Copy'; copyBtn.innerHTML = '📋';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText(text).then(() => {
        copyBtn.innerHTML = '✓'; copyBtn.classList.add('copied');
        setTimeout(() => { copyBtn.innerHTML = '📋'; copyBtn.classList.remove('copied'); }, 1500);
      });
    });
    actions.appendChild(copyBtn);

    if (who === 'bot') {
      const likeBtn = document.createElement('button');
      likeBtn.className = 'bact-btn'; likeBtn.title = 'Good response'; likeBtn.innerHTML = '👍';
      likeBtn.addEventListener('click', () => {
        likeBtn.classList.toggle('liked');
        dislikeBtn.classList.remove('disliked');
        showToast(likeBtn.classList.contains('liked') ? '👍 Thanks for the feedback!' : '');
      });

      const dislikeBtn = document.createElement('button');
      dislikeBtn.className = 'bact-btn'; dislikeBtn.title = 'Bad response'; dislikeBtn.innerHTML = '👎';
      dislikeBtn.addEventListener('click', () => {
        dislikeBtn.classList.toggle('disliked');
        likeBtn.classList.remove('liked');
        showToast(dislikeBtn.classList.contains('disliked') ? '👎 Feedback noted, will improve!' : '');
      });

      actions.appendChild(likeBtn);
      actions.appendChild(dislikeBtn);
    }

    row.appendChild(actions);
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
  }

  function addTyping() {
    if (voiceOnly) return;
    const t = document.createElement('div'); t.className = 'bubble bot typing'; t.id = 'typingIndicator';
    t.innerHTML = `<div class="typing-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    chat.appendChild(t); chat.scrollTop = chat.scrollHeight;
  }
  function removeTyping() { document.getElementById('typingIndicator')?.remove(); }

  // ══════════════════════════════
  // STATUS
  // ══════════════════════════════
  function setStatus(state) {
    const dot = document.querySelector('.hstatus-dot');
    const label = document.querySelector('.header-status');
    if (!dot || !label) return;
    dot.className = 'hstatus-dot' + (state !== 'ready' ? ` ${state}` : '');
    const map = { ready:'Ready', thinking:'Thinking…', speaking:'Speaking…' };
    label.innerHTML = ''; label.appendChild(dot);
    label.appendChild(document.createTextNode(' ' + (map[state] || 'Ready')));
  }

  // ══════════════════════════════
  // SEND MESSAGE
  // ══════════════════════════════
  async function sendMessage(text) {
    const cleaned = text.trim();
    if (!cleaned && !attachedImage) return;
    if (isThinking) return;

    const imageToSend = attachedImage;
    if (attachedImage) { attachedImage = null; attachPreview.style.display = 'none'; attachBtn.classList.remove('has-file'); }

    chatHistory.push({ role:'user', content: cleaned || '[image attached]' });
    addBubble(cleaned || '', 'user', '', false, imageToSend);
    msg.value = '';
    addTyping(); isThinking = true; setStatus('thinking');

    try {
      const body = { message: cleaned || 'Please analyse this image.', history: chatHistory, wiki: webSearchEnabled };
      if (imageToSend) body.image = imageToSend;

      const res = await fetch('https://eka-dev1.onrender.com/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
      }).then(r => r.json());

      removeTyping(); isThinking = false;
      const srcLabel = res.source === 'web+ai' ? '🌐 Web + AI' : res.source === 'local' ? '📁 Cached' : '🤖 AI';
      chatHistory.push({ role:'assistant', content: res.reply });

      setTimeout(() => {
        addBubble(res.reply, 'bot', srcLabel, true);
        setStatus('speaking');
        const plain = res.reply.replace(/(\*\*|__|[\*_`])/g,'').replace(/<[^>]*>/g,'').replace(/[^\p{L}\p{N}\s.,!?]/gu,'').trim();
        speak(plain, () => setStatus('ready'));
        autosave();
      }, 200);
    } catch {
      removeTyping(); isThinking = false; setStatus('ready');
      addBubble('Something went wrong. Please try again.', 'bot');
    }
  }

  // ══════════════════════════════
  // TTS — uses waveform animation
  // ══════════════════════════════
  function speak(text, onEnd = null) {
    if (!text || isMuted || !('speechSynthesis' in window)) { onEnd?.(); return; }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0; utter.pitch = 1.05;
    const isHindi = /[\u0900-\u097F]/.test(text);
    utter.lang = languageToggle.value === 'hi' ? 'hi-IN' : languageToggle.value === 'en' ? 'en-GB' : isHindi ? 'hi-IN' : 'en-GB';
    utter.onstart = () => { speakingAnim.style.display = 'flex'; };
    utter.onend   = () => { speakingAnim.style.display = 'none'; if (voiceOnly) wakeMicButton.style.display = 'flex'; else msg.focus(); onEnd?.(); };
    utter.onerror = () => { speakingAnim.style.display = 'none'; onEnd?.(); };
    speechSynthesis.speak(utter);
  }

  // ══════════════════════════════
  // SPEECH RECOGNITION
  // ══════════════════════════════
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    recognition = new SR(); recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-IN';
    recognition.onstart  = () => { mic.classList.add('mic-active'); micStatus.textContent = 'Listening…'; };
    recognition.onresult = e => { micStatus.textContent = ''; sendMessage(e.results[0][0].transcript); };
    recognition.onend    = () => { mic.classList.remove('mic-active'); micStatus.textContent = ''; if (!voiceOnly) msg.focus(); };
    recognition.onerror  = () => { mic.classList.remove('mic-active'); micStatus.textContent = ''; };
    mic.addEventListener('click', () => { try { recognition.start(); } catch(e){} });
    wakeMicButton?.addEventListener('click', () => { wakeMicButton.style.display='none'; try { recognition.start(); } catch(e){} });
  } else { mic.style.display = 'none'; }

  // ══════════════════════════════
  // TOAST
  // ══════════════════════════════
  let toastTimer = null;
  function showToast(message) {
    if (!message) return;
    let t = document.getElementById('eka-toast');
    if (!t) { t = document.createElement('div'); t.id = 'eka-toast'; t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:rgba(30,20,32,0.97);border:1px solid rgba(201,168,76,0.3);color:#C9A84C;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:500;padding:9px 20px;border-radius:99px;opacity:0;transition:opacity 0.25s ease,transform 0.25s ease;pointer-events:none;z-index:9999;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.5);`; document.body.appendChild(t); }
    t.textContent = message;
    t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(12px)'; }, 2400);
  }

  // ══════════════════════════════
  // EVENT BINDINGS
  // ══════════════════════════════
  send.addEventListener('click', () => sendMessage(msg.value));
  msg.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(msg.value); } });

  // Keyboard viewport fix
  if (window.visualViewport) {
    let lastH = window.visualViewport.height;
    window.visualViewport.addEventListener('resize', () => { const h = window.visualViewport.height; if (lastH - h > 80) requestAnimationFrame(() => { chat.scrollTop = chat.scrollHeight; }); lastH = h; });
    msg.addEventListener('focus', () => { setTimeout(() => { chat.scrollTop = chat.scrollHeight; }, 320); });
  }

  // ══════════════════════════════
  // GREETING
  // ══════════════════════════════
  function showGreeting() {
    const p = JSON.parse(localStorage.getItem('eka-profile') || '{}');
    const greeting = p.name
      ? `Hello **${p.name}**! 👋 I'm **EKA**, your AI assistant. ✦\n\nHow can I help you today?`
      : `Hello! I'm **EKA**, your AI assistant. ✦\n\nAsk me anything — questions, code, writing, analysis, or just a chat. How can I help?`;
    addBubble(greeting, 'bot', '', true);
  }

  // ══════════════════════════════
  // INIT
  // ══════════════════════════════
  currentSessionId = genId();
  renderSessionList();
  checkOnboarding();

  // If onboarding already done, show greeting directly
  if (localStorage.getItem('eka-onboarded')) showGreeting();

  msg.focus();

});
