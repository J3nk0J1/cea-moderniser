/* ============================================================
   CadetNet Enhanced - Content Script
   DOM enhancements, quick nav, keyboard shortcuts, status bar,
   admin tools, theme fixes, draggable modals
   ============================================================ */

(function () {
  'use strict';

  /* ==========================================================
     SECTION 1: SETTINGS (synced with popup via chrome.storage)
     ========================================================== */

  const DEFAULTS = {
    compactMode: false,
    quickNav: true,
    statusBar: true,
    smoothTransitions: true,
    enhancedNotifications: true,
  };

  let settings = { ...DEFAULTS };

  function loadSettings() {
    if (chrome?.storage?.sync) {
      chrome.storage.sync.get(DEFAULTS, (stored) => {
        settings = { ...DEFAULTS, ...stored };
        applySettings();
      });
      chrome.storage.onChanged.addListener((changes) => {
        for (const key of Object.keys(changes)) {
          settings[key] = changes[key].newValue;
        }
        applySettings();
      });
    } else {
      applySettings();
    }
  }

  function applySettings() {
    document.documentElement.classList.toggle('ce-compact', settings.compactMode);

    if (settings.statusBar) {
      createStatusBar();
    } else {
      removeStatusBar();
    }
  }

  /* ==========================================================
     SECTION 2: BODY OVERFLOW FIX
     CadetNet sets style="overflow: hidden" on body inline.
     Remove it when no modal is open. Watch for Angular modals.
     ========================================================== */

  function fixBodyOverflow() {
    function updateOverflow() {
      const hasModal = document.querySelector('.modal.in, .modal-backdrop');
      if (!hasModal && document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
      }
    }

    // Check periodically instead of using MutationObserver on body
    // (body subtree observers cause infinite loops with Angular)
    updateOverflow();
    setInterval(updateOverflow, 1000);
  }

  /* ==========================================================
     SECTION 3: ANNOUNCEMENT CONTENT INLINE STYLE FIX
     Override heavy inline styles in announcement widget HTML
     ========================================================== */

  const LIGHT_BG_REGEX = /^(#fff(fff)?|#fef3e8|#fff4ce|#fff8f0|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)|rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*1?\s*\))$/i;
  const ALERT_ORANGE_BG_REGEX = /^#fef3e8$/i;
  const ALERT_YELLOW_BG_REGEX = /^(#fff4ce|#fff8f0)$/i;
  const DARK_TEXT_REGEX = /^(#333(333)?|#4a2800|#7a3e0a|#1b1f10|#84754e|#6b7280|rgb\(\s*51\s*,\s*51\s*,\s*51\s*\))$/i;
  const GREEN_CIRCLE_BG = /^#3c441e$/i;

  function restyleAnnouncementElement(el) {
    if (!el || el.nodeType !== 1) return;

    const style = el.style;
    const bgColor = style.backgroundColor;
    const color = style.color;

    // Fix background colors
    if (bgColor) {
      const bgNorm = bgColor.trim();
      if (ALERT_ORANGE_BG_REGEX.test(bgNorm)) {
        style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
        style.border = '1px solid rgba(245, 158, 11, 0.3)';
        style.borderRadius = '8px';
      } else if (ALERT_YELLOW_BG_REGEX.test(bgNorm)) {
        style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
        style.border = '1px solid rgba(245, 158, 11, 0.2)';
        style.borderRadius = '8px';
      } else if (LIGHT_BG_REGEX.test(bgNorm)) {
        style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
        style.border = '1px solid rgba(255, 255, 255, 0.1)';
        style.borderRadius = '8px';
      } else if (GREEN_CIRCLE_BG.test(bgNorm)) {
        style.backgroundColor = '#38bdf8';
      }
    }

    // Fix text colors
    if (color) {
      const colorNorm = color.trim();
      if (DARK_TEXT_REGEX.test(colorNorm)) {
        style.color = '#cbd5e1';
      }
    }

    // Fix strong/bold text
    const tag = el.tagName;
    if (tag === 'STRONG' || tag === 'B' || (style.fontWeight && parseInt(style.fontWeight) >= 600)) {
      if (!style.color || DARK_TEXT_REGEX.test(style.color.trim())) {
        style.color = '#e2e8f0';
      }
    }

    // Fix links
    if (tag === 'A') {
      style.color = '#38bdf8';
    }

    // Fix border colors (light borders)
    if (style.borderColor) {
      const bc = style.borderColor.trim().toLowerCase();
      if (bc.includes('#e') || bc.includes('#d') || bc.includes('#c') || bc.includes('rgb(2')) {
        style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }
    }

    // Recurse into children
    for (const child of el.children) {
      restyleAnnouncementElement(child);
    }
  }

  function watchAnnouncementWidgets() {
    let processing = false;

    function processAnnouncements() {
      if (processing) return;
      processing = true;
      const widgets = document.querySelectorAll('[cadetnet-announcements], [ng-bind-html]');
      widgets.forEach((widget) => {
        const styledElements = widget.querySelectorAll('[style]');
        styledElements.forEach((el) => restyleAnnouncementElement(el));
      });
      processing = false;
    }

    // Debounced processing - run after Angular finishes rendering
    let announcementTimer = null;
    function scheduleProcess() {
      if (announcementTimer) return;
      announcementTimer = setTimeout(() => {
        announcementTimer = null;
        processAnnouncements();
      }, 500);
    }

    // Initial delayed pass (wait for Angular to render)
    setTimeout(processAnnouncements, 1000);
    setTimeout(processAnnouncements, 3000);

    // Watch only the main content area, not the entire body
    const contentArea = document.getElementById('ui-view-index-html');
    if (contentArea) {
      const obs = new MutationObserver(scheduleProcess);
      obs.observe(contentArea, { childList: true, subtree: true });
    }
  }

  /* ==========================================================
     SECTION 4: SVG CHART TEXT FIX
     NVD3 charts have dark text - override to light gray
     ========================================================== */

  function fixChartText() {
    const selectors = [
      '.nvd3 text',
      '.nv-legend-text',
      '.nv-axisMaxMin text',
      '.tick text',
    ];

    function applyChartFixes() {
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          el.setAttribute('fill', '#94a3b8');
          el.style.fill = '#94a3b8';
        });
      });
    }

    // Delayed passes (charts render async)
    setTimeout(applyChartFixes, 1000);
    setTimeout(applyChartFixes, 3000);
    setTimeout(applyChartFixes, 6000);
  }

  /* ==========================================================
     SECTION 5: AAC SERVICE COLOR OVERRIDE
     AAC.css loads AFTER our extension and overrides colors
     back to #697e47. Re-override at the end of <head>.
     ========================================================== */

  function injectServiceColorOverrides() {
    if (document.getElementById('ce-service-color-override')) return;

    const style = document.createElement('style');
    style.id = 'ce-service-color-override';
    style.textContent = `
      .service-color { background-color: #38bdf8 !important; color: #0f172a !important; }
      .service-color-hover:hover { background-color: #7dd3fc !important; }
      .service-color-only { color: #38bdf8 !important; }
      i.nav-v5 { background-color: #38bdf8 !important; }
      a:hover { color: #7dd3fc !important; }
      .navbar { background: rgba(15, 23, 42, 0.95) !important; }
      .widget-area .widget .widget-head { background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.15)) !important; }
      .widget-area .widget { border: 1px solid rgba(255,255,255,0.1) !important; }
      .btn:hover { background-color: rgba(56, 189, 248, 0.15) !important; }
      #notificationsOpenBtn { background-color: #38bdf8 !important; }
      .navbar .navbar-nav > li.active > a,
      .navbar .navbar-nav > li > a:hover,
      .navbar .navbar-nav > li:hover > a { background-color: rgba(56, 189, 248, 0.15) !important; color: #38bdf8 !important; }
      .navbar .nav > li > ul > li > a:hover { color: #38bdf8 !important; }
      .searchOptions li a:hover { background: rgba(56, 189, 248, 0.15) !important; color: #38bdf8 !important; }
      .btn-datepicker, .btn-datepicker-bgwhite { background-color: rgba(56, 189, 248, 0.2) !important; }
      .widget-area .widget .widget-head { background-color: transparent !important; }
      [date-picker] .active, [date-picker] .now { background-color: #38bdf8 !important; }
      .child-collection a.btn.btn-show { background-color: rgba(56, 189, 248, 0.2) !important; color: #38bdf8 !important; }
      .btn.btn-child { background-color: rgba(56, 189, 248, 0.2) !important; }
      tr:hover .nextArrow, .nextArrow:hover { background-color: rgba(56, 189, 248, 0.2) !important; }
      .element-cancel-submit .btn.cancel:hover, .btn-task:hover { background-color: rgba(56, 189, 248, 0.15) !important; }
      #searchResults tr:hover .task-icon { background-image: none !important; }
      .navbar.navbar-default.navbar-fixed-top > div > div.navbar-header > a:hover { background-color: rgba(56, 189, 248, 0.15) !important; }
      #loading-bar .bar { background: linear-gradient(90deg, #38bdf8, #6366f1) !important; }
      .icon-info { background: none !important; }

      /* Force navbar-header out of position:absolute (inline style override) */
      .navbar-header { position: relative !important; float: left !important; }
      .navbar-header img.logo { z-index: 1 !important; position: relative !important; }
      .commmonHeaderNavs { position: relative !important; margin-left: 0 !important; }

      /* Kill AAC green hover on header nav items */
      body.ce-has-sidebar .commmonHeaderNavs { display: none !important; }
      body.ce-has-sidebar .navbar-right .my-account { display: none !important; }
      body.ce-has-sidebar .nav-other { display: none !important; }
      .navbar .navbar-nav > li.active > a,
      .navbar .navbar-nav > li > a:hover,
      .navbar .navbar-nav > li:hover > a {
        background-color: rgba(56, 189, 248, 0.15) !important;
        color: #38bdf8 !important;
      }

      /* Force kill light backgrounds from original stylesheets */
      .activity-template { background-color: transparent !important; }
      .activity-template > thead > tr { background-color: rgba(30, 41, 59, 0.6) !important; }
      .activity-submit-dates { background: rgba(30, 41, 59, 0.6) !important; }
      #myAccountFixed { background-color: rgba(30, 41, 59, 0.8) !important; margin: 0 !important; width: 100% !important; }
      .tab-solid-panel, .tab-solid-panel-list, .tab-solid-panel-inside { background: transparent !important; }
      .completed-chart { background: rgba(30, 41, 59, 0.8) !important; }
      table.children.common td { display: table-cell !important; }
      .has-nominated-bottom { border: 1px solid rgba(255,255,255,0.1) !important; }
      .entity-details { margin-top: 10px !important; }
    `;

    // Append at END of <head> to ensure it loads after AAC.css
    document.head.appendChild(style);

    // Also strip problematic inline styles from DOM elements
    setTimeout(() => {
      const navHeader = document.querySelector('.navbar-header[style]');
      if (navHeader) navHeader.setAttribute('style', '');
      const logo = document.querySelector('img.logo[style*="z-index:-1"]');
      if (logo) logo.style.zIndex = '1';
      const commonNavs = document.querySelector('.commmonHeaderNavs[style]');
      if (commonNavs) commonNavs.setAttribute('style', '');
    }, 100);
  }

  /* ==========================================================
     SECTION 6: DRAGGABLE TASK MODALS
     Make modals draggable by their header, with resize handle
     ========================================================== */

  function makeDraggableModal(modalEl) {
    // Find the drag handle (modal header)
    const header = modalEl.querySelector('.modalTitle, .modal-header');
    if (!header || header.dataset.ceDraggable) return;
    header.dataset.ceDraggable = 'true';

    // Ensure the modal is positioned for dragging
    const inner = modalEl.querySelector('.modal-inner') || modalEl.querySelector('.modal-content');
    if (!inner) return;

    inner.style.position = 'relative';
    inner.style.margin = 'auto';

    // Drag handle cursor
    header.style.cursor = 'grab';
    header.style.userSelect = 'none';

    let isDragging = false;
    let startX, startY, origLeft, origTop;

    header.addEventListener('mousedown', (e) => {
      // Don't drag if clicking a button or link inside the header
      if (e.target.closest('button, a, .close, .btn')) return;

      isDragging = true;
      header.style.cursor = 'grabbing';

      const rect = inner.getBoundingClientRect();

      // Switch to fixed positioning for smooth dragging
      inner.style.position = 'fixed';
      inner.style.left = rect.left + 'px';
      inner.style.top = rect.top + 'px';
      inner.style.margin = '0';
      inner.style.zIndex = '100001';
      inner.style.width = rect.width + 'px';

      startX = e.clientX;
      startY = e.clientY;
      origLeft = rect.left;
      origTop = rect.top;

      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      inner.style.left = (origLeft + dx) + 'px';
      inner.style.top = (origTop + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      header.style.cursor = 'grab';
    });

    // Add resize handle
    if (!inner.querySelector('.ce-resize-handle')) {
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'ce-resize-handle';
      resizeHandle.style.cssText = `
        position: absolute;
        bottom: 0;
        right: 0;
        width: 16px;
        height: 16px;
        cursor: nwse-resize;
        background: linear-gradient(135deg, transparent 50%, rgba(56, 189, 248, 0.4) 50%);
        border-radius: 0 0 8px 0;
        z-index: 10;
      `;

      let isResizing = false;
      let resizeStartX, resizeStartY, origWidth, origHeight;

      resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        origWidth = inner.offsetWidth;
        origHeight = inner.offsetHeight;
        e.preventDefault();
        e.stopPropagation();
      });

      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const dw = e.clientX - resizeStartX;
        const dh = e.clientY - resizeStartY;
        inner.style.width = Math.max(300, origWidth + dw) + 'px';
        inner.style.height = Math.max(200, origHeight + dh) + 'px';
        inner.style.overflow = 'auto';
      });

      document.addEventListener('mouseup', () => {
        isResizing = false;
      });

      inner.style.position = inner.style.position || 'relative';
      inner.appendChild(resizeHandle);
    }
  }

  function watchForModals() {
    function processModals() {
      const modals = document.querySelectorAll('.modal .modal-inner, .modal .modal-content');
      modals.forEach((el) => {
        const modal = el.closest('.modal');
        if (modal && !modal.dataset.ceDragInit) {
          modal.dataset.ceDragInit = 'true';
          makeDraggableModal(modal);
        }
      });
    }

    // Check for modals periodically (safe, no observer loops)
    processModals();
    setInterval(processModals, 2000);
  }

  /* ==========================================================
     SECTION 7: QUICK NAVIGATION (Ctrl/Cmd+K)
     ========================================================== */

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
    if (!settings.quickNav) return;
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
            escapeHtml(item.href) +
            '">' +
            '<span class="ce-nav-icon">' +
            icon +
            '</span>' +
            '<span>' +
            highlightMatch(item.text, q) +
            '</span>' +
            '<span class="ce-nav-path">' +
            escapeHtml(item.path) +
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
      if (!query) return escapeHtml(text);
      const idx = text.toLowerCase().indexOf(query);
      if (idx === -1) return escapeHtml(text);
      return (
        escapeHtml(text.slice(0, idx)) +
        '<strong>' +
        escapeHtml(text.slice(idx, idx + query.length)) +
        '</strong>' +
        escapeHtml(text.slice(idx + query.length))
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

  /* ==========================================================
     SECTION 8: QUICK PEOPLE SEARCH (Ctrl+Shift+P)
     Floating dialog for fast people/PMKeyS lookup
     ========================================================== */

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

      // Navigate to people search page
      window.location.hash = '#/people/member';

      // Wait for Angular to render the search page, then fill in the search
      let attempts = 0;
      const trySearch = setInterval(() => {
        attempts++;
        if (attempts > 30) { clearInterval(trySearch); return; }

        // Look for the search input on the people page
        const searchInputs = document.querySelectorAll(
          'input[ng-model*="search"], input[ng-model*="Search"], input[ng-model*="filter"], input[ng-model*="Filter"], input[ng-model*="freeText"], input[name="freeText"], .searchBar input[type="text"], .searchControls input[type="text"], input.search-query'
        );

        for (const searchInput of searchInputs) {
          if (searchInput.offsetParent !== null) { // visible
            // Set value using Angular's scope
            const ngScope = window.angular?.element(searchInput).scope();
            const ngModel = searchInput.getAttribute('ng-model');

            if (ngScope && ngModel) {
              // Set the model value via Angular scope
              const parts = ngModel.split('.');
              let obj = ngScope;
              for (let i = 0; i < parts.length - 1; i++) {
                if (obj[parts[i]]) obj = obj[parts[i]];
              }
              obj[parts[parts.length - 1]] = term;
              ngScope.$apply();
            } else {
              // Fallback: set value and dispatch events
              searchInput.value = term;
              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
              searchInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Try to click the search button
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

  /* ==========================================================
     SECTION 9: ADMIN QUICK ACTIONS PANEL
     Floating action button (bottom-right) with shortcut menu
     ========================================================== */

  function createAdminQuickActions() {
    if (document.getElementById('ce-admin-fab')) return;

    const ACTIONS = [
      { label: 'People Search', hash: '#/people/member' },
      { label: 'Applications', hash: '#/people/application' },
      { label: 'My Tasks', hash: '#/my-tasks' },
      { label: 'My Notifications', hash: '#/my-notifications' },
      { label: 'Reports', hash: '#/reports' },
      { label: 'System Admin', hash: '#/landing/System' },
    ];

    // FAB container
    const container = document.createElement('div');
    container.id = 'ce-admin-fab';
    container.style.cssText = `
      position: fixed;
      bottom: 44px;
      right: 20px;
      z-index: 99995;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      font-family: 'Inter', system-ui, sans-serif;
    `;

    // Menu (hidden by default)
    const menu = document.createElement('div');
    menu.id = 'ce-admin-fab-menu';
    menu.style.cssText = `
      display: none;
      flex-direction: column;
      gap: 4px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 30px rgba(56, 189, 248, 0.1);
      min-width: 180px;
    `;

    ACTIONS.forEach((action) => {
      const item = document.createElement('a');
      item.href = action.hash;
      item.textContent = action.label;
      item.style.cssText = `
        display: block;
        padding: 8px 14px;
        color: #94a3b8 !important;
        font-size: 13px;
        font-weight: 500;
        border-radius: 8px;
        text-decoration: none !important;
        transition: all 300ms ease;
        cursor: pointer;
      `;
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(56, 189, 248, 0.15)';
        item.style.color = '#38bdf8';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
        item.style.color = '#94a3b8';
      });
      item.addEventListener('click', () => {
        menu.style.display = 'none';
      });
      menu.appendChild(item);
    });

    // FAB button
    const fab = document.createElement('button');
    fab.id = 'ce-admin-fab-btn';
    fab.innerHTML = '\u26A1';
    fab.title = 'Admin Quick Actions';
    fab.style.cssText = `
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(56, 189, 248, 0.2);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(56, 189, 248, 0.2);
      transition: all 300ms ease;
      line-height: 1;
      padding: 0;
    `;
    fab.addEventListener('mouseenter', () => {
      fab.style.background = 'rgba(56, 189, 248, 0.35)';
      fab.style.boxShadow = '0 4px 25px rgba(56, 189, 248, 0.3)';
      fab.style.transform = 'scale(1.1)';
    });
    fab.addEventListener('mouseleave', () => {
      fab.style.background = 'rgba(56, 189, 248, 0.2)';
      fab.style.boxShadow = '0 4px 15px rgba(56, 189, 248, 0.2)';
      fab.style.transform = 'scale(1)';
    });

    let menuOpen = false;
    fab.addEventListener('click', () => {
      menuOpen = !menuOpen;
      menu.style.display = menuOpen ? 'flex' : 'none';
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (menuOpen && !container.contains(e.target)) {
        menuOpen = false;
        menu.style.display = 'none';
      }
    });

    container.appendChild(menu);
    container.appendChild(fab);
    document.body.appendChild(container);
  }

  /* ==========================================================
     SECTION 10: STATUS BAR (with task count badge)
     ========================================================== */

  function createStatusBar() {
    if (document.getElementById('ce-statusbar')) return;

    const bar = document.createElement('div');
    bar.id = 'ce-statusbar';

    // Extension badge
    const badge = document.createElement('span');
    badge.className = 'ce-status-item';
    badge.innerHTML = '<span class="ce-status-badge">CE</span> CadetNet Enhanced';
    bar.appendChild(badge);

    // Current page path
    const pagePath = document.createElement('span');
    pagePath.className = 'ce-status-item';
    pagePath.id = 'ce-status-page';
    updatePagePath(pagePath);
    bar.appendChild(pagePath);

    // Task count badge
    const taskItem = document.createElement('span');
    taskItem.className = 'ce-status-item';
    taskItem.id = 'ce-status-tasks';
    taskItem.style.cursor = 'pointer';
    taskItem.addEventListener('click', () => {
      window.location.hash = '#/my-tasks';
    });
    updateTaskCount(taskItem);
    bar.appendChild(taskItem);

    // Spacer
    const spacer = document.createElement('span');
    spacer.className = 'ce-status-spacer';
    bar.appendChild(spacer);

    // Quick nav shortcut hint
    const shortcutHint = document.createElement('span');
    shortcutHint.className = 'ce-status-item';
    shortcutHint.style.cursor = 'pointer';
    shortcutHint.textContent = 'Ctrl+K: Quick Nav';
    shortcutHint.addEventListener('click', openQuickNav);
    bar.appendChild(shortcutHint);

    // People search shortcut hint
    const peopleHint = document.createElement('span');
    peopleHint.className = 'ce-status-item';
    peopleHint.style.cursor = 'pointer';
    peopleHint.textContent = 'Ctrl+Shift+P: People';
    peopleHint.addEventListener('click', openPeopleSearch);
    bar.appendChild(peopleHint);

    // Timestamp
    const timestamp = document.createElement('span');
    timestamp.className = 'ce-status-item';
    function updateTime() {
      timestamp.textContent = new Date().toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    updateTime();
    setInterval(updateTime, 30000);
    bar.appendChild(timestamp);

    document.body.appendChild(bar);
  }

  function updatePagePath(el) {
    const hash = window.location.hash.replace('#/', '').replace(/%20/g, ' ');
    el.textContent = hash ? '\u203A ' + hash : '\u203A Dashboard';
  }

  function updateTaskCount(el) {
    if (!el) el = document.getElementById('ce-status-tasks');
    if (!el) return;

    // Read task count from .countBadge next to "Tasks" in the my-account dropdown
    let taskCount = 0;
    const badges = document.querySelectorAll('.countBadge');
    badges.forEach((badge) => {
      // Check if this badge is associated with "Tasks"
      const parent = badge.closest('a, li, td');
      if (parent) {
        const text = parent.textContent || '';
        if (text.includes('Task')) {
          const count = parseInt(badge.textContent.trim(), 10);
          if (!isNaN(count)) taskCount = count;
        }
      }
    });

    if (taskCount > 0) {
      el.innerHTML =
        '<span style="' +
        'background: rgba(220, 38, 38, 0.2);' +
        'border: 1px solid rgba(220, 38, 38, 0.3);' +
        'color: #fca5a5;' +
        'padding: 1px 6px;' +
        'border-radius: 4px;' +
        'font-size: 10px;' +
        'font-weight: 600;' +
        '">' + taskCount + '</span> Tasks';
    } else {
      el.innerHTML =
        '<span style="' +
        'background: rgba(34, 197, 94, 0.2);' +
        'border: 1px solid rgba(34, 197, 94, 0.3);' +
        'color: #86efac;' +
        'padding: 1px 6px;' +
        'border-radius: 4px;' +
        'font-size: 10px;' +
        'font-weight: 600;' +
        '">0</span> Tasks';
    }
  }

  function watchTaskCount() {
    // Poll task count periodically (safe - no observer loops)
    setInterval(updateTaskCount, 5000);
  }

  function removeStatusBar() {
    const bar = document.getElementById('ce-statusbar');
    if (bar) bar.remove();
  }

  /* ==========================================================
     SECTION 11: KEYBOARD SHORTCUTS
     ========================================================== */

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

    // Escape closes overlays
    if (e.key === 'Escape') {
      closeQuickNav();
      closePeopleSearch();
    }
  });

  /* ==========================================================
     SECTION 12: NOTIFICATION ENHANCEMENT
     ========================================================== */

  function enhanceNotifications() {
    if (!settings.enhancedNotifications) return;

    const badges = document.querySelectorAll('.countBadge');
    badges.forEach((badge) => {
      const count = parseInt(badge.textContent.trim(), 10);
      if (count > 0) {
        badge.style.animation = 'ce-pulse 2s ease-in-out infinite';
      }
    });

    if (!document.getElementById('ce-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'ce-pulse-style';
      style.textContent =
        '@keyframes ce-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }';
      document.head.appendChild(style);
    }
  }

  /* ==========================================================
     SECTION 13: PAGE TITLE ENHANCEMENT
     ========================================================== */

  function enhanceTitle() {
    const hash = window.location.hash.replace('#/', '').replace(/%20/g, ' ');
    const section = hash.split('/')[0] || 'Dashboard';
    document.title = section + ' - CadetNet';
  }

  /* ==========================================================
     SECTION 14: SPA NAVIGATION TRANSITIONS
     Skeleton loading screens on hash changes, click-spam guard,
     XHR-aware auto-dismiss
     ========================================================== */

  // Skeleton templates for different page types
  const SKELETON_TEMPLATES = {
    // People search / table-heavy pages
    table: `
      <div class="ce-skel-header"></div>
      <div class="ce-skel-toolbar">
        <div class="ce-skel-block" style="width:200px;height:36px"></div>
        <div class="ce-skel-block" style="width:120px;height:36px"></div>
        <div class="ce-skel-block" style="width:100px;height:36px"></div>
      </div>
      <div class="ce-skel-table">
        <div class="ce-skel-row ce-skel-row-header">
          <div class="ce-skel-cell" style="width:5%"></div>
          <div class="ce-skel-cell" style="width:25%"></div>
          <div class="ce-skel-cell" style="width:20%"></div>
          <div class="ce-skel-cell" style="width:20%"></div>
          <div class="ce-skel-cell" style="width:15%"></div>
          <div class="ce-skel-cell" style="width:15%"></div>
        </div>
        ${Array(8).fill(`
          <div class="ce-skel-row">
            <div class="ce-skel-cell" style="width:5%"></div>
            <div class="ce-skel-cell" style="width:25%"></div>
            <div class="ce-skel-cell" style="width:20%"></div>
            <div class="ce-skel-cell" style="width:20%"></div>
            <div class="ce-skel-cell" style="width:15%"></div>
            <div class="ce-skel-cell" style="width:15%"></div>
          </div>
        `).join('')}
      </div>`,
    // Detail / form pages (member view, activity edit)
    detail: `
      <div class="ce-skel-header"></div>
      <div class="ce-skel-tabs">
        <div class="ce-skel-block" style="width:100px;height:32px;border-radius:6px"></div>
        <div class="ce-skel-block" style="width:120px;height:32px;border-radius:6px"></div>
        <div class="ce-skel-block" style="width:100px;height:32px;border-radius:6px"></div>
        <div class="ce-skel-block" style="width:90px;height:32px;border-radius:6px"></div>
      </div>
      <div class="ce-skel-form">
        <div class="ce-skel-form-row">
          <div class="ce-skel-label"></div>
          <div class="ce-skel-input"></div>
        </div>
        <div class="ce-skel-form-row">
          <div class="ce-skel-label"></div>
          <div class="ce-skel-input"></div>
        </div>
        <div class="ce-skel-form-row">
          <div class="ce-skel-label"></div>
          <div class="ce-skel-input" style="height:80px"></div>
        </div>
        <div class="ce-skel-form-row">
          <div class="ce-skel-label"></div>
          <div class="ce-skel-input"></div>
        </div>
        <div class="ce-skel-form-row">
          <div class="ce-skel-label"></div>
          <div class="ce-skel-input"></div>
        </div>
      </div>`,
    // Dashboard / widget pages
    dashboard: `
      <div class="ce-skel-header"></div>
      <div class="ce-skel-widgets">
        <div class="ce-skel-widget">
          <div class="ce-skel-widget-head"></div>
          <div class="ce-skel-widget-body">
            <div class="ce-skel-block" style="width:80%;height:14px;margin-bottom:10px"></div>
            <div class="ce-skel-block" style="width:60%;height:14px;margin-bottom:10px"></div>
            <div class="ce-skel-block" style="width:70%;height:14px"></div>
          </div>
        </div>
        <div class="ce-skel-widget">
          <div class="ce-skel-widget-head"></div>
          <div class="ce-skel-widget-body">
            <div class="ce-skel-block" style="width:90%;height:14px;margin-bottom:10px"></div>
            <div class="ce-skel-block" style="width:50%;height:14px;margin-bottom:10px"></div>
            <div class="ce-skel-block" style="width:75%;height:14px"></div>
          </div>
        </div>
      </div>`,
    // Generic landing page
    landing: `
      <div class="ce-skel-header" style="height:40px;width:250px;margin-bottom:24px"></div>
      <div class="ce-skel-grid">
        ${Array(6).fill(`
          <div class="ce-skel-card">
            <div class="ce-skel-block" style="width:70%;height:16px;margin-bottom:12px"></div>
            <div class="ce-skel-block" style="width:90%;height:12px;margin-bottom:8px"></div>
            <div class="ce-skel-block" style="width:50%;height:12px"></div>
          </div>
        `).join('')}
      </div>`,
  };

  function getSkeletonType(hash) {
    const h = hash.toLowerCase();
    if (h === '#/' || h === '#') return 'dashboard';
    if (h.includes('/landing/')) return 'landing';
    if (h.includes('/member') || h.includes('/application') || h.includes('/reports') ||
        h.includes('/my-tasks') || h.includes('/my-notifications') || h.includes('/my-activities') ||
        h.includes('/search')) return 'table';
    return 'detail';
  }

  function getPageLabel(hash) {
    const h = hash.replace('#/', '').replace(/%20/g, ' ');
    if (!h || h === '#') return 'Dashboard';
    // Clean up path segments into a readable label
    const parts = h.split('/').filter(Boolean);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ');
  }

  let navTransitionActive = false;
  let lastNavTime = 0;

  function showNavTransition(hash) {
    // Click-spam guard: ignore rapid-fire navigations
    const now = Date.now();
    if (now - lastNavTime < 300) return;
    lastNavTime = now;

    // Remove any existing skeleton
    dismissNavTransition();

    const type = getSkeletonType(hash);
    const label = getPageLabel(hash);

    const overlay = document.createElement('div');
    overlay.id = 'ce-nav-skeleton';
    overlay.innerHTML = `
      <div class="ce-skel-container">
        <div class="ce-skel-progress"></div>
        <div class="ce-skel-breadcrumb">
          <span class="ce-skel-crumb-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </span>
          <span>Loading ${escapeHtml(label)}</span>
        </div>
        ${SKELETON_TEMPLATES[type]}
      </div>
    `;

    // Insert into the main content area, not over the whole page
    const contentArea = document.querySelector('#ui-view-index-html') ||
                        document.querySelector('.wrap > .container:not(.nav)') ||
                        document.querySelector('.wrap');
    if (contentArea) {
      // Hide real content, show skeleton in its place
      overlay.style.cssText = 'position:relative;';
      const children = Array.from(contentArea.children).filter(c => c.id !== 'ce-nav-skeleton' && !c.classList.contains('navbar'));
      children.forEach(c => { c.dataset.ceHidden = c.style.display; c.style.display = 'none'; });
      contentArea.appendChild(overlay);
    } else {
      document.body.appendChild(overlay);
    }

    navTransitionActive = true;

    // Auto-dismiss: watch for Angular content to appear
    let checks = 0;
    const dismissCheck = setInterval(() => {
      checks++;
      // Check if Angular has rendered new content (ui-view populated)
      const uiView = document.querySelector('[ui-view]:not(#ce-nav-skeleton)');
      const hasContent = uiView && uiView.children.length > 0 && uiView.querySelector('.ng-scope');
      const angularDone = !document.querySelector('.globalBusyIndicator:not(.ng-hide)');

      if ((hasContent && angularDone && checks > 3) || checks > 60) {
        clearInterval(dismissCheck);
        dismissNavTransition();
      }
    }, 150);
  }

  function dismissNavTransition() {
    const skeleton = document.getElementById('ce-nav-skeleton');
    if (!skeleton) { navTransitionActive = false; return; }

    // Fade out
    skeleton.style.opacity = '0';
    skeleton.style.transition = 'opacity 200ms ease';

    setTimeout(() => {
      // Restore hidden content
      const parent = skeleton.parentElement;
      if (parent) {
        parent.querySelectorAll('[data-ce-hidden]').forEach(c => {
          c.style.display = c.dataset.ceHidden || '';
          delete c.dataset.ceHidden;
        });
      }
      skeleton.remove();
      navTransitionActive = false;
    }, 200);
  }

  // Click-spam prevention on nav links
  function installClickGuard() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href*="#/"], a[cadet-link]');
      if (!link) return;

      if (navTransitionActive) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }, true);
  }

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    enhanceTitle();
    const pagePath = document.getElementById('ce-status-page');
    if (pagePath) updatePagePath(pagePath);

    // Show skeleton transition
    showNavTransition(window.location.hash);
  });

  /* ==========================================================
     SECTION 15: UTILITY FUNCTIONS
     ========================================================== */

  function escapeHtml(text) {
    const el = document.createElement('span');
    el.textContent = text;
    return el.innerHTML;
  }

  /**
   * Navigate by clicking the original Angular cadet-link element if possible,
   * falling back to Angular's $location service, then raw hash change.
   */
  function navigateViaAngular(path, fallbackHref) {
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
  }

  /* ==========================================================
     SECTION X: SIDEBAR NAVIGATION
     Convert header nav to modern sidebar layout
     ========================================================== */

  /* ==========================================================
     APP LAUNCHER (top-right navbar button for external links)
     ========================================================== */

  function createAppLauncher() {
    if (document.getElementById('ce-app-launcher')) return;

    // Harvest external links from the original waffle menu
    const externalLinks = [];
    document.querySelectorAll('.external-web-links .dynamic-links a, .external-web-links .static-links a').forEach(a => {
      const text = a.textContent.trim();
      const href = a.getAttribute('href');
      if (text && href && !text.includes('Changes in this') && !text.includes('Terms') &&
          !text.includes('Privacy') && !text.includes('Commonwealth') && text !== '') {
        externalLinks.push({ text, href, target: a.getAttribute('target') || '' });
      }
    });

    // Fallback if Angular hasn't rendered the links
    if (externalLinks.length === 0) {
      externalLinks.push(
        { text: 'CadetNet v5', href: '#/', target: '' },
        { text: 'Intranet', href: 'https://members.cadetnet.gov.au/', target: '_blank' },
        { text: 'Website', href: 'https://www.cadetnet.gov.au/', target: '_blank' },
        { text: 'Webmail', href: 'https://outlook.office365.com/', target: '_blank' },
        { text: 'eLearning', href: 'https://apps.cadetnet.gov.au/elearning/', target: '_blank' },
      );
    }

    // Create launcher container
    const launcher = document.createElement('div');
    launcher.id = 'ce-app-launcher';

    const btn = document.createElement('button');
    btn.className = 'ce-app-launcher-btn';
    btn.title = 'Apps & Links';
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>' +
      '<rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';

    const menu = document.createElement('div');
    menu.className = 'ce-app-launcher-menu';
    menu.style.display = 'none';

    const menuTitle = document.createElement('div');
    menuTitle.className = 'ce-app-launcher-title';
    menuTitle.textContent = 'Apps & Links';
    menu.appendChild(menuTitle);

    externalLinks.forEach(link => {
      const item = document.createElement('a');
      item.href = link.href;
      if (link.target) item.target = link.target;
      if (link.target === '_blank') item.rel = 'noreferrer';
      item.className = 'ce-app-launcher-item';
      item.innerHTML = '<span>' + escapeHtml(link.text) + '</span>' +
        (link.target === '_blank' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' : '');
      menu.appendChild(item);
    });

    let menuOpen = false;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuOpen = !menuOpen;
      menu.style.display = menuOpen ? 'block' : 'none';
    });
    document.addEventListener('click', () => {
      if (menuOpen) { menuOpen = false; menu.style.display = 'none'; }
    });

    launcher.appendChild(btn);
    launcher.appendChild(menu);

    // Insert into navbar
    const navbar = document.querySelector('.navbar .container') ||
                   document.querySelector('.navbar');
    if (navbar) navbar.appendChild(launcher);
  }

  function createSidebarNav() {
    if (document.getElementById('ce-sidebar')) return;

    // Fix inline styles on navbar-header that cause overlap
    const navbarHeader = document.querySelector('.navbar-header[style*="position"]');
    if (navbarHeader) navbarHeader.style.position = 'relative';
    const logoEl = document.querySelector('img.logo[style*="z-index"]');
    if (logoEl) logoEl.style.zIndex = '1';
    const commonNavs = document.querySelector('.commmonHeaderNavs[style]');
    if (commonNavs) { commonNavs.style.position = 'relative'; commonNavs.style.marginLeft = '0'; }

    // Harvest nav structure - try from DOM, fall back to hardcoded structure
    let navData = [];
    const topLevelItems = document.querySelectorAll('.commmonHeaderNavs > li.level-1');

    if (topLevelItems.length > 0) {
      topLevelItems.forEach(li => {
        const topLink = li.querySelector(':scope > a');
        if (!topLink) return;
        const section = {
          text: topLink.textContent.trim(),
          href: topLink.getAttribute('href') || '#',
          path: topLink.getAttribute('path') || '',
          children: []
        };
        li.querySelectorAll('ul.level-2 > li a').forEach(subLink => {
          section.children.push({
            text: subLink.textContent.trim(),
            href: subLink.getAttribute('href') || '#',
            path: subLink.getAttribute('path') || ''
          });
        });
        navData.push(section);
      });
    }

    // Fallback: if Angular hasn't rendered nav yet, use known CadetNet structure
    if (navData.length === 0) {
      navData = [
        { text: 'People', href: '#/landing/People', path: 'People', children: [
          { text: 'Search', href: '#/people/member', path: 'People/Search' },
          { text: 'Applications', href: '#/people/application', path: 'People/Applications' },
          { text: 'Cadet bulk image import', href: '#/people/bulk-image-import', path: 'People/Cadet bulk image import' },
          { text: 'Workflow history', href: '#/landing/People/Workflow history', path: 'People/Workflow history' },
        ]},
        { text: 'Organisation', href: '#/landing/Organisation', path: 'Organisation', children: [
          { text: 'Activities', href: '#/landing/Organisation/Activities', path: 'Organisation/Activities' },
          { text: 'Assets', href: '#/landing/Organisation/Assets', path: 'Organisation/Assets' },
          { text: 'Cashbook', href: '#/landing/Organisation/Cashbook', path: 'Organisation/Cashbook' },
          { text: 'Facilities', href: '#/landing/Organisation/Facilities', path: 'Organisation/Facilities' },
          { text: 'Firearms', href: '#/landing/Organisation/Firearms', path: 'Organisation/Firearms' },
          { text: 'Hazards', href: '#/landing/Organisation/Hazards', path: 'Organisation/Hazards' },
          { text: 'ICT assets', href: '#/landing/Organisation/ICT assets', path: 'Organisation/ICT assets' },
          { text: 'Inspections', href: '#/landing/Organisation/Inspections', path: 'Organisation/Inspections' },
          { text: 'Learning', href: '#/landing/Organisation/Learning', path: 'Organisation/Learning' },
          { text: 'Sentinel', href: '#/landing/Organisation/Sentinel', path: 'Organisation/Sentinel' },
          { text: 'Uniforms', href: '#/landing/Organisation/Uniforms', path: 'Organisation/Uniforms' },
          { text: 'Units', href: '#/landing/Organisation/Units', path: 'Organisation/Units' },
          { text: 'Workflow history', href: '#/landing/Organisation/Workflow history', path: 'Organisation/Workflow history' },
        ]},
        { text: 'Reports', href: '#/landing/Reports', path: 'Reports', children: [
          { text: 'Search', href: '#/reports', path: 'Reports/Search' },
        ]},
        { text: 'System', href: '#/landing/System', path: 'System', children: [
          { text: 'Activities & learning', href: '#/landing/System/Activities & learning', path: 'System/Activities & learning' },
          { text: 'Assets', href: '#/landing/System/Assets', path: 'System/Assets' },
          { text: 'Cashbook', href: '#/landing/System/Cashbook', path: 'System/Cashbook' },
          { text: 'Facilities', href: '#/landing/System/Facilities', path: 'System/Facilities' },
          { text: 'Firearms', href: '#/landing/System/Firearms', path: 'System/Firearms' },
          { text: 'Global', href: '#/landing/System/Global', path: 'System/Global' },
          { text: 'Health & safety', href: '#/landing/System/Health & safety', path: 'System/Health & safety' },
          { text: 'Mail', href: '#/landing/System/Mail', path: 'System/Mail' },
          { text: 'Organisation - content', href: '#/landing/System/Organisation - content', path: 'System/Organisation - content' },
          { text: 'People - details', href: '#/landing/System/People - details', path: 'System/People - details' },
          { text: 'People - ranks', href: '#/landing/System/People - ranks', path: 'System/People - ranks' },
          { text: 'People - roles', href: '#/landing/System/People - roles', path: 'System/People - roles' },
          { text: 'Permission', href: '#/landing/System/Permission', path: 'System/Permission' },
          { text: 'Training', href: '#/landing/System/Training', path: 'System/Training' },
          { text: 'Units', href: '#/landing/System/Units', path: 'System/Units' },
          { text: 'Workflow', href: '#/landing/System/Workflow', path: 'System/Workflow' },
        ]},
      ];
    }

    // Get user info - extract actual name from greeting text
    function extractUserName() {
      const el = document.getElementById('userGreeting');
      if (!el) return '';
      // The greeting is like "Hi James \n 1" — clone and strip badges
      const clone = el.cloneNode(true);
      clone.querySelectorAll('.countBadge, i').forEach(b => b.remove());
      let text = clone.textContent.trim();
      // Strip "Hi " prefix
      text = text.replace(/^Hi\s+/i, '').trim();
      // Strip any remaining numbers / whitespace
      text = text.replace(/\d+/g, '').trim();
      return text || '';
    }

    let userName = extractUserName() || 'User';

    // Get notification/task counts
    function getCounts() {
      let n = 0, t = 0;
      document.querySelectorAll('.countBadge').forEach(badge => {
        const parent = badge.closest('a, td');
        if (!parent) return;
        const text = parent.textContent || '';
        const count = parseInt(badge.textContent.trim(), 10) || 0;
        if (text.includes('Notification')) n = count;
        if (text.includes('Task')) t = count;
      });
      // Fallback: check userGreeting badge for total count
      if (n === 0 && t === 0) {
        const greetEl = document.getElementById('userGreeting');
        if (greetEl) {
          const greetBadge = greetEl.querySelector('.countBadge');
          if (greetBadge) t = parseInt(greetBadge.textContent.trim(), 10) || 0;
        }
      }
      return { notif: n, task: t };
    }

    const counts = getCounts();

    // Section icons using simple SVG paths for crisp rendering
    const icons = {
      dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      people: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
      org: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="12"/></svg>',
      reports: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
      system: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
      tasks: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
      bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
      user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      learn: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
      calendar: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      logout: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
      search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      cashbook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
    };

    const sectionIconMap = {
      'People': icons.people,
      'Organisation': icons.org,
      'Reports': icons.reports,
      'System': icons.system,
    };

    // Build sidebar
    const sidebar = document.createElement('div');
    sidebar.id = 'ce-sidebar';

    // Brand
    const brand = document.createElement('div');
    brand.className = 'ce-sidebar-brand';
    const logoImg = document.querySelector('.navbar-header img.logo');
    const logoSrc = logoImg ? logoImg.src : '';
    brand.innerHTML =
      (logoSrc ? '<img src="' + logoSrc + '" class="ce-sidebar-logo" alt="Logo">' : '') +
      '<span class="ce-sidebar-title">CadetNet</span>' +
      '<button class="ce-sidebar-collapse-btn" title="Collapse sidebar">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>' +
      '</button>';
    sidebar.appendChild(brand);

    // Search
    const searchBox = document.createElement('div');
    searchBox.className = 'ce-sidebar-search';
    searchBox.innerHTML = '<div class="ce-sidebar-search-inner">' + icons.search +
      '<input type="text" placeholder="Search... Ctrl+K" class="ce-sidebar-search-input" readonly></div>';
    searchBox.querySelector('input').addEventListener('click', () => openQuickNav());
    sidebar.appendChild(searchBox);

    // User card
    const userCard = document.createElement('div');
    userCard.className = 'ce-sidebar-user';
    userCard.innerHTML =
      '<div class="ce-sidebar-user-avatar">' + userName.charAt(0).toUpperCase() + '</div>' +
      '<div class="ce-sidebar-user-info">' +
        '<div class="ce-sidebar-user-name">' + escapeHtml(userName) + '</div>' +
        '<div class="ce-sidebar-user-badges" id="ce-sidebar-badges">' +
          '<span class="ce-badge ce-badge-info" id="ce-sidebar-notif">' + counts.notif + ' notif</span>' +
          '<span class="ce-badge ce-badge-danger" id="ce-sidebar-tasks">' + counts.task + ' tasks</span>' +
        '</div>' +
      '</div>';
    sidebar.appendChild(userCard);

    // Dashboard link
    const dashSection = document.createElement('div');
    dashSection.className = 'ce-sidebar-section-divider';
    const dashLink = document.createElement('a');
    dashLink.href = '#/';
    dashLink.className = 'ce-sidebar-item ce-sidebar-dash';
    dashLink.title = 'Dashboard';
    dashLink.innerHTML = '<span class="ce-sidebar-icon">' + icons.dashboard + '</span><span>Dashboard</span>';
    dashLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigateViaAngular(null, '#/');
    });
    dashSection.appendChild(dashLink);
    sidebar.appendChild(dashSection);

    // Main nav sections
    const navContainer = document.createElement('div');
    navContainer.className = 'ce-sidebar-nav';

    navData.forEach(section => {
      const group = document.createElement('div');
      group.className = 'ce-sidebar-group';

      const header = document.createElement('button');
      header.className = 'ce-sidebar-section';
      header.title = section.text;
      const icon = sectionIconMap[section.text] || icons.org;
      header.innerHTML =
        '<span class="ce-sidebar-icon">' + icon + '</span>' +
        '<span class="ce-sidebar-section-text">' + escapeHtml(section.text) + '</span>' +
        '<span class="ce-sidebar-chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></span>';

      const submenu = document.createElement('div');
      submenu.className = 'ce-sidebar-submenu';

      section.children.forEach(child => {
        const item = document.createElement('a');
        item.className = 'ce-sidebar-subitem';
        item.href = child.href;
        item.textContent = child.text;
        item.addEventListener('click', (e) => {
          e.preventDefault();
          navigateViaAngular(child.path, child.href);
        });
        submenu.appendChild(item);
      });

      header.addEventListener('click', () => {
        // In collapsed mode, navigate to section landing page
        if (document.body.classList.contains('ce-sidebar-collapsed')) {
          navigateViaAngular(section.path, section.href);
          return;
        }
        const wasOpen = submenu.classList.contains('open');
        // Accordion: close all other sections first
        navContainer.querySelectorAll('.ce-sidebar-submenu.open').forEach(sm => {
          sm.classList.remove('open');
          sm.closest('.ce-sidebar-group')?.querySelector('.ce-sidebar-section')?.classList.remove('open');
        });
        // Toggle this one
        if (!wasOpen) {
          submenu.classList.add('open');
          header.classList.add('open');
        }
      });

      group.appendChild(header);
      group.appendChild(submenu);
      navContainer.appendChild(group);
    });
    sidebar.appendChild(navContainer);

    // Separator label
    const sepLabel = document.createElement('div');
    sepLabel.className = 'ce-sidebar-label';
    sepLabel.textContent = 'My Account';
    sidebar.appendChild(sepLabel);

    // Quick actions
    const quickActions = document.createElement('div');
    quickActions.className = 'ce-sidebar-quick';
    quickActions.innerHTML =
      '<a href="#/my-tasks" class="ce-sidebar-item" title="My Tasks">' +
        '<span class="ce-sidebar-icon">' + icons.tasks + '</span>' +
        '<span>My Tasks</span>' +
        '<span class="ce-sidebar-count ce-count-task" id="ce-sb-task-count">' + (counts.task || '') + '</span></a>' +
      '<a href="#/my-notifications" class="ce-sidebar-item" title="Notifications">' +
        '<span class="ce-sidebar-icon">' + icons.bell + '</span>' +
        '<span>Notifications</span>' +
        '<span class="ce-sidebar-count ce-count-notif" id="ce-sb-notif-count">' + (counts.notif || '') + '</span></a>' +
      '<a href="#/my/view-details" class="ce-sidebar-item" title="My Details">' +
        '<span class="ce-sidebar-icon">' + icons.user + '</span><span>My Details</span></a>' +
      '<a href="#/my/learning" class="ce-sidebar-item" title="My Learning">' +
        '<span class="ce-sidebar-icon">' + icons.learn + '</span><span>My Learning</span></a>' +
      '<a href="#/my/my-activities" class="ce-sidebar-item" title="My Activities">' +
        '<span class="ce-sidebar-icon">' + icons.calendar + '</span><span>My Activities</span></a>' +
      '<a href="#/MyAccount/My cashbook" class="ce-sidebar-item" title="My Cashbook">' +
        '<span class="ce-sidebar-icon">' + icons.cashbook + '</span><span>My Cashbook</span></a>';
    // Wire quick action links through Angular navigation
    const quickPaths = {
      '#/my-tasks': 'MyAccount/Tasks',
      '#/my-notifications': 'MyAccount/Notifications',
      '#/my/view-details': 'MyAccount/My details',
      '#/my/learning': 'MyAccount/My learning',
      '#/my/my-activities': 'MyAccount/My activities',
      '#/MyAccount/My cashbook': 'MyAccount/My cashbook',
    };
    quickActions.querySelectorAll('a.ce-sidebar-item').forEach(link => {
      const hash = link.href.includes('#') ? '#' + link.href.split('#')[1] : '';
      const angularPath = quickPaths[hash];
      if (angularPath) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          navigateViaAngular(angularPath, link.href);
        });
      }
    });
    sidebar.appendChild(quickActions);

    // Logout
    const logoutDiv = document.createElement('div');
    logoutDiv.className = 'ce-sidebar-logout';
    logoutDiv.innerHTML = '<a href="#/logout" class="ce-sidebar-item ce-sidebar-logout-btn" title="Logout">' +
      '<span class="ce-sidebar-icon">' + icons.logout + '</span><span>Logout</span></a>';
    sidebar.appendChild(logoutDiv);

    // Insert sidebar
    const wrap = document.querySelector('.wrap') || document.body;
    wrap.insertBefore(sidebar, wrap.firstChild);
    document.body.classList.add('ce-has-sidebar');

    // Hide original nav elements (moved to sidebar)
    const headerNav = document.querySelector('.commmonHeaderNavs');
    if (headerNav) headerNav.style.display = 'none';
    const myAccountDropdown = document.querySelector('.navbar-right .my-account');
    if (myAccountDropdown) myAccountDropdown.style.display = 'none';
    // Hide the original waffle menu (we'll build a cleaner app launcher)
    const waffleMenu = document.querySelector('.nav-other');
    if (waffleMenu) waffleMenu.style.display = 'none';

    // Build app launcher button in the navbar (top-right)
    createAppLauncher();

    // Collapse toggle
    const collapseBtn = sidebar.querySelector('.ce-sidebar-collapse-btn');
    collapseBtn.addEventListener('click', () => {
      const collapsed = document.body.classList.toggle('ce-sidebar-collapsed');
      collapseBtn.innerHTML = collapsed
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>';
    });

    // Active nav tracking
    function updateActiveNav() {
      const hash = window.location.hash || '#/';
      // Clear all active states
      sidebar.querySelectorAll('.ce-sidebar-subitem, .ce-sidebar-item').forEach(el => {
        el.classList.remove('active');
      });
      // Close all submenus first (accordion)
      sidebar.querySelectorAll('.ce-sidebar-submenu.open').forEach(sm => {
        sm.classList.remove('open');
        sm.closest('.ce-sidebar-group')?.querySelector('.ce-sidebar-section')?.classList.remove('open');
      });
      // Find matching subitem and open ONLY its parent section
      let matched = false;
      sidebar.querySelectorAll('.ce-sidebar-subitem').forEach(item => {
        if (!matched && item.href) {
          // Match by hash ending (strips domain/query)
          const itemHash = item.href.includes('#') ? '#' + item.href.split('#')[1] : '';
          if (itemHash && hash.startsWith(itemHash)) {
            item.classList.add('active');
            matched = true;
            const group = item.closest('.ce-sidebar-group');
            if (group) {
              group.querySelector('.ce-sidebar-submenu')?.classList.add('open');
              group.querySelector('.ce-sidebar-section')?.classList.add('open');
            }
          }
        }
      });
      // Dashboard
      const dashItem = sidebar.querySelector('.ce-sidebar-dash');
      if (dashItem) dashItem.classList.toggle('active', hash === '#/' || hash === '#');
      // Quick action items
      sidebar.querySelectorAll('.ce-sidebar-quick .ce-sidebar-item').forEach(item => {
        if (item.href) {
          const itemHash = item.href.includes('#') ? '#' + item.href.split('#')[1] : '';
          if (itemHash && hash === itemHash) item.classList.add('active');
        }
      });
    }
    updateActiveNav();
    window.addEventListener('hashchange', updateActiveNav);

    // Periodically update badge counts AND user name (Angular renders async)
    let nameResolved = userName !== 'User';
    setInterval(() => {
      const c = getCounts();
      const taskEl = document.getElementById('ce-sb-task-count');
      const notifEl = document.getElementById('ce-sb-notif-count');
      const badgeTask = document.getElementById('ce-sidebar-tasks');
      const badgeNotif = document.getElementById('ce-sidebar-notif');
      if (taskEl) taskEl.textContent = c.task || '';
      if (notifEl) notifEl.textContent = c.notif || '';
      if (badgeTask) badgeTask.textContent = c.task + ' tasks';
      if (badgeNotif) badgeNotif.textContent = c.notif + ' notif';

      // Retry user name if it was 'User' initially (Angular hadn't rendered)
      if (!nameResolved) {
        const freshName = extractUserName();
        if (freshName && freshName !== 'User') {
          userName = freshName;
          nameResolved = true;
          const nameEl = sidebar.querySelector('.ce-sidebar-user-name');
          if (nameEl) nameEl.textContent = freshName;
          const avatarEl = sidebar.querySelector('.ce-sidebar-user-avatar');
          if (avatarEl) avatarEl.textContent = freshName.charAt(0).toUpperCase();
        }
      }
    }, 2000);
  }

  /* ==========================================================
     SECTION: ICON MODERNISATION
     Replace legacy PNG icons with inline SVGs, load Font Awesome
     ========================================================== */

  function moderniseIcons() {
    // Inject Font Awesome 6 Free (CDN) for anything using .fa classes
    if (!document.getElementById('ce-fa-css')) {
      const fa = document.createElement('link');
      fa.id = 'ce-fa-css';
      fa.rel = 'stylesheet';
      fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
      fa.crossOrigin = 'anonymous';
      document.head.appendChild(fa);
    }

    // SVG icon map for replacing PNG images
    const svgIcons = {
      bell: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
      tasks: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><line x1="13" y1="6" x2="21" y2="6"/><line x1="13" y1="12" x2="21" y2="12"/><line x1="13" y1="18" x2="21" y2="18"/></svg>',
      play: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>',
      playDown: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>',
      tick: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
      cross: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      success: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="16 8 10 16 7 13"/></svg>',
      error: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      question: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      eye: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
      loading: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>',
      notMandatory: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    };

    // Map CadetNet .icon-* classes to SVG replacements
    const iconClassMap = {
      'icon-tick': svgIcons.tick,
      'icon-cross': svgIcons.cross,
      'icon-success': svgIcons.success,
      'icon-error': svgIcons.error,
      'icon-warning': svgIcons.warning,
      'icon-warning-yellow': svgIcons.warning,
      'icon-info': svgIcons.info,
      'icon-question': svgIcons.question,
      'icon-question-large': svgIcons.question,
      'icon-eye-open': svgIcons.eye,
      'icon-play': svgIcons.play,
      'icon-not-mandatory': svgIcons.notMandatory,
      'icon-exclamation': svgIcons.warning,
      'icon-alert': svgIcons.warning,
    };

    function replaceIcons() {
      // 1. Replace PNG images in count-icon divs (notifications/tasks icons)
      document.querySelectorAll('.count-icon img').forEach(img => {
        if (img.dataset.ceReplaced) return;
        img.dataset.ceReplaced = 'true';
        const src = (img.src || '').toLowerCase();
        let svg;
        if (src.includes('notif')) {
          svg = svgIcons.bell;
        } else if (src.includes('task')) {
          svg = svgIcons.tasks;
        }
        if (svg) {
          const wrapper = document.createElement('span');
          wrapper.className = 'ce-icon-replaced';
          wrapper.innerHTML = svg;
          img.replaceWith(wrapper);
        }
      });

      // 2. Replace .icon-* span elements with SVG
      Object.keys(iconClassMap).forEach(cls => {
        document.querySelectorAll('span.' + cls + ':not([data-ce-icon])').forEach(el => {
          el.dataset.ceIcon = 'true';
          el.innerHTML = iconClassMap[cls];
          el.style.display = 'inline-flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.verticalAlign = 'middle';
        });
      });

      // 3. Replace the global busy indicator GIF
      const gbi = document.getElementById('gbi');
      if (gbi && !gbi.dataset.ceReplaced) {
        gbi.dataset.ceReplaced = 'true';
        gbi.style.display = 'none';
        // We already have the skeleton system for loading, so just hide it
      }

      // 4. Replace nav-other PNG icon
      document.querySelectorAll('img[src*="icon-nav-other"]').forEach(img => {
        if (img.dataset.ceReplaced) return;
        img.dataset.ceReplaced = 'true';
        img.style.display = 'none';
      });
    }

    // Run immediately and periodically (Angular re-renders DOM)
    replaceIcons();
    setInterval(replaceIcons, 3000);
  }

  /* ==========================================================
     SECTION X+1: LOADING SCREEN
     ========================================================== */

  function showLoadingScreen() {
    const loader = document.createElement('div');
    loader.id = 'ce-loading';
    loader.innerHTML = `
      <div style="
        position: fixed; inset: 0; z-index: 999999;
        background: linear-gradient(135deg, #020617, #0f172a, #0c1929);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        font-family: 'Inter', system-ui, sans-serif;
        transition: opacity 500ms ease;
      ">
        <div style="
          width: 48px; height: 48px; border-radius: 50%;
          border: 3px solid rgba(56, 189, 248, 0.2);
          border-top-color: #38bdf8;
          animation: ce-spin 0.8s linear infinite;
        "></div>
        <div style="
          margin-top: 16px; color: #94a3b8;
          font-size: 13px; font-weight: 500;
          letter-spacing: 0.5px;
        ">Loading CadetNet Enhanced...</div>
      </div>
    `;
    document.body.appendChild(loader);

    // Add spin animation
    if (!document.getElementById('ce-spin-style')) {
      const style = document.createElement('style');
      style.id = 'ce-spin-style';
      style.textContent = '@keyframes ce-spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    // Fade out after content loads
    setTimeout(() => {
      const el = loader.firstElementChild;
      if (el) el.style.opacity = '0';
      setTimeout(() => loader.remove(), 500);
    }, 1200);
  }

  /* ==========================================================
     SECTION 16: INITIALIZATION
     ========================================================== */

  function init() {
    showLoadingScreen();
    loadSettings();
    enhanceTitle();
    enhanceNotifications();

    // DOM fixes
    fixBodyOverflow();
    watchAnnouncementWidgets();
    fixChartText();
    injectServiceColorOverrides();

    // Draggable modals
    watchForModals();

    // Admin tools
    createAdminQuickActions();

    // Sidebar navigation
    createSidebarNav();

    // Task count watcher
    watchTaskCount();

    // Icon modernisation
    moderniseIcons();

    // Click-spam guard
    installClickGuard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
