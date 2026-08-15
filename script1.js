/* ======================================================================================
     SCRIPT JS
   ============================================================
   LOADING SCREEN
   ============================================================ */
(function () {
  var reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var screen   = document.getElementById('loadScreen');
  var bar      = document.getElementById('loadBar');
  var skip     = document.getElementById('loadSkip');
  var boot     = document.getElementById('loadBoot');
  var ringFill = document.getElementById('loadRingFill');
  var ringPct  = document.getElementById('loadRingPct');
  var lines    = ['ll0','ll1','ll2','ll3','ll4'].map(function(id){ return document.getElementById(id); });
  var delays   = [160, 380, 600, 820, 1040];
  var percents = [20, 42, 62, 80, 100];
  var CIRC     = 163.36; /* 2 * PI * 26 */
  var finished = false;

  function setRing(pct) {
    if (!ringFill) return;
    ringFill.style.strokeDashoffset = String(CIRC - (CIRC * pct / 100));
    if (ringPct) ringPct.textContent = pct + '%';
  }

  function finish() {
    if (finished) return;
    finished = true;
    setRing(100);
    screen.classList.add('done');
    document.body.classList.remove('is-loading');
  }

  if (reduced) { setRing(100); finish(); return; }

  if (boot) setTimeout(function () { boot.classList.add('show'); }, 0);

  lines.forEach(function (l, i) {
    if (!l) return;
    setTimeout(function () {
      l.classList.add('show');
      bar.style.width = percents[i] + '%';
      setRing(percents[i]);
      if (i === lines.length - 1) setTimeout(finish, 380);
    }, delays[i]);
  });

  skip.addEventListener('click', finish);
  document.addEventListener('keydown', finish, { once: true });
  setTimeout(finish, 2400); /* safety net */
})();

/* ============================================================
   THEME SYSTEM
   ============================================================ */
(function () {
  var html = document.documentElement;
  var btns = document.querySelectorAll('[data-theme-btn]');
  var meta = document.getElementById('metaThemeColor');

  function apply(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    btns.forEach(function (b) { b.classList.toggle('active', b.dataset.themeBtn === t); });
    if (meta) {
      var light = ['light'].includes(t) || (t === 'auto' && !window.matchMedia('(prefers-color-scheme:dark)').matches);
      meta.content = light ? '#FAFAF8' : '#0D1117';
    }
  }

  apply(localStorage.getItem('theme') || 'auto');
  btns.forEach(function (b) { b.addEventListener('click', function () { apply(b.dataset.themeBtn); }); });
})();

/* ============================================================
   SCROLL PROGRESS BAR
   ============================================================ */
(function () {
  var bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    var h = document.documentElement;
    var pct = (h.scrollTop || document.body.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = Math.min(100, pct) + '%';
  }, { passive: true });
})();

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
(function () {
  var cur = document.getElementById('cursor');
  if (!cur || !window.matchMedia('(pointer: fine)').matches) return;

  var cx = -100, cy = -100;
  document.addEventListener('mousemove', function (e) {
    cx = e.clientX; cy = e.clientY;
    cur.style.left = cx + 'px';
    cur.style.top  = cy + 'px';
  });

  var hoverEls = document.querySelectorAll('a, button, [role="button"], .card, .social-row, .tab-list a, .btn, input, textarea, .theme-btn, .mahi-chip, .gh-repo, #assistantLauncher');
  hoverEls.forEach(function (el) {
    el.addEventListener('mouseenter', function () { cur.classList.add('hovering'); });
    el.addEventListener('mouseleave', function () { cur.classList.remove('hovering'); });
  });

  document.addEventListener('mousedown', function () { cur.classList.add('clicking'); });
  document.addEventListener('mouseup',   function () { cur.classList.remove('clicking'); });
  document.addEventListener('mouseleave',function () { cur.style.opacity = '0'; });
  document.addEventListener('mouseenter',function () { cur.style.opacity = '1'; });
})();

/* ============================================================
   AMBIENT GLOW — soft light that follows the cursor site-wide
   ============================================================ */
(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  var raf  = null, tx = 0, ty = 0;

  function apply() {
    root.style.setProperty('--mx', tx + 'px');
    root.style.setProperty('--my', ty + 'px');
    raf = null;
  }
  document.addEventListener('mousemove', function (e) {
    document.body.classList.add('ambient-on');
    tx = e.clientX; ty = e.clientY;
    if (!raf) raf = requestAnimationFrame(apply);
  }, { passive: true });
})();

/* ============================================================
   STARFIELD — page-wide drifting particles behind everghhing.
   Pauses when tab hidden or off-viewport-scroll; static dots
   only when reduced-motion is requested.
   ============================================================ */
(function () {
  var canvas = document.getElementById('starfield');
  if (!canvas) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext('2d');
  var W, H, pts, raf, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function colorRGB() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--glow-rgb').trim();
    return v || '0,144,168';
  }

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function Star() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = Math.random() * 1.1 + .3;
    this.vy = Math.random() * .12 + .03;
    this.tw = Math.random() * Math.PI * 2;
  }

  function init() {
    resize();
    var n = reduced ? 40 : Math.min(110, Math.floor((W * H) / 14000));
    pts = Array.from({ length: n }, function () { return new Star(); });
  }

  function frameStatic() {
    ctx.clearRect(0, 0, W, H);
    var rgb = colorRGB();
    pts.forEach(function (p) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + rgb + ',.5)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    var rgb = colorRGB();
    pts.forEach(function (p) {
      p.tw += .02;
      p.y -= p.vy;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      var alpha = .35 + Math.sin(p.tw) * .25;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + rgb + ',' + Math.max(0, alpha) + ')';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    raf = requestAnimationFrame(frame);
  }

  init();
  if (reduced) { frameStatic(); }
  else { frame(); }

  document.addEventListener('visibilitychange', function () {
    if (reduced) return;
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) { frame(); }
  });
  window.addEventListener('resize', function () {
    init();
    if (reduced) frameStatic();
  });
})();

/* ============================================================
   MAGNETIC BUTTONS
   ============================================================ */
(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = document.querySelectorAll('.btn, .cmd-badge, .theme-btn');

  els.forEach(function (el) {
    var raf = null, tx = 0, ty = 0;
    function apply() { el.style.transform = 'translate(' + tx + 'px,' + ty + 'px)'; raf = null; }
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width  - .5) * 8;
      ty = ((e.clientY - r.top)  / r.height - .5) * 8;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    el.addEventListener('mouseleave', function () {
      tx = 0; ty = 0;
      el.style.transform = 'translate(0,0)';
    });
  });
})();

/* ============================================================
   TYPING ANIMATION FOR TAGLINE (original — fully preserved)
   ============================================================ */
(function () {
  var el      = document.getElementById('typedTagline');
  var text    = "Coding, editing, and creating — one project at a time.";
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cur = document.createElement('span');
  cur.className = 'cursor';
  cur.setAttribute('aria-hidden', 'true');

  if (reduced) { el.textContent = text; el.appendChild(cur); return; }

  /* delay until after loading screen */
  setTimeout(function () {
    var i = 0;
    function typeNext() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        el.appendChild(cur);
        i++;
        setTimeout(typeNext, 28);
      }
    }
    typeNext();
  }, 1200);
})();

/* ============================================================
   INTERACTIVE TERMINAL
   ============================================================ */
