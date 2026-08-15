(function () {
  const $ = (id) => document.getElementById(id);
  const pages = document.querySelectorAll('.page');

  document.title = CONFIG.标题;

  const start = new Date(CONFIG.纪念日);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysTotal = Math.round((today - start) / 86400000);

  function countUp(el, target) {
    const dur = 1600;
    const t0 = performance.now();
    function f(t) {
      const k = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }

  countUp($('daysNum'), daysTotal);
  $('coverNames').textContent = CONFIG.你的昵称 + ' ♥ ' + CONFIG.他的昵称;
  $('coverDate').textContent = CONFIG.纪念日 + ' 是我们的开始';

  function drawHeart(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y + 0.3 * s);
    c.bezierCurveTo(x, y, x - 0.5 * s, y, x - 0.5 * s, y + 0.25 * s);
    c.bezierCurveTo(x - 0.5 * s, y + 0.55 * s, x, y + 0.85 * s, x, y + s);
    c.bezierCurveTo(x, y + 0.85 * s, x + 0.5 * s, y + 0.55 * s, x + 0.5 * s, y + 0.25 * s);
    c.bezierCurveTo(x + 0.5 * s, y, x, y, x, y + 0.3 * s);
    c.closePath();
    c.fill();
  }

  const cv = $('heartsCanvas');
  const ctx = cv.getContext('2d');
  function sizeCanvas() {
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  const hearts = [];
  setInterval(() => {
    hearts.push({
      x: Math.random() * cv.width,
      y: cv.height + 30,
      s: 12 + Math.random() * 20,
      v: 0.6 + Math.random() * 1.3,
      c: 'rgba(255,107,129,' + (0.25 + Math.random() * 0.4).toFixed(2) + ')'
    });
    if (hearts.length > 70) hearts.shift();
  }, 320);

  function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const h of hearts) {
      h.y -= h.v;
      h.x += Math.sin(h.y * 0.02) * 0.3;
      ctx.fillStyle = h.c;
      drawHeart(ctx, h.x, h.y, h.s);
    }
    requestAnimationFrame(tick);
  }
  tick();

  $('enterBtn').addEventListener('click', () => {
    pages[1].scrollIntoView({ behavior: 'smooth' });
    const audio = $('bgm');
    audio.play().then(() => $('musicBtn').classList.add('playing')).catch(() => {});
  });

  const tl = $('timeline');
  CONFIG.时光轴.forEach((n) => {
    const item = document.createElement('div');
    item.className = 'tl-item';
    item.innerHTML =
      '<div class="tl-dot"></div>' +
      '<div class="tl-card">' +
      (n.照片 ? '<img src="photos/timeline/' + n.照片 + '.jpg" data-hint="photos/timeline/' + n.照片 + '.jpg" loading="lazy" alt="">' : '') +
      '<h3>' + n.标题 + '</h3>' +
      '<p class="tl-date">' + n.日期 + '</p>' +
      '<p class="tl-text">' + n.文字 + '</p>' +
      '</div>';
    tl.appendChild(item);
  });

  function buildGrid(boxId, folder, count, caption, wide) {
    const box = $(boxId);
    for (let i = 1; i <= count; i++) {
      const item = document.createElement('div');
      item.className = 'grid-item' + (wide ? ' wide-item' : '');
      const img = document.createElement('img');
      img.src = 'photos/' + folder + '/' + i + '.jpg';
      img.setAttribute('data-hint', 'photos/' + folder + '/' + i + '.jpg');
      img.loading = 'lazy';
      img.alt = '';
      img.addEventListener('click', () => openLightbox(img.src, caption(i)));
      item.appendChild(img);
      box.appendChild(item);
    }
  }

  buildGrid('foodGrid', 'food', CONFIG.美食数量, (i) => '第 ' + i + ' 道 · 每一道都是爱');
  buildGrid('travelGrid', 'travel', CONFIG.旅行数量, (i) => '第 ' + i + ' 站 · 有你的风景', true);

  const lb = $('lightbox');
  function openLightbox(src, cap) {
    $('lightboxImg').src = src;
    $('lightboxCap').textContent = cap;
    lb.classList.add('show');
  }
  lb.addEventListener('click', () => lb.classList.remove('show'));

  const audio = $('bgm');
  audio.src = CONFIG.歌曲文件;
  const mBtn = $('musicBtn');
  const hint = $('musicHint');
  hint.textContent = '♪ ' + CONFIG.歌曲标题;

  mBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {
        hint.textContent = '（歌曲文件还没放好，先手动看歌词吧）';
      });
    } else {
      audio.pause();
    }
  });
  audio.addEventListener('playing', () => mBtn.classList.add('playing'));
  audio.addEventListener('pause', () => mBtn.classList.remove('playing'));
  audio.addEventListener('error', () => {
    mBtn.classList.add('no-file');
    hint.textContent = '（歌曲文件还没放好，先手动看歌词吧）';
    $('lyricsBox').classList.add('no-music');
  });

  const lbx = $('lyricsBox');
  LYRICS.forEach((l) => {
    const d = document.createElement('div');
    d.className = 'lyric';
    d.textContent = l.词;
    lbx.appendChild(d);
  });
  const lines = Array.from(lbx.children);

  function syncLyric() {
    const t = audio.currentTime;
    let idx = 0;
    for (let i = 0; i < LYRICS.length; i++) if (LYRICS[i].秒 <= t) idx = i;
    setActive(idx);
  }

  function setActive(idx) {
    lines.forEach((l, i) => {
      l.classList.toggle('on', i === idx);
      l.classList.toggle('passed', i < idx);
    });
    const on = lbx.querySelector('.lyric.on');
    if (on) lbx.scrollTo({ top: on.offsetTop - lbx.clientHeight / 2 + on.clientHeight / 2, behavior: 'smooth' });
  }

  audio.addEventListener('timeupdate', syncLyric);

  function fmtTime(t) {
    if (!isFinite(t)) t = 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function showTime() {
    $('playTime').textContent = fmtTime(audio.currentTime) + ' / ' + fmtTime(audio.duration);
  }

  audio.addEventListener('timeupdate', showTime);
  audio.addEventListener('loadedmetadata', showTime);
  audio.addEventListener('durationchange', showTime);

  function saveCal() {
    try { localStorage.setItem('love_anniversary_cal', JSON.stringify(LYRICS.map(function (l) { return l.秒; }))); } catch (e) {}
  }

  let savedCal = null;
  try { savedCal = JSON.parse(localStorage.getItem('love_anniversary_cal') || 'null'); } catch (e) {}
  if (savedCal && savedCal.length === LYRICS.length) {
    LYRICS.forEach(function (l, i) { l.秒 = savedCal[i]; });
    lines.forEach(function (c, i) {
      c.classList.add('marked');
      c.innerHTML = LYRICS[i].词 + ' <em>' + fmtTime(LYRICS[i].秒) + '</em>';
    });
  }

  lbx.addEventListener('click', (e) => {
    const c = e.target.closest('.lyric');
    if (!c) return;
    const i = lines.indexOf(c);
    if (calMode) {
      let t = Math.round((audio.currentTime - 0.6) * 10) / 10;
      if (t < 0) t = 0;
      LYRICS[i].秒 = t;
      c.classList.add('marked');
      c.innerHTML = LYRICS[i].词 + ' <em>' + fmtTime(t) + '</em>';
      saveCal();
    }
    setActive(i);
  });

  const exportBtn = $('exportBtn');
  exportBtn.addEventListener('click', () => {
    const ta = $('calExport');
    ta.value = LYRICS.map(function (l, i) {
      return fmtTime(l.秒) + ' ' + (i + 1) + ' ' + l.词;
    }).join('\n');
    ta.classList.add('show');
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
  });

  const calBtn = $('calBtn');
  let calMode = false;
  calBtn.addEventListener('click', () => {
    calMode = !calMode;
    calBtn.classList.toggle('on', calMode);
    calBtn.textContent = calMode ? '校准中：听到哪句点哪句' : '校准歌词';
  });

  const dots = $('dots');
  pages.forEach((p, i) => {
    const d = document.createElement('span');
    d.addEventListener('click', () => p.scrollIntoView({ behavior: 'smooth' }));
    dots.appendChild(d);
  });

  function markDot() {
    const pos = window.scrollY + window.innerHeight / 2;
    let cur = 0;
    pages.forEach((p, i) => { if (p.offsetTop <= pos) cur = i; });
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i === cur));
  }
  window.addEventListener('scroll', markDot, { passive: true });
  markDot();

  $('card3d').addEventListener('click', (e) => {
    e.stopPropagation();
    $('card3d').classList.toggle('flipped');
  });

  function burst(x, y) {
    for (let i = 0; i < 10; i++) {
      const h = document.createElement('span');
      h.className = 'f-heart';
      h.textContent = '❤';
      h.style.left = x + 'px';
      h.style.top = y + 'px';
      h.style.setProperty('--dx', (Math.random() * 180 - 90) + 'px');
      h.style.setProperty('--dy', -(60 + Math.random() * 150) + 'px');
      h.style.setProperty('--rot', (Math.random() * 120 - 60) + 'deg');
      h.style.fontSize = (14 + Math.random() * 22) + 'px';
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 1500);
    }
  }

  $('sec-finale').addEventListener('click', (e) => burst(e.clientX, e.clientY));

  const pm = $('posterModal');
  const card = $('card3d');
  $('posterBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    makePoster();
    pm.classList.add('show');
  });
  $('posterClose').addEventListener('click', () => pm.classList.remove('show'));
  pm.addEventListener('click', (e) => {
    if (e.target === pm) pm.classList.remove('show');
  });
  card.addEventListener('click', (e) => e.stopPropagation());

  function makePoster() {
    const c = document.createElement('canvas');
    c.width = 750;
    c.height = 1200;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 750, 1200);
    grad.addColorStop(0, '#ffe3ea');
    grad.addColorStop(0.5, '#ffc9d4');
    grad.addColorStop(1, '#ff9aae');
    g.fillStyle = grad;
    g.fillRect(0, 0, 750, 1200);

    g.fillStyle = 'rgba(255,255,255,0.55)';
    drawHeart(g, 110, 300, 34);
    drawHeart(g, 640, 240, 24);
    drawHeart(g, 620, 850, 30);
    drawHeart(g, 130, 900, 20);
    g.fillStyle = 'rgba(194,68,95,0.18)';
    drawHeart(g, 375, 1150, 60);
    drawHeart(g, 375, 60, 40);

    g.textAlign = 'center';
    g.fillStyle = '#c2445f';
    g.font = 'bold 100px KaiTi, STKaiti, serif';
    g.fillText('一周年快乐', 375, 470);

    g.font = '56px KaiTi, STKaiti, serif';
    g.fillText(CONFIG.你的昵称 + ' ♥ ' + CONFIG.他的昵称, 375, 590);

    g.font = '44px KaiTi, STKaiti, serif';
    g.fillStyle = '#a04050';
    g.fillText('我们已相爱 ' + daysTotal + ' 天', 375, 690);

    g.font = '34px KaiTi, STKaiti, serif';
    g.fillStyle = '#c98a96';
    g.fillText(CONFIG.纪念日 + ' · 至 · 永远', 375, 780);

    const qrImg = new Image();
    qrImg.onload = function () {
      g.drawImage(qrImg, 290, 890, 170, 170);
      g.font = '24px KaiTi, STKaiti, serif';
      g.fillStyle = '#b08892';
      g.fillText('扫一扫 · 进入我们的回忆', 375, 1120);
      const url = c.toDataURL('image/png');
      $('posterImg').src = url;
      $('savePoster').href = url;
      $('savePoster').setAttribute('download', CONFIG.你的昵称 + '&' + CONFIG.他的昵称 + '的纪念海报.png');
    };
    qrImg.src = QR_IMAGE;
  }

  window.addEventListener('error', function (e) {
    const t = e.target;
    if (t && t.tagName === 'IMG' && !t._ph) {
      t._ph = true;
      const ph = document.createElement('div');
      ph.className = 'ph';
      ph.innerHTML = '待放入照片<br><small>' + (t.getAttribute('data-hint') || '') + '</small>';
      t.parentNode.replaceChild(ph, t);
    }
  }, true);
})();
