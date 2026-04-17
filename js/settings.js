/* CadetNet Enhanced - Settings */
(function () {
  'use strict';

  window.CE = window.CE || {};

  const DEFAULTS = {
    compactMode: false,
    quickNav: true,
    statusBar: true,
    smoothTransitions: true,
    enhancedNotifications: true,
  };

  CE.DEFAULTS = DEFAULTS;
  CE.settings = { ...DEFAULTS };

  CE.loadSettings = function () {
    if (chrome?.storage?.sync) {
      chrome.storage.sync.get(DEFAULTS, (stored) => {
        CE.settings = { ...DEFAULTS, ...stored };
        CE.applySettings();
      });
      chrome.storage.onChanged.addListener((changes) => {
        for (const key of Object.keys(changes)) {
          CE.settings[key] = changes[key].newValue;
        }
        CE.applySettings();
      });
    } else {
      CE.applySettings();
    }
  };

  CE.applySettings = function () {
    document.documentElement.classList.toggle('ce-compact', CE.settings.compactMode);

    if (CE.settings.statusBar) {
      CE.createStatusBar?.();
    } else {
      CE.removeStatusBar?.();
    }
  };
})();