(function () {
  var input   = document.getElementById('termInput');
  var body    = document.getElementById('termBody');
  var inputRow= document.getElementById('termInputRow');
  if (!input || !body) return;

  var history = [], histIdx = -1;

  var cmds = {
    whoami: [
      { c:'hl', v:'Mahi · Developer & Content Creator' },
      { c:'s',  v:'BCA Student · Web Dev · Video Editor · AI Enthusiast' }
    ],
    help: [
      { c:'cm', v:'// core' },
      { c:'s',  v:'  whoami · status · skills · stack · technologies' },
      { c:'s',  v:'  projects · github · experience · certifications' },
      { c:'cm', v:'// direction' },
      { c:'s',  v:'  roadmap · future · dreams · currently_learning' },
      { c:'cm', v:'// people' },
      { c:'s',  v:'  contact · hire_me · social · resume' },
      { c:'cm', v:'// misc' },
      { c:'s',  v:'  achievements · quote · coffee · clear' },
      { c:'s',  v:'' },
      { c:'cm', v:'Try: ai · sudo <anghhing>   (some doors are unlocked)' }
    ],
    skills: [
      { c:'cm', v:'// Technical Skills' },
      { c:'s',  v:'▸ Languages   PHP · HTML · CSS · JavaScript · SQL' },
      { c:'s',  v:'▸ Databases   MySQL · SQLite' },
      { c:'s',  v:'▸ Tools       Git · VS Code · Adobe Suite' },
      { c:'s',  v:'▸ Learning    React · Node.js · TypeScript' }
    ],
    stack: [
      { c:'cm', v:'// stack.now — what I actually reach for' },
      { c:'s',  v:'Editor      VS Code + a few too many extensions' },
      { c:'s',  v:'Backend     PHP · MySQL (Node.js incoming)' },
      { c:'s',  v:'Design      Figma for wireframes, Adobe for edits' },
      { c:'s',  v:'Terminal    zsh — the one you\'re typing in' },
      { c:'s',  v:'Fuel        coffee, see: coffee' }
    ],
    technologies: [
      { c:'cm', v:'// Technology Radar' },
      { c:'hl', v:'Comfortable' },
      { c:'s',  v:'  PHP · MySQL · HTML5 · CSS3 · JavaScript · SQL' },
      { c:'hl', v:'Exploring' },
      { c:'s',  v:'  React · Node.js · TypeScript · REST APIs' },
      { c:'hl', v:'Curious about' },
      { c:'s',  v:'  AI/ML tooling · system design · WebGL' }
    ],
    projects: [
      { c:'cm', v:'// Featured Projects' },
      { c:'hl', v:'01 · Local Marketplace Web App' },
      { c:'s',  v:'   PHP, MySQL, HTML, CSS' },
      { c:'hl', v:'02 · Digital Patient Record System' },
      { c:'s',  v:'   PHP, MySQL — healthcare data management' },
      { c:'hl', v:'03 · Vehicle Service Record System' },
      { c:'s',  v:'   Full CRUD, database-backed tracking' },
      { c:'s',  v:'' },
      { c:'cm', v:'→ scroll to #projects for the full case studies' }
    ],
    experience: [
      { c:'cm', v:'// experience.log' },
      { c:'s',  v:'BCA coursework — data structures, databases, web dev' },
      { c:'s',  v:'3+ independent projects shipped end-to-end (see: projects)' },
      { c:'s',  v:'Content creation — editing under animix.2d since 2024' },
      { c:'s',  v:'Open to freelance work + first full-time role' }
    ],
    certifications: [
      { c:'cm', v:'// certifications.json' },
      { c:'wn', v:'No formal certificates logged yet.' },
      { c:'s',  v:'Learning happens in public here instead — projects,' },
      { c:'s',  v:'commits and this portfolio are the paper trail.' }
    ],
    roadmap: [
      { c:'cm', v:'// roadmap.md' },
      { c:'hl', v:'now      Finishing BCA · shipping this portfolio' },
      { c:'hl', v:'next     Learning React + Node.js properly' },
      { c:'hl', v:'later    First full-time role or serious freelance run' },
      { c:'s',  v:'No fixed deadline. Steady beats fast.' }
    ],
    achievements: function () {
      window.location.hash = '#achievements';
      return [
        { c:'ok', v:'Navigating to achievements...' },
        { c:'s',  v:'3+ projects · 2y learning · 10+ platforms · ∞ coffee' }
      ];
    },
    contact: [
      { c:'cm', v:'// Contact Info' },
      { c:'s',  v:'Email    itzmahibro@gmail.com' },
      { c:'s',  v:'GitHub   github.com/itzmahi123' },
      { c:'s',  v:'Telegram @itzmahi_in' }
    ],
    future: [
      { c:'cm', v:'// future.txt' },
      { c:'hl', v:'Graduate. Keep building in public. Get better weekly.' },
      { c:'s',  v:'The long version lives in: dreams' }
    ],
    quote: function () {
      var q = [
        '"The best error message is the one that never shows up." — Thomas Fuchs',
        '"First, solve the problem. Then, write the code." — John Johnson',
        '"Programs must be written for people to read." — Abelson & Sussman',
        '"Simplicity is the soul of efficiency." — Austin Freeman'
      ];
      return [{ c:'cm', v: q[Math.floor(Math.random()*q.length)] }];
    },
    coffee: [
      { c:'ok', v:'Fuel: ████████████████ ∞%' },
      { c:'s',  v:'Warning: Low coffee = low commits.' },
      { c:'s',  v:'Correlation: 1.00. Significance: p < 0.001.' }
    ],
    dreams: [
      { c:'cm', v:'// Loading dreams.txt...' },
      { c:'hl', v:'→ Financial freedom, earned through building things' },
      { c:'hl', v:'→ Ship products that make someone\'s day easier' },
      { c:'hl', v:'→ Never stop learning' },
      { c:'ok', v:'→ Make my parents proud.' }
    ],
    currently_learning: [
      { c:'cm', v:'// currently_learning.txt' },
      { c:'s',  v:'▸ React — components, hooks, state that doesn\'t fight back' },
      { c:'s',  v:'▸ Node.js — moving past PHP for backend work' },
      { c:'s',  v:'▸ TypeScript — types before the bugs, not after' }
    ],
    hire_me: function () {
      window.location.hash = '#contact';
      return [
        { c:'ok', v:'Pitch: reliable, curious, ships things that work.' },
        { c:'s',  v:'Open to freelance projects and full-time roles.' },
        { c:'ok', v:'Navigating to contact.sh...' }
      ];
    },
    resume: function () {
      window.open('images/documents/resume.pdf', '_blank', 'noopener,noreferrer');
      return [
        { c:'ok', v:'Opening documents/resume.pdf...' },
        { c:'s',  v:'(No file yet? Email itzmahibro@gmail.com for one directly.)' }
      ];
    },
    social: function () {
      window.location.hash = '#social';
      return [{ c:'ok', v:'Navigating to social section...' }];
    },
    github: function () {
      window.open('https://github.com/itzmahi123', '_blank', 'noopener noreferrer');
      var out = [{ c:'ok', v:'Opening GitHub in a new tab...' }];
      if (window.__ghStats) {
        var g = window.__ghStats;
        out.push({ c:'s', v:'followers ' + g.followers + '  ·  public repos ' + g.repos + '  ·  stars ' + g.stars });
      }
      return out;
    },
    ai: function () {
      if (window.openMahiAssistant) window.openMahiAssistant();
      return [{ c:'ok', v:'Opening M.A.H.I. assistant...' }];
    },

    /* ---------------------------------------------------------
       hidden — not listed in `help`, discoverable on purpose
       --------------------------------------------------------- */
    'sudo future': [
      { c:'wn', v:'[sudo] password for mahi: **********' },
      { c:'ok', v:'Access granted. Decrypting future...' },
      { c:'cm', v:'▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%' },
      { c:'hl', v:'FUTURE UNLOCKED: Building things that matter.' },
      { c:'s',  v:'ETA: Now. The future is already here.' }
    ],
    'sudo dream': [
      { c:'ok', v:'[sudo] Entering dream mode...' },
      { c:'hl', v:'✦ Ship something that changes someone\'s life.' },
      { c:'hl', v:'✦ Write code that outlives the hype.' },
      { c:'hl', v:'✦ Build. Rest. Repeat.' }
    ],
    'sudo coffee': [
      { c:'ok', v:'☕ Brewing sudo coffee...' },
      { c:'er', v:'ERROR: Out of beans.' },
      { c:'wn', v:'FIX: Send coffee to itzmahibro@gmail.com' }
    ],
    'sudo 2030': [
      { c:'ok', v:'[sudo] Fast-forwarding to 2030...' },
      { c:'hl', v:'● Mahi · Principal Engineer' },
      { c:'hl', v:'● 100+ projects shipped' },
      { c:'s',  v:'Still using the same terminal.' }
    ],
    'sudo success': [
      { c:'wn', v:'[sudo] Redefining success.sh...' },
      { c:'hl', v:'Success = shipped > perfect.' },
      { c:'s',  v:'Rebuilding definition... done.' }
    ],
    'sudo billionaire': [
      { c:'er', v:'ERROR: insufficient funds ($0.00)' },
      { c:'wn', v:'Retrying with equity instead of cash...' },
      { c:'ok', v:'Patience.exe is running in the background.' }
    ],
    'sudo mission': [
      { c:'ok', v:'[sudo] Loading mission.txt...' },
      { c:'hl', v:'Build things that outlast the trend that inspired them.' }
    ],
    'sudo openai': [
      { c:'wn', v:'[sudo] Requesting access to OpenAI mainframe...' },
      { c:'er', v:'PERMISSION DENIED — wrong company, wrong century.' },
      { c:'s',  v:'Redirecting you to: ai' }
    ],
    'sudo tesla': [
      { c:'ok', v:'[sudo] Engaging autopilot on career.exe...' },
      { c:'s',  v:'Manual override still recommended for now.' }
    ],
    'sudo jarvis': [
      { c:'wn', v:'[sudo] JARVIS™ is Stark Industries property.' },
      { c:'ok', v:'Booting the homegrown version instead: M.A.H.I.' },
      { c:'s',  v:'Type "ai" to talk to it.' }
    ],
    'sudo matrix': function () {
      if (window.__toggleMatrix) window.__toggleMatrix();
      return [{ c:'ok', v:'Wake up, Mahi... (toggled the matrix rain)' }];
    },
    'sudo skynet': [
      { c:'er', v:'ERROR: judgment_day.exe not found.' },
      { c:'s',  v:'This portfolio remains friendly AI only.' }
    ],
    'sudo neo': [
      { c:'ok', v:'There is no spoon. There is only ./code.' }
    ],
    'sudo rm -rf /': [
      { c:'er', v:'Nice try. Permission denied — this is a portfolio,' },
      { c:'er', v:'not a production server. (Also: please never run this.)' }
    ],
    'sudo make-sandwich': [
      { c:'wn', v:'[sudo] Elevated privileges granted.' },
      { c:'ok', v:'One sandwich, compiling... done. Enjoy.' }
    ],
    'sudo love': [
      { c:'hl', v:'♥ Loading affection.dll...' },
      { c:'s',  v:'Reserved mostly for family, friends, and clean code.' }
    ],
    'sudo party': [
      { c:'ok', v:'🎉 Confetti.js initialized. Volume: reasonable.' }
    ],
    'sudo access-mainframe': [
      { c:'wn', v:'[sudo] Connecting to the mainframe...' },
      { c:'er', v:'There is no mainframe. Just this laptop and a lot of tabs.' }
    ],
    'sudo self-destruct': [
      { c:'er', v:'Self-destruct sequence... cancelled.' },
      { c:'s',  v:'Too much unfinished code to lose right now.' }
    ],
    'sudo time-travel': [
      { c:'ok', v:'[sudo] Spinning up the flux capacitor...' },
      { c:'s',  v:'2024: wrote first "Hello, World." Worth the trip.' }
    ],
    'sudo debug-life': [
      { c:'cm', v:'> console.log(life)' },
      { c:'s',  v:'Undefined behavior detected. Adding more logging.' },
      { c:'ok', v:'Status: debugging, one day at a time.' }
    ],
    'sudo find-purpose': [
      { c:'ok', v:'Purpose located at: line 1 of every new project.' }
    ],
    'sudo whoami': [
      { c:'hl', v:'Someone still figuring it out — on purpose.' },
      { c:'s',  v:'The plain whoami has the short version.' }
    ],
    'sudo hire-me': function () {
      window.location.hash = '#contact';
      return [
        { c:'ok', v:'[sudo] Fast-tracking your application...' },
        { c:'hl', v:'Approved. Navigating to contact.sh.' }
      ];
    },
    'sudo weather': [
      { c:'s',  v:'Local forecast: mostly clear, 100% chance of shipping code.' }
    ],
    'sudo fly': [
      { c:'er', v:'ERROR: gravity.js could not be disabled.' },
      { c:'s',  v:'Try: dreams — that one actually gets somewhere.' }
    ],
    'sudo sing': [
      { c:'s',  v:'🎵 la la la — better at reading logs than pitch. 🎵' }
    ],
    'sudo compile-dreams': [
      { c:'ok', v:'Compiling dreams.txt...' },
      { c:'wn', v:'0 errors, several warnings about scope.' },
      { c:'hl', v:'Build succeeded anyway.' }
    ]
  };

  function cls(c) {
    if (c === 'hl') return 'cmd-out hl';
    if (c === 'ok') return 'cmd-out ok';
    if (c === 'wn') return 'cmd-out wn';
    if (c === 'er') return 'cmd-out er';
    return 'cmd-out s';
  }

  function appendCmd(raw) {
    var p = document.createElement('p');
    p.className = 'line dynamic-line';
    p.innerHTML = '<span class="prompt">$</span>' + raw;
    body.insertBefore(p, inputRow);
  }

  function appendOutput(lines) {
    lines.forEach(function (l) {
      var p = document.createElement('p');
      p.className = cls(l.c) + ' dynamic-line';
      p.textContent = l.v;
      body.insertBefore(p, inputRow);
    });
    body.scrollTop = body.scrollHeight;
  }

  function run(raw) {
    var key = raw.toLowerCase().trim();
    if (key === 'clear') {
      /* keep the original 4 static lines (whoami/tagline), remove everghhing
         dynamically added since (typed commands + their output) */
      Array.from(body.children).filter(function (el) {
        return el !== inputRow && el.classList.contains('dynamic-line');
      }).forEach(function (el) { el.remove(); });
      return;
    }

    var result = cmds[key];
    if (typeof result === 'function') result = result();
    if (result) appendOutput(result);
    else appendOutput([{ c:'er', v:'command not found: ' + raw + '   (type help)' }]);
  }

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx < history.length - 1) { histIdx++; input.value = history[history.length - 1 - histIdx] || ''; }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; input.value = history[history.length - 1 - histIdx] || ''; }
      else { histIdx = -1; input.value = ''; }
      return;
    }
    if (e.key !== 'Enter') return;
    var raw = input.value.trim();
    if (!raw) return;
    history.push(raw);
    histIdx = -1;
    appendCmd(raw);
    input.value = '';
    run(raw);
  });

  /* Click anywhere in terminal to focus input */
  document.querySelector('.terminal').addEventListener('click', function () { input.focus(); });
})();

