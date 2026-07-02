// ===================================================
// STUDENT SCAFFOLD — app.js
// ===================================================

// Guard: must be logged in
const studentName = sessionStorage.getItem('studentName');
const classCode   = sessionStorage.getItem('classCode');
if (!studentName || classCode !== CONFIG.CLASS_CODE) {
  window.location.href = 'index.html';
}

// ===== STUDENT IDENTITY =====
document.getElementById('student-name-display').textContent = studentName;
document.getElementById('student-avatar').textContent = studentName.charAt(0).toUpperCase();

// Set due date meta text
document.getElementById('due-date-meta').textContent = 'Due: ' + new Date(CONFIG.DUE_DATE).toLocaleString('en-AU', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
});
document.getElementById('footer-due-date-sub').textContent = 'Due: ' + new Date(CONFIG.DUE_DATE).toLocaleString('en-AU', {
  day: 'numeric', month: 'long', year: 'numeric'
});

// ===== COUNTDOWN =====
function updateCountdown() {
  const due  = new Date(CONFIG.DUE_DATE);
  const diff = due - new Date();
  const el   = document.getElementById('countdown');
  if (!el) return;
  if (diff <= 0) {
    el.textContent = '⏰ Due Now!';
    el.style.webkitTextFillColor = '#ef4444';
    el.style.color = '#ef4444';
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  el.textContent = `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ===== TABS =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const content = document.getElementById(`tab-content-${target}`);
    if (content) {
      content.classList.add('active');
      // Re-trigger card animations
      content.querySelectorAll('.scaffold-card').forEach(card => {
        card.style.animation = 'none';
        void card.offsetHeight;
        card.style.animation = '';
      });
    }
  });
});

// ===== LOCAL AUTO-SAVE =====
const SAVE_KEY = `bs_scaffold_${studentName.replace(/\s+/g,'_').toLowerCase()}`;

function collectAllData() {
  const data = { studentName, classCode, timestamp: new Date().toISOString() };

  // All text inputs and textareas with IDs
  document.querySelectorAll('input[type="text"][id], textarea[id]').forEach(el => {
    data[el.id] = el.value;
  });

  // Radio buttons for self-assessment rubric (rb1, rb2, rb3, rb4)
  ['rb1', 'rb2', 'rb3', 'rb4'].forEach(name => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    data[name] = checked ? checked.value : '';
  });

  // Checkboxes for checklist (chk1 - chk5)
  ['chk1', 'chk2', 'chk3', 'chk4', 'chk5'].forEach(id => {
    const el = document.getElementById(id);
    data[id] = el ? (el.checked ? 'Yes' : 'No') : 'No';
  });

  return data;
}

function restoreData(data) {
  Object.entries(data).forEach(([key, value]) => {
    const el = document.getElementById(key);
    if (el) {
      if (el.tagName === 'INPUT' && el.type === 'checkbox') {
        el.checked = (value === 'Yes');
      } else if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.type !== 'radio') {
        el.value = value;
      }
    }
  });
  // Radios for self-assessment
  ['rb1', 'rb2', 'rb3', 'rb4'].forEach(name => {
    if (data[name]) {
      const radio = document.querySelector(`input[name="${name}"][value="${data[name]}"]`);
      if (radio) radio.checked = true;
    }
  });
}

// Restore on load
try {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) restoreData(JSON.parse(saved));
} catch(e) {}

// Save on input
let saveTimer;
function triggerSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(collectAllData()));
      const ind = document.getElementById('save-indicator');
      if (ind) {
        ind.textContent = '💾 Saved ' + new Date().toLocaleTimeString('en-AU', {hour:'2-digit',minute:'2-digit'});
      }
    } catch(e) {}
  }, 600);
}

document.addEventListener('input', triggerSave);
document.addEventListener('change', triggerSave);

// ===== CHECKLIST STYLING =====
function styleCheckItem(item) {
  const cb = item.querySelector('input[type="checkbox"]');
  if (cb.checked) {
    item.style.borderColor = 'var(--green)';
    item.style.background  = 'rgba(34,197,94,0.05)';
  } else {
    item.style.borderColor = '';
    item.style.background  = '';
  }
}

document.querySelectorAll('.check-item').forEach(item => {
  item.addEventListener('change', () => setTimeout(() => styleCheckItem(item), 30));
  styleCheckItem(item);
});

// ===== SUBMISSION =====
async function submitResearch() {
  const btn = document.getElementById('submit-btn');
  const overlay = document.getElementById('submit-overlay');
  const spinner = document.getElementById('submit-spinner');
  const successEl = document.getElementById('submit-success');
  const failEl = document.getElementById('submit-fail');

  // Show overlay / spinner
  overlay.style.display = 'flex';
  spinner.style.display = 'flex';
  successEl.style.display = 'none';
  failEl.style.display = 'none';
  btn.disabled = true;

  const data = collectAllData();

  // Check if script URL is configured
  if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
    spinner.style.display = 'none';
    failEl.style.display = 'flex';
    document.getElementById('submit-fail-msg').textContent =
      'The teacher has not yet connected the Google Sheet. Please check back later or tell your teacher.';
    btn.disabled = false;
    return;
  }

  try {
    // We use text/plain content-type to avoid CORS preflight issues with Apps Script
    await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data),
    });

    // Show success (we can't read the response body in no-cors mode, so we optimistically succeed)
    spinner.style.display = 'none';
    successEl.style.display = 'flex';
    document.getElementById('submit-success-name').textContent =
      `${data.studentName} — your trial prep portfolio has been received.`;
    document.getElementById('submit-ts').textContent =
      'Submitted: ' + new Date().toLocaleString('en-AU');

    // Update submit status below button
    const status = document.getElementById('submit-status');
    if (status) {
      status.textContent = '✅ Submitted at ' + new Date().toLocaleTimeString('en-AU');
      status.style.color = 'var(--green)';
    }

    // Save last submit time
    localStorage.setItem(SAVE_KEY + '_submitted', new Date().toISOString());

  } catch (err) {
    spinner.style.display = 'none';
    failEl.style.display = 'flex';
    document.getElementById('submit-fail-msg').textContent =
      'Could not connect to the server. Make sure you have internet access. Error: ' + err.message;
  } finally {
    btn.disabled = false;
  }
}

// Show previous submission time if exists
const prevSubmit = localStorage.getItem(SAVE_KEY + '_submitted');
if (prevSubmit) {
  const status = document.getElementById('submit-status');
  if (status) {
    const d = new Date(prevSubmit);
    status.textContent = '✅ Last submitted: ' + d.toLocaleString('en-AU');
    status.style.color = 'var(--green)';
  }
}

// ===== WORD COUNT =====
const writingArea = document.getElementById('partb-response');
const wordCountEl = document.getElementById('word-count');

function updateWordCount() {
  if (!writingArea || !wordCountEl) return;
  const words = writingArea.value.trim().split(/\s+/).filter(w => w.length > 0);
  const count  = writingArea.value.trim() === '' ? 0 : words.length;
  wordCountEl.textContent = count;
  wordCountEl.style.color = count >= 150 && count <= 350
    ? 'var(--green)'
    : count > 350 ? 'var(--amber)' : 'var(--blue)';
}

if (writingArea) {
  writingArea.addEventListener('input', updateWordCount);
  updateWordCount();
}

// ===== KEY TERMS TRACKER =====
function updateTerms() {
  if (!writingArea) return;
  const text   = writingArea.value.toLowerCase();
  const chips  = document.querySelectorAll('.term-chip');
  let   found  = 0;
  const total  = chips.length;

  chips.forEach(chip => {
    const term = chip.dataset.term.toLowerCase();
    const hit  = text.includes(term);
    chip.classList.toggle('found', hit);
    if (hit) found++;
  });

  const bar   = document.getElementById('terms-bar');
  const count = document.getElementById('terms-count');
  if (bar)   bar.style.width = (found / total * 100) + '%';
  if (count) count.textContent = `${found} / ${total} terms used`;
}

if (writingArea) {
  writingArea.addEventListener('input', updateTerms);
  // Run once after data restore
  setTimeout(updateTerms, 200);
}

// ===== QUESTION SELECTOR =====
const QUESTIONS = {
  '1': 'Explain the interdependence between marketing and operations. (4 Marks)',
  '2': 'Analyse how consumer laws influence a business\'s marketing activities. (6 Marks)',
  '3': 'Assess how McDonald\'s utilizes operations strategies (such as technology) to gain a competitive advantage. (8 Marks)'
};

function selectQuestion(val) {
  // Style the options
  document.querySelectorAll('.question-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  const chosen = document.getElementById(`qopt-${val}`);
  if (chosen) chosen.classList.add('selected');

  // Show the pinned banner
  const banner = document.getElementById('selected-q-banner');
  const sqText = document.getElementById('sq-text');
  if (banner && sqText && QUESTIONS[val]) {
    sqText.textContent = QUESTIONS[val];
    banner.style.display = 'block';
  }
}

function restoreQuestion(val) {
  if (!val) return;
  const radio = document.querySelector(`input[name="selected-question"][value="${val}"]`);
  if (radio) radio.checked = true;
  selectQuestion(val);
}

// Wire up radio buttons
document.querySelectorAll('input[name="selected-question"]').forEach(radio => {
  radio.addEventListener('change', () => {
    selectQuestion(radio.value);
    triggerSave();
  });
});

// Add selected-question to collectAllData
const _origCollect = collectAllData;
collectAllData = function() {
  const data = _origCollect();
  const checked = document.querySelector('input[name="selected-question"]:checked');
  data['selected-question'] = checked ? checked.value : '';
  data['selected-question-text'] = checked ? (QUESTIONS[checked.value] || '') : '';
  return data;
};

// Restore on load (after data restore runs)
setTimeout(() => {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const d = JSON.parse(saved);
      if (d['selected-question']) restoreQuestion(d['selected-question']);
    }
  } catch(e) {}
  // Also update terms & word count after restore
  updateWordCount();
  updateTerms();
}, 300);
