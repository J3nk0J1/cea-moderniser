/* CadetNet Enhanced - Initialization */
(function () {
  'use strict';

  function init() {
    CE.showLoadingScreen();
    CE.loadSettings();
    CE.enhanceTitle();
    CE.enhanceNotifications();

    // DOM fixes
    CE.initDomFixes();

    // Draggable modals
    CE.initModals();

    // Admin tools
    CE.initAdminPanel();

    // Sidebar navigation
    CE.initSidebar();

    // Task count watcher
    CE.watchTaskCount();

    // Icon modernisation
    CE.initIcons();

    // Click-spam guard
    CE.installClickGuard();

    // Reporting tools
    CE.initReporting?.();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