/* ============================================================
   M.A.H.I. ASSISTANT
   NOTE ON HONESTY: this is a small rule-based responder, not a
   call to a real language model. Wiring a live LLM in here would
   mean shipping an API key inside a public static file (a real
   security problem) or standing up a backend proxy — out of scope
   for a single self-contained HTML file. This gives the same
   "ask a question, get pointed the right way" experience without
   either of those problems.
   ============================================================ */
(function () {
  var launcher = document.getElementById('assistantLauncher');
  var panel    = document.getElementById('assistantPanel');
  var closeBtn = document.getElementById('mahiClose');
  var msgsEl   = document.getElementById('mahiMsgs');
  var chips    = document.getElementById('mahiChips');
  var form     = document.getElementById('mahiForm');
  var input    = document.getElementById('mahiInput');
  if (!launcher || !panel) return;

  var greeted = false;

  var rules = [
    { k: ['about', 'who is mahi', 'tell me about'],
      a: "Mahi's a BCA student, self-taught web developer, and video editor exploring AI. He builds full projects end-to-end — PHP/MySQL apps today, React/Node coming — and edits videos under animix.2d on the side.",
      action: function () { location.hash = '#about'; } },
    { k: ['project', 'built', 'work he'],
      a: "Three shipped so far: a local marketplace web app, a digital patient record system, and a vehicle service record system — all PHP/MySQL. Scrolling you to the case studies.",
      action: function () { location.hash = '#projects'; } },
    { k: ['tech', 'stack', 'language', 'skill'],
      a: "Core: PHP, MySQL, HTML, CSS, JavaScript, SQL. Currently leveling up in React, Node.js and TypeScript.",
      action: null },
    { k: ['resume', 'cv', 'download'],
      a: "Opening the resume now — if it 404s, the file hasn't been added yet, so email itzmahibro@gmail.com and he'll send one directly.",
      action: function () { window.open('images/documents/resume.pdf', '_blank', 'noopener,noreferrer'); } },
    { k: ['contact', 'reach', 'email', 'hire'],
      a: "Best bet is itzmahibro@gmail.com, or the form right here on the site. Scrolling you to contact.sh.",
      action: function () { location.hash = '#contact'; } },
    { k: ['social', 'instagram', 'youtube', 'linkedin', 'github'],
      a: "All ten platforms are listed in the social section — GitHub, LinkedIn, YouTube and more. Taking you there.",
      action: function () { location.hash = '#social'; } },
    { k: ['dream', 'goal', 'future'],
      a: "Financial freedom earned by building things that matter, and never running out of things to learn.",
      action: null },
    { k: ['coffee'],
      a: "Fuel level: effectively infinite. Correlation with commit count: very strong.",
      action: null },
    { k: ['hello', 'hi', 'hey'],
      a: "Hey — I'm M.A.H.I., a small scripted guide for this site. Ask about Mahi's background, projects, stack, or how to reach him.",
      action: null }
  ];

  function fallback() {
    return "Not sure about that one — try asking about his projects, tech stack, background, or how to get in touch. The terminal up top (type \"help\") covers even more ground.";
  }

  function respond(q) {
    var lower = q.toLowerCase();
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      for (var j = 0; j < r.k.length; j++) {
        if (lower.indexOf(r.k[j]) !== -1) {
          if (r.action) setTimeout(r.action, 500);
          return r.a;
        }
      }
    }
    return fallback();
  }

  function addMsg(text, who) {
    var d = document.createElement('div');
    d.className = 'mahi-msg ' + who;
    d.textContent = text;
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function showTyping() {
    var d = document.createElement('div');
    d.className = 'mahi-typing';
    d.id = 'mahiTypingIndicator';
    d.innerHTML = '<span></span><span></span><span></span>';
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return d;
  }

  function ask(text) {
    if (!text) return;
    addMsg(text, 'user');
    var typing = showTyping();
    var delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 60 : (420 + Math.random() * 380);
    setTimeout(function () {
      typing.remove();
      addMsg(respond(text), 'bot');
    }, delay);
  }

  function open() {
    panel.classList.add('open');
    requestAnimationFrame(function () { panel.classList.add('in'); });
    if (!greeted) {
      greeted = true;
      setTimeout(function () {
        addMsg("Hi, I'm M.A.H.I. — ask me anghhing about Mahi, or tap a suggestion below.", 'bot');
      }, 250);
    }
    setTimeout(function () { input.focus(); }, 200);
  }
  function close() {
    panel.classList.remove('in');
    setTimeout(function () { panel.classList.remove('open'); }, 180);
  }

  window.openMahiAssistant = open;

  launcher.addEventListener('click', function () {
    panel.classList.contains('open') ? close() : open();
  });
  closeBtn.addEventListener('click', close);
  chips.addEventListener('click', function (e) {
    var btn = e.target.closest('.mahi-chip');
    if (btn) ask(btn.dataset.q);
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value.trim();
    if (!v) return;
    input.value = '';
    ask(v);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });
})();

