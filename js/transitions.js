/* ==========================================================
   SPA NAVIGATION TRANSITIONS & LOADING SCREEN
   Section 14 + Loading Screen from content.js
   ========================================================== */
(function () {
  'use strict';

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
          <span>Loading ${CE.escapeHtml(label)}</span>
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
    CE.enhanceTitle();
    const pagePath = document.getElementById('ce-status-page');
    if (pagePath) CE.updatePagePath(pagePath);

    // Show skeleton transition
    showNavTransition(window.location.hash);
  });

  /* ==========================================================
     LOADING SCREEN
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

  // Expose to CE namespace
  CE.showLoadingScreen = showLoadingScreen;
  CE.installClickGuard = installClickGuard;
  CE.showNavTransition = showNavTransition;
  CE.dismissNavTransition = dismissNavTransition;
})();
