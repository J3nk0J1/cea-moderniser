/* ==========================================================
   STATUS BAR, NOTIFICATION ENHANCEMENT & PAGE TITLE
   Sections 10, 12, 13 from content.js
   ========================================================== */
(function () {
  'use strict';

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
    shortcutHint.addEventListener('click', CE.openQuickNav);
    bar.appendChild(shortcutHint);

    // People search shortcut hint
    const peopleHint = document.createElement('span');
    peopleHint.className = 'ce-status-item';
    peopleHint.style.cursor = 'pointer';
    peopleHint.textContent = 'Ctrl+Shift+P: People';
    peopleHint.addEventListener('click', CE.openPeopleSearch);
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
     SECTION 12: NOTIFICATION ENHANCEMENT
     ========================================================== */

  function enhanceNotifications() {
    if (!CE.settings.enhancedNotifications) return;

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

  // Expose to CE namespace
  CE.createStatusBar = createStatusBar;
  CE.removeStatusBar = removeStatusBar;
  CE.enhanceTitle = enhanceTitle;
  CE.enhanceNotifications = enhanceNotifications;
  CE.watchTaskCount = watchTaskCount;
  CE.updateTaskCount = updateTaskCount;
  CE.updatePagePath = updatePagePath;
})();
