/* ==========================================================
   ICON MODERNISATION
   Replaces CadetNet PNG/sprite icons with inline SVGs and
   injects Font Awesome 6 for .fa class usage.
   ========================================================== */
(function () {
  'use strict';

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

  // Expose to CE namespace
  CE.initIcons = function () { moderniseIcons(); };
})();
