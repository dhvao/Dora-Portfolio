/* Edit section labels in index.html; tune the choreography here. No dependencies. */
(() => {
  'use strict';
  const motion = { flipDistance: 250, detachDistance: 260, sectionRest: 96, stagger: .12, arc: 28, hoverDelay: 140, zoomDamping: 10, jumpDuration: 1050 };
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ruler = document.querySelector('#ruler'), input = document.querySelector('#rail-input');
  const labels = document.querySelector('#section-labels'), needle = document.querySelector('#needle');
  const ghost = document.querySelector('#ghost'), bracket = document.querySelector('#viewport-bracket');
  const wordmark = document.querySelector('#wordmark');
  const heroText = wordmark.textContent;
  wordmark.textContent = '';
  const heroChars = [...heroText].map(char => { const span = document.createElement('span'); span.textContent = char; span.className = 'hero-char'; span.setAttribute('aria-hidden', 'true'); wordmark.append(span); return span; });
  const sections = [...document.querySelectorAll('section[data-label]')].map((el, index) => {
    const name = el.dataset.label;
    const chars = [...name].map(char => { const span = document.createElement('span'); span.className = 'letter'; span.textContent = char; span.setAttribute('aria-hidden', 'true'); labels.append(span); return span; });
    const hit = document.createElement('a'); hit.className = 'label-hit'; hit.href = '#' + el.id; hit.setAttribute('aria-label', name === 'TEMPLATE' ? 'Introduction' : name); labels.append(hit);
    const section = { el, name, chars, hit, index, widths: [], centers: [], width: 0, hover: 0 };
    hit.addEventListener('pointerenter', () => section.hover = 1);
    hit.addEventListener('pointerleave', () => section.hover = 0);
    return section;
  });
  const ticks = Array.from({ length: 101 }, (_, i) => { const el = document.createElement('div'); el.className = 'tick' + (i % 5 === 0 ? ' major' : ''); if (i % 5 === 0) el.innerHTML = '<span>' + i + '</span>'; document.querySelector('#ticks').append(el); return el; });
  let geom, heroBase = [], zoom = 0, zoomTarget = 0, hoverTimer, hovered = false, focused = false, dragging = false, pointerY = 0, jump = null, lastTime = 0, lastScroll = 0, velocity = 0, activeIndex = -1;
  let frameId = 0, measurePending = true, lastInteraction = performance.now(), snapDone = true;
  const requestFrame = () => { if (!frameId) frameId = requestAnimationFrame(render); };
  function measure() {
    const y = window.scrollY;
    const styles = getComputedStyle(document.documentElement);
    const nav = parseFloat(styles.getPropertyValue('--nav'));
    geom = { w: innerWidth, h: innerHeight, doc: document.documentElement.scrollHeight, nav, rail: parseFloat(styles.getPropertyValue('--rail')), mobile: innerWidth <= 600 };
    geom.max = Math.max(1, geom.doc - geom.h); geom.top = nav + 12; geom.span = geom.h - geom.top - 14;
    for (const s of sections) {
      s.anchor = s.el.getBoundingClientRect().top + y; s.bottom = s.anchor + s.el.offsetHeight;
      let total = 0;
      s.chars.forEach((el, i) => { el.style.transform = 'none'; const width = el.getBoundingClientRect().width; s.widths[i] = width; s.centers[i] = total + width / 2; total += width; }); s.width = total;
    }
    // Short sections still get a settled navigation stop before the next word departs.
    // Remap the whole letter journey, preserving its shape and reverse-scroll behavior.
    const rate = 1 + (geom.nav + 26) / geom.max;
    for (const s of sections.slice(1)) {
      const rideLength = s.width * (geom.mobile ? 13 : 20) / 32;
      const naturalStart = (geom.top + s.anchor - (geom.h - 36 + motion.detachDistance - rideLength)) / rate;
      const previousStop = targetFor(sections[s.index - 1]), stop = targetFor(s);
      const rest = Math.min(motion.sectionRest, Math.max(0, stop - previousStop) * .16);
      const start = Math.min(stop - 1, Math.max(naturalStart, previousStop + rest));
      s.journey = { naturalStart, start, stop };
    }
    heroChars.forEach(el => el.style.transform = 'none');
    heroBase = heroChars.map(el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + y + r.height / 2 }; });
    geom.heroFont = parseFloat(getComputedStyle(wordmark).fontSize);
    geom.heroStart = Math.max(0, heroBase[0].y - nav - 110);
    measurePending = false;
  }
  function scrollToY(y, duration = motion.jumpDuration) {
    y = clamp(y, 0, geom.max);
    if (reduced.matches || duration === 0) { jump = null; window.scrollTo(0, y); }
    else jump = { from: window.scrollY, to: y, start: performance.now(), duration: Math.min(duration, Math.max(320, Math.abs(y - window.scrollY) * .65)) };
    requestFrame();
  }
  function targetFor(s) { return s.index === 0 ? 0 : clamp(s.anchor - geom.nav - 16, 0, geom.max); }
  function journeyScroll(s, scroll, inverse = false) {
    const j = s.journey;
    if (!j || j.start <= j.naturalStart || scroll >= j.stop) return scroll;
    const from = inverse ? j.naturalStart : j.start;
    const to = inverse ? j.start : j.naturalStart;
    return mix(to, j.stop, clamp((scroll - from) / (j.stop - from)));
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]'); if (!link) return;
    const s = sections.find(s => '#' + s.el.id === link.getAttribute('href')); if (!s) return;
    event.preventDefault(); snapDone = true; scrollToY(targetFor(s)); history.replaceState(null, '', '#' + s.el.id);
  });
  function normalTick(p, scroll) { return geom.top + p * geom.doc - scroll - scroll / geom.max * (geom.nav + 26); }
  function tickY(p, scroll) { return mix(normalTick(p, scroll), geom.top + p * geom.span, ease(zoom)); }
  function progressAt(y) {
    // Exact inverse of the displayed scale, including while the hover morph runs.
    const z = ease(zoom), scroll = window.scrollY;
    const start = mix(normalTick(0, scroll), geom.top, z);
    return clamp((y - start) / mix(geom.doc, geom.span, z));
  }
  function setZoom(value) { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => { zoomTarget = value || dragging || focused ? 1 : 0; ruler.classList.toggle('zoomed', !!zoomTarget); requestFrame(); }, motion.hoverDelay); }
  input.addEventListener('pointerenter', e => { hovered = true; pointerY = e.clientY; setZoom(1); requestFrame(); });
  input.addEventListener('pointerleave', () => { hovered = false; if (!dragging) setZoom(0); requestFrame(); });
  input.addEventListener('focus', () => { focused = true; setZoom(1); });
  input.addEventListener('blur', () => { focused = false; if (!hovered && !dragging) setZoom(0); });
  input.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault(); jump = null; dragging = true; snapDone = true; pointerY = e.clientY;
    // Freeze the fully expanded map on pointer-down so dragging never chases a moving scale.
    clearTimeout(hoverTimer); zoom = zoomTarget = 1; ruler.classList.add('zoomed'); document.body.classList.add('dragging'); input.setPointerCapture(e.pointerId);
    window.scrollTo(0, clamp((pointerY - geom.top) / geom.span) * geom.max); requestFrame();
  });
  input.addEventListener('pointermove', e => { pointerY = e.clientY; if (dragging) window.scrollTo(0, clamp((pointerY - geom.top) / geom.span) * geom.max); requestFrame(); });
  function release() { if (!dragging) return; dragging = false; document.body.classList.remove('dragging'); if (!hovered && !focused) setZoom(0); requestFrame(); }
  input.addEventListener('pointerup', release); input.addEventListener('pointercancel', release); input.addEventListener('lostpointercapture', release);
  input.addEventListener('keydown', event => {
    let next; const step = event.shiftKey ? geom.max * .01 : geom.max * .002;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = window.scrollY + step;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = window.scrollY - step;
    if (event.key === 'PageDown') next = window.scrollY + geom.h * .8;
    if (event.key === 'PageUp') next = window.scrollY - geom.h * .8;
    if (event.key === 'Home') next = 0; if (event.key === 'End') next = geom.max;
    if (next !== undefined) { event.preventDefault(); snapDone = true; scrollToY(next, 220); }
  });
  function cancelJump() { jump = null; lastInteraction = performance.now(); snapDone = false; requestFrame(); }
  window.addEventListener('wheel', cancelJump, { passive: true }); window.addEventListener('touchstart', cancelJump, { passive: true });
  window.addEventListener('keydown', e => { if (e.target !== input && ['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)) cancelJump(); });
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', () => { measurePending = true; requestFrame(); });
  new ResizeObserver(() => { measurePending = true; requestFrame(); }).observe(document.querySelector('main'));
  reduced.addEventListener('change', requestFrame);
  function render(now) {
    frameId = 0; if (measurePending) measure();
    const dt = Math.min((now - (lastTime || now - 16)) / 1000, .05); lastTime = now;
    if (jump) { const p = clamp((now - jump.start) / jump.duration); window.scrollTo(0, mix(jump.from, jump.to, ease(p))); if (p === 1) jump = null; }
    const scroll = window.scrollY, progress = clamp(scroll / geom.max);
    velocity = mix(velocity, (scroll - lastScroll) / Math.max(dt, .001), 1 - Math.exp(-8 * dt)); lastScroll = scroll;
    zoom = reduced.matches ? zoomTarget : mix(zoom, zoomTarget, 1 - Math.exp(-motion.zoomDamping * dt)); if (Math.abs(zoom - zoomTarget) < .0005) zoom = zoomTarget;
    const z = ease(zoom), top = geom.nav + 29, bottom = geom.h - 36, railX = geom.w - geom.rail / 2;
    const titleSize = geom.mobile ? 22 : 32, smallSize = geom.mobile ? 11 : 16, rideSize = geom.mobile ? 13 : 20, slot = geom.mobile ? 18 : 21;
    const topThreshold = geom.nav + 80;
    const state = sections.map((s, i) => {
      const y = normalTick(s.anchor / geom.doc, journeyScroll(s, scroll));
      const flip = i === 0 ? clamp((scroll - geom.heroStart) / 310) : clamp((topThreshold + motion.flipDistance - y) / motion.flipDistance);
      return { y, flip, detach: i === 0 ? 1 : 0, queuedY: bottom, rideLength: s.width * rideSize / 32 };
    });
    let queue = 0;
    for (let i = sections.length - 1; i > 0; i--) { const s = state[i]; s.queuedY = bottom - slot * queue; s.detach = clamp((s.queuedY + motion.detachDistance - s.y - s.rideLength) / motion.detachDistance); queue += 1 - s.detach; }
    let current = 0; state.forEach((s, i) => { if (s.flip >= .98) current = i; });
    if (current !== activeIndex) { activeIndex = current; sections.forEach((s, i) => { if (i === current) s.hit.setAttribute('aria-current', 'location'); else s.hit.removeAttribute('aria-current'); }); document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + sections[current].el.id)); }
    const horizontal = (s, j, y, size, alpha) => ({ x: geom.w - geom.rail - 9 - (s.width - s.centers[j]) * size / 32, y, scale: size / 32, rot: 0, alpha });
    const vertical = (s, j, y) => ({ x: railX, y: y + (s.width - s.centers[j]) * rideSize / 32, scale: rideSize / 32, rot: -90, alpha: .48 });
    sections.forEach((s, i) => {
      const st = state[i], nextFlip = state[i + 1]?.flip || 0;
      let left = Infinity, right = -Infinity, upper = Infinity, lower = -Infinity;
      s.chars.forEach((el, j) => {
        let a, b, p;
        if (i === 0) { a = { x: heroBase[j].x, y: heroBase[j].y - scroll, scale: geom.heroFont / 32, rot: 0, alpha: 1 }; b = horizontal(s, j, top + 24 * (1 - nextFlip), mix(titleSize, smallSize, nextFlip), mix(1, .43, nextFlip)); p = st.flip; }
        else if (st.flip > 0) { a = vertical(s, j, st.y); b = horizontal(s, j, top + i * slot + 24 * (1 - nextFlip), mix(titleSize, smallSize, nextFlip), mix(1, .43, nextFlip)); p = st.flip; }
        else if (st.detach < 1) { a = horizontal(s, j, st.queuedY, smallSize, .43); b = vertical(s, j, st.queuedY - st.rideLength); p = st.detach; }
        else { a = b = vertical(s, j, st.y); p = 1; }
        let local = ease(clamp(p * (1 + (s.chars.length - 1) * motion.stagger) - (s.chars.length - 1 - j) * motion.stagger));
        if (reduced.matches) local = p >= .5 ? 1 : 0;
        let x = mix(a.x, b.x, local) - Math.sin(local * Math.PI) * motion.arc;
        let y = mix(a.y, b.y, local), scale = mix(a.scale, b.scale, local), rot = mix(a.rot, b.rot, local), alpha = mix(a.alpha, b.alpha, local);
        const map = horizontal(s, j, geom.top + s.anchor / geom.doc * geom.span, smallSize, .85);
        // Keep the introduction visible until its title has left the hero.
        const mapBlend = i === 0 ? z * st.flip : z;
        x = mix(x, map.x, mapBlend); y = mix(y, map.y, mapBlend); scale = mix(scale, map.scale, mapBlend); rot *= 1 - mapBlend; alpha = mix(alpha, .85, mapBlend);
        alpha = mix(alpha, 1, s.hover);
        el.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) rotate(${rot}deg) scale(${scale})`;
        el.style.color = s.hover ? '#477cea' : `rgba(25,26,24,${alpha})`;
        if (i === 0) {
          // Use the actual hero letters for the flight so there is no text swap.
          const h = heroChars[j], base = heroBase[j];
          h.style.transform = `translate3d(${x-base.x}px,${y-(base.y-scroll)}px,0) rotate(${rot}deg) scale(${scale*32/geom.heroFont})`;
          h.style.opacity = st.flip > 0 || z > 0 ? '0' : '1'; el.style.opacity = st.flip > 0 || z > 0 ? '1' : '0';
        }
        const sideways = Math.abs(rot) > 45, hw = (sideways ? 32 : s.widths[j]) * scale / 2, hh = (sideways ? s.widths[j] : 32) * scale / 2;
        left = Math.min(left, x-hw); right = Math.max(right, x+hw); upper = Math.min(upper, y-hh); lower = Math.max(lower, y+hh);
      });
      Object.assign(s.hit.style, { left: left - 3 + 'px', top: upper - 4 + 'px', width: right - left + 6 + 'px', height: lower - upper + 8 + 'px', pointerEvents: i === 0 && state[0].flip === 0 ? 'none' : 'auto' });
    });
    ticks.forEach((el, i) => { const y = tickY(i / 100, scroll); el.style.display = y < geom.nav || y > geom.h ? 'none' : ''; const stretch = 1 + (1-z) * Math.min(.65, Math.abs(velocity) / 4500) * Math.max(0,1 - Math.abs(y - (geom.top+progress*geom.span))/180); el.style.transform = `translateY(${y-geom.nav}px) scaleX(${stretch})`; el.style.transformOrigin = 'right'; });
    const needleY = geom.top + progress * geom.span;
    needle.style.top = needleY + 'px'; needle.style.opacity = String(clamp(progress / .018)); needle.firstElementChild.textContent = String(Math.round(progress * 100)).padStart(3,'0') + '%';
    bracket.style.top = geom.top + scroll / geom.doc * geom.span + 'px'; bracket.style.height = geom.h / geom.doc * geom.span + 'px'; bracket.style.opacity = z;
    ghost.style.opacity = hovered && !dragging ? '1' : '0'; ghost.style.top = clamp(pointerY, geom.top, geom.h-14) + 'px'; ghost.firstElementChild.textContent = Math.round(progressAt(pointerY) * 100) + '%';
    input.setAttribute('aria-valuenow', String(Math.round(progress * 100))); input.setAttribute('aria-valuetext', `${Math.round(progress*100)} percent, ${sections[current].name}`);
    // Let a paused, partially formed word settle. New wheel/touch input cancels immediately.
    if (!snapDone && !jump && !dragging && zoom < .01 && !reduced.matches && now-lastInteraction > 500 && Math.abs(velocity)<25) {
      snapDone = true;
      const i = state.findIndex(s => s.flip>.05 && s.flip<.95);
      if (i >= 0) { const st = state[i]; let target; if (i === 0) target = geom.heroStart + (st.flip >= .5 ? 312 : -2); else { const yTarget = topThreshold + (st.flip >= .5 ? -2 : motion.flipDistance + 2); target = journeyScroll(sections[i], (geom.top + sections[i].anchor - yTarget) / (1 + (geom.nav + 26) / geom.max), true); } scrollToY(target, 600); }
    }
    if (jump || zoom !== zoomTarget || Math.abs(velocity) > .5 || !snapDone) requestFrame();
  }
  document.fonts.ready.then(() => { measurePending = true; requestFrame(); });
  requestFrame();
})();
