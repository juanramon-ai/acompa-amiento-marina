(function () {
  'use strict';

  const cfg = window.MARINA_CONFIG || {};
  const SESSION_KEY = 'marina_chat_session';
  const HISTORY_KEY = 'marina_chat_history';
  const MAX_HISTORY = 40;

  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function getSession() {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) { id = uuid(); localStorage.setItem(SESSION_KEY, id); }
    return id;
  }

  function getHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function saveHistory(h) {
    const trimmed = h.slice(-MAX_HISTORY);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed)); } catch (_) {}
  }

  function build() {
    if (document.getElementById('chat-panel')) return;

    const fab = document.createElement('button');
    fab.className = 'chat-fab';
    fab.setAttribute('aria-label', 'Abrir asistente de Marina');
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.appendChild(fab);

    const wa = document.createElement('a');
    wa.className = 'whatsapp-fab';
    wa.setAttribute('aria-label', 'Escribir a Marina por WhatsApp');
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.setAttribute('data-whatsapp', '');
    wa.innerHTML = '<svg viewBox="0 0 32 32"><path d="M16.001 2.667C8.635 2.667 2.668 8.635 2.668 16c0 2.356.616 4.657 1.787 6.684L2.668 29.333l6.792-1.771A13.26 13.26 0 0 0 16 29.333c7.365 0 13.333-5.968 13.333-13.333S23.366 2.667 16.001 2.667zM16 26.667c-2.01 0-3.986-.54-5.719-1.563l-.41-.243-4.03 1.052 1.077-3.927-.267-.422A10.596 10.596 0 0 1 5.333 16c0-5.882 4.785-10.667 10.667-10.667 5.881 0 10.667 4.785 10.667 10.667S21.881 26.667 16 26.667zm5.844-7.989c-.32-.16-1.893-.935-2.187-1.041-.293-.107-.507-.16-.72.16s-.827 1.041-1.014 1.254c-.187.214-.373.24-.693.08-.32-.16-1.353-.499-2.578-1.592-.952-.85-1.594-1.901-1.781-2.221-.187-.32-.02-.493.14-.653.144-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.214.053-.4-.026-.56-.08-.16-.72-1.74-.987-2.381-.26-.626-.526-.541-.72-.551-.187-.009-.4-.011-.614-.011s-.56.08-.853.4c-.293.32-1.12 1.094-1.12 2.667s1.146 3.094 1.307 3.307c.16.213 2.256 3.445 5.467 4.829.765.331 1.36.528 1.825.676.767.244 1.465.21 2.017.127.615-.091 1.893-.773 2.16-1.52.267-.747.267-1.387.187-1.52-.08-.134-.293-.213-.613-.373z"/></svg>';
    document.body.appendChild(wa);
    if (cfg.WHATSAPP_NUMBER) {
      const msg = encodeURIComponent(cfg.WHATSAPP_PREFILLED || '');
      wa.href = `https://wa.me/${cfg.WHATSAPP_NUMBER}${msg ? '?text=' + msg : ''}`;
    }

    const panel = document.createElement('div');
    panel.id = 'chat-panel';
    panel.className = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Asistente de Marina');
    panel.innerHTML = `
      <div class="chat-header">
        <div>
          <div class="chat-header-name">Asistente de Marina</div>
          <div class="chat-header-status">Respondo en pocas horas</div>
        </div>
        <button class="chat-close" aria-label="Cerrar chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="chat-body" id="chat-body" aria-live="polite"></div>
      <form class="chat-input-row" id="chat-form" autocomplete="off">
        <input class="chat-input" type="text" id="chat-input" placeholder="Escribe tu mensaje..." aria-label="Mensaje" />
        <button class="chat-send" type="submit">Enviar</button>
      </form>
    `;
    document.body.appendChild(panel);

    const body = panel.querySelector('#chat-body');
    const input = panel.querySelector('#chat-input');
    const form = panel.querySelector('#chat-form');
    const closeBtn = panel.querySelector('.chat-close');

    function scrollBottom() { body.scrollTop = body.scrollHeight; }

    function renderMsg(text, role) {
      const el = document.createElement('div');
      el.className = 'chat-msg' + (role === 'user' ? ' is-user' : '');
      el.textContent = text;
      body.appendChild(el);
      scrollBottom();
      return el;
    }

    function renderTyping() {
      const el = document.createElement('div');
      el.className = 'chat-typing';
      el.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(el);
      scrollBottom();
      return el;
    }

    function hydrate() {
      body.innerHTML = '';
      const history = getHistory();
      if (history.length === 0) {
        renderMsg(cfg.CHAT_GREETING || 'Hola, ¿en qué puedo ayudarte?', 'assistant');
      } else {
        history.forEach(m => renderMsg(m.content, m.role));
      }
    }

    async function sendToWebhook(message, history) {
      if (!cfg.N8N_WEBHOOK_URL) {
        await new Promise(r => setTimeout(r, 900));
        return {
          reply: "Gracias por tu mensaje. Marina te contestará personalmente en las próximas horas. Si prefieres, también puedes escribirle por WhatsApp pulsando el botón verde."
        };
      }
      const res = await fetch(cfg.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: getSession(), message, history })
      });
      if (!res.ok) throw new Error('Webhook ' + res.status);
      const data = await res.json();
      return data;
    }

    async function handleSend(text) {
      const history = getHistory();
      renderMsg(text, 'user');
      history.push({ role: 'user', content: text });
      saveHistory(history);

      const typing = renderTyping();
      try {
        const data = await sendToWebhook(text, history);
        typing.remove();
        const reply = (data && (data.reply || data.output || data.text)) || 'He recibido tu mensaje.';
        renderMsg(reply, 'assistant');
        history.push({ role: 'assistant', content: reply });
        saveHistory(history);
      } catch (err) {
        typing.remove();
        renderMsg(cfg.CHAT_ERROR_FALLBACK || 'No puedo responderte por aquí ahora mismo. Puedes escribir a Marina por WhatsApp.', 'assistant');
      }
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      handleSend(text);
    });

    closeBtn.addEventListener('click', () => {
      panel.classList.remove('is-open');
      fab.style.display = 'flex';
    });

    fab.addEventListener('click', () => {
      panel.classList.toggle('is-open');
      if (panel.classList.contains('is-open')) {
        fab.style.display = 'none';
        if (body.children.length === 0) hydrate();
        setTimeout(() => input.focus(), 100);
      }
    });

    hydrate();

    window.MarinaChat = {
      open: () => {
        panel.classList.add('is-open');
        fab.style.display = 'none';
        setTimeout(() => input.focus(), 100);
      },
      close: () => {
        panel.classList.remove('is-open');
        fab.style.display = 'flex';
      },
      reset: () => {
        localStorage.removeItem(HISTORY_KEY);
        hydrate();
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