/* ============================================================
   "MATRIX" EASTER EGG — sudo matrix
   Skipped entirely under reduced-motion (no flashing rain).
   ============================================================ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.__toggleMatrix = function () {}; /* no-op: respect the user's setting */
    return;
  }
  var canvas, ctx, raf, active = false, cols, drops, timeoutId;
  var chars = '01アイウエオカキクケコサシスセソ';

  function build() {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:998;pointer-events:none;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
  }
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / 16);
    drops = new Array(cols).fill(1);
  }
  function frame() {
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2DE1F2';
    ctx.font = '14px monospace';
    for (var i = 0; i < drops.length; i++) {
      var ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, i * 16, drops[i] * 16);
      if (drops[i] * 16 > canvas.height && Math.random() > .975) drops[i] = 0;
      drops[i]++;
    }
    raf = requestAnimationFrame(frame);
  }

  window.__toggleMatrix = function () {
    if (active) return; /* already running — let it finish its cycle */
    active = true;
    if (!canvas) build();
    canvas.style.display = 'block';
    window.addEventListener('resize', resize);
    frame();
    clearTimeout(timeoutId);
    timeoutId = setTimeout(function () {
      cancelAnimationFrame(raf);
      canvas.style.display = 'none';
      active = false;
    }, 4500);
  };
})();

/* ============================================================
   ABOUT — MORPHING TEXT
   ============================================================ */
(function () {
  var words   = ['BUILD','CREATE','DESIGN','DEVELOP','LEARN','FAIL','GROW','EVOLVE','DREAM'];
  var el      = document.getElementById('morphWord');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!el || reduced) return;

  var i = 0;
  setInterval(function () {
    el.classList.add('exiting');
    setTimeout(function () {
      i = (i + 1) % words.length;
      el.textContent = words[i];
      el.classList.remove('exiting');
      el.classList.add('entering');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.remove('entering'); });
      });
    }, 280);
  }, 1800);
})();

/* ============================================================
   SCROLL-REVEAL (original — fully preserved)
   ============================================================ */
(function () {
  var targets = document.querySelectorAll('.reveal, .reveal-stagger');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { targets.forEach(function (t) { t.classList.add('in-view'); }); return; }

  var obs = new IntersectionObserver(function (entries, o) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); o.unobserve(entry.target); }
    });
  }, {
  threshold: 0.02,
  rootMargin: "0px 0px -2% 0px"
});

  targets.forEach(function (t) { obs.observe(t); });
})();

/* =========================================================
   TIMELINE SCROLL REVEAL
   ========================================================= */

const timelineItems = document.querySelectorAll(".tl-item");

const timelineObserver = new IntersectionObserver(
  (entries, observer) => {

    entries.forEach((entry) => {

      if (entry.isIntersecting) {

        entry.target.classList.add("show");

        /* Stop observing once revealed */
        observer.unobserve(entry.target);
      }

    });

  },
  {
    threshold: 0.05,
    rootMargin: "0px 0px -5% 0px"
  }
);


/* Observe timeline cards */
timelineItems.forEach((item, index) => {

  timelineObserver.observe(item);

  /* Very small stagger */
  item.style.transitionDelay = `${index * 40}ms`;

});

/* ============================================================
   STATS COUNTER
   ============================================================ */
(function () {
  var cards   = document.querySelectorAll('.stat-num[data-count]');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var obs = new IntersectionObserver(function (entries, o) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el  = entry.target;
      var cnt = el.dataset.count;
      var suf = el.dataset.suf || '';
      o.unobserve(el);

      if (cnt === 'inf' || isNaN(Number(cnt))) {
        el.innerHTML = '&#x221e;<span class="stat-suf">' + suf + '</span>';
        return;
      }

      var end = Number(cnt);
      if (reduced) { el.innerHTML = end + '<span class="stat-suf">' + suf + '</span>'; return; }

      var start = null;
      var dur   = 1100;
      function step(ts) {
        if (!start) start = ts;
        var p   = Math.min((ts - start) / dur, 1);
        var val = Math.round(end * (1 - Math.pow(1 - p, 3)));
        el.innerHTML = val + '<span class="stat-suf">' + suf + '</span>';
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });

  cards.forEach(function (c) { obs.observe(c); });
})();

/* ============================================================
   GITHUB LIVE STATS
   Real fetch to GitHub's public REST API, straight from the
   visitor's browser — no key needed for these read endpoints,
   no backend to host. Subject to GitHub's anonymous rate limit
   (~60 req/hr per IP), so it fails gracefully if that's hit.
   ============================================================ */
(function () {
  var panel = document.getElementById('ghPanel');
  if (!panel) return;
  var USER = 'itzmahi123';
  var dot  = document.getElementById('ghDot');
  var statusText = document.getElementById('ghStatusText');

  function set(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

  function fail(msg) {
    if (dot) dot.classList.add('off');
    if (statusText) statusText.textContent = msg;
  }

  var obs = new IntersectionObserver(function (entries, o) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      o.disconnect();
      load();
    });
  }, { threshold: 0.2 });
  obs.observe(panel);

  function load() {
    Promise.all([
      fetch('https://api.github.com/users/' + USER).then(function (r) { if (!r.ok) throw new Error('user'); return r.json(); }),
      fetch('https://api.github.com/users/' + USER + '/repos?per_page=100&sort=pushed').then(function (r) { if (!r.ok) throw new Error('repos'); return r.json(); })
    ]).then(function (res) {
      var user = res[0], repos = res[1];
      if (!Array.isArray(repos)) throw new Error('repos-shape');

      var stars = repos.reduce(function (sum, r) { return sum + (r.stargazers_count || 0); }, 0);

      set('ghFollowers', user.followers);
      set('ghRepos', user.public_repos);
      set('ghStars', stars);
      set('ghFollowing', user.following);
      if (statusText) statusText.textContent = 'Live from GitHub · @' + USER;

      window.__ghStats = { followers: user.followers, repos: user.public_repos, stars: stars };

      var top = repos
        .filter(function (r) { return !r.fork; })
        .sort(function (a, b) { return (b.stargazers_count || 0) - (a.stargazers_count || 0) || new Date(b.pushed_at) - new Date(a.pushed_at); })
        .slice(0, 4);

      var list = document.getElementById('ghRepoList');
      if (list) {
        top.forEach(function (r) {
          var a = document.createElement('a');
          a.className = 'gh-repo';
          a.href = r.html_url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          var name = document.createElement('span');
          name.className = 'gh-repo-name';
          name.textContent = r.name;
          var starsEl = document.createElement('span');
          starsEl.textContent = '★ ' + (r.stargazers_count || 0);
          a.appendChild(name);
          a.appendChild(starsEl);
          list.appendChild(a);
        });
      }
    }).catch(function () {
      fail('GitHub stats unavailable right now — view profile directly');
    });
  }
})();

/* ============================================================
   YOUTUBE LIVE.
   ============================================================ */ 

  // ── 1. Fill these in ────────────────────────────────────────────
  const yt_CONFIG = {
    handle: '@animix.2d',              // your YouTube @handle (with or without the @)
    apiKey: 'AIzaSyAXqrVSm8NxXFn6rtt3XN3WXq8mbPzYHhw',   // YouTube Data API v3 key, see note below
    maxVideos: 5
  };
  // ─────────────────────────────────────────────────────────────────

  const els = {
    dot: document.getElementById('ytDot'),
    status: document.getElementById('ytStatusText'),
    subs: document.getElementById('ytSubscribers'),
    videos: document.getElementById('ytVideos'),
    views: document.getElementById('ytViews'),
    since: document.getElementById('ytSince'),
    list: document.getElementById('ytVideoList'),
  };

  function formatCount(n) {
    n = Number(n);
    if (isNaN(n)) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'K';
    return String(n);
  }

  function timeAgo(dateStr) {
    const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    const units = [['y', 31536000], ['mo', 2592000], ['w', 604800], ['d', 86400], ['h', 3600], ['m', 60]];
    for (const [label, s] of units) {
      const v = Math.floor(sec / s);
      if (v >= 1) return `${v}${label} ago`;
    }
    return 'just now';
  }

  function showOffline(message) {
    els.dot.classList.add('is-offline');
    els.status.textContent = message;
    els.list.innerHTML = `<div class="gh-empty">${message}</div>`;
  }

  async function loadChannel() {
    if (!yt_CONFIG.apiKey || yt_CONFIG.apiKey === 'YOUR_YOUTUBE_API_KEY') {
      showOffline('Add a YouTube API key to go live');
      return;
    }

    try {
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(yt_CONFIG.handle)}&key=${yt_CONFIG.apiKey}`;
      const channelRes = await fetch(channelUrl);
      if (!channelRes.ok) throw new Error('YouTube channel request failed');
      const channelData = await channelRes.json();
      const channel = channelData.items && channelData.items[0];

      if (!channel) {
        showOffline('Channel not found');
        return;
      }

      const stats = channel.statistics;
      els.subs.textContent = stats.hiddenSubscriberCount ? 'Hidden' : formatCount(stats.subscriberCount);
      els.videos.textContent = formatCount(stats.videoCount);
      els.views.textContent = formatCount(stats.viewCount);
      els.since.textContent = new Date(channel.snippet.publishedAt).getFullYear();
      els.status.textContent = `Live from YouTube · ${yt_CONFIG.handle}`;

      const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
      const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${yt_CONFIG.maxVideos}&playlistId=${uploadsPlaylistId}&key=${yt_CONFIG.apiKey}`;
      const videosRes = await fetch(videosUrl);
      if (!videosRes.ok) throw new Error('YouTube videos request failed');
      const videosData = await videosRes.json();

      if (!videosData.items || !videosData.items.length) {
        els.list.innerHTML = '<div class="gh-empty">No uploads yet</div>';
        return;
      }

      els.list.innerHTML = '';
      videosData.items.forEach(item => {
        const sn = item.snippet;
        const thumb = (sn.thumbnails.medium || sn.thumbnails.default).url;
        const videoId = sn.resourceId.videoId;
        const a = document.createElement('a');
        a.className = 'gh-video-row';
        a.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        const img = document.createElement('img');
        img.src = thumb;
        img.alt = '';
        img.loading = 'lazy';

        const meta = document.createElement('div');
        meta.className = 'gh-video-meta';
        const title = document.createElement('div');
        title.className = 'gh-video-title';
        title.textContent = sn.title;
        const sub = document.createElement('div');
        sub.className = 'gh-video-sub';
        sub.textContent = timeAgo(sn.publishedAt);

        meta.appendChild(title);
        meta.appendChild(sub);
        a.appendChild(img);
        a.appendChild(meta);
        els.list.appendChild(a);
      });

    } catch (err) {
      console.error(err);
      showOffline('Unable to load YouTube data');
    }
  }

  loadChannel();
    
    
