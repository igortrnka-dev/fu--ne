/* FU—NE · interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Language ---------- */
  const I18N = window.FUNE_I18N || { sk: {}, ui: { en: {}, sk: {} } };
  const store = {
    get() { try { return localStorage.getItem('fune-lang'); } catch { return null; } },
    set(v) { try { localStorage.setItem('fune-lang', v); } catch {} },
  };
  let lang = (() => {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'sk' || q === 'en') return q;
    const s = store.get();
    if (s === 'sk' || s === 'en') return s;
    return /^(sk|cs)\b/i.test(navigator.language || '') ? 'sk' : 'en';
  })();
  const T = (en) => (lang === 'sk' && I18N.sk[en]) || en;
  const UI = (k) => (I18N.ui[lang] || I18N.ui.en)[k];

  /* ---------- Load ---------- */
  const markLoaded = () => requestAnimationFrame(() => document.body.classList.add('loaded'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(markLoaded); else window.addEventListener('load', markLoaded);
  setTimeout(markLoaded, 1200);

  /* ---------- Scroll progress ---------- */
  const bar = $('.progress');
  const onScrollProgress = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
  };

  /* ---------- Menu ---------- */
  const burger = $('.burger');
  const menu = $('#menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    $$('.menu nav a').forEach((a, i) => { a.style.transitionDelay = open ? (0.15 + i * 0.035) + 's' : '0s'; });
  };
  burger.addEventListener('click', () => setMenu(true));
  $$('[data-close-menu], .menu a').forEach(el => el.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Ticks ---------- */
  $$('.ticks').forEach(t => {
    const a = +t.dataset.active;
    t.innerHTML = Array.from({ length: 10 }, (_, i) => `<i class="${i + 1 === a ? 'on' : ''}"></i>`).join('');
  });

  /* ---------- Odometer ---------- */
  $$('.odo').forEach(el => {
    const v = el.dataset.value;
    el.setAttribute('aria-label', v);
    el.innerHTML = [...v].map(ch => {
      if (!/\d/.test(ch)) return `<span>${ch}</span>`;
      const col = Array.from({ length: 20 }, (_, i) => `<i>${i % 10}</i>`).join('');
      return `<span class="d" data-d="${ch}"><span>${col}</span></span>`;
    }).join('');
  });
  const runOdo = (el) => {
    $$('.d', el).forEach((d, i) => {
      const n = +d.dataset.d + 10;
      const inner = d.firstElementChild;
      inner.style.transitionDelay = (i * 0.08) + 's';
      inner.style.transform = `translateY(-${n}em)`;
    });
  };

  /* ---------- Pixel masks ---------- */
  $$('.pixmask').forEach(m => {
    const [c, r] = m.dataset.pix.split('x').map(Number);
    m.style.gridTemplateColumns = `repeat(${c}, 1fr)`;
    m.style.gridTemplateRows = `repeat(${r}, 1fr)`;
    const cells = c * r;
    let html = '';
    for (let i = 0; i < cells; i++) html += `<i style="transition-delay:${(Math.random() * 0.9).toFixed(2)}s"></i>`;
    m.innerHTML = html;
  });

  /* ---------- Dot fields ---------- */
  $$('[data-dots]').forEach(f => {
    const n = +f.dataset.dots;
    f.innerHTML = '<i></i>'.repeat(n);
    const dots = $$('i', f);
    if (reduce) return;
    setInterval(() => {
      dots.forEach(d => d.classList.remove('hi'));
      for (let k = 0; k < 4; k++) dots[Math.floor(Math.random() * n)].classList.add('hi');
    }, 900);
  });

  /* ---------- Statement words ---------- */
  const words = $('[data-words]');
  const wordsEN = words ? words.textContent.trim() : '';
  let wordEls = [];
  const renderWords = () => {
    if (!words) return;
    words.innerHTML = T(wordsEN).split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    wordEls = $$('.w', words);
  };
  renderWords();
  const onScrollWords = () => {
    if (!words) return;
    const r = words.getBoundingClientRect();
    const start = innerHeight * 0.85, end = innerHeight * 0.3;
    const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.6)));
    const k = Math.round(p * wordEls.length);
    wordEls.forEach((w, i) => w.classList.toggle('on', i < k));
  };

  /* ---------- Parallax gems ---------- */
  const polys = $$('.poly');
  const onScrollPoly = () => {
    polys.forEach(p => {
      const r = p.parentElement.getBoundingClientRect();
      const s = parseFloat(p.dataset.speed);
      p.style.transform = `translateY(${(r.top) * s}px)`;
    });
  };

  /* ---------- Reveal + "in view" triggers ---------- */
  const triggers = new Map();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      const fn = triggers.get(e.target);
      if (fn) fn(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

  $$('.reveal').forEach(el => io.observe(el));
  const onView = (el, fn) => { if (!el) return; triggers.set(el, fn); io.observe(el); };

  $$('.odo').forEach(el => onView(el, runOdo));
  $$('.pixmask').forEach(el => onView(el, m => setTimeout(() => m.classList.add('go'), 150)));
  $$('[data-progress]').forEach(el => onView(el, b => { b.style.width = b.dataset.progress + '%'; }));
  onView($('.core'), c => c.classList.add('in'));

  /* ---------- Services accordion ---------- */
  const svcs = $$('.svc');
  const openSvc = (s) => svcs.forEach(x => x.classList.toggle('open', x === s));
  svcs.forEach(s => {
    s.addEventListener('click', () => openSvc(s));
    s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSvc(s); } });
    if (matchMedia('(hover:hover) and (min-width:1025px)').matches) s.addEventListener('mouseenter', () => openSvc(s));
  });

  /* ---------- Generic slider helper ---------- */
  function slider(root, count, render, { auto = 0 } = {}) {
    let i = 0, timer;
    const pager = $('[data-pager]', root);
    if (pager) {
      pager.innerHTML = Array.from({ length: count }, () => '<i></i>').join('');
      $$('i', pager).forEach((d, k) => d.addEventListener('click', () => go(k)));
    }
    const go = (k, first) => {
      i = (k + count) % count;
      if (pager) $$('i', pager).forEach((d, n) => d.classList.toggle('on', n === i));
      render(i, first);
      if (auto) { clearInterval(timer); timer = setInterval(() => go(i + 1), auto); }
    };
    $('[data-prev]', root)?.addEventListener('click', () => go(i - 1));
    $('[data-next]', root)?.addEventListener('click', () => go(i + 1));
    go(0, true);
    return { go, get index() { return i; } };
  }

  const swap = (els, fn, first) => {
    if (first || reduce) { fn(); return; }
    els.forEach(e => e.classList.add('out'));
    setTimeout(() => { fn(); els.forEach(e => e.classList.remove('out')); }, 320);
  };

  /* ---------- Process ---------- */
  const steps = [
    {
      i: 'i-target',
      en: { t: 'Step 1 — Strategy & Audit', p: 'We analyse your niche, audience and goals and design the right roster of AI models and channels.', n: '48', u: 'h', l: 'Strategy delivery time' },
      sk: { t: 'Krok 1 — Stratégia a audit', p: 'Analyzujeme vašu niku, publikum a ciele a navrhneme správnu zostavu AI modelov a kanálov.', n: '48', u: 'h', l: 'Dodanie stratégie' },
    },
    {
      i: 'i-persona',
      en: { t: 'Step 2 — Model Creation', p: 'We create each persona — visual identity, personality, voice and content style — and test it with real audiences.', n: '7', u: 'days', l: 'Average model creation' },
      sk: { t: 'Krok 2 — Tvorba modelov', p: 'Vytvoríme každú persónu — vizuálnu identitu, osobnosť, hlas a štýl obsahu — a otestujeme ju na skutočnom publiku.', n: '7', u: 'dní', l: 'Priemerná tvorba modelu' },
    },
    {
      i: 'i-workflow',
      en: { t: 'Step 3 — Automation Setup', p: 'We connect content generation, fan chat and scheduled publishing into one automated pipeline with a live dashboard.', n: '2', u: 'weeks', l: 'Average time to launch' },
      sk: { t: 'Krok 3 — Nastavenie automatizácie', p: 'Prepojíme generovanie obsahu, chat s fanúšikmi a plánované publikovanie do jedného automatizovaného procesu so živým dashboardom.', n: '2', u: 'týždne', l: 'Priemerný čas spustenia' },
    },
    {
      i: 'i-trend',
      en: { t: 'Step 4 — Manage & Scale', p: 'We run your models every day, monitor quality and revenue, and scale the ones that perform.', n: '24/7', u: '', l: 'Monitoring & support' },
      sk: { t: 'Krok 4 — Správa a škálovanie', p: 'Vaše modely prevádzkujeme každý deň, sledujeme kvalitu aj tržby a škálujeme tie, ktoré fungujú.', n: '24/7', u: '', l: 'Monitoring a podpora' },
    },
  ];
  const proc = $('[data-process]');
  let procSlider;
  if (proc) {
    const sw = $$('.proc-swap', proc);
    const art = $('.proc-img .art-cover', proc);
    procSlider = slider(proc, steps.length, (k, first) => {
      const s = steps[k][lang];
      $('[data-icon]', proc)?.setAttribute('href', '#' + steps[k].i);
      swap(sw, () => {
        $('[data-title]', proc).textContent = s.t;
        $('[data-text]', proc).textContent = s.p;
        $('[data-num]', proc).textContent = s.n;
        $('[data-unit]', proc).textContent = s.u;
        $('[data-label]', proc).textContent = s.l;
      }, first);
      if (!first && art) { art.style.opacity = 0; setTimeout(() => { art.style.filter = `hue-rotate(${k * 0}deg) brightness(${1 - k * 0.12})`; art.style.opacity = 1; }, 320); }
    }, { auto: 7000 });
  }

  /* ---------- Analytics ---------- */
  // Donut
  const donut = $('[data-donut]');
  if (donut) {
    const C = 2 * Math.PI * 66;
    const segs = $$('[data-seg]', donut);
    segs.forEach(c => { c.style.strokeDasharray = `0 ${C}`; });
    onView(donut, () => {
      segs.forEach(c => {
        const len = (+c.dataset.seg / 100) * C - 2;
        c.style.strokeDasharray = `${len} ${C}`;
        c.style.strokeDashoffset = -((+c.dataset.off / 100) * C);
      });
    });
  }

  // Uptime bars
  const ub = $('[data-ubars]');
  if (ub) {
    const n = 30;
    ub.innerHTML = Array.from({ length: n }, (_, i) => {
      const fill = i < 14 ? 100 : i < 22 ? Math.max(18, 100 - (i - 13) * 11) : 0;
      return `<i style="--h:${fill}%;--dl:${(i * 0.035).toFixed(2)}s"></i>`;
    }).join('');
    onView(ub, el => el.classList.add('go'));
  }

  // Line chart + tooltip
  const lc = $('[data-line]');
  if (lc) {
    const pts = [[52, 188, '02:00 · €180'], [70, 184, '04:00 · €640'], [88, 178, '06:00 · €1.3k'], [106, 170, '08:00 · €2.2k'], [124, 156, '10:00 · €3.8k'], [142, 140, '12:00 · €5.5k']];
    const tip = $('[data-tip]', lc);
    let k = 0;
    const place = () => {
      const svg = $('svg', lc);
      const sx = svg.clientWidth / 260, sy = svg.clientHeight / 210;
      const [x, y, label] = pts[k];
      tip.firstElementChild.textContent = label;
      tip.style.left = (x * sx - tip.offsetWidth / 2) + 'px';
      tip.style.top = (y * sy + 12) + 'px';
    };
    onView(lc, el => {
      el.classList.add('go');
      place();
      if (!reduce) setInterval(() => { k = (k + 1) % pts.length; place(); }, 1800);
    });
    addEventListener('resize', place);
  }

  // Evolution bars
  const evo = $('[data-evo]');
  if (evo) onView(evo, () => $$('.fill', evo).forEach((f, i) => setTimeout(() => { f.style.height = f.dataset.h + '%'; }, i * 120)));

  // Battery
  const bat = $('[data-battery]');
  if (bat) {
    const cells = $$('i', bat);
    let lvl = 0;
    onView(bat, () => {
      setInterval(() => {
        lvl = (lvl + 1) % (cells.length + 3);
        cells.forEach((c, i) => c.classList.toggle('on', i < Math.min(lvl, cells.length)));
      }, 380);
    });
  }

  // Partner icons
  const partner = $('[data-partner]');
  if (partner && !reduce) {
    const ic = $$('svg', partner);
    let p = 0;
    setInterval(() => { ic[p].classList.remove('on'); p = (p + 1) % ic.length; ic[p].classList.add('on'); }, 1600);
  }

  // Clocks
  const clocks = $$('.clock');
  const tick = () => {
    const now = new Date();
    clocks.forEach(c => {
      const tz = c.dataset.tz;
      let h, m, s;
      try {
        const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }).formatToParts(now);
        const g = t => +parts.find(p => p.type === t).value;
        h = g('hour'); m = g('minute'); s = g('second');
      } catch { h = now.getHours(); m = now.getMinutes(); s = now.getSeconds(); }
      const set = (cls, deg) => c.querySelector(cls).setAttribute('transform', `rotate(${deg} 50 50)`);
      set('.h', ((h % 12) + m / 60) * 30);
      set('.m', (m + s / 60) * 6);
      set('.s', s * 6);
    });
  };
  // UTC offsets
  clocks.forEach(c => {
    try {
      const name = new Intl.DateTimeFormat('en-US', { timeZone: c.dataset.tz, timeZoneName: 'shortOffset' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName').value;
      const off = name.replace('GMT', '').trim() || '+0';
      c.querySelector('[data-utc]').textContent = 'UTC ' + off.replace(/^([+-])/, '$1');
    } catch {}
  });
  if (clocks.length) { tick(); setInterval(tick, 1000); }

  // Ticker duplication
  $$('[data-ticker]').forEach(t => { t.innerHTML += t.innerHTML; });

  /* ---------- Pricing toggle ---------- */
  $$('[data-plan]').forEach(plan => {
    const btn = $('.toggle', plan);
    const num = $('[data-price]', plan);
    const price = $('.plan-price', plan);
    btn.addEventListener('click', () => {
      const yearly = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', yearly);
      price.classList.toggle('yearly', yearly);
      num.classList.add('flip');
      setTimeout(() => { num.textContent = yearly ? plan.dataset.yearly : plan.dataset.monthly; num.classList.remove('flip'); }, 220);
    });
  });

  /* ---------- FAQ ---------- */
  $$('[data-faq] .qa').forEach(qa => {
    const b = $('button', qa);
    b.addEventListener('click', () => {
      const open = !qa.classList.contains('open');
      $$('[data-faq] .qa').forEach(o => { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', false); });
      qa.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open);
    });
  });
  const offer = $('[data-offer]');
  if (offer) $('button', offer).addEventListener('click', e => {
    const open = offer.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', open);
  });

  /* ---------- Photos ---------- */
  const U = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=75`;
  const setImg = (img, src, name) => {
    img.onerror = () => { img.onerror = null; img.src = `https://i.pravatar.cc/800?u=${encodeURIComponent(name)}`; };
    img.src = src;
    img.alt = name;
  };

  /* ---------- Team ---------- */
  const team = [
    { n: 'Adam Weber', img: '1500648767791-00dcc994a43e',
      en: { r: 'Founder & CEO', b: 'I founded Fune to turn AI content into a real business. I lead our strategy and make sure every AI model we launch has a clear audience, a plan and measurable revenue.' },
      sk: { r: 'Zakladateľ a CEO', b: 'Fune som založil, aby sa z AI obsahu stal skutočný biznis. Vediem našu stratégiu a dbám na to, aby mal každý AI model, ktorý spustíme, jasné publikum, plán a merateľné tržby.' } },
    { n: 'Nora Lindqvist', img: '1580489944761-15a19d654956',
      en: { r: 'Head of AI Models', b: 'I lead the team that designs our personas — their look, personality and voice. My goal is AI characters that feel consistent, recognisable and genuinely engaging.' },
      sk: { r: 'Vedúca AI modelov', b: 'Vediem tím, ktorý navrhuje naše persóny — ich vzhľad, osobnosť a hlas. Mojím cieľom sú AI postavy, ktoré pôsobia konzistentne, sú zapamätateľné a skutočne pútavé.' } },
    { n: 'Lukas Brenner', img: '1506794778202-cad84cf45f1d',
      en: { r: 'Head of Automation', b: 'My team builds the pipelines behind every model — content generation, fan chat and scheduled publishing — so the whole roster runs smoothly around the clock.' },
      sk: { r: 'Vedúci automatizácie', b: 'Môj tím stavia procesy za každým modelom — generovanie obsahu, chat s fanúšikmi aj plánované publikovanie — aby všetko bežalo hladko nonstop.' } },
    { n: 'Sofia Marin', img: '1573496359142-b8d87734a5a2',
      en: { r: 'Creative Director', b: 'I shape the visual style of everything our models publish, combining human creativity with AI tools so every photo, video and post looks premium and on-brand.' },
      sk: { r: 'Kreatívna riaditeľka', b: 'Formujem vizuálny štýl všetkého, čo naše modely zverejňujú. Spájam ľudskú kreativitu s AI nástrojmi, aby každá fotka, video aj príspevok pôsobili prémiovo a v súlade so značkou.' } },
  ];
  const tRoot = $('[data-team]');
  let teamSlider;
  if (tRoot) {
    const img = $('[data-photo]', tRoot);
    const sw = $$('.proc-swap', tRoot);
    team.forEach(m => { const i = new Image(); i.src = U(m.img); });
    teamSlider = slider(tRoot, team.length, (k, first) => {
      const m = team[k];
      if (!first) img.classList.add('out');
      setTimeout(() => { setImg(img, U(m.img), m.n); img.classList.remove('out'); }, first ? 0 : 300);
      swap(sw, () => {
        $('[data-name]', tRoot).textContent = m.n;
        $('[data-role]', tRoot).textContent = m[lang].r;
        $('[data-bio]', tRoot).textContent = m[lang].b;
      }, first);
    });
  }

  /* ---------- Testimonials ---------- */
  const reviews = [
    { n: 'Henrik Vos', c: 'Altrion Media', img: '1507003211169-0a1dd7228f2d',
      en: { r: 'Agency Owner', q: 'Fune took our roster from two to eight AI models in three months. The automation handles content and chat — we just watch the dashboard.' },
      sk: { r: 'Majiteľ agentúry', q: 'S Fune sme za tri mesiace narástli z dvoch na osem AI modelov. Obsah aj chat rieši automatizácia — my len sledujeme dashboard.' } },
    { n: 'Daniel Kraus', c: 'Northgrid', img: '1472099645785-5658abf4ff4e',
      en: { r: 'Head of Growth', q: 'Content used to be our bottleneck. Now every model posts daily in a consistent style, and we don’t touch a single file.' },
      sk: { r: 'Vedúci rastu', q: 'Obsah bol naše úzke miesto. Dnes každý model publikuje denne v jednotnom štýle a my nemusíme otvoriť ani jeden súbor.' } },
    { n: 'Mei Tanaka', c: 'Lumina Labs', img: '1544005313-94ddf0286df2',
      en: { r: 'Founder', q: 'The fan chat AI is incredible — instant replies, the right tone for each persona, and fans keep coming back.' },
      sk: { r: 'Zakladateľka', q: 'AI chat s fanúšikmi je neuveriteľný — okamžité odpovede, správny tón pre každú persónu a fanúšikovia sa stále vracajú.' } },
    { n: 'Marcus Hale', c: 'Corvex Digital', img: '1519085360753-af0119f7cbe7',
      en: { r: 'COO', q: 'The live profit dashboard changed how we run the business. We see what earns in real time and scale it the same day.' },
      sk: { r: 'COO', q: 'Živý dashboard zisku zmenil spôsob, akým firmu riadime. Vidíme, čo zarába, v reálnom čase a škálujeme to ešte v ten deň.' } },
    { n: 'Elena Rossi', c: 'Fieldnote', img: '1438761681033-6461ffad8d80',
      en: { r: 'Brand Manager', q: 'I was sceptical about AI personas, but the quality is premium and everything is reviewed. Engagement keeps growing.' },
      sk: { r: 'Brand manažérka', q: 'K AI persónam som bola skeptická, no kvalita je prémiová a všetko prechádza kontrolou. Engagement neustále rastie.' } },
    { n: 'James Okafor', c: 'Brightpath', img: '1531427186611-ecfd6d936c79',
      en: { r: 'Creator Manager', q: 'We launched a new model in a week — look, voice, content plan and chat, all ready and all automated.' },
      sk: { r: 'Manažér tvorcov', q: 'Nový model sme spustili za týždeň — vzhľad, hlas, obsahový plán aj chat, všetko pripravené a automatizované.' } },
    { n: 'Clara Novak', c: 'Helix Studio', img: '1534528741775-53994a69daeb',
      en: { r: 'Operations Lead', q: 'Scheduling across platforms and time zones used to be chaos. Now it simply runs, 24/7.' },
      sk: { r: 'Vedúca prevádzky', q: 'Plánovanie naprieč platformami a časovými pásmami bolo kedysi chaos. Teraz to jednoducho beží, 24/7.' } },
    { n: 'Tom Becker', c: 'Stackwell', img: '1539571696357-5a69c17a67c6',
      en: { r: 'Founder', q: 'Fune doesn’t just sell tools — they run our AI roster for us and improve it every month. It’s like having a whole AI department.' },
      sk: { r: 'Zakladateľ', q: 'Fune nepredáva len nástroje — prevádzkuje za nás celé portfólio AI modelov a každý mesiac ho zlepšuje. Je to ako mať vlastné AI oddelenie.' } },
  ];
  const rRoot = $('[data-testi]');
  if (rRoot) {
    const thumbs = $('[data-thumbs]', rRoot);
    const img = $('[data-photo]', rRoot);
    reviews.slice(0, 7).forEach((r, k) => {
      const a = document.createElement('button');
      a.className = 'thumb';
      a.setAttribute('aria-label', r.n);
      const im = document.createElement('img');
      im.loading = 'lazy';
      setImg(im, U(r.img).replace('w=900', 'w=400'), r.n);
      a.appendChild(im);
      a.addEventListener('click', () => s.go(k));
      thumbs.appendChild(a);
    });
    const fades = [$('[data-quote]', rRoot), $('.testi-who', rRoot), img];
    var s = slider(rRoot, reviews.length, (k, first) => {
      const r = reviews[k];
      $$('.thumb', thumbs).forEach((t, n) => t.classList.toggle('on', n === k));
      const apply = () => {
        $('[data-quote]', rRoot).textContent = r[lang].q;
        $('[data-name]', rRoot).textContent = r.n;
        $('[data-role]', rRoot).textContent = r[lang].r;
        $('[data-co]', rRoot).textContent = r.c;
        setImg(img, U(r.img), r.n);
      };
      if (first || reduce) { apply(); return; }
      fades.forEach(f => f.classList.add('fade-out'));
      setTimeout(() => { apply(); fades.forEach(f => f.classList.remove('fade-out')); }, 380);
    }, { auto: 8000 });
  }

  /* ---------- Marquee band ---------- */
  $$('[data-band]').forEach(row => {
    const unit = `<span>${row.dataset.band.repeat(4)}</span>`;
    row.innerHTML = unit + unit;
  });

  /* ---------- Forms ---------- */
  $$('[data-form]').forEach(f => {
    f.addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('.form-msg', f);
      const email = f.querySelector('input[type=email]');
      if (email && !/^\S+@\S+\.\S+$/.test(email.value)) { msg.textContent = UI('badEmail'); email.focus(); return; }
      msg.textContent = UI('thanks');
      f.reset();
    });
  });

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(y => { y.textContent = new Date().getFullYear(); });

  /* ---------- Particles ---------- */
  function particles(canvas, opts) {
    const ctx = canvas.getContext('2d');
    let W, H, P = [], dpr = Math.min(devicePixelRatio || 1, 2), visible = true;
    const rgb = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '46,193,111';
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((W * H) / opts.density);
      P = Array.from({ length: count }, () => spawn(true));
    };
    const spawn = () => {
      // bias toward a diagonal band (like a nebula)
      const t = Math.random();
      const bx = W * (0.15 + t * 0.8), by = H * (opts.bandY + (0.5 - t) * opts.bandTilt);
      const spread = H * opts.spread;
      const big = Math.random() < opts.big;
      const g = (Math.random() + Math.random() + Math.random()) / 3 - 0.5; // gaussian-ish
      return {
        x: bx + (Math.random() - 0.5) * spread * 2.2,
        y: by + g * spread * 2,
        r: big ? 2.5 + Math.random() * 8 : 0.4 + Math.random() * 1.7,
        a: big ? 0.06 + Math.random() * 0.3 : 0.25 + Math.random() * 0.6,
        vx: (Math.random() - 0.5) * 0.12 + 0.05,
        vy: (Math.random() - 0.5) * 0.08 - 0.03,
        tw: Math.random() * Math.PI * 2,
        tint: Math.random() < opts.tint,
      };
    };
    const draw = () => {
      if (!visible) { requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        p.x += p.vx; p.y += p.vy; p.tw += 0.02;
        if (p.x > W + 20) p.x = -20; if (p.x < -20) p.x = W + 20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
        const a = p.a * (0.7 + Math.sin(p.tw) * 0.3);
        const col = p.tint ? `rgba(${rgb},${a})` : `rgba(235,240,236,${a})`;
        if (p.r > 2) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, col); g.addColorStop(1, p.tint ? `rgba(${rgb},0)` : 'rgba(235,240,236,0)');
          ctx.fillStyle = g;
        } else ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    resize();
    addEventListener('resize', () => { clearTimeout(canvas._t); canvas._t = setTimeout(resize, 150); });
    draw();
  }
  const intro = $('[data-particles="intro"]');
  if (intro) particles(intro, { density: 2300, bandY: 0.3, bandTilt: 0.38, spread: 0.22, tint: 0.14, big: 0.32 });
  const logoP = $('[data-particles="logo"]');
  if (logoP) particles(logoP, { density: 1500, bandY: 0.55, bandTilt: 0.5, spread: 0.4, tint: 0.2, big: 0.3 });

  /* ---------- Apply language ---------- */
  const origText = new WeakMap();
  const origAttr = new WeakMap();
  const norm = (str) => str.replace(/\s+/g, ' ').trim();
  const titleEN = document.title;
  const metaDesc = $('meta[name="description"]');
  const descEN = metaDesc ? metaDesc.content : '';

  function translateTree() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        if (!p || p.closest('script, style, [data-dyn], [data-words], .odo')) return NodeFilter.FILTER_REJECT;
        return /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    let n;
    while ((n = walker.nextNode())) {
      let o = origText.get(n);
      if (o === undefined) { o = n.nodeValue; origText.set(n, o); }
      const tr = T(norm(o));
      n.nodeValue = tr === norm(o) ? o : o.match(/^\s*/)[0] + tr + o.match(/\s*$/)[0];
    }
    $$('[placeholder], [aria-label]').forEach(el => {
      let o = origAttr.get(el);
      if (!o) { o = { placeholder: el.getAttribute('placeholder'), label: el.getAttribute('aria-label') }; origAttr.set(el, o); }
      if (o.placeholder) el.setAttribute('placeholder', T(o.placeholder));
      if (o.label) el.setAttribute('aria-label', T(o.label));
    });
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = T(titleEN);
    if (metaDesc) metaDesc.content = T(descEN);
    translateTree();
    renderWords();
    onScrollWords();
    [procSlider, teamSlider, typeof s !== 'undefined' ? s : null].forEach(sl => sl && sl.go(sl.index, true));
    $$('.form-msg').forEach(m => { m.textContent = ''; });
    $$('img[data-sk]').forEach(img => {
      if (!img.dataset.en) img.dataset.en = img.getAttribute('src');
      const want = lang === 'sk' ? img.dataset.sk : img.dataset.en;
      if (img.getAttribute('src') !== want) img.setAttribute('src', want);
    });
    $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
    // App sign-in opens in the same language as the website.
    $$('[data-app-link]').forEach(a => {
      const u = new URL(a.getAttribute('href'), location.href);
      u.searchParams.set('lang', lang);
      a.setAttribute('href', u.toString());
    });
  }

  $$('[data-lang]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    store.set(lang);
    applyLang();
  }));
  applyLang();

  /* ---------- Floating dashboard cards ---------- */
  const floats = $$('[data-float]');
  const onScrollFloat = () => {
    if (reduce) return;
    floats.forEach(f => {
      const r = f.parentElement.getBoundingClientRect();
      const y = ((r.top + r.height / 2) - innerHeight / 2) * parseFloat(f.dataset.float);
      f.style.transform = `translateY(${Math.max(-40, Math.min(40, y))}px)`;
    });
  };

  /* ---------- Scroll loop ---------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScrollProgress(); onScrollWords(); onScrollPoly(); onScrollFloat(); ticking = false; });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();

/* Phone CTA bar: shows once the hero is scrolled past, hides again at the final CTA and Contact. */
(() => {
  const bar = document.querySelector('[data-cta-bar]');
  if (!bar) return;
  const hero = document.querySelector('.hero');
  const ends = [document.querySelector('.cta-band'), document.querySelector('#contact')].filter(Boolean);
  const seen = new Map();
  const update = () => {
    const pastHero = seen.get(hero) === false;
    const atEnd = ends.some((e) => seen.get(e));
    const show = pastHero && !atEnd;
    bar.classList.toggle('show', show);
    bar.setAttribute('aria-hidden', String(!show));
    bar.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', show ? '0' : '-1'));
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => seen.set(en.target, en.isIntersecting));
    update();
  }, { threshold: 0 });
  [hero, ...ends].forEach((el) => el && io.observe(el));
})();
