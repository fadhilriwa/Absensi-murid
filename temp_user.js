/* ═══════════════════════════════════════════
   USER APP — Enhanced
═══════════════════════════════════════════ */
let session   = null;
let teacher   = null;
let students  = [];
let selected  = new Set();
let todayKey  = getTodayKey();

const MONTHS   = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS     = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const DAYS_SHT = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

/* ─── Boot ───── */
window.addEventListener('DOMContentLoaded', () => {
  session = requireAuth();
  if (!session) return;

  teacher  = getTeacherById(session.teacherId);
  if (!teacher) {
    showToast('Data pengajar tidak ditemukan. Hubungi admin.', 'error');
    setTimeout(doLogout, 1500);
    return;
  }
  students = teacher.students;

  // Header
  document.getElementById('header-display-name').textContent = session.displayName;
  document.getElementById('header-teacher-name').textContent = teacher.name;
  document.getElementById('header-avatar').textContent = session.displayName.charAt(0).toUpperCase();

  if (session.role === 'admin') {
    document.getElementById('btn-admin-switch').classList.remove('hidden');
  }

  renderGreeting();
  renderQuickStats();
  renderStudentList();
  checkAlreadySubmitted();
  populateFilters();
  loadRiwayat();
  loadStatistik();
  renderProfile();
});

/* ─── Greeting ───── */
function renderGreeting() {
  const now  = new Date();
  const hour = now.getHours();
  let greeting = 'Selamat Malam!';
  if (hour >= 5 && hour < 12)  greeting = 'Selamat Pagi! ☀️';
  else if (hour >= 12 && hour < 15) greeting = 'Selamat Siang! 🌤️';
  else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore! 🌅';
  else greeting = 'Selamat Malam! 🌙';

  document.getElementById('greeting-hello').textContent = greeting;
  document.getElementById('greeting-name').textContent = session.displayName;
  document.getElementById('date-today').textContent = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById('date-day').textContent = DAYS[now.getDay()];
}

/* ─── Quick Stats ───── */
function renderQuickStats() {
  const now    = new Date();
  const month  = now.getMonth() + 1;
  const year   = now.getFullYear();
  const report = getMonthlyReport(teacher.id, year, month);

  const daysSubmitted = report.filter(r => r.submitted).length;
  const totalHadir    = report.reduce((s, r) => s + r.count, 0);
  const totalMurid    = students.length;
  const avgRate       = daysSubmitted && totalMurid
    ? Math.round(totalHadir / (daysSubmitted * totalMurid) * 100)
    : 0;

  // Streak: count consecutive days from today backwards
  const allAtt = getAttendance();
  let streak = 0;
  const d = new Date(now);
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (allAtt[key]?.[teacher.id]?.submitted) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }

  document.getElementById('user-stats').innerHTML = `
    <div class="user-stat-card">
      <div class="us-icon">🎓</div>
      <div class="us-val">${totalMurid}</div>
      <div class="us-label">Total Murid</div>
    </div>
    <div class="user-stat-card">
      <div class="us-icon">📅</div>
      <div class="us-val">${daysSubmitted}</div>
      <div class="us-label">Hari Absensi</div>
    </div>
    <div class="user-stat-card">
      <div class="us-icon">📈</div>
      <div class="us-val">${avgRate}%</div>
      <div class="us-label">Kehadiran</div>
    </div>
    <div class="user-stat-card">
      <div class="us-icon">🔥</div>
      <div class="us-val">${streak}</div>
      <div class="us-label">Hari Streak</div>
    </div>`;
}

/* ─── Tabs ───── */
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('tab-' + tab + '-btn').classList.add('active');
  if (tab === 'statistik') loadStatistik();
  if (tab === 'riwayat')   loadRiwayat();
}

