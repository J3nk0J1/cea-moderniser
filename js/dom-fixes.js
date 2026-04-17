/* CadetNet Enhanced - DOM Fixes */
(function () {
  'use strict';

  /* Body overflow fix - CadetNet sets overflow:hidden on body inline */
  function fixBodyOverflow() {
    function updateOverflow() {
      const hasModal = document.querySelector('.modal.in, .modal-backdrop');
      if (!hasModal && document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
      }
    }
    updateOverflow();
    setInterval(updateOverflow, 1000);
  }

  /* Announcement inline style fix */
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

    if (color) {
      const colorNorm = color.trim();
      if (DARK_TEXT_REGEX.test(colorNorm)) {
        style.color = '#cbd5e1';
      }
    }

    const tag = el.tagName;
    if (tag === 'STRONG' || tag === 'B' || (style.fontWeight && parseInt(style.fontWeight) >= 600)) {
      if (!style.color || DARK_TEXT_REGEX.test(style.color.trim())) {
        style.color = '#e2e8f0';
      }
    }

    if (tag === 'A') {
      style.color = '#38bdf8';
    }

    if (style.borderColor) {
      const bc = style.borderColor.trim().toLowerCase();
      if (bc.includes('#e') || bc.includes('#d') || bc.includes('#c') || bc.includes('rgb(2')) {
        style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }
    }

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

    let announcementTimer = null;
    function scheduleProcess() {
      if (announcementTimer) return;
      announcementTimer = setTimeout(() => {
        announcementTimer = null;
        processAnnouncements();
      }, 500);
    }

    setTimeout(processAnnouncements, 1000);
    setTimeout(processAnnouncements, 3000);

    const contentArea = document.getElementById('ui-view-index-html');
    if (contentArea) {
      const obs = new MutationObserver(scheduleProcess);
      obs.observe(contentArea, { childList: true, subtree: true });
    }
  }

  /* SVG chart text fix */
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

    setTimeout(applyChartFixes, 1000);
    setTimeout(applyChartFixes, 3000);
    setTimeout(applyChartFixes, 6000);
  }

  /* AAC service color override */
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

    document.head.appendChild(style);

    setTimeout(() => {
      const navHeader = document.querySelector('.navbar-header[style]');
      if (navHeader) navHeader.setAttribute('style', '');
      const logo = document.querySelector('img.logo[style*="z-index:-1"]');
      if (logo) logo.style.zIndex = '1';
      const commonNavs = document.querySelector('.commmonHeaderNavs[style]');
      if (commonNavs) commonNavs.setAttribute('style', '');
    }, 100);
  }

  CE.initDomFixes = function () {
    fixBodyOverflow();
    watchAnnouncementWidgets();
    fixChartText();
    injectServiceColorOverrides();
  };
})();
