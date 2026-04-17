/* CadetNet Enhanced - Utility Functions */
(function () {
  'use strict';

  CE.escapeHtml = function (text) {
    const el = document.createElement('span');
    el.textContent = text;
    return el.innerHTML;
  };

  /**
   * Navigate by clicking the original Angular cadet-link element if possible,
   * falling back to Angular's $location service, then raw hash change.
   */
  CE.navigateViaAngular = function (path, fallbackHref) {
    // Strategy 1: Find and click the original hidden <a cadet-link> with matching path
    if (path) {
      const original = document.querySelector(
        'a[cadet-link][path="' + path.replace(/"/g, '\\"') + '"]'
      );
      if (original) {
        original.click();
        return;
      }
    }

    // Strategy 2: Use Angular's $location service directly
    const hashPart = (fallbackHref || '').replace(/.*#/, '');
    if (hashPart && window.angular) {
      try {
        const injector = window.angular.element(document.body).injector();
        if (injector) {
          injector.invoke(['$location', '$rootScope', function($location, $rootScope) {
            $location.path(hashPart.replace(/^#?\/?/, '/'));
            $rootScope.$apply();
          }]);
          return;
        }
      } catch (e) { /* fall through */ }
    }

    // Strategy 3: Raw hash change
    if (fallbackHref) {
      const hash = fallbackHref.includes('#') ? '#' + fallbackHref.split('#')[1] : fallbackHref;
      window.location.hash = hash;
    }
  };
})();