/* ═══ ABSENSI ═══ */
function renderStudentList() {
  const list = document.getElementById('student-list');
  list.innerHTML = '';
  document.getElementById('count-total').textContent = students.length;
  document.getElementById('student-list-title').textContent = `Daftar Murid — ${teacher.name}`;

  students.forEach((s, idx) => {
    const name    = studentName(s);
    const kelas   = typeof s === 'object' ? (s.kelas || '') : '';
    const pelajar = typeof s === 'object' && s.pelajaran?.length ? s.pelajaran.join(', ') : '';
    const initial = name.charAt(0).toUpperCase();

    const item = document.createElement('div');
    item.className = 'student-item unchecked';
    item.id = 'student-item-' + idx;
    item.onclick = () => toggleStudent(idx);
    item.innerHTML = `
      <div class="custom-checkbox" id="cb-${idx}"></div>
      <div class="student-avatar-sm">${initial}</div>
      <div style="flex:1;min-width:0;">
        <div class="student-name">${name}</div>
        ${(kelas || pelajar) ? `<div class="student-info-small">${[kelas, pelajar].filter(Boolean).join(' · ')}</div>` : ''}
      </div>
      <div class="student-status" id="status-${idx}">Tidak Hadir</div>
    `;
    list.appendChild(item);
  });
  updateCounters();
}

function toggleStudent(idx) {
  const name     = studentName(students[idx]);
  const item     = document.getElementById('student-item-' + idx);
  const statusEl = document.getElementById('status-' + idx);
  if (selected.has(name)) {
    selected.delete(name);
    item.className = 'student-item unchecked';
    statusEl.textContent = 'Tidak Hadir';
  } else {
    selected.add(name);
    item.className = 'student-item checked';
    statusEl.textContent = 'Hadir ✓';
  }
  updateCounters();
}

function updateCounters() {
  const hadir = selected.size;
  const absen = students.length - hadir;
  document.getElementById('count-hadir').textContent = hadir;
  document.getElementById('count-absen').textContent = absen;
  document.getElementById('checked-counter').textContent = `${hadir} murid dipilih`;
}

function selectAll(state) {
  students.forEach((s, idx) => {
    const name = studentName(s);
    const item = document.getElementById('student-item-' + idx);
    const statusEl = document.getElementById('status-' + idx);
    if (state) {
      selected.add(name);
      item.className = 'student-item checked';
      statusEl.textContent = 'Hadir ✓';
    } else {
      selected.delete(name);
      item.className = 'student-item unchecked';
      statusEl.textContent = 'Tidak Hadir';
    }
  });
  updateCounters();
}

/* ─── Save ───── */
function handleSaveAttendance() {
  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.innerHTML = '⏳ Menyimpan...';

  const presentList = [...selected];
  saveAttendanceForDate(teacher.id, todayKey, presentList);

  showToast(`✅ Absensi berhasil disimpan! ${presentList.length} murid hadir.`, 'success');
  renderQuickStats();
  checkAlreadySubmitted();
}

/* ─── Re-submit ───── */
function enableResubmit() {
  const rec = getAttendanceForDate(teacher.id, todayKey);
  document.getElementById('submitted-view').classList.add('hidden');
  document.getElementById('absen-form-view').classList.remove('hidden');

  // Pre-check previously present students
  selected.clear();
  if (rec && rec.present) {
    rec.present.forEach(n => selected.add(n));
  }
  students.forEach((s, idx) => {
    const name = studentName(s);
    const item = document.getElementById('student-item-' + idx);
    const statusEl = document.getElementById('status-' + idx);
    if (selected.has(name)) {
      item.className = 'student-item checked';
      statusEl.textContent = 'Hadir ✓';
    } else {
      item.className = 'student-item unchecked';
      statusEl.textContent = 'Tidak Hadir';
    }
  });
  updateCounters();

  const btn = document.getElementById('btn-save');
  btn.disabled = false;
  btn.innerHTML = '💾 Perbarui Absensi';

  showToast('✏️ Mode edit — ubah lalu simpan ulang.', 'info');
}

