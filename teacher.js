// ===================================================
// TEACHER DASHBOARD — teacher.js
// ===================================================

let allSubmissions = [];
let currentSort = 'time';
let teacherPassword = '';

// ===== LOGIN =====
function teacherLogin() {
  const pw = document.getElementById('teacher-pw').value;
  if (!pw) { showTlError('Please enter the password.'); return; }

  if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
    showTlError('Google Sheet not connected yet. Update SCRIPT_URL in config.js first.');
    return;
  }

  teacherPassword = pw;
  document.getElementById('teacher-login').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadSubmissions();
}

function teacherLogout() {
  teacherPassword = '';
  document.getElementById('teacher-login').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('teacher-pw').value = '';
}

function showTlError(msg) {
  const el = document.getElementById('tl-error');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('teacher-login').style.display !== 'none') {
    teacherLogin();
  }
});

// ===== LOAD SUBMISSIONS FROM APPS SCRIPT =====
async function loadSubmissions() {
  const container = document.getElementById('students-container');
  container.innerHTML = '<div class="dash-loading"><div class="spinner"></div><span>Loading submissions…</span></div>';

  try {
    const url = `${CONFIG.SCRIPT_URL}?password=${encodeURIComponent(teacherPassword)}&action=read`;
    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      if (result.error === 'Unauthorized') {
        container.innerHTML = '';
        alert('Incorrect password. Please refresh and try again.');
        teacherLogout();
      } else {
        container.innerHTML = `<div class="dash-empty"><div class="dash-empty-icon">⚠️</div><p>${result.error || 'Unknown error'}</p></div>`;
      }
      return;
    }

    allSubmissions = result.submissions || [];
    renderDashboard();

  } catch (err) {
    container.innerHTML = `
      <div class="dash-empty">
        <div class="dash-empty-icon">🔌</div>
        <p>Could not connect to Google Sheet.</p>
        <p style="font-size:0.8rem;margin-top:0.5rem;color:var(--text-dim)">${err.message}</p>
      </div>`;
  }
}

// ===== RENDER =====
function renderDashboard() {
  updateStats();
  renderStudents(allSubmissions);
}

