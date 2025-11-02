// index.js — videos + reveal + small UX helpers (no icon changes)
(() => {
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const onReady = (fn) =>
    (document.readyState === 'loading')
      ? document.addEventListener('DOMContentLoaded', fn, { once:true })
      : fn();

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover:hover)').matches;

  onReady(() => {
    // 1) Reveal-on-scroll for project cards (matches your CSS classes)
    const cards = $$('.projects-grid > article');
    if (cards.length) {
      cards.forEach(el => el.classList.add('will-reveal'));
      if ('IntersectionObserver' in window && !prefersReduced) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              e.target.classList.add('is-visible');
              io.unobserve(e.target);
            }
          });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
        cards.forEach(el => io.observe(el));
      } else {
        cards.forEach(el => el.classList.add('is-visible'));
      }
    }

    // 2) Video UX — robust hover play/pause (desktop), click toggle, one-at-a-time
    const videos = $$('.project-media video');

    // Helper: try to play; if blocked by policy, mute then retry
    const tryPlay = async (v) => {
      try {
        await v.play();
      } catch {
        // Ensure muted + inline for mobile policies
        v.muted = true;
        v.setAttribute('muted', '');
        v.setAttribute('playsinline', '');
        try { await v.play(); } catch { /* ignore */ }
      }
    };

    if (videos.length) {
      videos.forEach(v => {
        // Safer defaults for autoplay policies and UX
        v.preload = 'metadata';
        v.playsInline = true;           // iOS inline playback
        v.setAttribute('playsinline', '');
        v.muted = true;                  // allow hover-autoplay
        v.setAttribute('muted', '');

        // Click anywhere on video toggles play/pause (controls stay visible)
        v.addEventListener('click', (ev) => {
          // If you want clicks on controls only, remove this listener.
          if (v.paused) tryPlay(v);
          else v.pause();
        });

        // Double-click -> fullscreen
        v.addEventListener('dblclick', (ev) => {
          ev.preventDefault();
          const goFS = v.requestFullscreen || v.webkitRequestFullscreen || v.msRequestFullscreen;
          if (goFS) goFS.call(v);
        }, { passive:false });

        // When one plays, pause the others
        v.addEventListener('play', () => {
          videos.forEach(other => {
            if (other !== v && !other.paused) other.pause();
          });
        });
      });

      // Hover autoplay (desktop only, respect reduced motion)
      if (canHover && !prefersReduced) {
        videos.forEach(v => {
          v.addEventListener('mouseenter', () => {
            // Only auto-play if user isn't already playing another
            if (v.paused) tryPlay(v);
          });
          v.addEventListener('mouseleave', () => {
            // Gentle: pause on leave so cards feel responsive
            if (!v.paused) v.pause();
          });
        });
      }
    }

    // 3) Back-to-top (uses your CSS classes if present)
    addBackToTop();
  });

  // Small helper for back-to-top button
  function addBackToTop(){
    if (document.querySelector('.to-top-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'to-top-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label','Back to top');
    btn.textContent = '↑';
    document.body.appendChild(btn);

    const update = () => {
      if (window.scrollY > 600) btn.classList.add('show');
      else btn.classList.remove('show');
    };
    update();
    window.addEventListener('scroll', update, { passive:true });

    btn.addEventListener('click', () => {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }
})();