/* ─── Check if already submitted ───── */
function checkAlreadySubmitted() {
  const rec = getAttendanceForDate(teacher.id, todayKey);
  if (rec && rec.submitted) {
    document.getElementById('absen-form-view').classList.add('hidden');
    document.getElementById('submitted-view').classList.remove('hidden');

    const savedAt = new Date(rec.savedAt);
    document.getElementById('submitted-time').textContent =
      `Dikirim pada ${savedAt.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })} WIB`;

    const total = students.length;
    const hadir = rec.present.length;
    document.getElementById('sv-hadir').textContent = hadir;
    document.getElementById('sv-absen').textContent = total - hadir;
    document.getElementById('sv-total').textContent = total;

    const presentDiv = document.getElementById('sv-present-list');
    const absentDiv  = document.getElementById('sv-absent-list');
    presentDiv.innerHTML = rec.present.length
      ? rec.present.map(n => `<span class="student-chip">${n}</span>`).join('')
      : '<span style="color:var(--text3);font-size:.82rem;">—</span>';
    const absentList = students.map(s => studentName(s)).filter(n => !rec.present.includes(n));
    absentDiv.innerHTML = absentList.length
      ? absentList.map(n => `<span class="student-chip absent">${n}</span>`).join('')
      : '<span style="color:var(--text3);font-size:.82rem;">Semua murid hadir! 🎉</span>';

    document.getElementById('absen-badge').innerHTML = `<span class="badge badge-green">✅ Sudah Dikirim</span>`;
  }
}

/* ═══ STATISTIK ═══ */
function loadStatistik() {
  const year    = parseInt(document.getElementById('stat-year').value);
  const month   = parseInt(document.getElementById('stat-month').value);
  const records = getMonthlyReport(teacher.id, year, month);
  const total   = students.length;

  const submitted  = records.filter(r => r.submitted).length;
  const totalHadir = records.reduce((s, r) => s + r.count, 0);
  const avgRate    = submitted && total ? Math.round(totalHadir / (submitted * total) * 100) : 0;

  // Summary cards
  document.getElementById('stat-summary-cards').innerHTML = `
    <div class="stat-mini-card">
      <div class="smc-val" style="color:var(--cyan);">${submitted}</div>
      <div class="smc-lbl">Hari Mengajar</div>
    </div>
    <div class="stat-mini-card">
      <div class="smc-val" style="color:var(--green);">${totalHadir}</div>
      <div class="smc-lbl">Total Kehadiran</div>
    </div>
    <div class="stat-mini-card">
      <div class="smc-val" style="color:var(--violet);">${avgRate}%</div>
      <div class="smc-lbl">Rata-rata Hadir</div>
    </div>
    <div class="stat-mini-card">
      <div class="smc-val" style="color:var(--pink);">${total}</div>
      <div class="smc-lbl">Total Murid</div>
    </div>`;

  // Per-student bar breakdown
  const studentStats = students.map(s => {
    const name = studentName(s);
    const present = records.filter(r => r.present.includes(name)).length;
    const pct = submitted ? Math.round(present / submitted * 100) : 0;
    return { name, present, pct, kelas: typeof s === 'object' ? (s.kelas || '') : '' };
  }).sort((a, b) => b.pct - a.pct);

  document.getElementById('stat-student-bars').innerHTML = studentStats.map(s => {
    const barColor = s.pct >= 80 ? 'var(--green)' : s.pct >= 50 ? 'var(--amber)' : 'var(--red)';
    return `
      <div class="stat-bar-item">
        <div class="stat-bar-header">
          <div class="stat-bar-name">
            <span class="stat-bar-avatar">${s.name.charAt(0)}</span>
            <div>
              <div style="font-weight:600;font-size:.85rem;">${s.name}</div>
              ${s.kelas ? `<div style="font-size:.68rem;color:var(--text3);">${s.kelas}</div>` : ''}
            </div>
          </div>
          <div class="stat-bar-val">
            <span style="font-weight:800;color:${barColor};">${s.pct}%</span>
            <span style="font-size:.72rem;color:var(--text3);">${s.present}/${submitted}</span>
          </div>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill" style="width:${s.pct}%;background:${barColor};"></div>
        </div>
      </div>`;
  }).join('');

  // Calendar heatmap
  renderCalendar(year, month, records);
}