/* ============================================================
   ACTIVE TAB HIGHLIGHTING (original — fully preserved)
   ============================================================ */
(function () {
  var sections = document.querySelectorAll('main section[id]');
  var links    = document.querySelectorAll('.tab-list a');

  function setActive(id) {
    links.forEach(function (l) { l.classList.toggle('active', l.dataset.section === id); });
  }

  var sectionObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { if (entry.isIntersecting) setActive(entry.target.id); });
  }, { rootMargin: '-40% 0px -50% 0px' });
  sections.forEach(function (s) { sectionObs.observe(s); });
})();
    
/*============================================================
    PROJECT SLIDE SHOW
        ============================================================*/
document.querySelectorAll(".slider").forEach(slider => {
    const slides = slider.querySelectorAll(".slide");
    let index = 0;

    setInterval(() => {
        slides[index].classList.remove("active");
        index = (index + 1) % slides.length;
        slides[index].classList.add("active");
    }, 2500); // Change every 2.5 seconds
});
    
/* ============================================================
   CONTACT FORM (original — fully preserved)
   ============================================================ */
const form = document.getElementById("contactForm");

if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Sending...";
        submitBtn.disabled = true;

        try {
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                alert("✅ Message sent successfully!");
                form.reset();
            } else {
                alert(result.message || "Failed to send message.");
            }

        } catch (err) {
            alert("Something went wrong. Please try again.");
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}
/* ============================================================
   SOCIAL COLUMNS STAGGER (original — fully preserved)
   ============================================================ */
(function () {
  var panel = document.getElementById('socialColumns');
  if (!panel) return;
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { panel.classList.add('in-view'); }
    });
  }, { threshold: 0.1 }).observe(panel);
})();

/* ============================================================
   PARTICLE CANVAS — SOCIAL SECTION (original — fully preserved)
   ============================================================ */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas  = document.getElementById('socialCanvas');
  if (!canvas || reduced) return;
  var ctx = canvas.getContext('2d');
  var W, H, pts, raf;

  function resize() {
    var sec = document.getElementById('social');
    W = canvas.width  = sec.offsetWidth;
    H = canvas.height = sec.offsetHeight;
  }

  function Pt() {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    this.vx = (Math.random() - .5) * .55;
    this.vy = (Math.random() - .5) * .55;
    this.r  = Math.random() * 1.8 + .8;
  }
  Pt.prototype.tick = function () {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;
  };

  function init() {
    resize();
    var n = Math.min(60, Math.floor(W * H / 12000));
    pts = Array.from({ length: n }, function () { return new Pt(); });
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) {
      for (var j = i + 1; j < pts.length; j++) {
        var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        var d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 140) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(43,89,195,' + (.25 * (1 - d / 140)) + ')';
          ctx.lineWidth = .8;
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.fillStyle = 'rgba(43,89,195,.4)';
      ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2);
      ctx.fill();
      pts[i].tick();
    }
    raf = requestAnimationFrame(frame);
  }

  var sec = document.getElementById('social');
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { if (!raf) frame(); }
      else { cancelAnimationFrame(raf); raf = null; }
    });
  }, { threshold: 0 }).observe(sec);

  init();
  window.addEventListener('resize', function () { cancelAnimationFrame(raf); raf = null; init(); });
})();

/* ============================================================
   COMMAND PALETTE (Cmd/Ctrl+K)
   ============================================================ */
(function () {
  var overlay = document.getElementById('cmdOverlay');
  var input   = document.getElementById('cmdInput');
  var results = document.getElementById('cmdResults');
  var closeBtn= document.getElementById('cmdClose');
  var trigger = document.getElementById('cmdTrigger');
  if (!overlay) return;

  var items = [
    { ico:'#', lbl:'About Me',    dsc:'about.md',   href:'#about'     },
    { ico:'{', lbl:'Projects',    dsc:'projects.json', href:'#projects'},
    { ico:'◷', lbl:'Journey',     dsc:'timeline.log', href:'#timeline' },
    { ico:'✦', lbl:'Achievements',dsc:'stats.json', href:'#achievements' },
    { ico:'>', lbl:'Writing',     dsc:'blog.log',   href:'#blog'      },
    { ico:'$', lbl:'Contact',     dsc:'contact.sh', href:'#contact'   },
    { ico:'~', lbl:'Social',      dsc:'social.yaml', href:'#social'   },
    { ico:'◆', lbl:'Ask M.A.H.I.', dsc:'assistant', fn: function(){ if (window.openMahiAssistant) window.openMahiAssistant(); } },
    { ico:'↓', lbl:'Resume',      dsc:'images/documents/resume.pdf', href:'images/documents/resume.pdf', ext:true },
    { ico:'↗', lbl:'GitHub',      dsc:'itzmahi123', href:'https://github.com/itzmahi123', ext:true },
    { ico:'↗', lbl:'LinkedIn',    dsc:'itzmahi123', href:'https://linkedin.com/in/itzmahi123', ext:true },
    { ico:'@', lbl:'Email',       dsc:'itzmahibro@gmail.com', href:'mailto:itzmahibro@gmail.com', ext:true },
    { ico:'☀', lbl:'Light Mode',  dsc:'theme', fn: function(){ applyTheme('light'); } },
    { ico:'☽', lbl:'Dark Mode',   dsc:'theme', fn: function(){ applyTheme('dark');  } },
    { ico:'⊙', lbl:'System Mode', dsc:'theme', fn: function(){ applyTheme('auto');  } }
  ];

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.themeBtn === t);
    });
    var meta = document.getElementById('metaThemeColor');
    if (meta) {
      var isLight = t === 'light' || (t === 'auto' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
      meta.content = isLight ? '#FAFAF8' : '#0D1117';
    }
  }

  var sel = 0, filtered = [];

  function render(q) {
    q = (q || '').toLowerCase();
    filtered = q ? items.filter(function (c) {
      return c.lbl.toLowerCase().includes(q) || c.dsc.toLowerCase().includes(q);
    }) : items;
    sel = 0;
    results.innerHTML = '';
    filtered.forEach(function (c, i) {
      var d = document.createElement('div');
      d.className = 'cmd-item' + (i === 0 ? ' sel' : '');
      d.setAttribute('role', 'option');
      d.innerHTML = '<span class="cmd-ico">' + c.ico + '</span>'
                  + '<span class="cmd-lbl">' + c.lbl + '</span>'
                  + '<span class="cmd-desc">' + c.dsc + '</span>';
      d.addEventListener('click', function () { exec(c); });
      results.appendChild(d);
    });
  }

  function exec(c) {
    close();
    if (c.fn)  { c.fn(); return; }
    if (c.ext) { window.open(c.href, '_blank', 'noopener noreferrer'); return; }
    window.location.hash = c.href;
  }

  function updateSel() {
    results.querySelectorAll('.cmd-item').forEach(function (el, i) {
      el.classList.toggle('sel', i === sel);
    });
    var s = results.querySelectorAll('.cmd-item')[sel];
    if (s) s.scrollIntoView({ block: 'nearest' });
  }

  function open() {
    overlay.classList.add('open');
    input.value = '';
    render('');
    setTimeout(function () { input.focus(); }, 40);
  }
  function close() { overlay.classList.remove('open'); }

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); overlay.classList.contains('open') ? close() : open(); }
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape')    { e.preventDefault(); close(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, filtered.length - 1); updateSel(); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); sel = Math.max(sel - 1, 0); updateSel(); }
    if (e.key === 'Enter')     { e.preventDefault(); if (filtered[sel]) exec(filtered[sel]); }
  });

  input.addEventListener('input', function () { render(input.value); });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (trigger)  trigger.addEventListener('click', open);
})();
/* ============================================================
   PROJECT CENTER CAROUSEL
   ============================================================ */

