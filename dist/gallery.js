(() => {
  'use strict';
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-menu');
  function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.textContent = 'Menu +'; }
  menuButton.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.textContent = open ? 'Close −' : 'Menu +'; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', e => { if (!menu.contains(e.target) && !menuButton.contains(e.target)) closeMenu(); });

  const dialog = document.querySelector('#image-viewer');
  let opener;
  function closeImage() { if (dialog.open) dialog.close(); }
  document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    const img = dialog.querySelector('img'); img.src = button.dataset.zoom; img.alt = button.dataset.caption;
    dialog.querySelector('p').textContent = button.dataset.caption;
    dialog.showModal(); document.body.classList.add('viewing-art');
  }));
  dialog.querySelector('button').addEventListener('click', closeImage);
  dialog.addEventListener('click', e => { if (e.target === dialog) closeImage(); });
  dialog.addEventListener('close', () => { document.body.classList.remove('viewing-art'); opener?.focus({ preventScroll: true }); });

  const search = document.querySelector('#archive-search');
  if (search) {
    let filter = 'all';
    const items = [...document.querySelectorAll('.archive-item')];
    const buttons = [...document.querySelectorAll('[data-filter]')];
    function applyFilter() {
      const query = search.value.toLocaleLowerCase().trim(); let count = 0;
      items.forEach(item => { item.hidden = !((filter === 'all' || item.dataset.collection === filter) && item.dataset.search.includes(query)); if (!item.hidden) count++; });
      document.querySelector('#results-count').textContent = `${count} ${count === 1 ? 'work' : 'works'}`;
      document.querySelector('#empty-results').hidden = count !== 0;
    }
    buttons.forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button))); applyFilter(); }));
    search.addEventListener('input', applyFilter);
  }

  // Optional future scroll-scrubbed background. Inactive until an actual export is supplied.
  const config = window.PORTFOLIO_CONFIG?.background;
  if (!config?.enabled || !config.video) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const script = [...document.scripts].find(s => s.src.endsWith('/gallery.js'));
  const base = new URL('.', script.src);
  const host = document.querySelector('#art-background'); host.style.opacity = config.opacity;
  const video = document.createElement('video'); video.muted = true; video.playsInline = true; video.preload = 'metadata';
  if (config.poster) video.poster = new URL(config.poster, base).href;
  host.append(video);
  let pending = false, target = 0;
  function seek() { if (!video.seeking && Number.isFinite(video.duration) && Math.abs(video.currentTime - target) > .04) video.currentTime = target; }
  function update() { pending = false; const max = Math.max(1, document.documentElement.scrollHeight - innerHeight); target = reduced.matches ? 0 : Math.min(1, Math.max(0, scrollY / max)) * (video.duration || 0); seek(); }
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
  video.addEventListener('loadedmetadata', schedule); video.addEventListener('seeked', seek);
  addEventListener('scroll', schedule, { passive: true }); addEventListener('resize', schedule); reduced.addEventListener('change', schedule);
  video.src = new URL(config.video, base).href;
})();
