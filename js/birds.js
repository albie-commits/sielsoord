/* SIELSOORD — Language-aware bird checklist tables */
(function () {
  'use strict';

  const LANG_COLUMN = { af: 0, en: 1, de: 2 };
  const STATUS_KEYS = {
    '🟢 Resident': 'birds.status_resident',
    '🟡 Occasional': 'birds.status_occasional',
    '🟢 Very common — photographed!': 'birds.status_very_common_photo',
    '🟢 Resident — near-endemic': 'birds.status_resident_near_endemic',
    '🟢 Near-endemic': 'birds.status_near_endemic',
    '🟢 Resident — photographed!': 'birds.status_resident_photo',
    '🟡 Summer migrant — photographed!': 'birds.status_summer_migrant_photo',
    '🟡 Palearctic migrant': 'birds.status_palearctic_migrant',
    '🟡 Summer migrant': 'birds.status_summer_migrant',
    '🟢 Very common': 'birds.status_very_common',
    '🟡 Occasional at waterholes': 'birds.status_occasional_waterholes',
    '🟢 At waterholes': 'birds.status_waterholes',
    '🟢 Resident — giant nests!': 'birds.status_resident_giant_nests',
    '🟡 At waterholes after rain': 'birds.status_waterholes_after_rain'
  };

  const currentLang = () => localStorage.getItem('sielsoord-lang') || 'af';
  const t = (key) => {
    const lang = currentLang();
    return window.TRANSLATIONS?.[lang]?.[key]
      || window.TRANSLATIONS?.af?.[key]
      || key;
  };

  function prepareTables() {
    document.querySelectorAll('.bird-table').forEach(table => {
      const rows = Array.from(table.rows);
      rows.forEach((row, rowIndex) => {
        Array.from(row.cells).forEach((cell, index) => {
          if (index < 3) cell.dataset.birdLanguage = ['af', 'en', 'de'][index];
        });

        if (rowIndex > 0 && row.cells[4]) {
          const originalStatus = row.cells[4].textContent.trim();
          row.cells[4].dataset.statusKey = STATUS_KEYS[originalStatus] || '';
        }
      });
    });
  }

  function renderTables() {
    const lang = currentLang();
    const activeColumn = LANG_COLUMN[lang] ?? 0;

    document.querySelectorAll('.bird-table').forEach(table => {
      Array.from(table.rows).forEach((row, rowIndex) => {
        Array.from(row.cells).forEach((cell, index) => {
          if (index < 3) cell.hidden = index !== activeColumn;
        });

        if (rowIndex === 0) {
          if (row.cells[activeColumn]) row.cells[activeColumn].textContent = t('birds.th_name');
          if (row.cells[3]) row.cells[3].textContent = t('birds.th_scientific');
          if (row.cells[4]) row.cells[4].textContent = t('birds.th_status');
        } else if (row.cells[4]?.dataset.statusKey) {
          row.cells[4].textContent = t(row.cells[4].dataset.statusKey);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    prepareTables();
    renderTables();
    window.addEventListener('sielsoord:langchange', renderTables);
  });
})();
