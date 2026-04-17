/* CadetNet Enhanced - Sidebar Navigation */
(function () {
  'use strict';

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
      item.innerHTML = '<span>' + CE.escapeHtml(link.text) + '</span>' +
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
    searchBox.querySelector('input').addEventListener('click', () => CE.openQuickNav());
    sidebar.appendChild(searchBox);

    // User card
    const userCard = document.createElement('div');
    userCard.className = 'ce-sidebar-user';
    userCard.innerHTML =
      '<div class="ce-sidebar-user-avatar">' + userName.charAt(0).toUpperCase() + '</div>' +
      '<div class="ce-sidebar-user-info">' +
        '<div class="ce-sidebar-user-name">' + CE.escapeHtml(userName) + '</div>' +
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
      CE.navigateViaAngular(null, '#/');
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
        '<span class="ce-sidebar-section-text">' + CE.escapeHtml(section.text) + '</span>' +
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
          CE.navigateViaAngular(child.path, child.href);
        });
        submenu.appendChild(item);
      });

      header.addEventListener('click', () => {
        // In collapsed mode, navigate to section landing page
        if (document.body.classList.contains('ce-sidebar-collapsed')) {
          CE.navigateViaAngular(section.path, section.href);
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
          CE.navigateViaAngular(angularPath, link.href);
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

  CE.initSidebar = function () { createSidebarNav(); };
})();
