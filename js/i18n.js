/* ═══════════════════════════════════════════════════════════════════
   SIELSOORD — i18n Engine
   Language switcher, localStorage persistence, element translation
   ═══════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  const LANGS = ['af', 'en', 'de'];
  const DEFAULT_LANG = 'af';
  const STORAGE_KEY = 'sielsoord-lang';

  /* ── Get current language ──────────────────────────────────────── */
  function getLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGS.includes(stored)) return stored;
    // Detect from browser
    const browserLang = (navigator.language || 'af').substring(0, 2);
    if (LANGS.includes(browserLang)) return browserLang;
    return DEFAULT_LANG;
  }

  /* ── Set language and apply ────────────────────────────────────── */
  function setLang(lang) {
    if (!LANGS.includes(lang)) lang = DEFAULT_LANG;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    applyTranslations(lang);
    updateSwitcherUI(lang);
  }

  /* ── Translate a single element ────────────────────────────────── */
  function translateElement(el, lang) {
    const dict = (typeof TRANSLATIONS !== 'undefined') ? TRANSLATIONS[lang] : null;
    if (!dict) return;

    const key = el.getAttribute('data-i18n');
    if (key && dict[key]) {
      el.innerHTML = dict[key];
      return;
    }

    // data-i18n-attr — translate attributes like placeholder, title, alt
    const attrTranslations = el.getAttribute('data-i18n-attr');
    if (attrTranslations) {
      // Format: "placeholder:kontak.form_msg_ph;title:something"
      attrTranslations.split(';').forEach(pair => {
        const [attr, aKey] = pair.split(':').map(s => s.trim());
        if (attr && aKey && dict[aKey]) {
          el.setAttribute(attr, dict[aKey]);
        }
      });
    }
  }

  /* ── Apply translations to entire page ─────────────────────────── */
  function applyTranslations(lang) {
    if (typeof TRANSLATIONS === 'undefined') return;
    const dict = TRANSLATIONS[lang];
    if (!dict) return;

    document.documentElement.lang = lang;

    // All elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      translateElement(el, lang);
    });

    // Elements with data-i18n-attr only
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      if (!el.hasAttribute('data-i18n')) {
        translateElement(el, lang);
      }
    });

    // Dispatch event so other scripts (map.js etc) can react
    window.dispatchEvent(new CustomEvent('sielsoord:langchange', { detail: { lang } }));
  }

  /* ── Update switcher button UI ─────────────────────────────────── */
  function updateSwitcherUI(lang) {
    document.querySelectorAll('.lang-switcher').forEach(switcher => {
      switcher.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === lang) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });
  }

  /* ── Build the language switcher HTML ──────────────────────────── */
  function createSwitcherHTML(currentLang) {
    const labels = { af: 'AF', en: 'EN', de: 'DE' };
    const titles = { af: 'Afrikaans', en: 'English', de: 'Deutsch' };
    return LANGS.map(code =>
      `<button class="lang-btn${code === currentLang ? ' active' : ''}" data-lang="${code}" title="${titles[code]}" aria-label="${titles[code]}">${labels[code]}</button>`
    ).join('');
  }

  /* ── Initialize on DOM ready ───────────────────────────────────── */
  function init() {
    const lang = getLang();

    // Inject language switchers into nav
    document.querySelectorAll('.lang-switcher').forEach(container => {
      container.innerHTML = createSwitcherHTML(lang);
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('.lang-btn');
        if (btn) {
          setLang(btn.dataset.lang);
        }
      });
    });

    // Apply translations immediately
    applyTranslations(lang);
  }

  // Run as early as possible to avoid flash of untranslated content
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for external use
  window.SielsoordI18n = { getLang, setLang, applyTranslations, LANGS };
})();
