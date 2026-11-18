/* FU—NE · Product dashboard (simulated live data)
   URL params:
     ?lang=en|sk            language (default: saved choice / browser)
     ?shot=full|profit|kpis|roster|chat|queue|revenue|log
                            screenshot mode: frozen, no animations, only that part
*/
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const SHOT = params.get('shot');
  const reduce = !!SHOT || matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Seeded random (same picture every load) ---------- */
  let seed = 18;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const between = (a, b) => a + rnd() * (b - a);

  /* ---------- Language ---------- */
  const store = { get() { try { return localStorage.getItem('fune-lang'); } catch { return null; } }, set(v) { try { localStorage.setItem('fune-lang', v); } catch {} } };
  let lang = (() => {
    const q = params.get('lang'); if (q === 'sk' || q === 'en') return q;
    const s = store.get(); if (s === 'sk' || s === 'en') return s;
    return /^(sk|cs)\b/i.test(navigator.language || '') ? 'sk' : 'en';
  })();
  const SK = {
    'Fune Dashboard — AI Model Roster': 'Fune Dashboard — AI modely',
    'Main navigation': 'Hlavná navigácia', 'Overview': 'Prehľad', 'AI Models': 'AI modely', 'Content': 'Obsah',
    'Fan Chat': 'Chat', 'Scheduler': 'Plánovač', 'Analytics': 'Analytika', 'Brand Guard': 'Strážca značky',
    'Settings': 'Nastavenia', 'Early beta access now available.': 'Prístup do bety je už dostupný.', 'Scale plan': 'Plán Scale',
    'LIVE': 'NAŽIVO', 'live': 'naživo', 'Day': 'Deň', 'Search models, posts…': 'Hľadať modely, príspevky…',
    'Search': 'Hľadať', 'Notifications': 'Upozornenia', 'Language': 'Jazyk', 'Open menu': 'Otvoriť menu',
    'Today’s net profit': 'Dnešný čistý zisk', 'Last min': 'Posledná min.', 'Pace / day': 'Tempo / deň', 'Gross': 'Hrubý zisk',
    'of €20,000': 'z 20 000 €', 'Profit through the day': 'Zisk počas dňa', 'Net': 'Čistý', 'Target €20,000': 'Cieľ 20 000 €',
    'Profit chart': 'Graf zisku', 'Total fans': 'Fanúšikovia spolu', 'Messages answered': 'Zodpovedané správy', 'avg reply': 'priem. odpoveď',
    'Assets generated': 'Vygenerované výstupy', 'in queue': 'vo fronte', 'Active models': 'Aktívne modely',
    'AI models · roster': 'AI modely · zoznam', 'Filter models': 'Filtrovať modely', 'All': 'Všetky', 'Generating': 'Generuje',
    'Chatting': 'Chatuje', 'Posting': 'Publikuje', 'Idle': 'Nečinný', 'Model': 'Model', 'Status': 'Stav', 'Fans': 'Fanúšikovia',
    'Last 12 h': 'Posledných 12 h', 'Today': 'Dnes', 'Fan chat': 'Chat s fanúšikmi', 'Content queue': 'Fronta obsahu',
    'Next 6 h': 'Najbližších 6 h', 'Revenue mix': 'Štruktúra tržieb', 'By platform': 'Podľa platformy', 'Ops log': 'Log operácií',
  };
  const T = (en) => (lang === 'sk' && SK[en]) || en;
  const LOC = () => (lang === 'sk' ? 'sk-SK' : 'en-US');
  const money = (n, d = 0) => new Intl.NumberFormat(LOC(), { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  const num = (n) => new Intl.NumberFormat(LOC()).format(Math.round(n));
  const nb = (str) => str.replace(/([\s\u00a0\u202f]+)/g, '<span class="nb">$1</span>');
  const moneyHTML = (n, d = 0) => nb(money(n, d));
  const dec = (n, d = 1) => new Intl.NumberFormat(LOC(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

  /* ---------- Simulation clock & profit model ---------- */
  const DAY_EXPECT = 20800; // projected net for the whole day
  const TARGET = 20000;
  const rate = (h) => (0.35 + 1.5 * Math.exp(-((h - 21) ** 2) / 14) + 0.55 * Math.exp(-((h - 12.5) ** 2) / 8)) * (1 + 0.3 * Math.sin(h * 7.1) + 0.18 * Math.sin(h * 17.3));
  const CUM = new Float64Array(1441);
  for (let m = 1; m <= 1440; m++) CUM[m] = CUM[m - 1] + rate((m - 0.5) / 60);
  const frac = (sec) => { const m = Math.max(0, Math.min(1440, sec / 60)); const i = Math.floor(m); const j = Math.min(i + 1, 1440); return (CUM[i] + (CUM[j] - CUM[i]) * (m - i)) / CUM[1440]; };
  const netAt = (sec) => frac(sec) * DAY_EXPECT;

  let sim = 15 * 3600 + 42 * 60 + 10; // 15:42:10
  const STEP = 6; // simulated seconds per real second

  /* ---------- Data ---------- */
  const MODELS = [
    { n: 'Mia Nova', h: 'mia.nova', fans: 15519, share: 1261.65, st: 'generating', g: ['#2EC16F', '#0F5A31'] },
    { n: 'Nyx Ray', h: 'nyx.ray', fans: 8458, share: 1071.53, st: 'chatting', g: ['#3FA7C9', '#173F4F'] },
    { n: 'Kira Byte', h: 'kira.byte', fans: 10161, share: 891.44, st: 'chatting', g: ['#8F86E8', '#2F2A66'] },
    { n: 'Luna Vex', h: 'luna.vex', fans: 19042, share: 843.08, st: 'idle', g: ['#BFC3C1', '#3E4042'] },
    { n: 'Aria Sol', h: 'aria.sol', fans: 12617, share: 590.32, st: 'generating', g: ['#E0A43A', '#5E410F'] },
    { n: 'Zoe Flux', h: 'zoe.flux', fans: 6883, share: 391.14, st: 'posting', g: ['#E07A9A', '#561F31'] },
    { n: 'Ivy Volt', h: 'ivy.volt', fans: 4310, share: 302.77, st: 'idle', g: ['#7AD3A7', '#1E4D38'] },
    { n: 'Sky Lumen', h: 'sky.lumen', fans: 3925, share: 188.76, st: 'chatting', g: ['#8FB7FF', '#25385F'] },
  ];
  const shareSum = MODELS.reduce((a, m) => a + m.share, 0);
  MODELS.forEach((m) => {
    m.share /= shareSum;
    m.wob = between(0, Math.PI * 2);
    let v = between(20, 40);
    m.spark = Array.from({ length: 12 }, () => (v = Math.max(5, v + between(-6, 10))));
    m.today = 0; m.prevToday = 0;
  });
  const initials = (n) => n.split(' ').map((w) => w[0]).join('');
  const avStyle = (m) => `background:linear-gradient(135deg,${m.g[0]},${m.g[1]})`;
  const STATUS = { generating: 'Generating', chatting: 'Chatting', posting: 'Posting', idle: 'Idle' };

  const U = (id, w = 160) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;
  const QUEUE = [
    { img: '1742924937517-9e5914653e59', t: ['Neon studio set · 6 photos', 'Neónový set · 6 fotiek'], m: 0, p: ['s-ig', 's-x'], time: '16:00', st: 'scheduled' },
    { img: '1786372546514-1d524effae64', t: ['Behind the scenes reel', 'Zákulisie · reel'], m: 1, p: ['s-tt', 's-ig'], time: '16:30', st: 'review' },
    { img: '1768885512012-0c47ad00870c', t: ['Q&A stories', 'Otázky a odpovede · stories'], m: 2, p: ['s-ig'], time: '17:15', st: 'generating' },
    { img: '1782170932323-8f03eb41cc96', t: ['Tokyo night teaser', 'Tokio v noci · ukážka'], m: 4, p: ['s-yt', 's-tt'], time: '18:00', st: 'scheduled' },
    { img: '1758393517077-a2d963888cfb', t: ['Weekly drop · 12 photos', 'Týždenný drop · 12 fotiek'], m: 5, p: ['s-ig', 's-x'], time: '19:30', st: 'scheduled' },
    { img: '1742924937109-1eb087fcb8c2', t: ['Live stream announcement', 'Oznámenie live streamu'], m: 3, p: ['s-ig', 's-yt'], time: '20:00', st: 'review' },
  ];
  const QST = { scheduled: ['Scheduled', 'Naplánované', 'generating'], review: ['In review', 'Na kontrole', 'posting'], generating: ['Generating', 'Generuje', 'generating'] };

  const MIX = [
    { k: ['Subscriptions', 'Predplatné'], s: 0.46 },
    { k: ['Tips', 'Tipy'], s: 0.21 },
    { k: ['Brand deals', 'Spolupráce'], s: 0.19 },
    { k: ['Shop', 'Obchod'], s: 0.14 },
  ];

  const CHATS = [
    { f: ['Your neon set yesterday was unreal 🔥', 'Tvoj včerajší neónový set bol neskutočný 🔥'], r: ['Thank you! A new one drops tonight at 9 ✨', 'Ďakujem! Nový vychádza dnes o 21:00 ✨'] },
    { f: ['What camera do you use?', 'Aký fotoaparát používaš?'], r: ['A studio setup — ring light, lots of neon and a bit of magic 😉', 'Štúdiový setup — kruhové svetlo, veľa neónu a trocha mágie 😉'] },
    { f: ['When is the next live?', 'Kedy bude ďalší live?'], r: ['Friday at 8 pm CET — I’ll send you a reminder!', 'V piatok o 20:00 — pošlem ti pripomienku!'] },
    { f: ['Love the new hair color', 'Nová farba vlasov je top'], r: ['Green era unlocked 💚 so glad you like it!', 'Zelená éra odomknutá 💚 teší ma, že sa ti páči!'] },
    { f: ['Are you real?', 'Si skutočná?'], r: ['I’m an AI model created by the Fune team — still happy to chat! 🤖', 'Som AI model od tímu Fune — aj tak rada pokecám! 🤖'] },
    { f: ['Any travel content coming?', 'Chystáš aj cestovateľský obsah?'], r: ['The Tokyo series starts next week 🗼', 'Séria z Tokia štartuje budúci týždeň 🗼'] },
    { f: ['Thanks for the reply yesterday!', 'Vďaka za včerajšiu odpoveď!'], r: ['Always! You were one of my first fans 💚', 'Vždy! Bol si jeden z mojich prvých fanúšikov 💚'] },
    { f: ['Can you do a gym routine post?', 'Spravíš príspevok s cvičením?'], r: ['Adding it to next week’s plan 💪', 'Pridávam to do plánu na budúci týždeň 💪'] },
  ];

  /* ---------- State ---------- */
  const state = { fansToday: 0, msgs: 12480, assets: 186, queueN: 42, avg: 2.3, feed: [], log: [], lastNet: 0 };

  /* ---------- Rendering ---------- */
  const el = {
    clock: $('[data-clock]'), net: $('[data-net]'), last: $('[data-lastmin]'), pace: $('[data-pace]'), gross: $('[data-gross]'),
    bar: $('[data-target-bar]'), pct: $('[data-target-pct]'), plot: $('[data-plot]'), fans: $('[data-fans]'), fansToday: $('[data-fans-today]'),
    msgs: $('[data-msgs]'), avg: $('[data-avg]'), assets: $('[data-assets]'), queueN: $('[data-queue-n]'), active: $('[data-active]'),
    segs: $('[data-segs]'), roster: $('[data-roster]'), feed: $('[data-feed]'), queue: $('[data-queue]'), mix: $('[data-mix]'), log: $('[data-log]'),
  };
  const hhmmss = (s) => { s = Math.floor(s) % 86400; const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return [h, m, x].map((v) => String(v).padStart(2, '0')).join(':'); };
  const hhmm = (s) => hhmmss(s).slice(0, 5);

  function renderMoney(target, v) {
    const parts = new Intl.NumberFormat(LOC(), { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).formatToParts(v);
    target.innerHTML = parts.map((p) => {
      if (p.type === 'currency') return `<span class="cur">${p.value}</span>`;
      if (/^[\s\u00a0\u202f]+$/.test(p.value)) return `<span class="nb">${p.value}</span>`;
      if (p.type === 'decimal' || p.type === 'fraction') return `<span class="frac">${p.value}</span>`;
      return p.value;
    }).join('');
  }

  function modelToday(net) {
    const raw = MODELS.map((m) => m.share * (1 + 0.06 * Math.sin(sim / 2400 + m.wob)));
    const sum = raw.reduce((a, b) => a + b, 0);
    MODELS.forEach((m, i) => { m.prevToday = m.today; m.today = (raw[i] / sum) * net; });
  }

  let counting = false;
  function renderProfit(net) {
    if (!counting) renderMoney(el.net, net);
    const last = Math.max(0, net - netAt(sim - 60));
    el.last.innerHTML = '+' + moneyHTML(last, 0);
    const f = frac(sim);
    el.pace.innerHTML = moneyHTML((net / Math.max(f, 0.01)) * (1 + 0.02 * Math.sin(sim / 900)), 0);
    el.gross.innerHTML = moneyHTML(net / 0.74, 0);
    const pct = Math.min(100, (net / TARGET) * 100);
    el.bar.style.width = pct + '%';
    el.pct.textContent = Math.round(pct) + '%';
  }

  /* chart */
  const W = 720, H = 250, Y0 = 238, YMAX = 22000;
  const xs = (sec) => (sec / 86400) * W;
  const ys = (v) => Y0 - (v / YMAX) * (Y0 - 10);
  let dot, label;
  function renderChart(net) {
    const pts = [], gpts = [];
    for (let s = 0; s <= sim; s += 600) { const v = netAt(s); pts.push([xs(s), ys(v)]); gpts.push([xs(s), ys(v / 0.74)]); }
    pts.push([xs(sim), ys(net)]); gpts.push([xs(sim), ys(net / 0.74)]);
    const line = (p) => p.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
    const grid = [5000, 10000, 15000].map((v) => `<line class="gl" x1="0" x2="${W}" y1="${ys(v)}" y2="${ys(v)}"/>`).join('') +
      [6, 12, 18].map((h) => `<line class="gl" y1="0" y2="${Y0}" x1="${xs(h * 3600)}" x2="${xs(h * 3600)}"/>`).join('') +
      `<line class="gl" x1="0" x2="${W}" y1="${Y0}" y2="${Y0}"/>`;
    el.plot.innerHTML = grid +
      `<line class="tg" x1="0" x2="${W}" y1="${ys(TARGET)}" y2="${ys(TARGET)}"/>` +
      `<path class="area" d="${line(pts)} L${xs(sim).toFixed(1)} ${Y0} L0 ${Y0}Z"/>` +
      `<path class="gross" d="${line(gpts)}"/>` +
      `<path class="net" d="${line(pts)}"/>` +
      `<line class="now" x1="${xs(sim)}" x2="${xs(sim)}" y1="0" y2="${Y0}"/>`;
    placeChartOverlay(net);
  }
  function placeChartOverlay(net) {
    const card = el.plot.closest('.card');
    if (!dot) {
      dot = document.createElement('i'); dot.className = 'plot-dot';
      label = document.createElement('span'); label.className = 'plot-label';
      card.append(dot, label);
      [[TARGET, '20k', 'tgt'], [15000, '15k'], [10000, '10k'], [5000, '5k']].forEach(([v, t, c]) => {
        const y = document.createElement('span'); y.className = 'y-label' + (c ? ' ' + c : ''); y.dataset.v = v; y.textContent = t; card.append(y);
      });
    }
    const r = el.plot.getBoundingClientRect(), cr = card.getBoundingClientRect();
    const px = (x) => r.left - cr.left + (x / W) * r.width;
    const py = (y) => r.top - cr.top + (y / H) * r.height;
    dot.style.left = px(xs(sim)) + 'px'; dot.style.top = py(ys(net)) + 'px';
    label.style.left = px(xs(sim)) + 'px'; label.style.top = py(ys(net)) + 'px';
    label.innerHTML = hhmm(sim) + ' · ' + moneyHTML(net, 0);
    $$('.y-label', card).forEach((y) => { y.style.top = py(ys(+y.dataset.v)) - 14 + 'px'; });
  }

  const sparkPath = (a) => {
    const max = Math.max(...a), min = Math.min(...a);
    const p = a.map((v, i) => [(i / (a.length - 1)) * 108 + 1, 25 - ((v - min) / (max - min || 1)) * 21]);
    const d = p.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
    return { d, fill: d + ' L109 27 L1 27Z' };
  };

  let filter = 'all';
  function renderRoster() {
    el.roster.innerHTML = MODELS.map((m, i) => {
      const sp = sparkPath(m.spark);
      const flash = m.today - m.prevToday > 4 && !reduce ? ' class="flash"' : '';
      return `<tr data-st="${m.st}"${flash}>
        <td class="hide-xs">${i + 1}</td>
        <td><div class="model"><span class="mav st-${m.st}" style="${avStyle(m)}">${initials(m.n)}</span><div><b>${m.n}</b><small>@${m.h}</small></div></div></td>
        <td><span class="status ${m.st}">${T(STATUS[m.st])}</span></td>
        <td class="num hide-xs">${num(m.fans)}</td>
        <td class="hide-s"><svg class="spark" viewBox="0 0 110 28" aria-hidden="true"><path class="fill" d="${sp.fill}"/><path d="${sp.d}"/></svg></td>
        <td class="num today">${moneyHTML(m.today, 2)}</td>
      </tr>`;
    }).join('');
    applyFilter();
  }
  function applyFilter() { $$('tr', el.roster).forEach((tr) => tr.classList.toggle('row-hide', filter !== 'all' && tr.dataset.st !== filter)); }

  function renderKpis() {
    el.fans.textContent = num(MODELS.reduce((a, m) => a + m.fans, 0));
    el.fansToday.textContent = '+' + num(state.fansToday) + (lang === 'sk' ? ' dnes' : ' today');
    el.msgs.textContent = num(state.msgs);
    el.avg.textContent = dec(state.avg) + ' s';
    el.assets.textContent = num(state.assets);
    el.queueN.textContent = state.queueN;
    const active = MODELS.filter((m) => m.st !== 'idle').length;
    el.active.textContent = active;
    el.segs.innerHTML = MODELS.map((m) => `<i class="${m.st !== 'idle' ? 'on' : ''}"></i>`).join('');
  }

  function renderFeed() {
    const L = lang === 'sk' ? 1 : 0;
    el.feed.innerHTML = state.feed.map((x) => {
      const m = MODELS[x.m], c = CHATS[x.k];
      return `<li class="msg"><span class="mav" style="${avStyle(m)}">${initials(m.n)}</span><div>
        <div class="who"><b>${x.fan}</b><span>→ @${m.h}</span><span>${hhmm(x.t)}</span></div>
        <div class="bub">${c.f[L]}</div>
        <div class="bub ai"><span class="tag"><svg><use href="#i-sparkle"/></svg>AI · ${dec(x.lat)} s</span><br>${c.r[L]}</div>
      </div></li>`;
    }).join('');
  }

  function renderQueue() {
    const L = lang === 'sk' ? 1 : 0;
    el.queue.innerHTML = QUEUE.map((q) => {
      const st = QST[q.st];
      return `<li class="qrow">
        <span class="thumb"><img src="${U(q.img)}" alt="" loading="lazy"></span>
        <div><b>${q.t[L]}</b><div class="qmeta"><span>@${MODELS[q.m].h}</span>${q.p.map((p) => `<svg><use href="#${p}"/></svg>`).join('')}</div></div>
        <div class="qright"><span class="qtime">${q.time}</span><span class="status ${st[2]}">${st[L]}</span></div>
      </li>`;
    }).join('');
  }

  function renderMix(net) {
    const L = lang === 'sk' ? 1 : 0;
    if (!el.mix.children.length) {
      el.mix.innerHTML = MIX.map(() => '<li><span class="lbl"></span><span class="val"></span><span class="bar"><i></i></span></li>').join('');
    }
    $$('li', el.mix).forEach((li, i) => {
      li.querySelector('.lbl').textContent = MIX[i].k[L] + ' · ' + Math.round(MIX[i].s * 100) + ' %';
      li.querySelector('.val').innerHTML = moneyHTML(net * MIX[i].s, 0);
      li.querySelector('.bar i').style.width = MIX[i].s / MIX[0].s * 100 + '%';
    });
  }

  const PLAT = [['s-ig', 'Instagram', 0.41], ['s-tt', 'TikTok', 0.27], ['s-yt', 'YouTube', 0.19], ['s-x', 'X', 0.13]];
  function renderPlat() {
    const ul = $('[data-plat]'); if (!ul) return;
    ul.innerHTML = PLAT.map(([ic, n, v]) => `<li><svg><use href="#${ic}"/></svg><span>${n}</span><b>${Math.round(v * 100)} %</b><i style="--w:${v / PLAT[0][2] * 100}%"></i></li>`).join('');
  }

  const LOG = {
    gen: (x) => [`${x.a}`, lang === 'sk' ? `vygeneroval ${x.n} obrázkov · ${x.s}` : `generated ${x.n} images · ${x.s}`, 'a'],
    chat: (x) => [`${x.a}`, lang === 'sk' ? `odpovedal na ${x.n} správ · priem. ${dec(x.l)} s` : `replied to ${x.n} messages · avg ${dec(x.l)} s`, 'c'],
    post: (x) => [`${x.a}`, lang === 'sk' ? `zverejnil príspevok · ${x.s}` : `published a post · ${x.s}`, 'p'],
    guard: (x) => ['brand-guard', lang === 'sk' ? `schválil ${x.n} výstupov · AI označenie ✓` : `approved ${x.n} assets · AI label ✓`, 'a'],
    pay: (x) => ['payments', `+${money(x.v, 2)} · ${lang === 'sk' ? x.k[1] : x.k[0]}`, 'a'],
    sched: (x) => ['scheduler', lang === 'sk' ? `naplánoval „${x.q[1]}“ · ${x.when}` : `queued “${x.q[0]}” · ${x.when}`, 'p'],
  };
  function renderLog() {
    el.log.innerHTML = state.log.map((x) => {
      const [actor, text, cls] = LOG[x.kind](x);
      return `<span class="ln"><span class="t">[${hhmmss(x.t)}]</span> <span class="${cls}">${actor.padEnd(12, ' ')}</span>▸ ${text}</span>`;
    }).join('') + '<span class="ln"><span class="t">[' + hhmmss(sim) + ']</span> <span class="cursor"></span></span>';
  }

  /* ---------- Simulation step ---------- */
  let tickN = 0;
  function addChat() {
    const talkers = MODELS.map((m, i) => i).filter((i) => MODELS[i].st !== 'idle');
    state.feed.unshift({ m: pick(talkers), k: Math.floor(rnd() * CHATS.length), fan: 'fan_' + Math.floor(between(1000, 9999)), lat: between(1.2, 3.4), t: sim });
    state.feed.length = Math.min(state.feed.length, 6);
    state.msgs += Math.floor(between(3, 12));
    state.avg = between(1.9, 2.7);
  }
  function addLog() {
    const actives = MODELS.filter((m) => m.st !== 'idle');
    const m = pick(actives);
    const kinds = ['gen', 'chat', 'post', 'guard', 'pay', 'pay', 'sched'];
    const kind = pick(kinds);
    const x = { kind, t: sim, a: m.h };
    if (kind === 'gen') { x.n = Math.floor(between(2, 7)); x.s = pick(['neon-studio', 'street-night', 'soft-light', 'tokyo-series']); state.assets += x.n; }
    if (kind === 'chat') { x.n = Math.floor(between(6, 24)); x.l = between(1.8, 2.8); }
    if (kind === 'post') { x.s = pick(['Instagram', 'TikTok', 'YouTube', 'X']); }
    if (kind === 'guard') { x.n = Math.floor(between(3, 9)); }
    if (kind === 'pay') { x.v = between(8, 120); x.k = pick([['tip', 'tip'], ['subscription', 'predplatné'], ['shop', 'obchod']]); }
    if (kind === 'sched') { const q = pick(QUEUE); x.q = q.t; x.when = q.time; }
    state.log.push(x);
    state.log = state.log.slice(-11);
  }
  function step() {
    tickN++;
    sim = (sim + STEP) % 86400;
    // statuses
    if (tickN % 5 === 0) {
      const act = MODELS.filter((m) => m.st !== 'idle');
      const m = pick(act);
      m.st = pick(['generating', 'chatting', 'posting'].filter((s) => s !== m.st));
    }
    if (tickN % 23 === 0) {
      const idle = MODELS.filter((m) => m.st === 'idle'), act = MODELS.filter((m) => m.st !== 'idle');
      if (idle.length && act.length) { const a = pick(idle), b = pick(act); a.st = 'generating'; b.st = 'idle'; }
    }
    // fans
    MODELS.forEach((m) => { if (m.st !== 'idle' && rnd() < 0.3) { const k = Math.ceil(rnd() * 3); m.fans += k; state.fansToday += k; } });
    MODELS.forEach((m) => { if (rnd() < 0.15) { m.spark.shift(); m.spark.push(Math.max(5, m.spark[m.spark.length - 1] + between(-5, 9))); } });
    if (tickN % 3 === 0) addChat();
    if (rnd() < 0.75) addLog();
  }

  function renderAll() {
    const net = netAt(sim);
    el.clock.textContent = hhmmss(sim);
    modelToday(net);
    renderProfit(net);
    renderChart(net);
    renderRoster();
    renderKpis();
    renderFeed();
    renderMix(net);
    renderPlat();
    renderLog();
  }

  /* ---------- Static translation (same approach as the website) ---------- */
  const orig = new WeakMap(), origAttr = new WeakMap();
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const DYN = '[data-roster], [data-feed], [data-queue], [data-mix], [data-plat], [data-log], [data-net], [data-plot], .plot-label, .y-label, script, style';
  function translate() {
    document.documentElement.lang = lang;
    document.title = T('Fune Dashboard — AI Model Roster');
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (!n.parentElement || n.parentElement.closest(DYN) || !/\S/.test(n.nodeValue)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    let n;
    while ((n = w.nextNode())) {
      let o = orig.get(n); if (o === undefined) { o = n.nodeValue; orig.set(n, o); }
      const tr = T(norm(o));
      n.nodeValue = tr === norm(o) ? o : o.match(/^\s*/)[0] + tr + o.match(/\s*$/)[0];
    }
    $$('[placeholder], [aria-label]').forEach((e) => {
      let o = origAttr.get(e); if (!o) { o = { p: e.getAttribute('placeholder'), l: e.getAttribute('aria-label') }; origAttr.set(e, o); }
      if (o.p) e.setAttribute('placeholder', T(o.p));
      if (o.l) e.setAttribute('aria-label', T(o.l));
    });
    $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  }

  /* ---------- UI ---------- */
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang; store.set(lang);
    translate(); renderQueue(); renderAll();
  }));
  $$('[data-filter]').forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.filter;
    $$('[data-filter]').forEach((x) => x.classList.toggle('on', x === b));
    applyFilter();
  }));
  $$('.snav a').forEach((a) => a.addEventListener('click', () => {
    $$('.snav a').forEach((x) => x.classList.toggle('on', x === a));
    document.body.classList.remove('side-open');
  }));
  $('.side-toggle')?.addEventListener('click', (e) => { e.stopPropagation(); document.body.classList.toggle('side-open'); });
  document.addEventListener('click', (e) => { if (document.body.classList.contains('side-open') && !e.target.closest('.side')) document.body.classList.remove('side-open'); });
  addEventListener('resize', () => placeChartOverlay(netAt(sim)));

  /* ---------- Boot ---------- */
  for (let i = 0; i < 24; i++) step(); // pre-fill feed and log
  translate();
  renderQueue();
  renderAll();

  if (SHOT) {
    document.body.classList.add('shot', 'shot-' + SHOT);
    if (SHOT !== 'full') {
      const cards = $$(`.card[data-shot="${SHOT}"]`);
      cards.forEach((c) => c.classList.add('in-shot'));
      if (cards.length === 1) cards[0].classList.add('solo');
    }
    requestAnimationFrame(() => placeChartOverlay(netAt(sim)));
    return; // frozen picture for screenshots
  }

  // count-up for the hero number on first load
  if (!reduce && !document.hidden) {
    counting = true;
    const t0 = performance.now();
    const anim = (t) => {
      const k = Math.min(1, (t - t0) / 1200);
      renderMoney(el.net, netAt(sim) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(anim); else counting = false;
    };
    requestAnimationFrame(anim);
    setTimeout(() => { if (counting) { counting = false; renderMoney(el.net, netAt(sim)); } }, 1600);
  }
  setInterval(() => { step(); renderAll(); }, 1000);
})();