function renderCalendar(year, month, records) {
  const cal = document.getElementById('stat-calendar');
  const firstDay  = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();

  // Build attendance map
  const attMap = {};
  records.forEach(r => {
    const d = new Date(r.date + 'T00:00:00');
    attMap[d.getDate()] = r;
  });

  let html = '<div class="cal-header">' + DAYS_SHT.map(d => `<div class="cal-day-name">${d}</div>`).join('') + '</div>';
  html += '<div class="cal-grid">';

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell cal-empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const rec = attMap[d];
    const isToday = (d === today.getDate() && month - 1 === today.getMonth() && year === today.getFullYear());
    let cls = 'cal-cell';
    let inner = d;
    if (isToday) cls += ' cal-today';
    if (rec && rec.submitted) {
      const pct = students.length ? Math.round(rec.count / students.length * 100) : 0;
      if (pct >= 80)      cls += ' cal-high';
      else if (pct >= 50) cls += ' cal-mid';
      else                cls += ' cal-low';
      inner = `<span class="cal-date">${d}</span><span class="cal-count">${rec.count}</span>`;
    } else {
      cls += ' cal-none';
    }
    html += `<div class="${cls}">${inner}</div>`;
  }
  html += '</div>';

  // Legend
  html += `<div class="cal-legend">
    <span class="cal-legend-item"><span class="cal-dot cal-dot-high"></span> ≥80%</span>
    <span class="cal-legend-item"><span class="cal-dot cal-dot-mid"></span> 50-79%</span>
    <span class="cal-legend-item"><span class="cal-dot cal-dot-low"></span> <50%</span>
    <span class="cal-legend-item"><span class="cal-dot cal-dot-none"></span> Tidak Ada</span>
  </div>`;

  cal.innerHTML = html;
}

function printStatistik() {
  const month = parseInt(document.getElementById('stat-month').value);
  const year  = parseInt(document.getElementById('stat-year').value);
  const records = getMonthlyReport(teacher.id, year, month);
  const total = students.length;
  const submitted = records.filter(r => r.submitted).length;
  const totalHadir = records.reduce((s, r) => s + r.count, 0);
  const pelajaranList = [...new Set(students.flatMap(s => typeof s === 'string' ? [] : (s.pelajaran || [])))];

  const area = document.getElementById('print-stat-area');
  const studentRows = students.map(s => {
    const name = studentName(s);
    const present = records.filter(r => r.present.includes(name)).length;
    const pct = submitted ? Math.round(present / submitted * 100) : 0;
    const kelas = typeof s === 'object' ? (s.kelas || '—') : '—';
    return `<tr><td>${name}</td><td>${kelas}</td><td>${present}</td><td>${submitted}</td><td>${pct}%</td></tr>`;
  }).join('');

  area.style.display = '';
  area.innerHTML = `
    <div class="print-header-box">
      <div class="school-name">🎵 Absensi Sanggar</div>
      <div class="report-title">Statistik Kehadiran — ${teacher.name}</div>
      <div class="report-meta">${MONTHS[month-1]} ${year} | ${total} Murid${pelajaranList.length ? ' | ' + pelajaranList.join(', ') : ''}</div>
    </div>
    <div class="print-summary-row">
      <div class="print-summary-cell"><div class="sv">${submitted}</div><div class="sl">Hari Mengajar</div></div>
      <div class="print-summary-cell"><div class="sv">${totalHadir}</div><div class="sl">Total Hadir</div></div>
      <div class="print-summary-cell"><div class="sv">${submitted && total ? Math.round(totalHadir/(submitted*total)*100) : 0}%</div><div class="sl">Rata-rata</div></div>
      <div class="print-summary-cell"><div class="sv">${total}</div><div class="sl">Total Murid</div></div>
    </div>
    <table>
      <thead><tr><th>Nama Murid</th><th>Kelas</th><th>Hadir</th><th>Hari Aktif</th><th>Persen</th></tr></thead>
      <tbody>${studentRows}</tbody>
    </table>`;

  window.print();
  setTimeout(() => { area.style.display = 'none'; }, 500);
}

/* ═══ RIWAYAT ═══ */
function populateFilters() {
  const now = new Date();
  ['riwayat-month','stat-month'].forEach(id => {
    const sel = document.getElementById(id);
    MONTHS.forEach((m, i) => {
      const opt = document.createElement('option');
      opt.value = i + 1; opt.textContent = m;
      if (i === now.getMonth()) opt.selected = true;
      sel.appendChild(opt);
    });
  });
  ['riwayat-year','stat-year'].forEach(id => {
    const sel = document.getElementById(id);
    for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      sel.appendChild(opt);
    }
  });
}