function updateStats() {
  const total = allSubmissions.length;
  const today = allSubmissions.filter(s => {
    const d = new Date(s.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const complete = allSubmissions.filter(s => s['partb-response'] && s['partb-response'].trim().length > 50).length;
  const last = allSubmissions.length
    ? new Date(allSubmissions[allSubmissions.length - 1].timestamp).toLocaleString('en-AU', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})
    : '—';

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-today').textContent = today;
  document.getElementById('stat-complete').textContent = complete;
  document.getElementById('stat-last').textContent = last;

  // Render direct Google Sheet link if configured
  const sheetLink = document.getElementById('sheet-link');
  if (CONFIG.SCRIPT_URL && CONFIG.SCRIPT_URL !== 'YOUR_APPS_SCRIPT_URL_HERE') {
    sheetLink.style.display = 'inline-flex';
  }
}

function sortBy(field) {
  currentSort = field;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`sort-${field}`).classList.add('active');
  filterStudents();
}

function filterStudents() {
  const query = document.getElementById('dash-search').value.toLowerCase();
  let filtered = allSubmissions.filter(s =>
    (s.studentName || '').toLowerCase().includes(query)
  );
  if (currentSort === 'name') {
    filtered.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
  } else {
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  renderStudents(filtered);
}

function renderStudents(submissions) {
  const container = document.getElementById('students-container');

  if (submissions.length === 0) {
    container.innerHTML = `
      <div class="dash-empty">
        <div class="dash-empty-icon">📭</div>
        <p>No submissions yet.</p>
        <p style="font-size:0.8rem;margin-top:0.5rem;color:var(--text-dim)">Students will appear here once they submit their scaffold.</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="students-grid">${submissions.map((s, i) => studentCard(s, i)).join('')}</div>`;
}

function studentCard(s, idx) {
  const name = s.studentName || 'Unknown';
  const initials = name.charAt(0).toUpperCase();
  const time = s.timestamp ? new Date(s.timestamp).toLocaleString('en-AU', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Unknown time';

  // Completion tags
  const fields = [
    { key: 'strategic-role-def', label: 'Marketing Core' },
    { key: 'ops-tech-est',       label: 'Operations Tech' },
    { key: 'ops-inter-mkt',      label: 'Interdependence' },
    { key: 'ratio-curr-ans',     label: 'Finance Ratios' },
    { key: 'hr-cascading',       label: 'HR Cascading' },
    { key: 'partb-response',     label: 'Practice Essay' }
  ];

  const tags = fields.map(f =>
    `<span class="sc-tag ${s[f.key] ? 'filled' : 'empty'}">${f.label}</span>`
  ).join('');

  return `
    <div class="student-card" id="scard-${idx}" onclick="toggleCard(${idx})">
      <div class="sc-card-header">
        <div class="sc-avatar">${initials}</div>
        <div>
          <div class="sc-name">${escHtml(name)}</div>
          <div class="sc-meta">${time} · ${s.classCode || ''}</div>
        </div>
        <div class="sc-expand-icon">▼</div>
      </div>
      <div class="sc-preview">${tags}</div>
      <div class="sc-detail" onclick="event.stopPropagation()">${renderDetail(s)}</div>
    </div>`;
}

function toggleCard(idx) {
  const card = document.getElementById(`scard-${idx}`);
  card.classList.toggle('expanded');
}

function renderDetail(s) {
  const sections = [
    {
      title: '📢 Marketing Management (RIPS)',
      fields: [
        { label: 'Role: Strategic Role', key: 'mkt-role-strategic' },
        { label: 'Influence: Choice Factors', key: 'choice-psych' },
        { label: 'Influence: Consumer Laws', key: 'law-deceptive' },
        { label: 'Influence: Ethical Influences', key: 'ethics-health' },
        { label: 'Process: SWOT & Situational', key: 'mkt-proc-swot' },
        { label: 'Process: Market Research', key: 'mkt-proc-research' },
        { label: 'Strategy: Marketing Mix (4Ps)', key: 'mkt-strat-mix' },
        { label: 'Strategy: Global Marketing', key: 'mkt-strat-global' }
      ]
    },
    {
      title: '⚙️ Operations Management (RIPS)',
      fields: [
        { label: 'Role: Hybrid Goods/Services', key: 'ops-role-hybrid' },
        { label: 'Influence: CSR & Sustainability', key: 'ops-inf-csr' },
        { label: 'Process: Transformation', key: 'ops-proc-trans' },
        { label: 'Strategy: Established Tech', key: 'ops-tech-est' },
        { label: 'Strategy: Leading-Edge Tech', key: 'ops-tech-lead' },
        { label: 'Strategy: Quality Management', key: 'ops-strat-quality' },
        { label: 'Strategy: Interdep Scenario', key: 'ops-inter-mkt' }
      ]
    },
    {
      title: '💰 Financial Management (RIPS)',
      fields: [
        { label: 'Role: Financial Objectives', key: 'fin-role-obj' },
        { label: 'Influence: Debt Financing', key: 'fin-debt' },
        { label: 'Influence: Equity Financing', key: 'fin-equity' },
        { label: 'Process: Current Ratio Calc', key: 'ratio-curr-ans' },
        { label: 'Process: Current Ratio State', key: 'ratio-curr-state' },
        { label: 'Process: Current Ratio Expl', key: 'ratio-curr-expl' },
        { label: 'Process: Gearing Ratio Calc', key: 'ratio-gear-ans' },
        { label: 'Process: Gearing Ratio State', key: 'ratio-gear-state' },
        { label: 'Process: Gearing Ratio Expl', key: 'ratio-gear-expl' },
        { label: 'Process: Gross Profit Calc', key: 'ratio-prof-ans' },
        { label: 'Process: Gross Profit State', key: 'ratio-prof-state' },
        { label: 'Process: Gross Profit Expl', key: 'ratio-prof-expl' },
        { label: 'Strategy: Working Capital & Cash', key: 'fin-strat-cash' }
      ]
    },
    {
      title: '👷 Human Resources Management (RIPSE)',
      fields: [
        { label: 'Role: Strategic HR', key: 'hr-role-strategic' },
        { label: 'Influence: Legal Framework', key: 'hr-inf-legal' },
        { label: 'Process: Acquisition Stage', key: 'hr-acquisition' },
        { label: 'Process: Development Stage', key: 'hr-development' },
        { label: 'Process: Maintenance Stage', key: 'hr-maintenance' },
        { label: 'Process: Separation Stage', key: 'hr-separation' },
        { label: 'Strategy: Leadership & Rewards', key: 'hr-strat-style' },
        { label: 'Strategy: Cascading Failure', key: 'hr-cascading' },
        { label: 'Strategy: Grievance', key: 'hr-dispute-grievance' },
        { label: 'Strategy: Mediation', key: 'hr-dispute-mediation' },
        { label: 'Strategy: Arbitration', key: 'hr-dispute-arbitration' },
        { label: 'Effectiveness: Culture & KPIs', key: 'syl-hr-eff-culture' },
        { label: 'Effectiveness: Turnover & Morale', key: 'syl-hr-eff-turnover' }
      ]
    },
    {
      title: '✍️ HSC Exam Practice Writing',
      fields: [
        { label: 'Selected Practice Question', key: 'selected-question-text' },
        { label: 'Student Response Draft', key: 'partb-response' },
        { label: 'Rubric 1 (Terminology)', key: 'rb1' },
        { label: 'Rubric 2 (Explaining Connections)', key: 'rb2' },
        { label: 'Rubric 3 (Case Study)', key: 'rb3' },
        { label: 'Rubric 4 (PEEL Structure)', key: 'rb4' }
      ]
    }
  ];

  return sections.map(sec => `
    <div class="detail-section">
      <div class="detail-section-title">${sec.title}</div>
      <div class="detail-grid">
        ${sec.fields.map(f => {
          const val = s[f.key] || '';
          return `
            <div class="detail-field">
              <div class="df-label">${f.label}</div>
              <div class="df-value ${val ? '' : 'empty'}">${val ? escHtml(val) : 'Not filled in'}</div>
            </div>`;
        }).join('')}
      </div>
    </div>
  `).join('');
}

// ===== CSV EXPORT =====
function exportCSV() {
  if (!allSubmissions.length) { alert('No submissions to export.'); return; }

  const headers = [
    'Timestamp', 'Student Name', 'Class Code',
    'Mkt Role Strategic', 'Mkt Influence Choice', 'Mkt Influence Laws', 'Mkt Influence Ethics',
    'Mkt Process SWOT', 'Mkt Process Research', 'Mkt Strategy Mix', 'Mkt Strategy Global',
    'Ops Role Hybrid', 'Ops Influence CSR', 'Ops Process Transformation',
    'Ops Strategy Established Tech', 'Ops Strategy Leading Tech', 'Ops Strategy Quality', 'Ops Strategy Interdep Scenario',
    'Fin Role Objectives', 'Fin Influence Debt', 'Fin Influence Equity',
    'Fin Process Current Ratio Calc', 'Fin Process Current Ratio State', 'Fin Process Current Ratio Expl',
    'Fin Process Gearing Ratio Calc', 'Fin Process Gearing Ratio State', 'Fin Process Gearing Ratio Expl',
    'Fin Process Gross Profit Ratio Calc', 'Fin Process Gross Profit Ratio State', 'Fin Process Gross Profit Ratio Expl',
    'Fin Strategy Cash Working Capital',
    'HR Role Strategic', 'HR Influence Legal',
    'HR Process Acquisition', 'HR Process Development', 'HR Process Maintenance', 'HR Process Separation',
    'HR Strategy Leadership Rewards', 'HR Strategy Cascading Failure',
    'HR Strategy Grievance Dispute', 'HR Strategy Mediation Dispute', 'HR Strategy Arbitration Dispute',
    'Selected Question', 'Essay Draft Response',
    'Rubric Terminology', 'Rubric Explanation', 'Rubric Case Study', 'Rubric PEEL'
  ];

  const keys = [
    'timestamp', 'studentName', 'classCode',
    'mkt-role-strategic', 'choice-psych', 'law-deceptive', 'ethics-health',
    'mkt-proc-swot', 'mkt-proc-research', 'mkt-strat-mix', 'mkt-strat-global',
    'ops-role-hybrid', 'ops-inf-csr', 'ops-proc-trans',
    'ops-tech-est', 'ops-tech-lead', 'ops-strat-quality', 'ops-inter-mkt',
    'fin-role-obj', 'fin-debt', 'fin-equity',
    'ratio-curr-ans', 'ratio-curr-state', 'ratio-curr-expl',
    'ratio-gear-ans', 'ratio-gear-state', 'ratio-gear-expl',
    'ratio-prof-ans', 'ratio-prof-state', 'ratio-prof-expl',
    'fin-strat-cash',
    'hr-role-strategic', 'hr-inf-legal',
    'hr-acquisition', 'hr-development', 'hr-maintenance', 'hr-separation',
    'hr-strat-style', 'hr-cascading',
    'hr-dispute-grievance', 'hr-dispute-mediation', 'hr-dispute-arbitration',
    'selected-question-text', 'partb-response',
    'rb1', 'rb2', 'rb3', 'rb4'
  ];

  const csvRows = [headers.join(',')];
  allSubmissions.forEach(s => {
    csvRows.push(keys.map(k => csvCell(s[k] || '')).join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `business_submissions_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(val) {
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
