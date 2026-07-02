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
    { key: 'strategic-role-def', label: 'R1: Strategic Role' },
    { key: 'inter-ops',          label: 'R2: Interdependence' },
    { key: 'market-resource',    label: 'R3: Markets' },
    { key: 'choice-psych',       label: 'C1: Choice Factors' },
    { key: 'law-deceptive',      label: 'L1: Consumer Laws' },
    { key: 'ethics-truth',       label: 'L2: Ethics' },
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
      title: '📢 Role of Marketing',
      fields: [
        { label: 'Strategic Role Explanation', key: 'strategic-role-def' },
        { label: 'Strategic Role Case Study', key: 'strategic-role-case' },
        { label: 'Interdependence: Operations', key: 'inter-ops' },
        { label: 'Interdependence: Finance', key: 'inter-fin' },
        { label: 'Interdependence: HR', key: 'inter-hr' },
        { label: 'Resource Market', key: 'market-resource' },
        { label: 'Industrial Market', key: 'market-industrial' },
        { label: 'Intermediate Market', key: 'market-intermediate' },
        { label: 'Consumer Market', key: 'market-consumer' },
        { label: 'Mass Market', key: 'market-mass' },
        { label: 'Niche Market', key: 'market-niche' }
      ]
    },
    {
      title: '🧠 Customer Choice Factors',
      fields: [
        { label: 'Psychological Factors', key: 'choice-psych' },
        { label: 'Psychological Example', key: 'choice-psych-ex' },
        { label: 'Sociocultural Factors', key: 'choice-socio' },
        { label: 'Sociocultural Example', key: 'choice-socio-ex' },
        { label: 'Economic Factors', key: 'choice-econ' },
        { label: 'Economic Example', key: 'choice-econ-ex' },
        { label: 'Government Factors', key: 'choice-govt' },
        { label: 'Government Example', key: 'choice-govt-ex' }
      ]
    },
    {
      title: '⚖️ Consumer Laws & Ethical Influences',
      fields: [
        { label: 'Deceptive & Misleading', key: 'law-deceptive' },
        { label: 'Price Discrimination', key: 'law-discrimination' },
        { label: 'Implied Conditions', key: 'law-implied' },
        { label: 'Warranties', key: 'law-warranties' },
        { label: 'Ethics: Truth & Accuracy', key: 'ethics-truth' },
        { label: 'Ethics: Good Taste', key: 'ethics-taste' },
        { label: 'Ethics: Products & Health', key: 'ethics-health' },
        { label: 'Ethics: Fair Competition', key: 'ethics-competition' },
        { label: 'Ethics: Sugging', key: 'ethics-sugging' }
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
    'Strategic Role Summary', 'Strategic Role Case Study',
    'Interdependence Ops', 'Interdependence Fin', 'Interdependence HR',
    'Resource Market', 'Industrial Market', 'Intermediate Market', 'Consumer Market', 'Mass Market', 'Niche Market',
    'Psychological Choice', 'Psychological Example',
    'Sociocultural Choice', 'Sociocultural Example',
    'Economic Choice', 'Economic Example',
    'Government Choice', 'Government Example',
    'Deceptive Advertising Law', 'Price Discrimination Law', 'Implied Conditions Law', 'Warranties Law',
    'Ethics Truth Accuracy', 'Ethics Good Taste', 'Ethics Health', 'Ethics Competition', 'Ethics Sugging',
    'Selected Question', 'Essay Draft Response',
    'Rubric Terminology', 'Rubric Explanation', 'Rubric Case Study', 'Rubric PEEL'
  ];

  const keys = [
    'timestamp', 'studentName', 'classCode',
    'strategic-role-def', 'strategic-role-case',
    'inter-ops', 'inter-fin', 'inter-hr',
    'market-resource', 'market-industrial', 'market-intermediate', 'market-consumer', 'market-mass', 'market-niche',
    'choice-psych', 'choice-psych-ex',
    'choice-socio', 'choice-socio-ex',
    'choice-econ', 'choice-econ-ex',
    'choice-govt', 'choice-govt-ex',
    'law-deceptive', 'law-discrimination', 'law-implied', 'law-warranties',
    'ethics-truth', 'ethics-taste', 'ethics-health', 'ethics-competition', 'ethics-sugging',
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
