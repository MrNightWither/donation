'use strict';

/* NightWither Unterstützungs-Seite – Wege ein- und ausschalten (15.11.2026)
   HIER TRÄGST DU DEINE LINKS EIN.
   Steht bei einem Weg ein Link, der mit https:// beginnt, erscheint seine Karte.
   Bleibt der Link leer (''), bleibt die Karte unsichtbar.
   Es wird nichts im Netz abgerufen und nichts eingebettet – die Karten sind reine Links. */
(() => {
  const WEGE = {
    kofi: '',        // z. B. 'https://ko-fi.com/deinname'
    trinkgeld: ''    // z. B. Link zu deiner Trinkgeld-Seite
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

  Object.entries(WEGE).forEach(([name, link]) => {
    const karte = document.querySelector(`[data-weg="${name}"]`);
    const adresse = sichereAdresse(link);
    if (!karte || !adresse) return;
    const knopf = karte.querySelector('a.weg-link');
    if (knopf) knopf.href = adresse;
    karte.hidden = false;
  });

  // Abschnitte ohne sichtbare Karte bleiben ganz ausgeblendet
  document.querySelectorAll('[data-nur-mit-karten]').forEach((abschnitt) => {
    abschnitt.hidden = !abschnitt.querySelector('.weg:not([hidden])');
  });
})();
