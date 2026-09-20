(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- contato (WhatsApp) ---------- */
  const PHONE = '5521995079506';
  const MSG = 'Gostei da FONTE e quero entrar no beta fechado.';
  const waUrl = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(MSG);
  $$('[data-wa]').forEach(a => (a.href = waUrl));
  const d = PHONE.replace(/^55/, '');
  $('#phone').textContent = '+55 (' + d.slice(0, 2) + ') ' + d.slice(2, -4) + '-' + d.slice(-4);

  /* ---------- h1 palavra por palavra ---------- */
  $$('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words
      .map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`)
      .join(' ');
  });

  /* ---------- revelar ao rolar ---------- */
  $$('[data-reveal]').forEach(el => el.style.setProperty('--d', el.dataset.delay || 0));
  const revealTargets = $$('[data-reveal], [data-split]');
  const onReveal = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      onReveal.unobserve(e.target);
      e.target.dispatchEvent(new CustomEvent('revealed'));
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  revealTargets.forEach(el => onReveal.observe(el));

  /* ---------- barra de progresso + dock ---------- */
  const bar = $('#progress');
  const dock = $('#dock');
  const hero = $('#hero');
  const final = $('#final');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    const pastHero = hero.getBoundingClientRect().bottom < innerHeight * 0.35;
    const finalRect = final.getBoundingClientRect();
    const atFinal = finalRect.top < innerHeight * 0.85;
    dock.classList.toggle('on', pastHero && !atFinal);
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- quadro kanban (FLIP) ---------- */
  const CARDS = {
    a: { text: 'Cenografia · aprovação da maquete', w: 34, tag: '#8fb2ec' },
    b: { text: 'Contratar operador de luz', w: 22, tag: '#4d7fd6' },
    c: { text: 'Figurino · segunda prova do elenco', w: 28, tag: '#595d6c' },
    e: { text: 'Release para imprensa', w: 40, tag: '#595d6c' },
    f: { text: 'Reserva do Teatro Principal', w: 30, tag: '#3f424d' },
    g: { text: 'Fechar roteiro de ensaios', w: 20, tag: '#3f424d' },
  };
  const INITIAL = { doing: ['a', 'b'], wait: ['c', 'e'], done: ['f', 'g'] };
  // cada passo move um card para outra coluna
  const STEPS = [
    ['a', 'done'],
    ['c', 'doing'],
    ['b', 'done'],
    ['e', 'doing'],
  ];

  const cols = {};
  $$('.col').forEach(c => (cols[c.dataset.col] = c));
  const els = {};
  Object.entries(CARDS).forEach(([id, c]) => {
    const el = document.createElement('div');
    el.className = 'kcard';
    el.style.setProperty('--w', c.w + 'px');
    el.style.setProperty('--tag', c.tag);
    el.innerHTML = `<i></i><span>${c.text}</span>`;
    els[id] = el;
  });

  function place(state) {
    Object.entries(state).forEach(([col, ids]) =>
      ids.forEach(id => {
        cols[col].appendChild(els[id]);
        els[id].classList.toggle('is-done', col === 'done');
      }));
  }
  place(INITIAL);

  function move(id, to) {
    const all = Object.values(els);
    const first = new Map(all.map(el => [el, el.getBoundingClientRect()]));
    cols[to].appendChild(els[id]);
    els[id].classList.toggle('is-done', to === 'done');
    all.forEach(el => {
      const a = first.get(el), b = el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) return;
      const isMover = el === els[id];
      if (isMover) el.classList.add('lift');
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) ${isMover ? 'scale(1.06) rotate(-2deg)' : ''}` },
          { transform: 'none' },
        ],
        { duration: isMover ? 800 : 500, easing: 'cubic-bezier(.22,1,.36,1)', delay: isMover ? 0 : 60 }
      ).finished.then(() => el.classList.remove('lift')).catch(() => {});
    });
  }

  let step = 0, boardTimer = null, boardVisible = false;
  function tick() {
    if (!boardVisible || document.hidden) return;
    if (step < STEPS.length) {
      const [id, to] = STEPS[step++];
      move(id, to);
      boardTimer = setTimeout(tick, 2200);
    } else {
      // reinicia com um fade curto
      step = 0;
      const board = $('.cols');
      board.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' }).finished.then(() => {
        place(INITIAL);
        board.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, fill: 'forwards' });
        boardTimer = setTimeout(tick, 1600);
      });
    }
  }
  if (!reduce) {
    new IntersectionObserver(([e]) => {
      boardVisible = e.isIntersecting;
      clearTimeout(boardTimer);
      if (boardVisible) boardTimer = setTimeout(tick, 1400);
    }, { threshold: 0.4 }).observe($('.board'));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && boardVisible) { clearTimeout(boardTimer); boardTimer = setTimeout(tick, 800); }
    });
  } else {
    place({ doing: ['b'], wait: ['c', 'e'], done: ['a', 'f', 'g'] });
  }

  /* ---------- contador ---------- */
  $$('.count').forEach(el => {
    const to = +el.dataset.to;
    const host = el.closest('[data-reveal]') || el;
    host.addEventListener('revealed', () => {
      if (reduce) return;
      const t0 = performance.now(), dur = 1400;
      const run = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(run);
      };
      el.textContent = '0';
      requestAnimationFrame(run);
    }, { once: true });
  });

  /* ---------- notificação push + e-mail ---------- */
  const mail = $('.mail-wrap');
  const push = $('#push');
  const showPush = () => {
    push.classList.remove('show-it');
    void push.offsetWidth;
    push.classList.add('show-it');
  };
  mail.addEventListener('revealed', () => {
    mail.classList.add('in');
    setTimeout(showPush, 300);
  });
  mail.addEventListener('click', () => { if (mail.classList.contains('in')) showPush(); });

  /* ---------- FAQ (acordeão) ---------- */
  $$('.qa').forEach(qa => {
    const btn = $('.q', qa);
    btn.addEventListener('click', () => {
      const open = !qa.classList.contains('open');
      $$('.qa.open').forEach(o => {
        if (o !== qa) { o.classList.remove('open'); $('.q', o).setAttribute('aria-expanded', 'false'); }
      });
      qa.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- toque: destaca card ---------- */
  $$('.tilt').forEach(card => {
    card.addEventListener('touchstart', () => card.classList.add('hot'), { passive: true });
    ['touchend', 'touchcancel'].forEach(ev =>
      card.addEventListener(ev, () => setTimeout(() => card.classList.remove('hot'), 350), { passive: true }));
  });
})();
