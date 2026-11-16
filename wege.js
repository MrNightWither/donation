'use strict';

/* NightWither Unterstützungs-Seite – Wege ein- und ausschalten (15.11.2026)
   Die Schalter und Links kommen aus dem Admin Panel (Reiter „Unterstützung“).
   Die Seite liest dazu ein öffentliches Dokument aus der Datenbank, nur lesend.
   Ist die Datenbank nicht erreichbar oder noch nichts gespeichert, gilt der Stand STANDARD unten.
   Es wird nichts eingebettet – die Karten sind reine Links. */
(() => {
  const QUELLE = 'https://firestore.googleapis.com/v1/projects/adminpannel-f0aab/databases/(default)/documents/status/unterstuetzung';
  const LINK_WEGE = ['kofi', 'paypal', 'trinkgeld', 'wunschliste']; // brauchen zusätzlich einen Link
  const STANDARD = {
    twitch: true, kick: true, tiktok: true, youtube: false,
    boost: true, shop: true,
    kofi: false, paypal: false, trinkgeld: false, wunschliste: false
  };

  // Nur echte https-Adressen zulassen
  function sichereAdresse(wert) {
    try {
      const u = new URL(String(wert || ''));
      return u.protocol === 'https:' ? u.href : null;
    } catch (e) {
      return null;
    }
  }

  // Firestore liefert jedes Feld verpackt: { booleanValue: true } oder { stringValue: '…' }
  function felderLesen(felder) {
    const aus = {};
    Object.entries(felder || {}).forEach(([name, wert]) => {
      if ('booleanValue' in wert) aus[name] = wert.booleanValue === true;
      else if ('stringValue' in wert) aus[name] = wert.stringValue;
    });
    return aus;
  }

  function anwenden(stand) {
    Object.keys(STANDARD).forEach((name) => {
      const karte = document.querySelector(`[data-weg="${name}"]`);
      if (!karte) return;
      let an = (name in stand ? stand[name] : STANDARD[name]) === true;
      if (an && LINK_WEGE.includes(name)) {
        const adresse = sichereAdresse(stand[`${name}Link`]);
        const knopf = karte.querySelector('a.weg-link');
        if (adresse && knopf) knopf.href = adresse;
        else an = false; // ohne gültigen Link bleibt die Karte aus
      }
      karte.hidden = !an;
    });

    // Abschnitte ohne sichtbare Karte bleiben ganz ausgeblendet
    document.querySelectorAll('[data-nur-mit-karten]').forEach((abschnitt) => {
      abschnitt.hidden = !abschnitt.querySelector('.weg:not([hidden])');
    });

    // Sichtbare Karten fortlaufend nummerieren, damit keine Lücken entstehen
    let nummer = 0;
    document.querySelectorAll('.weg').forEach((karte) => {
      if (karte.hidden || karte.closest('[hidden]')) return;
      nummer += 1;
      const feld = karte.querySelector('.weg-nr');
      if (feld) feld.textContent = String(nummer).padStart(2, '0');
    });
  }

  anwenden({});

  fetch(QUELLE, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' })
    .then((antwort) => (antwort.ok ? antwort.json() : null))
    .then((json) => { if (json && json.fields) anwenden(felderLesen(json.fields)); })
    .catch(() => { /* Datenbank nicht erreichbar: der Standard bleibt stehen */ });
})();