function loadRiwayat() {
  const year    = parseInt(document.getElementById('riwayat-year').value);
  const month   = parseInt(document.getElementById('riwayat-month').value);
  const records = getMonthlyReport(teacher.id, year, month);
  const container = document.getElementById('riwayat-list');
  const summary   = document.getElementById('riwayat-summary');

  // Summary
  const submitted  = records.filter(r => r.submitted).length;
  const totalHadir = records.reduce((s, r) => s + r.count, 0);
  summary.innerHTML = `
    <div class="riwayat-stat"><span class="rs-val" style="color:var(--cyan);">${submitted}</span><span class="rs-lbl">Hari Absensi</span></div>
    <div class="riwayat-stat"><span class="rs-val" style="color:var(--green);">${totalHadir}</span><span class="rs-lbl">Total Hadir</span></div>
    <div class="riwayat-stat"><span class="rs-val" style="color:var(--violet);">${submitted ? Math.round(totalHadir / submitted) : 0}</span><span class="rs-lbl">Rata-rata/Hari</span></div>`;

  if (!records.length) {
    container.innerHTML = `<div class="empty-state"><div class="icon">📭</div>Tidak ada data absensi bulan ini.</div>`;
    return;
  }

  container.innerHTML = records.map(r => {
    const d = new Date(r.date + 'T00:00:00');
    const total = students.length;
    const absentList = students.map(s => studentName(s)).filter(n => !r.present.includes(n));
    const pct = total ? Math.round(r.count / total * 100) : 0;
    return `
      <div class="history-item">
        <div class="history-date">
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="history-day-circle">${d.getDate()}</div>
            <div>
              <div style="font-weight:700;font-size:.88rem;">${DAYS[d.getDay()]}</div>
              <div style="font-size:.7rem;color:var(--text3);">${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge ${r.submitted ? 'badge-green' : 'badge-amber'}" style="font-size:.72rem;">${r.submitted ? r.count + '/' + total : '⏳'}</span>
            ${r.submitted ? `<div class="mini-progress"><div class="mini-fill" style="width:${pct}%"></div></div>` : ''}
          </div>
        </div>
        ${r.submitted ? `
          <div class="history-students">
            ${r.present.map(n => `<span class="student-chip">${n}</span>`).join('')}
            ${absentList.map(n => `<span class="student-chip absent">${n}</span>`).join('')}
          </div>` : '<div style="font-size:.8rem;color:var(--text3);padding:4px 0;">Tidak ada data</div>'}
      </div>`;
  }).join('');
}

/* ═══ PROFIL ═══ */
function renderProfile() {
  document.getElementById('profile-avatar').textContent = session.displayName.charAt(0).toUpperCase();
  document.getElementById('profile-name').textContent = session.displayName;
  document.getElementById('profile-username').textContent = session.username;
  document.getElementById('profile-total-murid').textContent = students.length;

  const classList = [...new Set(students.map(s => typeof s === 'object' ? s.kelas : '').filter(Boolean))];
  const pelajaranList = [...new Set(students.flatMap(s => typeof s === 'object' ? (s.pelajaran || []) : []))];
  document.getElementById('profile-kelas').textContent = classList.length ? classList.join(', ') : '—';
  document.getElementById('profile-pelajaran').textContent = pelajaranList.length ? pelajaranList.join(', ') : '—';

  document.getElementById('profile-murid-cards').innerHTML = students.map(s => {
    const name = studentName(s);
    const kelas = typeof s === 'object' ? (s.kelas || '') : '';
    const pelajaran = typeof s === 'object' && s.pelajaran?.length ? s.pelajaran : [];
    return `
      <div class="profile-murid-item">
        <div class="pm-avatar">${name.charAt(0)}</div>
        <div class="pm-info">
          <div class="pm-name">${name}</div>
          <div class="pm-meta">${[kelas, ...pelajaran].filter(Boolean).join(' · ') || '—'}</div>
        </div>
      </div>`;
  }).join('');
}

/* ─── Auth helpers ───── */
function doLogout()    { logout(); window.location.href = 'index.html'; }
function switchToAdmin() { window.location.href = 'admin.html'; }

/* ─── Toast ───── */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}