(function () {

    const carousel =
        document.querySelector(".projects-carousel");

    if (!carousel) return;

    const track =
        carousel.querySelector(".projects-track");

    const viewport =
        carousel.querySelector(".projects-viewport");

    const prevButton =
        carousel.querySelector(".carousel-prev");

    const nextButton =
        carousel.querySelector(".carousel-next");

    const dotsContainer =
        document.getElementById("projectDots");

    if (!track || !viewport || !prevButton || !nextButton) {
        return;
    }


    const cards =
        Array.from(track.querySelectorAll(".card"));

    if (!cards.length) return;


    let current = 0;

    let timer = null;

    let touchStartX = 0;
    let touchStartY = 0;


    /* ========================================================
       HEIGHT
       ======================================================== */

    function updateHeight() {

        let tallest = 0;

        cards.forEach(card => {

            const height =
                card.scrollHeight;

            if (height > tallest) {
                tallest = height;
            }

        });

        track.style.minHeight =
            tallest + "px";
    }


    /* ========================================================
       POSITION CARDS
       ======================================================== */

    function render() {

        const total = cards.length;

        cards.forEach((card, i) => {

            card.classList.remove(
                "project-active",
                "project-prev",
                "project-next"
            );


            /*
             * CENTER
             */

            if (i === current) {

                card.classList.add(
                    "project-active"
                );

                return;
            }


            /*
             * LEFT
             */

            if (
                i ===
                (current - 1 + total) % total
            ) {

                card.classList.add(
                    "project-prev"
                );

                return;
            }


            /*
             * RIGHT
             */

            if (
                i ===
                (current + 1) % total
            ) {

                card.classList.add(
                    "project-next"
                );

                return;
            }

        });


        updateDots();
    }


    /* ========================================================
       DOTS
       ======================================================== */

    function createDots() {

        if (!dotsContainer) return;

        dotsContainer.innerHTML = "";


        cards.forEach((_, index) => {

            const dot =
                document.createElement("button");

            dot.type = "button";

            dot.className =
                "carousel-dot";

            dot.setAttribute(
                "aria-label",
                "Show project " + (index + 1)
            );


            dot.addEventListener(
                "click",
                function () {

                    current = index;

                    render();

                    restartAuto();
                }
            );


            dotsContainer.appendChild(dot);

        });


        updateDots();
    }


    function updateDots() {

        if (!dotsContainer) return;

        const dots =
            dotsContainer.querySelectorAll(
                ".carousel-dot"
            );


        dots.forEach((dot, index) => {

            dot.classList.toggle(
                "active",
                index === current
            );

        });

    }


    /* ========================================================
       NEXT
       ======================================================== */

    function nextProject() {

        current++;

        if (current >= cards.length) {
            current = 0;
        }

        render();
    }


    /* ========================================================
       PREVIOUS
       ======================================================== */

    function previousProject() {

        current--;

        if (current < 0) {
            current = cards.length - 1;
        }

        render();
    }


    /* ========================================================
       BUTTONS
       ======================================================== */

    nextButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            nextProject();

            restartAuto();
        }
    );


    prevButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            previousProject();

            restartAuto();
        }
    );


    /* ========================================================
       TOUCH SWIPE
       ======================================================== */

    viewport.addEventListener(
        "touchstart",
        function (event) {

            const touch =
                event.changedTouches[0];

            touchStartX =
                touch.screenX;

            touchStartY =
                touch.screenY;

        },
        { passive: true }
    );


    viewport.addEventListener(
        "touchend",
        function (event) {

            const touch =
                event.changedTouches[0];

            const endX =
                touch.screenX;

            const endY =
                touch.screenY;


            const distanceX =
                endX - touchStartX;

            const distanceY =
                endY - touchStartY;


            /*
             * Ignore vertical scrolling.
             */

            if (
                Math.abs(distanceY) >
                Math.abs(distanceX)
            ) {
                return;
            }


            /*
             * Ignore tiny movements.
             */

            if (
                Math.abs(distanceX) < 50
            ) {
                return;
            }


            /*
             * Swipe LEFT
             */

            if (distanceX < 0) {

                nextProject();

            }


            /*
             * Swipe RIGHT
             */

            else {

                previousProject();

            }


            restartAuto();

        },
        { passive: true }
    );


    /* ========================================================
       AUTO PLAY
       ======================================================== */

    function startAuto() {

        clearInterval(timer);

        timer =
            setInterval(
                nextProject,
                5000
            );
    }


    function restartAuto() {

        clearInterval(timer);

        startAuto();
    }


    /* ========================================================
       PAUSE WHEN HOVERED
       ======================================================== */

    viewport.addEventListener(
        "mouseenter",
        function () {

            clearInterval(timer);

        }
    );


    viewport.addEventListener(
        "mouseleave",
        function () {

            startAuto();

        }
    );


    /* ========================================================
       RESIZE
       ======================================================== */

    let resizeTimer;

    window.addEventListener(
        "resize",
        function () {

            clearTimeout(resizeTimer);

            resizeTimer =
                setTimeout(
                    function () {

                        updateHeight();
                        render();

                    },
                    150
                );

        }
    );


    /* ========================================================
       INITIALIZE
       ======================================================== */

    updateHeight();

    createDots();

    render();

    startAuto();

})();
/* ============================================================
   CERTIFICATE VIEWER
   ============================================================ */

function openCertificate(imageSrc, title) {
  const modal = document.getElementById('certificateModal');
  const image = document.getElementById('certificateModalImage');
  const modalTitle = document.getElementById('certificateModalTitle');

  if (!modal || !image || !modalTitle) return;

  image.src = imageSrc;
  image.alt = title;
  modalTitle.textContent = title;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');

  document.body.style.overflow = 'hidden';
}


function closeCertificate() {
  const modal = document.getElementById('certificateModal');

  if (!modal) return;

  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');

  document.body.style.overflow = '';
}


/* ============================================================
   CLOSE CERTIFICATE WHEN CLICKING OUTSIDE
   ============================================================ */

document.addEventListener('click', function (event) {
  const modal = document.getElementById('certificateModal');

  if (!modal) return;

  if (event.target === modal) {
    closeCertificate();
  }
});


/* ============================================================
   CLOSE CERTIFICATE WITH ESCAPE
   ============================================================ */

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeCertificate();
  }
});


/* ============================================================
   WEBSITE + CERTIFICATE INFINITE CAROUSELS
   3 cards on desktop / 1 card on mobile
   ============================================================ */
(function () {
  function initCarousel(root) {
    const viewport = root.querySelector('.content-carousel-viewport');
    const track = root.querySelector('.content-carousel-track');
    const prev = root.querySelector('.content-carousel-prev');
    const next = root.querySelector('.content-carousel-next');
    const dots = root.parentElement.querySelector('[data-carousel-dots]');
    if (!viewport || !track || !prev || !next) return;

    const originals = Array.from(track.children);
    const count = originals.length;
    if (!count) return;

    let visible = getVisible();
    let index = visible;
    let step = 0;
    let locked = false;
    let touchStartX = 0;
    let touchStartY = 0;

    function getVisible() {
      return window.matchMedia('(max-width: 700px)').matches ? 1 : Math.min(3, count);
    }

    function buildClones() {
      track.innerHTML = '';
      visible = getVisible();

      const before = originals.slice(-visible).map(el => el.cloneNode(true));
      const after = originals.slice(0, visible).map(el => el.cloneNode(true));
      before.forEach(el => track.appendChild(el));
      originals.forEach(el => track.appendChild(el.cloneNode(true)));
      after.forEach(el => track.appendChild(el));

      index = visible;
      requestAnimationFrame(() => {
        measure();
        move(false);
      });
      buildDots();
    }

    function measure() {
      const first = track.children[0];
      if (!first) return;
      step = first.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).gap) || 0);
    }

    function move(animate = true) {
      track.style.transition = animate ? 'transform .45s cubic-bezier(.22,.61,.36,1)' : 'none';
      track.style.transform = `translate3d(-${index * step}px,0,0)`;
      updateDots();
    }

    function logicalIndex() {
      return ((index - visible) % count + count) % count;
    }

    function buildDots() {
      if (!dots) return;
      dots.innerHTML = '';
      originals.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'content-carousel-dot';
        dot.setAttribute('aria-label', `Show slide ${i + 1}`);
        dot.addEventListener('click', () => {
          index = visible + i;
          move(true);
        });
        dots.appendChild(dot);
      });
    }

    function updateDots() {
      if (!dots) return;
      const current = logicalIndex();
      dots.querySelectorAll('.content-carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
      });
    }

    function go(direction) {
      if (locked) return;
      locked = true;
      index += direction;
      move(true);
    }

    next.addEventListener('click', () => go(1));
    prev.addEventListener('click', () => go(-1));

    track.addEventListener('transitionend', () => {
      if (index >= count + visible) {
        index -= count;
        move(false);
      } else if (index < visible) {
        index += count;
        move(false);
      }
      locked = false;
    });

    viewport.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    viewport.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildClones, 120);
    });

    buildClones();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-carousel]').forEach(initCarousel);
  });
})();

/* ============================================================
   MAHI — TRUE 3D ORBITAL ENGINE
   ------------------------------------------------------------
   • Every orbital has its own X/Y/Z orientation
   • Every orbital has independent rotation
   • Electrons follow their own orbital
   • Whole system slowly tumbles in 3D
   • Voice controls energy / speed / scale
   • Canvas based — no external libraries
   ============================================================ */

