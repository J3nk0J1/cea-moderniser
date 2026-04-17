/* CadetNet Enhanced - Draggable Modals */
(function () {
  'use strict';

  function makeDraggableModal(modalEl) {
    const header = modalEl.querySelector('.modalTitle, .modal-header');
    if (!header || header.dataset.ceDraggable) return;
    header.dataset.ceDraggable = 'true';

    const inner = modalEl.querySelector('.modal-inner') || modalEl.querySelector('.modal-content');
    if (!inner) return;

    inner.style.position = 'relative';
    inner.style.margin = 'auto';

    header.style.cursor = 'grab';
    header.style.userSelect = 'none';

    let isDragging = false;
    let startX, startY, origLeft, origTop;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, a, .close, .btn')) return;

      isDragging = true;
      header.style.cursor = 'grabbing';

      const rect = inner.getBoundingClientRect();

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

    processModals();
    setInterval(processModals, 2000);
  }

  CE.initModals = function () {
    watchForModals();
  };
})();
