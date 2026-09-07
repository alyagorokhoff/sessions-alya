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
