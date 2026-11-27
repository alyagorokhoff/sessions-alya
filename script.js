(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = document.querySelectorAll(".reveal, .reveal-text");

  document.querySelectorAll("[data-stagger]").forEach((group) => {
    group.querySelectorAll(".reveal-text").forEach((element, index) => {
      element.style.setProperty("--delay", `${Math.min(index * 80, 320)}ms`);
    });
  });

  if (reducedMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12%", threshold: 0.08 },
  );

  reveals.forEach((element) => revealObserver.observe(element));

  const hero = document.querySelector(".hero");
  const image = document.querySelector(".hero__material");
  if (!hero || !image) return;
  let scheduled = false;

  const updateHeroDepth = () => {
    const progress = Math.min(window.scrollY / Math.max(hero.offsetHeight, 1), 1);
    image.style.translate = `0 ${progress * 2.8}%`;
    scheduled = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (scheduled || window.scrollY > hero.offsetHeight * 1.2) return;
      scheduled = true;
      window.requestAnimationFrame(updateHeroDepth);
    },
    { passive: true },
  );
})();

// Independent of decorative reveal animations and reduced-motion preferences.
(() => {
  const players = [...document.querySelectorAll('[data-player]')];
  const format = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  players.forEach((player) => {
    const audio = player.querySelector('audio');
    const button = player.querySelector('button');
    const range = player.querySelector('input');
    const title = player.closest('article').querySelector('h3').textContent;
    const error = player.closest('article').querySelector('[role="status"]');
    let pendingSeek = null;
    const state = () => {
      button.textContent = '';
      button.setAttribute('aria-label', `${audio.paused ? 'Слушать' : 'Пауза'}: ${title}`);
      button.setAttribute('aria-pressed', String(!audio.paused));
    };
    button.addEventListener('click', async () => {
      if (!audio.paused) return audio.pause();
      players.forEach((other) => { if (other !== player) other.querySelector('audio').pause(); });
      error.textContent = '';
      try { await audio.play(); } catch { error.textContent = 'Не удалось загрузить запись. Попробуй ещё раз.'; state(); }
    });
    ['play', 'pause', 'ended'].forEach((event) => audio.addEventListener(event, state));
    audio.addEventListener('loadedmetadata', () => {
      if (!Number.isFinite(audio.duration)) return;
      range.max = audio.duration;
      player.querySelector('[data-duration]').textContent = format(Math.round(audio.duration));
      if (pendingSeek !== null) { audio.currentTime = Math.min(pendingSeek,audio.duration); pendingSeek = null; }
    });
    audio.addEventListener('timeupdate', () => {
      range.value = audio.currentTime;
      player.querySelector('[data-current]').textContent = format(audio.currentTime);
      range.setAttribute('aria-valuetext', `${format(audio.currentTime)} из ${format(Number(range.max))}`);
      player.querySelector('.voice-player__wave').style.opacity = audio.paused ? '.65' : '1';
    });
    range.addEventListener('input', () => {
      const time = Number(range.value);
      player.querySelector('[data-current]').textContent = format(time);
      if (audio.readyState) audio.currentTime = time;
      else { pendingSeek = time; audio.load(); }
    });
    audio.addEventListener('error', () => { error.textContent = 'Запись временно недоступна. Попробуй ещё раз.'; });
  });
  const track = document.querySelector('.reviews-track');
  if (!track) return;
  const cards = [...track.children];
  const prev = document.querySelector('[data-review-prev]');
  const next = document.querySelector('[data-review-next]');
  const step = () => cards[1].offsetLeft - cards[0].offsetLeft;
  const update = () => {
    const index = Math.round(track.scrollLeft / step());
    const visible = Math.round((track.clientWidth + 24) / step());
    document.querySelector('[data-review-count]').textContent = `${index + 1}${visible > 1 ? '–' + Math.min(index + visible, cards.length) : ''} / ${cards.length}`;
    track.style.height = `${Math.ceil(Math.max(...cards.slice(index, index + visible).map((card) => card.getBoundingClientRect().height)))}px`;
    prev.disabled = track.scrollLeft < 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };
  const move = (direction) => track.scrollBy({ left: direction * step(), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  prev.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', (event) => {
    if (event.target !== track || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  track.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(track);
  track.querySelectorAll('img').forEach((image) => image.addEventListener('load', update));
  update();
  const dialog = document.querySelector('.review-lightbox');
  document.querySelectorAll('.review-image').forEach((button) => button.addEventListener('click', () => {
    const card = button.closest('.review-card');
    dialog.querySelector('.review-lightbox__bar p').textContent = card.querySelector('h3').textContent;
    const content = dialog.querySelector('.review-lightbox__content'); content.replaceChildren();
    card.querySelectorAll('.review-image').forEach((part) => {
      const figure = document.createElement('figure');
      if (part.querySelector('span')) { const caption = document.createElement('figcaption'); caption.textContent = part.querySelector('span').textContent; figure.append(caption); }
      const image = part.querySelector('img').cloneNode(); image.loading = 'eager'; figure.append(image); content.append(figure);
    });
    dialog.classList.remove('is-zoomed');
    dialog.querySelector('[data-review-zoom]').setAttribute('aria-pressed', 'false');
    dialog.querySelector('[data-review-zoom]').setAttribute('aria-label', 'Увеличить текст переписки');
    dialog.showModal(); dialog.scrollTop = 0;
  }));
  dialog.querySelector('[data-review-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-review-zoom]').addEventListener('click', (event) => {
    const zoomed = dialog.classList.toggle('is-zoomed');
    event.currentTarget.setAttribute('aria-pressed', String(zoomed));
    event.currentTarget.setAttribute('aria-label', zoomed ? 'Подогнать переписку по ширине' : 'Увеличить текст переписки');
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right)) dialog.close(); });
})();
