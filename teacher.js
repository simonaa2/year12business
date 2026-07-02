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
      title: '📢 Marketing Management',
      fields: [
        { label: 'Strategic Role Explanation', key: 'strategic-role-def' },
        { label: 'Strategic Role Case Study', key: 'strategic-role-case' },
        { label: 'Psychological Factors', key: 'choice-psych' },
        { label: 'Sociocultural Factors', key: 'choice-socio' },
        { label: 'Economic Factors', key: 'choice-econ' },
        { label: 'Government Factors', key: 'choice-govt' },
        { label: 'Deceptive & Misleading Law', key: 'law-deceptive' },
        { label: 'Implied Conditions Law', key: 'law-implied' },
        { label: 'Ethics: Products & Health', key: 'ethics-health' },
        { label: 'Ethics: Sugging', key: 'ethics-sugging' }
      ]
    },
    {
      title: '⚙️ Operations Management',
      fields: [
        { label: 'O1: Goods Features', key: 'ops-hybrid-goods' },
        { label: 'O1: Service Features', key: 'ops-hybrid-services' },
        { label: 'O1: Hybrid Overlap', key: 'ops-hybrid-overlap' },
        { label: 'O2: Established Tech', key: 'ops-tech-est' },
        { label: 'O2: Leading-Edge Tech', key: 'ops-tech-lead' },
        { label: 'O3: Marketing Interdep', key: 'ops-inter-mkt' },
        { label: 'O3: Finance Interdep', key: 'ops-inter-fin' },
        { label: 'O3: HR Interdep', key: 'ops-inter-hr' }
      ]
    },
    {
      title: '💰 Financial Management',
      fields: [
        { label: 'F1: Debt Financing Pros/Cons', key: 'fin-debt' },
        { label: 'F1: Equity Financing Pros/Cons', key: 'fin-equity' },
        { label: 'F2: Current Ratio Calculation', key: 'ratio-curr-ans' },
        { label: 'F2: Current Ratio Assessment', key: 'ratio-curr-state' },
        { label: 'F2: Current Ratio Explanation', key: 'ratio-curr-expl' },
        { label: 'F2: Gearing Ratio Calculation', key: 'ratio-gear-ans' },
        { label: 'F2: Gearing Ratio Assessment', key: 'ratio-gear-state' },
        { label: 'F2: Gearing Ratio Explanation', key: 'ratio-gear-expl' },
        { label: 'F2: Gross Profit Ratio Calculation', key: 'ratio-prof-ans' },
        { label: 'F2: Gross Profit Ratio Assessment', key: 'ratio-prof-state' },
        { label: 'F2: Gross Profit Ratio Explanation', key: 'ratio-prof-expl' }
      ]
    },
    {
      title: '👷 Human Resources Management',
      fields: [
        { label: 'H1: Acquisition Stage', key: 'hr-acquisition' },
        { label: 'H1: Development Stage', key: 'hr-development' },
        { label: 'H1: Maintenance Stage', key: 'hr-maintenance' },
        { label: 'H1: Separation Stage', key: 'hr-separation' },
        { label: 'H2: Cascading Failure Scenario', key: 'hr-cascading' },
        { label: 'H3: Grievance Procedures', key: 'hr-dispute-grievance' },
        { label: 'H3: Mediation & Conciliation', key: 'hr-dispute-mediation' },
        { label: 'H3: FWC Arbitration', key: 'hr-dispute-arbitration' }
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
    'M1 Strategic Role Summary', 'M1 Strategic Role Case Study',
    'Customer Choice Psychological', 'Customer Choice Sociocultural', 'Customer Choice Economic', 'Customer Choice Government',
    'Law Deceptive Advertising', 'Law Implied Conditions',
    'Ethics Products Health', 'Ethics Sugging',
    'O1 Goods Features', 'O1 Service Features', 'O1 Hybrid Overlap',
    'O2 Established Tech', 'O2 Leading-Edge Tech',
    'O3 Marketing Interdep', 'O3 Finance Interdep', 'O3 HR Interdep',
    'F1 Debt Pros/Cons', 'F1 Equity Pros/Cons',
    'F2 Current Ratio Calc', 'F2 Current Ratio State', 'F2 Current Ratio Expl',
    'F2 Gearing Ratio Calc', 'F2 Gearing Ratio State', 'F2 Gearing Ratio Expl',
    'F2 Gross Profit Ratio Calc', 'F2 Gross Profit Ratio State', 'F2 Gross Profit Ratio Expl',
    'H1 HR Acquisition', 'H1 HR Development', 'H1 HR Maintenance', 'H1 HR Separation',
    'H2 HR Cascading Failure',
    'H3 Grievance Dispute', 'H3 Mediation Dispute', 'H3 Arbitration Dispute',
    'Selected Question', 'Essay Draft Response',
    'Rubric Terminology', 'Rubric Explanation', 'Rubric Case Study', 'Rubric PEEL'
  ];

  const keys = [
    'timestamp', 'studentName', 'classCode',
    'strategic-role-def', 'strategic-role-case',
    'choice-psych', 'choice-socio', 'choice-econ', 'choice-govt',
    'law-deceptive', 'law-implied',
    'ethics-health', 'ethics-sugging',
    'ops-hybrid-goods', 'ops-hybrid-services', 'ops-hybrid-overlap',
    'ops-tech-est', 'ops-tech-lead',
    'ops-inter-mkt', 'ops-inter-fin', 'ops-inter-hr',
    'fin-debt', 'fin-equity',
    'ratio-curr-ans', 'ratio-curr-state', 'ratio-curr-expl',
    'ratio-gear-ans', 'ratio-gear-state', 'ratio-gear-expl',
    'ratio-prof-ans', 'ratio-prof-state', 'ratio-prof-expl',
    'hr-acquisition', 'hr-development', 'hr-maintenance', 'hr-separation',
    'hr-cascading',
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
