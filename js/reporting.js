/* CadetNet Enhanced - Report Builder */
(function () {
  'use strict';

  /* === Entity Configuration === */

  const ENTITIES = {
    Member: {
      displayName: 'Members',
      searchEndpoint: '/v5/api/Member/SearchPaged',
      csvEndpoint: '/v5/api/Member/CSVExport',
      defaultColumns: ['PMKeyS', 'FirstName', 'LastName', 'RankAbbreviation', 'UnitName', 'MemberTypeName', 'StatusName'],
      filterFields: [
        { name: 'freeText', label: 'Name / PMKeyS', type: 'text' },
        { name: 'unitName', label: 'Unit', type: 'text' },
        { name: 'rankGroup', label: 'Rank Group', type: 'text' },
        { name: 'memberType', label: 'Member Type', type: 'text' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Discharged'] },
      ],
    },
    Activity: {
      displayName: 'Activities',
      searchEndpoint: '/v5/api/Activity/SearchPaged',
      csvEndpoint: '/v5/api/Activity/CSVExport',
      defaultColumns: ['Name', 'ActivityTypeName', 'StartDate', 'EndDate', 'UnitName', 'StatusName'],
      filterFields: [
        { name: 'freeText', label: 'Activity Name', type: 'text' },
        { name: 'unitName', label: 'Unit', type: 'text' },
        { name: 'activityType', label: 'Activity Type', type: 'text' },
        { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Submitted', 'Approved', 'Completed', 'Cancelled'] },
      ],
    },
    Unit: {
      displayName: 'Units',
      searchEndpoint: '/v5/api/Unit/SearchPaged',
      csvEndpoint: '/v5/api/Unit/CSVExport',
      defaultColumns: ['UnitName', 'UnitAbbreviation', 'UnitTypeName', 'ParentUnitName', 'StatusName'],
      filterFields: [
        { name: 'freeText', label: 'Unit Name', type: 'text' },
        { name: 'unitType', label: 'Unit Type', type: 'text' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
      ],
    },
    Enrolment: {
      displayName: 'Enrolments',
      searchEndpoint: '/v5/api/MemberEnrolment/SearchPaged',
      csvEndpoint: '/v5/api/MemberEnrolment/CSVExport',
      defaultColumns: ['PMKeyS', 'FirstName', 'LastName', 'UnitName', 'MemberTypeName', 'EnrolmentDate', 'StatusName'],
      filterFields: [
        { name: 'freeText', label: 'Name / PMKeyS', type: 'text' },
        { name: 'unitName', label: 'Unit', type: 'text' },
      ],
    },
    Report: {
      displayName: 'System Reports',
      searchEndpoint: '/v5/api/Report/SearchPaged',
      csvEndpoint: '/v5/api/ReportingService/CSVExportUser',
      defaultColumns: ['Name', 'Description', 'CategoryName'],
      filterFields: [
        { name: 'freeText', label: 'Report Name', type: 'text' },
      ],
    },
    Accomplishment: {
      displayName: 'Accomplishments',
      searchEndpoint: '/v5/api/Accomplishment/SearchPaged',
      csvEndpoint: '/v5/api/Accomplishment/csv',
      defaultColumns: ['Name', 'AccomplishmentGroupName', 'StatusName'],
      filterFields: [
        { name: 'freeText', label: 'Name', type: 'text' },
      ],
    },
    WorkflowInstance: {
      displayName: 'Workflow Instances',
      searchEndpoint: '/v5/api/WorkflowInstance/SearchPaged',
      csvEndpoint: '/v5/api/WorkflowInstance/CSVExport',
      defaultColumns: ['Name', 'WorkflowDefinitionName', 'StatusName', 'CreatedDate'],
      filterFields: [
        { name: 'freeText', label: 'Name', type: 'text' },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed', 'Cancelled'] },
      ],
    },
    Sponsor: {
      displayName: 'Sponsors',
      searchEndpoint: '/v5/api/Sponsor/SearchPaged',
      csvEndpoint: '/v5/api/Sponsor/CSVExport',
      defaultColumns: ['Name', 'StatusName'],
      filterFields: [
        { name: 'freeText', label: 'Name', type: 'text' },
      ],
    },
  };

  /* === State === */

  const state = {
    entity: null,
    filters: '',
    sort: '',
    results: [],
    page: 0,
    pageSize: 25,
    totalCount: 0,
    loading: false,
    error: null,
    columns: [],
    discoveredColumns: [],
    panelOpen: false,
  };

  let panelEl = null;

  /* === API Integration === */

  async function fetchSearchPaged(entity, pageIndex, pageSize, filters, sort) {
    const config = ENTITIES[entity];
    if (!config) throw new Error('Unknown entity: ' + entity);

    const response = await fetch(config.searchEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageIndex: pageIndex,
        pageSize: pageSize,
        filters: filters || '',
        sort: sort || '',
      }),
    });

    if (!response.ok) {
      throw new Error('API error: ' + response.status + ' ' + response.statusText);
    }

    const data = await response.json();

    if (data.isSuccess === false) {
      throw new Error(data.Message || 'API returned error');
    }

    return {
      items: data.DataList || data.Data || [],
      totalCount: data.TotalItemCount || 0,
      canAdd: data.CanAddItem || false,
    };
  }

  function getCSVExportUrl(entity) {
    const config = ENTITIES[entity];
    return config ? config.csvEndpoint : null;
  }

  /* === UI Rendering === */

  function createPanel() {
    if (panelEl) return panelEl;

    const panel = document.createElement('div');
    panel.id = 'ce-report-panel';
    panel.className = 'ce-report-panel';

    panel.innerHTML = `
      <div class="ce-report-header">
        <div class="ce-report-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Report Builder
        </div>
        <button class="ce-report-close" title="Close">&times;</button>
      </div>

      <div class="ce-report-body">
        <!-- Entity Selector -->
        <div class="ce-report-section">
          <label class="ce-report-label">Data Source</label>
          <select id="ce-report-entity" class="ce-report-select">
            <option value="">Select an entity...</option>
          </select>
        </div>

        <!-- Filters -->
        <div class="ce-report-section" id="ce-report-filters-section" style="display:none">
          <label class="ce-report-label">Filters</label>
          <div id="ce-report-filters"></div>
        </div>

        <!-- Page Size -->
        <div class="ce-report-section" id="ce-report-options-section" style="display:none">
          <label class="ce-report-label">Results per page</label>
          <select id="ce-report-pagesize" class="ce-report-select ce-report-select-sm">
            <option value="10">10</option>
            <option value="25" selected>25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="ce-report-section" id="ce-report-actions-section" style="display:none">
          <div class="ce-report-actions">
            <button id="ce-report-run" class="ce-report-btn ce-report-btn-primary">Run Report</button>
            <button id="ce-report-csv" class="ce-report-btn ce-report-btn-secondary">Export CSV</button>
            <button id="ce-report-copy" class="ce-report-btn ce-report-btn-secondary">Copy</button>
          </div>
        </div>

        <!-- Status -->
        <div id="ce-report-status" class="ce-report-status" style="display:none"></div>

        <!-- Results -->
        <div id="ce-report-results" class="ce-report-results" style="display:none">
          <div class="ce-report-results-info">
            <span id="ce-report-count"></span>
            <div class="ce-report-pagination">
              <button id="ce-report-prev" class="ce-report-btn ce-report-btn-sm" disabled>&laquo; Prev</button>
              <span id="ce-report-page-info"></span>
              <button id="ce-report-next" class="ce-report-btn ce-report-btn-sm">Next &raquo;</button>
            </div>
          </div>
          <div class="ce-report-table-wrap">
            <table class="ce-report-table">
              <thead id="ce-report-thead"></thead>
              <tbody id="ce-report-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Populate entity selector
    const entitySelect = panel.querySelector('#ce-report-entity');
    for (const [key, config] of Object.entries(ENTITIES)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = config.displayName;
      entitySelect.appendChild(opt);
    }

    // Wire events
    entitySelect.addEventListener('change', onEntityChange);
    panel.querySelector('.ce-report-close').addEventListener('click', closePanel);
    panel.querySelector('#ce-report-run').addEventListener('click', runReport);
    panel.querySelector('#ce-report-csv').addEventListener('click', exportCSV);
    panel.querySelector('#ce-report-copy').addEventListener('click', copyToClipboard);
    panel.querySelector('#ce-report-prev').addEventListener('click', prevPage);
    panel.querySelector('#ce-report-next').addEventListener('click', nextPage);
    panel.querySelector('#ce-report-pagesize').addEventListener('change', (e) => {
      state.pageSize = parseInt(e.target.value, 10);
      state.page = 0;
      if (state.entity) runReport();
    });

    document.body.appendChild(panel);
    panelEl = panel;
    return panel;
  }

  function onEntityChange(e) {
    const entity = e.target.value;
    state.entity = entity || null;
    state.page = 0;
    state.results = [];
    state.totalCount = 0;
    state.discoveredColumns = [];
    state.columns = [];

    const filtersSection = panelEl.querySelector('#ce-report-filters-section');
    const optionsSection = panelEl.querySelector('#ce-report-options-section');
    const actionsSection = panelEl.querySelector('#ce-report-actions-section');
    const resultsDiv = panelEl.querySelector('#ce-report-results');
    const statusDiv = panelEl.querySelector('#ce-report-status');

    if (!entity) {
      filtersSection.style.display = 'none';
      optionsSection.style.display = 'none';
      actionsSection.style.display = 'none';
      resultsDiv.style.display = 'none';
      statusDiv.style.display = 'none';
      return;
    }

    // Build filter inputs
    const config = ENTITIES[entity];
    const filtersDiv = panelEl.querySelector('#ce-report-filters');
    filtersDiv.innerHTML = '';

    config.filterFields.forEach(field => {
      const row = document.createElement('div');
      row.className = 'ce-report-filter-row';

      const label = document.createElement('label');
      label.className = 'ce-report-filter-label';
      label.textContent = field.label;
      row.appendChild(label);

      if (field.type === 'select') {
        const sel = document.createElement('select');
        sel.className = 'ce-report-select ce-report-select-sm';
        sel.dataset.filterName = field.name;
        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = 'All';
        sel.appendChild(emptyOpt);
        field.options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          sel.appendChild(o);
        });
        row.appendChild(sel);
      } else {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'ce-report-input';
        inp.dataset.filterName = field.name;
        inp.placeholder = field.label + '...';
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') runReport();
        });
        row.appendChild(inp);
      }

      filtersDiv.appendChild(row);
    });

    filtersSection.style.display = 'block';
    optionsSection.style.display = 'block';
    actionsSection.style.display = 'block';
    resultsDiv.style.display = 'none';
    statusDiv.style.display = 'none';
  }

  function collectFilters() {
    if (!panelEl) return '';
    const inputs = panelEl.querySelectorAll('[data-filter-name]');
    const parts = [];
    inputs.forEach(inp => {
      const val = inp.value.trim();
      if (val) parts.push(val);
    });
    // CadetNet's searchPaged uses a single 'filters' string (free text search)
    return parts.join(' ');
  }

  async function runReport() {
    if (!state.entity) return;

    state.loading = true;
    state.error = null;
    state.filters = collectFilters();
    showStatus('Loading...', 'info');

    try {
      const result = await fetchSearchPaged(
        state.entity,
        state.page,
        state.pageSize,
        state.filters,
        state.sort
      );

      state.results = result.items;
      state.totalCount = result.totalCount;

      // Discover columns from first result
      if (result.items.length > 0 && state.discoveredColumns.length === 0) {
        state.discoveredColumns = Object.keys(result.items[0]).filter(
          k => !k.startsWith('$') && k !== 'Id' && k !== '$$hashKey'
        );
        state.columns = ENTITIES[state.entity].defaultColumns.filter(
          c => state.discoveredColumns.includes(c)
        );
        // Add any discovered columns not in defaults
        if (state.columns.length === 0) {
          state.columns = state.discoveredColumns.slice(0, 8);
        }
      }

      renderResults();
      hideStatus();
    } catch (err) {
      state.error = err.message;
      state.results = [];
      showStatus('Error: ' + err.message, 'error');
    } finally {
      state.loading = false;
    }
  }

  function renderResults() {
    const resultsDiv = panelEl.querySelector('#ce-report-results');
    const thead = panelEl.querySelector('#ce-report-thead');
    const tbody = panelEl.querySelector('#ce-report-tbody');
    const countEl = panelEl.querySelector('#ce-report-count');
    const pageInfoEl = panelEl.querySelector('#ce-report-page-info');
    const prevBtn = panelEl.querySelector('#ce-report-prev');
    const nextBtn = panelEl.querySelector('#ce-report-next');

    if (state.results.length === 0 && state.totalCount === 0) {
      resultsDiv.style.display = 'block';
      thead.innerHTML = '';
      tbody.innerHTML = '<tr><td class="ce-report-empty">No results found</td></tr>';
      countEl.textContent = '0 results';
      pageInfoEl.textContent = '';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    // Render header
    thead.innerHTML = '<tr>' +
      state.columns.map(col => {
        const label = col.replace(/([A-Z])/g, ' $1').trim();
        return '<th class="ce-report-th" data-sort="' + CE.escapeHtml(col) + '">' +
          CE.escapeHtml(label) +
          (state.sort === col ? ' &#9650;' : state.sort === col + 'Desc' ? ' &#9660;' : '') +
          '</th>';
      }).join('') +
      '</tr>';

    // Wire sort clicks
    thead.querySelectorAll('.ce-report-th').forEach(th => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (state.sort === col) {
          state.sort = col + 'Desc';
        } else {
          state.sort = col;
        }
        state.page = 0;
        runReport();
      });
    });

    // Render rows
    tbody.innerHTML = state.results.map(row => {
      return '<tr class="ce-report-tr">' +
        state.columns.map(col => {
          let val = row[col];
          if (val === null || val === undefined) val = '';
          if (typeof val === 'object') val = JSON.stringify(val);
          // Format dates
          if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
            val = new Date(val).toLocaleDateString('en-AU');
          }
          return '<td class="ce-report-td">' + CE.escapeHtml(String(val)) + '</td>';
        }).join('') +
        '</tr>';
    }).join('');

    // Update pagination
    const totalPages = Math.ceil(state.totalCount / state.pageSize);
    const currentPage = state.page + 1;
    countEl.textContent = state.totalCount + ' result' + (state.totalCount !== 1 ? 's' : '');
    pageInfoEl.textContent = 'Page ' + currentPage + ' of ' + Math.max(1, totalPages);
    prevBtn.disabled = state.page === 0;
    nextBtn.disabled = currentPage >= totalPages;

    resultsDiv.style.display = 'block';
  }

  function prevPage() {
    if (state.page > 0) {
      state.page--;
      runReport();
    }
  }

  function nextPage() {
    const totalPages = Math.ceil(state.totalCount / state.pageSize);
    if (state.page + 1 < totalPages) {
      state.page++;
      runReport();
    }
  }

  function showStatus(message, type) {
    const statusDiv = panelEl.querySelector('#ce-report-status');
    statusDiv.textContent = message;
    statusDiv.className = 'ce-report-status ce-report-status-' + type;
    statusDiv.style.display = 'block';
  }

  function hideStatus() {
    const statusDiv = panelEl.querySelector('#ce-report-status');
    statusDiv.style.display = 'none';
  }

  /* === Export Functions === */

  function exportCSV() {
    if (!state.entity) return;

    const url = getCSVExportUrl(state.entity);
    if (!url) return;

    // Trigger download via hidden link
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 100);

    showStatus('CSV export started — check your downloads', 'info');
    setTimeout(hideStatus, 3000);
  }

  function copyToClipboard() {
    if (state.results.length === 0) {
      showStatus('No data to copy', 'error');
      setTimeout(hideStatus, 2000);
      return;
    }

    // Build TSV (tab-separated values)
    const headers = state.columns.map(col => col.replace(/([A-Z])/g, ' $1').trim());
    const rows = state.results.map(row => {
      return state.columns.map(col => {
        let val = row[col];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
          return new Date(val).toLocaleDateString('en-AU');
        }
        return String(val);
      }).join('\t');
    });

    const tsv = headers.join('\t') + '\n' + rows.join('\n');

    navigator.clipboard.writeText(tsv).then(() => {
      showStatus('Copied ' + state.results.length + ' rows to clipboard', 'info');
      setTimeout(hideStatus, 2000);
    }).catch(() => {
      showStatus('Failed to copy — try using Export CSV instead', 'error');
      setTimeout(hideStatus, 3000);
    });
  }

  /* === Panel Open/Close === */

  function openPanel() {
    const panel = createPanel();
    panel.classList.add('ce-report-panel-open');
    state.panelOpen = true;

    // Close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape' && state.panelOpen) {
        closePanel();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  function closePanel() {
    if (panelEl) {
      panelEl.classList.remove('ce-report-panel-open');
    }
    state.panelOpen = false;
  }

  /* === Expose on CE namespace === */

  CE.openReportingPanel = function () {
    if (state.panelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  };

  CE.initReporting = function () {
    // Panel is created lazily on first open — nothing to do at init
  };
})();