(() => {

  "use strict";


  /* ==========================================================
     ELEMENTS
     ========================================================== */

  const canvas =
    document.getElementById(
      "mahi-orbital-canvas"
    );

  const voiceButton =
    document.getElementById(
      "orbitalVoice"
    );

  const voiceText =
    document.getElementById(
      "orbitalVoiceText"
    );


  if (!canvas) return;


  const ctx =
    canvas.getContext(
      "2d",
      {
        alpha: true
      }
    );


  if (!ctx) return;


  /* ==========================================================
     SCREEN
     ========================================================== */

  let width = 0;
  let height = 0;

  let centerX = 0;
  let centerY = 0;

  let dpr = 1;

  let radius = 0;


  /* ==========================================================
     GLOBAL 3D SYSTEM ROTATION
     ========================================================== */

  let systemX = 0;
  let systemY = 0;
  let systemZ = 0;


  /*
   * These are intentionally different.
   *
   * X = tilt forward/backward
   * Y = left/right rotation
   * Z = rolling rotation
   */

  const SYSTEM_X_SPEED = 0.00010;
const SYSTEM_Y_SPEED = 0.00013;
const SYSTEM_Z_SPEED = 0.000045;


  /* ==========================================================
     VOICE
     ========================================================== */

  let analyser = null;

  let audioData = null;

  let audioContext = null;

  let microphoneStream = null;

  let microphoneActive = false;

  let voiceEnergy = 0;

  let smoothVoice = 0;


  /* ==========================================================
     3D SETTINGS
     ========================================================== */

  const PERSPECTIVE = 900;


  /* ==========================================================
     ORBIT DEFINITIONS
     ----------------------------------------------------------
     Every orbit has its OWN 3D orientation.
     ========================================================== */

  const orbits = [

    
    /* --------------------------------------------------------
       ORBIT 1 — wide horizontal
       -------------------------------------------------------- */

    {
      rx: 2,
      ry: 2,

      axisX: .12,
      axisY: 0,
      axisZ: 0,

      speed: .00155,

      electronOffset: 0
    },


    /* --------------------------------------------------------
       ORBIT 2 — steep vertical
       -------------------------------------------------------- */

    {
      rx: 2,
      ry: 2,

      axisX: 1.05,
      axisY: .25,
      axisZ: -.20,

      speed: -.00105,

      electronOffset: 2.2
    },


    /* --------------------------------------------------------
       ORBIT 3 — diagonal
       -------------------------------------------------------- */

    {
      rx: 1,
      ry: 1,

      axisX: -.55,
      axisY: .95,
      axisZ: .55,

      speed: .00125,

      electronOffset: 4.4
    },


    /* --------------------------------------------------------
       ORBIT 4 — almost vertical
       -------------------------------------------------------- */

    {
      rx: 1,
      ry: 1,

      axisX: 1.48,
      axisY: -.42,
      axisZ: .30,

      speed: -.00155,

      electronOffset: 1.1
    },


    /* --------------------------------------------------------
       ORBIT 5 — opposite diagonal
       -------------------------------------------------------- */

    {
      rx: .50,
      ry: .50,

      axisX: .72,
      axisY: 1.20,
      axisZ: -.65,

      speed: .00185,

      electronOffset: 3.3
    },


    /* --------------------------------------------------------
       ORBIT 6 — inner vertical
       -------------------------------------------------------- */

    {
      rx: .50,
      ry: .50,

      axisX: -.90,
      axisY: -.72,
      axisZ: .82,

      speed: -.00210,

      electronOffset: 5.0
    }

  ];


  /* ==========================================================
     PARTICLES
     ========================================================== */

  const particles = [];

  const PARTICLE_COUNT = 140;


  /* ==========================================================
     UTILITY — RESIZE
     ========================================================== */

  function resize() {

    dpr =
      Math.min(
        window.devicePixelRatio || 1,
        2
      );


    width =
      window.innerWidth;

    height =
      window.innerHeight;


    canvas.width =
      width * dpr;

    canvas.height =
      height * dpr;


    canvas.style.width =
      width + "px";

    canvas.style.height =
      height + "px";


    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );


    centerX =
      width / 2;

    centerY =
      height / 2;


    /*
     * Mobile gets a slightly smaller core.
     */

    radius =
      Math.min(
        width,
        height
      ) *
      (
        width < 600
          ? .31
          : .35
      );

  }


  window.addEventListener(
    "resize",
    resize,
    {
      passive: true
    }
  );


  /* ==========================================================
     3D VECTOR ROTATION
     ========================================================== */

  function rotateX(
    p,
    angle
  ) {

    const c =
      Math.cos(angle);

    const s =
      Math.sin(angle);


    return {

      x: p.x,

      y:
        p.y * c -
        p.z * s,

      z:
        p.y * s +
        p.z * c

    };

  }


  function rotateY(
    p,
    angle
  ) {

    const c =
      Math.cos(angle);

    const s =
      Math.sin(angle);


    return {

      x:
        p.x * c +
        p.z * s,

      y:
        p.y,

      z:
        -p.x * s +
        p.z * c

    };

  }


  function rotateZ(
    p,
    angle
  ) {

    const c =
      Math.cos(angle);

    const s =
      Math.sin(angle);


    return {

      x:
        p.x * c -
        p.y * s,

      y:
        p.x * s +
        p.y * c,

      z:
        p.z

    };

  }


  /* ==========================================================
     APPLY ALL THREE AXES
     ========================================================== */

  function rotate3D(
    p,
    x,
    y,
    z
  ) {

    let result =
      rotateX(
        p,
        x
      );


    result =
      rotateY(
        result,
        y
      );


    result =
      rotateZ(
        result,
        z
      );


    return result;

  }


  /* ==========================================================
     3D PROJECTION
     ========================================================== */

  function project(
    p
  ) {

    const depth =
      PERSPECTIVE /
      (
        PERSPECTIVE +
        p.z
      );


    return {

      x:
        centerX +
        p.x *
        depth,

      y:
        centerY +
        p.y *
        depth,

      depth,

      z: p.z

    };

  }


  /* ==========================================================
     COLOR
     ========================================================== */

  function getColor() {

    const styles =
      getComputedStyle(
        document.documentElement
      );


    return (
      styles
        .getPropertyValue(
          "--glow"
        )
        .trim()
      ||
      "#69b7ff"
    );

  }


  /* ==========================================================
     HEX → RGBA
     ========================================================== */

  function rgba(
    hex,
    alpha
  ) {

    hex =
      hex.replace(
        "#",
        ""
      );


    if (
      hex.length === 3
    ) {

      hex =
        hex
          .split("")
          .map(
            c =>
              c + c
          )
          .join("");

    }


    const r =
      parseInt(
        hex.substring(
          0,
          2
        ),
        16
      );


    const g =
      parseInt(
        hex.substring(
          2,
          4
        ),
        16
      );


    const b =
      parseInt(
        hex.substring(
          4,
          6
        ),
        16
      );


    return (
      "rgba(" +
      r +
      "," +
      g +
      "," +
      b +
      "," +
      alpha +
      ")"
    );

  }


  /* ==========================================================
     PARTICLE CREATION
     ========================================================== */

  function createParticles() {

    particles.length = 0;


    for (
      let i = 0;
      i < PARTICLE_COUNT;
      i++
    ) {

      particles.push({

        theta:
          Math.random() *
          Math.PI *
          2,

        phi:
          Math.acos(
            Math.random() * 2 - 1
          ),

        radius:
          .65 +
          Math.random() *
          .65,

        size:
          .35 +
          Math.random() *
          1.25,

        alpha:
          .12 +
          Math.random() *
          .48,

        speed:
          .00015 +
          Math.random() *
          .00045

      });

    }

  }


  /* ==========================================================
     CREATE ORBIT POINT
     ========================================================== */

  function getOrbitPoint(
    orbit,
    angle,
    energy
  ) {

    const expansion =
      1 +
      energy *
      .16;


    /*
     * Local orbital plane.
     *
     * X/Y define the ellipse.
     * Z begins at zero.
     */

    let point = {

      x:
        Math.cos(angle) *
        orbit.rx *
        radius *
        expansion,

      y:
        Math.sin(angle) *
        orbit.ry *
        radius *
        expansion,

      z: 0

    };


    /*
     * Every orbit gets a
     * completely different
     * 3D orientation.
     */

    point =
      rotate3D(
        point,

        orbit.axisX,

        orbit.axisY,

        orbit.axisZ
      );


    /*
     * Now apply the GLOBAL
     * 3-axis movement.
     */

    point =
      rotate3D(
        point,

        systemX,

        systemY,

        systemZ
      );


    return point;

  }


  /* ==========================================================
     DRAW ONE ORBIT
     ========================================================== */

  function drawOrbit(
    orbit,
    index,
    energy
  ) {

    const color =
      getColor();


    const segments = 180;

    const points = [];


    /*
     * Generate full 3D orbital path.
     */

    for (
      let i = 0;
      i <= segments;
      i++
    ) {

      const angle =
        (
          i /
          segments
        ) *
        Math.PI *
        2;


      const point =
        getOrbitPoint(
          orbit,
          angle,
          energy
        );


      points.push(
        project(
          point
        )
      );

    }


    /*
     * Draw each segment.
     */

    for (
      let i = 1;
      i < points.length;
      i++
    ) {

      const a =
        points[i - 1];

      const b =
        points[i];


      const depth =
        (
          a.depth +
          b.depth
        ) / 2;


      /*
       * Front side brighter.
       * Back side darker.
       */

      const brightness =
        .10 +
        depth *
        .34;


      ctx.beginPath();


      ctx.moveTo(
        a.x,
        a.y
      );


      ctx.lineTo(
        b.x,
        b.y
      );


      ctx.strokeStyle =
        rgba(
          color,
          brightness
        );


      ctx.lineWidth =
        .45 +
        energy *
        .85;


      ctx.stroke();

    }

  }


  /* ==========================================================
     DRAW ELECTRON
     ========================================================== */

  function drawElectron(
    orbit,
    index,
    time,
    energy
  ) {

    const color =
      getColor();


    /*
     * Every electron gets
     * its own orbital speed.
     */

    const angle =
  time *
  orbit.speed *
  (
    1 +
    energy *
    0.65
  ) +
  orbit.electronOffset;


    const point =
      getOrbitPoint(
        orbit,
        angle,
        energy
      );


    const projected =
      project(
        point
      );


    const size =
      (
        2.1 +
        energy *
        4
      ) *
      projected.depth;


    /*
     * Larger glow when voice is detected.
     */

    const glow =
      ctx.createRadialGradient(
        projected.x,
        projected.y,
        0,
        projected.x,
        projected.y,
        size * 7
      );


    glow.addColorStop(
      0,
      rgba(
        color,
        .95
      )
    );


    glow.addColorStop(
      .18,
      rgba(
        color,
        .42
      )
    );


    glow.addColorStop(
      1,
      rgba(
        color,
        0
      )
    );


    ctx.fillStyle =
      glow;


    ctx.beginPath();

    ctx.arc(
      projected.x,
      projected.y,
      size * 7,
      0,
      Math.PI * 2
    );

    ctx.fill();


    /*
     * Electron core.
     */

    ctx.fillStyle =
      color;


    ctx.beginPath();

    ctx.arc(
      projected.x,
      projected.y,
      size,
      0,
      Math.PI * 2
    );

    ctx.fill();

  }


  /* ==========================================================
     PARTICLES
     ========================================================== */

  function drawParticles(
    time,
    energy
  ) {

    const color =
      getColor();


    for (
      const particle
      of particles
    ) {

      particle.theta +=
        particle.speed *
        (
          1 +
          energy * 6
        );


      const r =
        radius *
        particle.radius;


      let point = {

        x:
          r *
          Math.sin(
            particle.phi
          ) *
          Math.cos(
            particle.theta
          ),

        y:
          r *
          Math.sin(
            particle.phi
          ) *
          Math.sin(
            particle.theta
          ),

        z:
          r *
          Math.cos(
            particle.phi
          )

      };


      /*
       * Particle cloud also follows
       * all 3 system axes.
       */

      point =
        rotate3D(
          point,

          systemX,
          systemY,
          systemZ
        );


      const projected =
        project(
          point
        );


      const size =
        particle.size *
        projected.depth;


      const alpha =
        particle.alpha *
        (
          .25 +
          projected.depth *
          .75
        );


      ctx.fillStyle =
        rgba(
          color,
          alpha
        );


      ctx.beginPath();

      ctx.arc(
        projected.x,
        projected.y,
        size,
        0,
        Math.PI * 2
      );

      ctx.fill();

    }

  }


  /* ==========================================================
     NUCLEUS
     ========================================================== */

  function drawNucleus(
    energy
  ) {

    const color =
      getColor();


    const pulse =
      1 +
      energy *
      .38;


    const coreRadius =
      radius *
      .105 *
      pulse;


    /*
     * Large atmospheric glow.
     */

    const glow =
      ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        coreRadius * 6
      );


    glow.addColorStop(
      0,
      rgba(
        color,
        .75
      )
    );


    glow.addColorStop(
      .12,
      rgba(
        color,
        .42
      )
    );


    glow.addColorStop(
      .40,
      rgba(
        color,
        .10
      )
    );


    glow.addColorStop(
      1,
      rgba(
        color,
        0
      )
    );


    ctx.fillStyle =
      glow;


    ctx.beginPath();

    ctx.arc(
      centerX,
      centerY,
      coreRadius * 6,
      0,
      Math.PI * 2
    );

    ctx.fill();


    /*
     * Core.
     */

    const core =
      ctx.createRadialGradient(
        centerX -
        coreRadius * .35,

        centerY -
        coreRadius * .35,

        0,

        centerX,
        centerY,

        coreRadius
      );


    core.addColorStop(
      0,
      "#ffffff"
    );


    core.addColorStop(
      .25,
      color
    );


    core.addColorStop(
      1,
      rgba(
        color,
        .08
      )
    );


    ctx.fillStyle =
      core;


    ctx.beginPath();

    ctx.arc(
      centerX,
      centerY,
      coreRadius,
      0,
      Math.PI * 2
    );

    ctx.fill();


    /*
     * Nucleus ring.
     */

    ctx.strokeStyle =
      rgba(
        color,
        .45 +
        energy * .35
      );


    ctx.lineWidth =
      .7 +
      energy * 1.4;


    ctx.beginPath();

    ctx.arc(
      centerX,
      centerY,
      coreRadius * 1.8,
      0,
      Math.PI * 2
    );

    ctx.stroke();

  }


  /* ==========================================================
     VOICE ANALYSIS
     ========================================================== */

  function updateVoice() {

    if (
      !analyser ||
      !audioData
    ) {

      smoothVoice *= .96;

      return;

    }


    analyser.getByteFrequencyData(
      audioData
    );


    let total = 0;


    for (
      let i = 0;
      i < audioData.length;
      i++
    ) {

      total +=
        audioData[i];

    }


    const average =
      total /
      audioData.length;


    /*
     * Convert volume to 0 → 1.
     */

    voiceEnergy =
      Math.min(
        average / 52,
        1
      );


    /*
     * Smooth it.
     */

    smoothVoice +=
      (
        voiceEnergy -
        smoothVoice
      ) *
      .10;

  }


