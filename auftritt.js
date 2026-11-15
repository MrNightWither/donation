'use strict';

/* NightWither Unterstützungs-Seite – Laufband und Scroll-Bewegung, übernommen von der Kooperations-Seite (15.11.2026)
   Läuft nach kooperation.js, ruft nichts im Netz ab und fasst das Formular nicht an.
   Es liest nur die Reichweite-Zahlen, die kooperation.js schon in die Seite geschrieben hat.
   Zurücksetzen: in index.html die zwei Zeilen mit „auftritt“ entfernen. */
(() => {
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hatBeobachter = 'IntersectionObserver' in window;
  const STAFFEL_MS = 70;      // Abstand zwischen Geschwistern beim Einblenden
  const STAFFEL_MAX = 6;
  const ZAEHL_MS = 1100;      // Dauer des Hochzählens
  const BAND_WIEDERHOLUNGEN = 6;
  const BAND_TEXT = ['Danke', 'Subs', 'Bits', 'Boosts', 'Dabei sein'];

  function neu(tag, klasse, text) {
    const n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // Nur einmal je Bild arbeiten, egal wie oft der Browser das Ereignis meldet
  function gedrosselt(fn) {
    let wartet = false;
    return () => {
      if (wartet) return;
      wartet = true;
      requestAnimationFrame(() => { wartet = false; fn(); });
    };
  }

  /* ---------- Laufband ---------- */
  function bandFuellen() {
    const spur = document.getElementById('bandTrack');
    if (!spur) return;
    const stuecke = [];
    for (let runde = 0; runde < BAND_WIEDERHOLUNGEN; runde++) {
      BAND_TEXT.forEach((t) => {
        const sp = neu('span', '', t);
        const krone = document.createElement('img');
        krone.src = 'crown.webp';
        krone.alt = '';
        sp.append(krone);
        stuecke.push(sp);
      });
    }
    spur.replaceChildren(...stuecke);
  }

  /* ---------- Einblenden beim Scrollen ---------- */
  function einblenden() {
    if (ruhig || !hatBeobachter) return;
    const gruppen = [
      ['.block-head h2', 'rv-h'],
      ['.weg, .faq details, .hinweis', 'rv']
    ];
    const beobachter = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('rv-in');
        beobachter.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    gruppen.forEach(([auswahl, klasse]) => {
      document.querySelectorAll(auswahl).forEach((n) => {
        const platz = [...n.parentElement.children].filter((c) => c.matches(auswahl)).indexOf(n);
        if (klasse === 'rv-h') {
          const huelle = neu('span', 'rv-hi');
          huelle.append(...n.childNodes);
          n.append(huelle);
        }
        n.classList.add(klasse);
        n.style.setProperty('--rv-d', `${Math.min(platz, STAFFEL_MAX) * STAFFEL_MS}ms`);
        beobachter.observe(n);
      });
    });
  }

  /* ---------- Goldene Fortschrittslinie ---------- */
  function fortschritt() {
    const bar = document.querySelector('.bar');
    if (!bar) return;
    const setzen = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--prog', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : '0');
    };
    const melden = gedrosselt(setzen);
    window.addEventListener('scroll', melden, { passive: true });
    window.addEventListener('resize', melden);
    new MutationObserver(melden).observe(document.querySelector('main'), { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    setzen();
  }

  /* ---------- Reichweite: Zahlen zählen hoch ---------- */
  // „777+“ → zählt von 0 bis 777 und hängt das „+“ wieder an. Alles ohne Zahl am Anfang (∞) bleibt stehen.
  function hochzaehlen(feld) {
    const treffer = /^(\d{1,7})(.*)$/.exec(feld.textContent.trim());
    if (!treffer) return;
    const ziel = Number(treffer[1]);
    const rest = treffer[2];
    const fertig = `${treffer[1]}${rest}`;
    const start = performance.now();
    const schritt = (jetzt) => {
      const t = Math.min(1, (jetzt - start) / ZAEHL_MS);
      const weich = 1 - Math.pow(1 - t, 3);
      feld.textContent = t < 1 ? `${Math.round(ziel * weich)}${rest}` : fertig;
      if (t < 1) requestAnimationFrame(schritt);
    };
    requestAnimationFrame(schritt);
    // Sicherheitsnetz: läuft die Animation im Hintergrund nicht, steht am Ende trotzdem der echte Wert da
    setTimeout(() => { feld.textContent = fertig; }, ZAEHL_MS + 400);
  }

  function zahlen() {
    const block = document.getElementById('statsBlock');
    if (!block || ruhig || !hatBeobachter) return;
    let sichtbar = false;
    const starten = () => block.querySelectorAll('.stat-num').forEach(hochzaehlen);
    const beobachter = new IntersectionObserver((eintraege) => {
      if (!eintraege.some((e) => e.isIntersecting)) return;
      sichtbar = true;
      beobachter.disconnect();
      starten();
    }, { threshold: 0.4 });
    beobachter.observe(block);
    // kooperation.js tauscht die Karten aus, sobald die Zahlen geladen sind
    new MutationObserver(() => { if (sichtbar) starten(); }).observe(block, { childList: true });
  }

  bandFuellen();
  einblenden();
  fortschritt();
  zahlen();
})();
