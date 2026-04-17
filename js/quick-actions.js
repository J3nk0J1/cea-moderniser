/* CadetNet Enhanced - Quick Actions & Keyboard Shortcuts */
(function () {
  'use strict';

  /* === SECTION 7: QUICK NAVIGATION (Ctrl/Cmd+K) === */

  const NAV_ITEMS = [];

  function harvestNavItems() {
    NAV_ITEMS.length = 0;
    const links = document.querySelectorAll('.commmonHeaderNavs a[cadet-link], .account-fixed-items a[cadet-link]');
    links.forEach((link) => {
      const path = link.getAttribute('path') || '';
      const text = link.textContent.trim();
      const href = link.href;
      if (text && href && text !== 'Choose a section') {
        NAV_ITEMS.push({
          text,
          path,
          href,
          section: path.split('/')[0] || '',
        });
      }
    });
  }

  function openQuickNav() {
    if (!CE.settings.quickNav) return;
    if (document.getElementById('ce-quicknav-overlay')) return;

    harvestNavItems();

    const overlay = document.createElement('div');
    overlay.id = 'ce-quicknav-overlay';

    const dialog = document.createElement('div');
    dialog.id = 'ce-quicknav-dialog';

    const input = document.createElement('input');
    input.id = 'ce-quicknav-input';
    input.type = 'text';
    input.placeholder = 'Search pages... (People, Activities, Units, etc.)';
    input.autocomplete = 'off';

    const results = document.createElement('div');
    results.id = 'ce-quicknav-results';

    const hint = document.createElement('div');
    hint.id = 'ce-quicknav-hint';
    hint.innerHTML =
      '<span><kbd>\u2191\u2193</kbd> Navigate</span>' +
      '<span><kbd>Enter</kbd> Open</span>' +
      '<span><kbd>Esc</kbd> Close</span>';

    dialog.appendChild(input);
    dialog.appendChild(results);
    dialog.appendChild(hint);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    let activeIndex = 0;

    function renderResults(query) {
      const q = query.toLowerCase().trim();
      let items = NAV_ITEMS;
      if (q) {
        items = NAV_ITEMS.filter(
          (item) =>
            item.text.toLowerCase().includes(q) ||
            item.path.toLowerCase().includes(q)
        );
      }

      items = items.slice(0, 12);
      activeIndex = Math.min(activeIndex, Math.max(0, items.length - 1));

      results.innerHTML = items
        .map((item, i) => {
          const icon = getNavIcon(item.section);
          const activeClass = i === activeIndex ? ' ce-active' : '';
          return (
            '<div class="ce-quicknav-item' +
            activeClass +
            '" data-href="' +
            CE.escapeHtml(item.href) +
            '">' +
            '<span class="ce-nav-icon">' +
            icon +
            '</span>' +
            '<span>' +
            highlightMatch(item.text, q) +
            '</span>' +
            '<span class="ce-nav-path">' +
            CE.escapeHtml(item.path) +
            '</span>' +
            '</div>'
          );
        })
        .join('');

      if (items.length === 0) {
        results.innerHTML =
          '<div style="padding: 20px; text-align: center; color: var(--ce-text-muted); font-size: 14px;">No pages found</div>';
      }

      results.querySelectorAll('.ce-quicknav-item').forEach((el) => {
        el.addEventListener('click', () => {
          window.location.href = el.dataset.href;
          closeQuickNav();
        });
      });

      return items;
    }

    function getNavIcon(section) {
      const icons = {
        People: 'P',
        Organisation: 'O',
        Reports: 'R',
        System: 'S',
        MyAccount: 'M',
      };
      return icons[section] || '\u2302';
    }

    function highlightMatch(text, query) {
      if (!query) return CE.escapeHtml(text);
      const idx = text.toLowerCase().indexOf(query);
      if (idx === -1) return CE.escapeHtml(text);
      return (
        CE.escapeHtml(text.slice(0, idx)) +
        '<strong>' +
        CE.escapeHtml(text.slice(idx, idx + query.length)) +
        '</strong>' +
        CE.escapeHtml(text.slice(idx + query.length))
      );
    }

    renderResults('');
    input.focus();

    input.addEventListener('input', () => {
      activeIndex = 0;
      renderResults(input.value);
    });

    input.addEventListener('keydown', (e) => {
      const count = results.querySelectorAll('.ce-quicknav-item').length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % Math.max(1, count);
        renderResults(input.value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + Math.max(1, count)) % Math.max(1, count);
        renderResults(input.value);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const active = results.querySelector('.ce-quicknav-item.ce-active');
        if (active) {
          window.location.href = active.dataset.href;
          closeQuickNav();
        }
      } else if (e.key === 'Escape') {
        closeQuickNav();
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeQuickNav();
    });
  }

  function closeQuickNav() {
    const overlay = document.getElementById('ce-quicknav-overlay');
    if (overlay) overlay.remove();
  }

  /* === SECTION 8: QUICK PEOPLE SEARCH (Ctrl+Shift+P) === */

  function openPeopleSearch() {
    if (document.getElementById('ce-people-search-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'ce-people-search-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.5);
      backdrop-filter: blur(4px);
      z-index: 99999;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 20vh;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.15);
      padding: 20px;
      width: 400px;
      max-width: 90vw;
      animation: ce-dialog-in 200ms ease-out;
    `;

    const title = document.createElement('div');
    title.textContent = 'Quick People Search';
    title.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 12px;
      font-family: 'Inter', system-ui, sans-serif;
    `;

    const row = document.createElement('div');
    row.style.cssText = 'display: flex; gap: 8px;';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Name or PMKeyS...';
    input.style.cssText = `
      flex: 1;
      padding: 10px 14px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: rgba(30, 41, 59, 0.6);
      color: #e2e8f0;
      font-size: 14px;
      font-family: 'Inter', system-ui, sans-serif;
      outline: none;
    `;

    const goBtn = document.createElement('button');
    goBtn.textContent = 'Search';
    goBtn.style.cssText = `
      padding: 10px 18px;
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 8px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Inter', system-ui, sans-serif;
      transition: all 300ms ease;
    `;
    goBtn.addEventListener('mouseenter', () => {
      goBtn.style.background = 'rgba(56, 189, 248, 0.25)';
      goBtn.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.15)';
    });
    goBtn.addEventListener('mouseleave', () => {
      goBtn.style.background = 'rgba(56, 189, 248, 0.15)';
      goBtn.style.boxShadow = 'none';
    });

    const hint = document.createElement('div');
    hint.textContent = 'Press Enter to search, Esc to close';
    hint.style.cssText = `
      font-size: 11px;
      color: #64748b;
      margin-top: 10px;
      font-family: 'Inter', system-ui, sans-serif;
    `;

    function doSearch() {
      const term = input.value.trim();
      if (!term) return;
      closePeopleSearch();

      window.location.hash = '#/people/member';

      let attempts = 0;
      const trySearch = setInterval(() => {
        attempts++;
        if (attempts > 30) { clearInterval(trySearch); return; }

        const searchInputs = document.querySelectorAll(
          'input[ng-model*="search"], input[ng-model*="Search"], input[ng-model*="filter"], input[ng-model*="Filter"], input[ng-model*="freeText"], input[name="freeText"], .searchBar input[type="text"], .searchControls input[type="text"], input.search-query'
        );

        for (const searchInput of searchInputs) {
          if (searchInput.offsetParent !== null) {
            const ngScope = window.angular?.element(searchInput).scope();
            const ngModel = searchInput.getAttribute('ng-model');

            if (ngScope && ngModel) {
              const parts = ngModel.split('.');
              let obj = ngScope;
              for (let i = 0; i < parts.length - 1; i++) {
                if (obj[parts[i]]) obj = obj[parts[i]];
              }
              obj[parts[parts.length - 1]] = term;
              ngScope.$apply();
            } else {
              searchInput.value = term;
              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
              searchInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            setTimeout(() => {
              const searchBtn = document.querySelector(
                '.searchBar button, .searchControls button, button.search, button#searchBtn, .btn-search, .btn.search'
              );
              if (searchBtn) searchBtn.click();
            }, 200);

            clearInterval(trySearch);
            return;
          }
        }
      }, 300);
    }

    goBtn.addEventListener('click', doSearch);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearch();
      } else if (e.key === 'Escape') {
        closePeopleSearch();
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePeopleSearch();
    });

    row.appendChild(input);
    row.appendChild(goBtn);
    dialog.appendChild(title);
    dialog.appendChild(row);
    dialog.appendChild(hint);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    input.focus();
  }

  function closePeopleSearch() {
    const overlay = document.getElementById('ce-people-search-overlay');
    if (overlay) overlay.remove();
  }

  /* === SECTION 11: KEYBOARD SHORTCUTS === */

  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K = Quick Nav
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const overlay = document.getElementById('ce-quicknav-overlay');
      if (overlay) {
        closeQuickNav();
      } else {
        openQuickNav();
      }
    }

    // Ctrl+Shift+P = Quick People Search
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      const overlay = document.getElementById('ce-people-search-overlay');
      if (overlay) {
        closePeopleSearch();
      } else {
        openPeopleSearch();
      }
    }

    // Ctrl+Shift+R = Report Builder
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      CE.openReportingPanel?.();
    }

    // Escape closes overlays
    if (e.key === 'Escape') {
      closeQuickNav();
      closePeopleSearch();
    }
  });

  // Expose on CE namespace
  CE.openQuickNav = openQuickNav;
  CE.closeQuickNav = closeQuickNav;
  CE.openPeopleSearch = openPeopleSearch;
  CE.closePeopleSearch = closePeopleSearch;

  CE.initQuickActions = function () {
    // Keyboard shortcuts are registered at module load time above
    // This is called by init.js for consistency but the listeners are already active
  };
})();
