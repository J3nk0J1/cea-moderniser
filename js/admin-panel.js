/* CadetNet Enhanced - Admin Quick Actions Panel */
(function () {
  'use strict';

  function createAdminQuickActions() {
    if (document.getElementById('ce-admin-fab')) return;

    const ACTIONS = [
      { label: 'People Search', hash: '#/people/member' },
      { label: 'Applications', hash: '#/people/application' },
      { label: 'My Tasks', hash: '#/my-tasks' },
      { label: 'My Notifications', hash: '#/my-notifications' },
      { label: 'Reports', hash: '#/reports' },
      { label: 'Report Builder', action: () => CE.openReportingPanel?.() },
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
      if (action.hash) {
        item.href = action.hash;
      } else {
        item.href = '#';
      }
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
      item.addEventListener('click', (e) => {
        if (action.action) {
          e.preventDefault();
          action.action();
        }
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

  CE.initAdminPanel = function () {
    createAdminQuickActions();
  };
})();