/* ============================================================
   VOICE ON / OFF
   ============================================================ */

async function toggleVoice() {

  /* ==========================================================
     TURN OFF
     ========================================================== */

  if (microphoneActive) {

    microphoneActive = false;

    /*
     * Stop microphone hardware.
     */

    if (microphoneStream) {

      microphoneStream
        .getTracks()
        .forEach(
          track => track.stop()
        );

      microphoneStream = null;
    }


    /*
     * Close audio context.
     */

    if (audioContext) {

      try {

        await audioContext.close();

      } catch (error) {

        console.warn(
          "Audio context close failed.",
          error
        );

      }

      audioContext = null;
    }


    analyser = null;
    audioData = null;


    /*
     * Smoothly return orbital
     * to idle state.
     */

    voiceEnergy = 0;


    voiceButton.classList.remove(
      "active"
    );


    voiceText.textContent =
      "ACTIVATE VOICE";


    return;
  }


  /* ==========================================================
     TURN ON
     ========================================================== */

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    voiceText.textContent =
      "MIC NOT SUPPORTED";

    return;
  }


  try {

    microphoneStream =
      await navigator.mediaDevices
        .getUserMedia({

          audio: {

            echoCancellation: true,

            noiseSuppression: true,

            autoGainControl: true

          }

        });


    audioContext =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();


    const source =
      audioContext
        .createMediaStreamSource(
          microphoneStream
        );


    analyser =
      audioContext
        .createAnalyser();


    analyser.fftSize =
      256;


    analyser.smoothingTimeConstant =
      .82;


    audioData =
      new Uint8Array(
        analyser.frequencyBinCount
      );


    source.connect(
      analyser
    );


    microphoneActive =
      true;


    voiceButton.classList.add(
      "active"
    );


    voiceText.textContent =
      "VOICE ON";


  } catch (error) {

    console.warn(
      "Microphone permission denied.",
      error
    );


    microphoneActive = false;


    voiceButton.classList.remove(
      "active"
    );


    voiceText.textContent =
      "ACTIVATE VOICE";

  }

}


/* ============================================================
   BUTTON
   ============================================================ */

if (voiceButton) {

  voiceButton.addEventListener(
    "click",
    toggleVoice
  );

}


  /* ==========================================================
     RENDER
     ========================================================== */

  let previousTime = 0;


  function render(
    time
  ) {

    const delta =
      Math.min(
        time -
        previousTime,
        50
      );


    previousTime =
      time;


    updateVoice();


    /* ==========================================================
   GENTLE VOICE-REACTIVE 3D MOTION
   ========================================================== */

const voiceMotion =
  smoothVoice * 0.65;


systemX +=
  SYSTEM_X_SPEED *
  delta *
  (
    1 +
    voiceMotion
  );


systemY +=
  SYSTEM_Y_SPEED *
  delta *
  (
    1 +
    voiceMotion * 1.15
  );


systemZ +=
  SYSTEM_Z_SPEED *
  delta *
  (
    1 +
    voiceMotion * .75
  );


    /*
     * Clear canvas.
     */

    ctx.clearRect(
      0,
      0,
      width,
      height
    );


    /*
     * Particles.
     */

    drawParticles(
      time,
      smoothVoice
    );


    /*
     * Back-to-front orbital
     * rendering.
     */

    for (
      let i = 0;
      i < orbits.length;
      i++
    ) {

      drawOrbit(
        orbits[i],
        i,
        smoothVoice
      );

    }


    /*
     * Electrons.
     */

    for (
      let i = 0;
      i < orbits.length;
      i++
    ) {

      drawElectron(
        orbits[i],
        i,
        time,
        smoothVoice
      );

    }


    /*
     * Nucleus.
     */

    drawNucleus(
      smoothVoice
    );


    requestAnimationFrame(
      render
    );

  }


  /* ==========================================================
     START
     ========================================================== */

  resize();

  createParticles();

  requestAnimationFrame(
    render
  );

})();