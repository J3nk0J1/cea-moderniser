/* ============================================================
   CadetNet Enhanced - Popup Script
   Settings management for the extension popup
   ============================================================ */

const SETTINGS_KEYS = [
  'compactMode',
  'quickNav',
  'statusBar',
  'enhancedNotifications',
];

const DEFAULTS = {
  compactMode: false,
  quickNav: true,
  statusBar: true,
  enhancedNotifications: true,
};

// Load current settings into the toggles
chrome.storage.sync.get(DEFAULTS, (settings) => {
  SETTINGS_KEYS.forEach((key) => {
    const toggle = document.getElementById(key);
    if (toggle) {
      toggle.checked = settings[key];
    }
  });
});

// Save settings when toggles change
SETTINGS_KEYS.forEach((key) => {
  const toggle = document.getElementById(key);
  if (toggle) {
    toggle.addEventListener('change', () => {
      chrome.storage.sync.set({ [key]: toggle.checked });
    });
  }
});

// Check if we're on a CadetNet page
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  const indicator = document.getElementById('statusIndicator');
  const isCadetNet = tab?.url?.includes('cadetnet.gov.au');

  if (isCadetNet) {
    indicator.innerHTML =
      '<span class="status-dot active"></span>Active on CadetNet';
  } else {
    indicator.innerHTML =
      '<span class="status-dot inactive"></span>Not on CadetNet — navigate to cadetnet.gov.au';
  }
});
