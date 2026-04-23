
/* ════════════════════════════════════════
   ADMIN APP LOGIC
   ════════════════════════════════════════ */
let session = null;

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

// ── Boot ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  session = requireAuth('admin');
  if (!session) return;

  document.getElementById('header-name').textContent = session.displayName;
  document.getElementById('header-avatar').textContent = session.displayName.charAt(0).toUpperCase();

  if (session.teacherId) {
    document.getElementById('btn-user-switch').classList.remove('hidden');
  }

  initDashboard();
  initMonitoring();
  initRekap();
  initPengajar();
  initMurid();
  initAkun();
  initGaji();

  navTo('dashboard');
});

// ── Navigation ────────────────────────────────────────────────
function navTo(page) {
  document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('nav-' + page).classList.add('active');

  if (page === 'dashboard')  refreshDashboard();
  if (page === 'monitoring') refreshMonitoring();
  if (page === 'pengajar')   refreshPengajarTable();
  if (page === 'murid')      refreshMuridSelects();
  if (page === 'akun')       refreshAkunTable();
  if (page === 'rekap')      loadRekap();
  if (page === 'gaji')       loadGaji();
}

// ── Auth ──────────────────────────────────────────────────────
function doLogout()   { logout(); window.location.href = 'index.html'; }
function switchToUser() { window.location.href = 'user.html'; }

// ── Modals ────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

window.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

function showConfirm(message, onOk) {
  document.getElementById('confirm-text').textContent = message;
  const btn = document.getElementById('confirm-ok-btn');
  btn.onclick = () => { onOk(); closeModal('modal-confirm'); };
  openModal('modal-confirm');
}

// ── Toast ────────────────────────────────────────────────────
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

/* ════════════════════
   DASHBOARD
════════════════════ */
function initDashboard() {
  const now = new Date();
  document.getElementById('dash-date-big').textContent = DAYS[now.getDay()];
  document.getElementById('dash-date-sub').textContent = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById('dash-today-badge').textContent = `${now.getDate()} ${MONTHS[now.getMonth()]}`;
  document.getElementById('admin-greeting-name').textContent = session ? session.displayName : 'Administrator';
  refreshDashboard();
}

function refreshDashboard() {
  const teachers  = getTeachers();
  const todayKey  = getTodayKey();
  const all       = getAttendance();
  const todayData = all[todayKey] || {};

  const totalTeachers = teachers.length;
  const totalStudents = teachers.reduce((s, t) => s + t.students.length, 0);
  const submitted     = Object.keys(todayData).length;
  const totalHadir    = Object.values(todayData).reduce((s, r) => s + (r.present?.length || 0), 0);

  renderDashboardChart();

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card stat-pink">
      <div class="stat-icon">👩‍🏫</div>
      <div class="stat-value">${totalTeachers}</div>
      <div class="stat-label">Total Pengajar</div>
    </div>
    <div class="stat-card stat-violet">
      <div class="stat-icon">🎓</div>
      <div class="stat-value">${totalStudents}</div>
      <div class="stat-label">Total Murid</div>
    </div>
    <div class="stat-card stat-cyan">
      <div class="stat-icon">✅</div>
      <div class="stat-value">${submitted}/${totalTeachers}</div>
      <div class="stat-label">Absen Dikirim Hari Ini</div>
    </div>
    <div class="stat-card stat-green">
      <div class="stat-icon">📋</div>
      <div class="stat-value">${totalHadir}</div>
      <div class="stat-label">Murid Hadir Hari Ini</div>
    </div>`;

  document.getElementById('dash-today-badge').textContent = `${submitted} dari ${totalTeachers} pengajar`;

  const cards = document.getElementById('teacher-cards-today');
  cards.innerHTML = teachers.map(t => {
    const rec    = todayData[t.id];
    const total  = t.students.length;
    const hadir  = rec ? rec.present.length : 0;
    const pct    = total ? Math.round(hadir / total * 100) : 0;
    const status = rec
      ? `<span class="badge badge-green">✅ Terkirim</span>`
      : `<span class="badge badge-amber">⏳ Belum</span>`;
    return `
      <div class="teacher-card">
        <div class="teacher-card-header">
          <div class="teacher-avatar">${t.name.charAt(0)}</div>
          <div>
            <div class="teacher-name">${t.name}</div>
            <div class="teacher-meta">${total} murid</div>
          </div>
        </div>
        <div class="teacher-stats">
          <div class="teacher-stat">
            <div class="val" style="color:var(--green);">${hadir}</div>
            <div class="lbl">Hadir</div>
          </div>
          <div class="teacher-stat">
            <div class="val" style="color:var(--red);">${total - hadir}</div>
            <div class="lbl">Absen</div>
          </div>
          <div class="teacher-stat">
            <div class="val" style="color:var(--violet);">${pct}%</div>
            <div class="lbl">Kehadiran</div>
          </div>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between;">
          ${status}
          <button class="btn btn-secondary btn-sm" onclick="openDetailModal('${t.id}')">👁️ Detail</button>
        </div>
      </div>`;
  }).join('');
}

let dashChart = null;

function renderDashboardChart() {
  const all = getAttendance();
  const teachers = getTeachers();
  const labels = [];
  const hadirData = [];
  const now = new Date();

  // Ambil 7 hari terakhir
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    // label hari/tanggal
    const shortLabel = `${DAYS[d.getDay()].substring(0,3)}, ${d.getDate()} ${MONTHS[d.getMonth()].substring(0,3)}`;
    labels.push(shortLabel);

    // Hitung total hadir pada hari terpilih ini dari semua guru
    const dayData = all[dateKey] || {};
    const totalHadir = Object.values(dayData).reduce((sum, rec) => sum + (rec.present?.length || 0), 0);
    hadirData.push(totalHadir);
  }

  const ctx = document.getElementById('attendanceChart').getContext('2d');
  
  // Format warna sesuai tema
  const violetColor = getComputedStyle(document.documentElement).getPropertyValue('--violet').trim() || '#a78bfa';
  const pinkColor   = getComputedStyle(document.documentElement).getPropertyValue('--pink').trim() || '#f472b6';
  
  if (dashChart) dashChart.destroy();
  
  // Create gradient
  let gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, `rgba(167, 139, 250, 0.4)`); // Violet yang diatur opacitynya
  gradient.addColorStop(1, `rgba(167, 139, 250, 0.0)`);

  dashChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Murid Hadir',
        data: hadirData,
        backgroundColor: gradient,
        borderColor: violetColor,
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: pinkColor,
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1f2937',
          padding: 12,
          titleFont: { family: "'Poppins', sans-serif", size: 13 },
          bodyFont: { family: "'Poppins', sans-serif", size: 14 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
          ticks: { font: { family: "'Poppins', sans-serif", size: 11 }, stepSize: 1 }
        },
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { font: { family: "'Poppins', sans-serif", size: 11 } }
        }
      }
    }
  });
}

/* ════════════════════
   MONITORING
════════════════════ */
function initMonitoring() {
  const now = new Date();
  document.getElementById('monitor-date-badge').textContent =
    `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

function refreshMonitoring() {
  const teachers  = getTeachers();
  const todayKey  = getTodayKey();
  const todayData = (getAttendance())[todayKey] || {};
  const tbody     = document.getElementById('monitor-tbody');

  tbody.innerHTML = teachers.map((t, i) => {
    const rec    = todayData[t.id];
    const total  = t.students.length;
    const hadir  = rec ? rec.present.length : 0;
    const status = rec
      ? `<span class="badge badge-green">✅ Terkirim</span>`
      : `<span class="badge badge-amber">⏳ Belum Kirim</span>`;
    return `
      <tr id="mrow-${t.id}">
        <td>${i + 1}</td>
        <td><strong>${t.name}</strong></td>
        <td>${total}</td>
        <td><span style="color:var(--green);font-weight:700;">${hadir}</span></td>
        <td><span style="color:var(--red);font-weight:700;">${total - hadir}</span></td>
        <td>${status}</td>
        <td class="no-print"><button class="btn btn-secondary btn-sm" onclick="openDetailModal('${t.id}')">👁️ Detail</button></td>
      </tr>`;
  }).join('');
}

function filterMonitorTable() {
  const q = document.getElementById('monitor-search').value.toLowerCase();
  document.querySelectorAll('#monitor-tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function openDetailModal(teacherId) {
  const t       = getTeacherById(teacherId);
  const rec     = getAttendanceForDate(teacherId, getTodayKey());
  const present = rec ? rec.present : [];
  const names   = t.students.map(s => studentName(s));
  const absent  = names.filter(n => !present.includes(n));

  document.getElementById('modal-detail-title').textContent = `Detail — ${t.name}`;
  document.getElementById('modal-detail-body').innerHTML = `
    <div style="margin-bottom:16px;">
      <div style="font-size:.75rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">✅ Hadir (${present.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;min-height:28px;">
        ${present.length
          ? present.map(n => `<span class="student-chip">${n}</span>`).join('')
          : '<span style="color:var(--text3);font-size:.82rem;">Belum ada data</span>'}
      </div>
    </div>
    <div>
      <div style="font-size:.75rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">❌ Tidak Hadir (${absent.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;min-height:28px;">
        ${absent.length
          ? absent.map(n => `<span class="student-chip absent">${n}</span>`).join('')
          : '<span style="color:var(--text3);font-size:.82rem;">Semua murid hadir!</span>'}
      </div>
    </div>
    ${rec ? `<div style="margin-top:16px;font-size:.78rem;color:var(--text3);">📅 Dikirim: ${new Date(rec.savedAt).toLocaleString('id-ID')}</div>` : ''}`;
  openModal('modal-detail');
}

/* ════════════════════
   REKAP BULANAN
════════════════════ */
function initRekap() {
  const now  = new Date();
  const tSel = document.getElementById('rekap-teacher');
  const mSel = document.getElementById('rekap-month');
  const ySel = document.getElementById('rekap-year');

  tSel.innerHTML = '<option value="ALL">— Semua Pengajar —</option>' +
    getTeachers().map(t => `<option value="${t.id}">${t.name}</option>`).join('');

  MONTHS.forEach((m, i) => {
    const o = document.createElement('option');
    o.value = i + 1; o.textContent = m;
    if (i === now.getMonth()) o.selected = true;
    mSel.appendChild(o);
  });

  for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) {
    const o = document.createElement('option'); o.value = y; o.textContent = y;
    ySel.appendChild(o);
  }

  loadRekap();
}

function loadRekap() {
  const teacherId = document.getElementById('rekap-teacher').value;
  const month     = parseInt(document.getElementById('rekap-month').value);
  const year      = parseInt(document.getElementById('rekap-year').value);

  const monthName = MONTHS[month - 1];
  document.getElementById('print-subtitle-text').textContent = `${monthName} ${year}`;

  if (teacherId === 'ALL') {
    loadRekapAll(year, month, monthName);
  } else {
    loadRekapSingle(teacherId, year, month, monthName);
  }
}

function loadRekapSingle(teacherId, year, month, monthName) {
  const t          = getTeacherById(teacherId);
  const records    = getMonthlyReport(teacherId, year, month);
  const total      = t.students.length;
  const submitted  = records.filter(r => r.submitted).length;
  const totalHadir = records.reduce((s, r) => s + r.count, 0);
  const avgHadir   = submitted ? Math.round(totalHadir / submitted) : 0;

  document.getElementById('print-title-text').textContent = `Rekap Absensi — ${t.name}`;
  document.getElementById('print-subtitle-text').textContent = `${monthName} ${year}`;

  // Stat cards
  document.getElementById('rekap-summary').innerHTML = `
    <div class="rekap-summary-card">
      <div class="rv" style="color:var(--cyan);">${submitted}</div>
      <div class="rl">Hari Absensi</div>
    </div>
    <div class="rekap-summary-card">
      <div class="rv" style="color:var(--green);">${totalHadir}</div>
      <div class="rl">Total Hadir</div>
    </div>
    <div class="rekap-summary-card">
      <div class="rv" style="color:var(--pink);">${total}</div>
      <div class="rl">Total Murid</div>
    </div>`;

  // Hide ALL-mode cards, show single table
  document.getElementById('rekap-cards-screen').innerHTML = '';
  const wrap = document.getElementById('rekap-screen-table-wrap');
  wrap.style.display = '';

  // Wire up the per-teacher print button
  const printBtn = document.getElementById('rekap-single-print-btn');
  printBtn.onclick = () => printOneTeacher(teacherId);

  // Screen table header
  document.getElementById('rekap-table-title').textContent = `${t.name} | ${monthName} ${year}`;
  document.querySelector('#rekap-detail-table thead tr').innerHTML =
    `<th>Tanggal</th><th>Hari</th><th>Murid Hadir</th><th>Jumlah Hadir</th><th>Status</th>`;

  document.getElementById('rekap-tbody').innerHTML = records.length
    ? records.map(r => {
        const d = new Date(r.date + 'T00:00:00');
        return `
          <tr>
            <td>${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</td>
            <td>${DAYS[d.getDay()]}</td>
            <td style="font-size:.8rem;">${r.present.join(', ') || '—'}</td>
            <td><strong>${r.count}</strong> / ${total}</td>
            <td><span class="badge ${r.submitted ? 'badge-green' : 'badge-amber'}">${r.submitted ? '✅ Ada' : '—'}</span></td>
          </tr>`;
      }).join('')
    : `<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:32px;">Tidak ada data bulan ini.</td></tr>`;

  // Build print sections
  buildPrintArea([{ teacher: t, records, totalPresent: totalHadir, daysSubmitted: submitted }], monthName, year);
}

function loadRekapAll(year, month, monthName) {
  const reports    = getAllTeachersMonthlyReport(year, month);
  const totalHadir = reports.reduce((s, r) => s + r.totalPresent, 0);
  const totalDays  = reports.reduce((s, r) => s + r.daysSubmitted, 0);

  document.getElementById('print-title-text').textContent = 'Rekap Absensi Semua Pengajar';
  document.getElementById('print-subtitle-text').textContent = `${monthName} ${year}`;

  // Stat cards
  document.getElementById('rekap-summary').innerHTML = `
    <div class="rekap-summary-card">
      <div class="rv" style="color:var(--cyan);">${reports.length}</div>
      <div class="rl">Total Pengajar</div>
    </div>
    <div class="rekap-summary-card">
      <div class="rv" style="color:var(--green);">${totalHadir}</div>
      <div class="rl">Total Hadir (Semua)</div>
    </div>
    <div class="rekap-summary-card">
      <div class="rv" style="color:var(--violet);">${totalDays}</div>
      <div class="rl">Total Hari Absensi</div>
    </div>`;

  // Hide single table; show per-teacher cards
  document.getElementById('rekap-screen-table-wrap').style.display = 'none';

  // Render clickable teacher rekap cards
  const cardsEl = document.getElementById('rekap-cards-screen');
  cardsEl.innerHTML = reports.map(r => {
    const t   = r.teacher;
    const avg = r.daysSubmitted ? Math.round(r.totalPresent / r.daysSubmitted) : 0;
    const pct = t.students.length ? Math.round(r.totalPresent / (t.students.length * Math.max(r.daysSubmitted, 1)) * 100) : 0;
    const pelajaranList = [...new Set(t.students.flatMap(s => typeof s === 'string' ? [] : (s.pelajaran || [])))];
    return `
      <div class="rekap-teacher-card">
        <div class="rekap-tc-header">
          <div class="rekap-tc-avatar">${t.name.charAt(0)}</div>
          <div class="rekap-tc-info">
            <div class="rekap-tc-name">${t.name}</div>
            <div class="rekap-tc-sub">${t.students.length} murid${pelajaranList.length ? ' · ' + pelajaranList.slice(0,3).join(', ') + (pelajaranList.length > 3 ? '…' : '') : ''}</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="printOneTeacher('${t.id}')">🖨️ Cetak PDF</button>
        </div>
        <div class="rekap-tc-stats">
          <div class="rekap-tc-stat">
            <div class="rv" style="color:var(--cyan);">${r.daysSubmitted}</div>
            <div class="rl">Hari Absensi</div>
          </div>
          <div class="rekap-tc-stat">
            <div class="rv" style="color:var(--green);">${r.totalPresent}</div>
            <div class="rl">Total Hadir</div>
          </div>
          <div class="rekap-tc-stat">
            <div class="rv" style="color:var(--violet);">${avg}</div>
            <div class="rl">Rata-rata/Hari</div>
          </div>
        </div>
        <div class="progress-bar" style="margin-top:10px;"><div class="progress-fill" style="width:${Math.min(pct,100)}%"></div></div>
        <div style="font-size:.72rem;color:var(--text3);margin-top:6px;">${r.daysSubmitted > 0 ? `<span class="badge badge-green" style="font-size:.68rem;">✅ Ada Data</span>` : `<span class="badge badge-amber" style="font-size:.68rem;">— Belum Ada Data</span>`}</div>
      </div>`;
  }).join('');

  // Build print sections for all teachers
  buildPrintArea(reports, monthName, year);
}

// Build hidden per-teacher print blocks tagged with data-teacher-id
function buildPrintArea(reports, monthName, year) {
  const area = document.getElementById('rekap-print-area');
  area.innerHTML = reports.map(r => {
    const t    = r.teacher;
    const total = t.students.length;
    const pelajaranList = [...new Set(t.students.flatMap(s => (typeof s === 'string' ? [] : (s.pelajaran || []))))];

    const rows = r.records.length
      ? r.records.map(rec => {
          const d = new Date(rec.date + 'T00:00:00');
          return `
            <tr>
              <td>${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</td>
              <td>${DAYS[d.getDay()]}</td>
              <td style="font-size:.75rem;">${rec.present.join(', ') || '—'}</td>
              <td style="text-align:center;">${rec.count} / ${total}</td>
              <td style="text-align:center;">${rec.submitted ? '✅' : '—'}</td>
            </tr>`;
        }).join('')
      : `<tr><td colspan="5" style="text-align:center;padding:14px;color:#999;">Tidak ada data bulan ini.</td></tr>`;

    return `
      <div class="print-teacher-section print-only" data-teacher-id="${t.id}">
        <div class="print-teacher-header">
          <span class="tn">👩‍🏫 ${t.name}</span>
          <span class="ts">${monthName} ${year} &nbsp;|&nbsp; ${total} Murid${pelajaranList.length ? ' &nbsp;|&nbsp; ' + pelajaranList.join(', ') : ''}</span>
        </div>
        <div class="print-summary-row">
          <div class="print-summary-cell">
            <div class="sv">${r.daysSubmitted}</div>
            <div class="sl">Hari Absensi</div>
          </div>
          <div class="print-summary-cell">
            <div class="sv">${r.totalPresent}</div>
            <div class="sl">Total Kehadiran</div>
          </div>
          <div class="print-summary-cell">
            <div class="sv">${r.daysSubmitted ? Math.round(r.totalPresent / r.daysSubmitted) : 0}</div>
            <div class="sl">Rata-rata/Hari</div>
          </div>
          <div class="print-summary-cell">
            <div class="sv">${total}</div>
            <div class="sl">Total Murid</div>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Tanggal</th><th>Hari</th><th>Murid Hadir</th><th>Jumlah</th><th>Status</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }).join('');
}

// Print only one teacher's section — inject dynamic CSS for selective print
function printOneTeacher(teacherId) {
  // Inject a one-time <style> that hides all teacher sections except the target
  const styleId = 'dynamic-print-style';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    @media print {
      .print-teacher-section { display: none !important; }
      .print-teacher-section[data-teacher-id="${teacherId}"] { display: block !important; }
    }
  `;
  window.print();
  // Clean up after print dialog closes
  setTimeout(() => { styleEl.textContent = ''; }, 500);
}

/* ════════════════════
   KELOLA PENGAJAR
════════════════════ */
function initPengajar() { /* loaded on navTo */ }

function refreshPengajarTable() {
  const teachers = getTeachers();
  const tbody = document.getElementById('pengajar-tbody');
  tbody.innerHTML = teachers.length ? teachers.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${t.name}</strong></td>
      <td><span class="badge badge-violet">${t.students.length} murid</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm" onclick="openEditTeacherModal('${t.id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTeacherAction('${t.id}')">🗑️</button>
        </div>
      </td>
    </tr>`).join('')
  : `<tr><td colspan="4"><div class="empty-state"><div class="icon">👩‍🏫</div>Belum ada pengajar terdaftar.</div></td></tr>`;
}

function openAddTeacherModal() {
  document.getElementById('modal-teacher-title').textContent = 'Tambah Pengajar';
  document.getElementById('teacher-name-input').value = '';
  document.getElementById('teacher-edit-id').value = '';
  openModal('modal-teacher');
}

function openEditTeacherModal(id) {
  const t = getTeacherById(id);
  document.getElementById('modal-teacher-title').textContent = 'Edit Pengajar';
  document.getElementById('teacher-name-input').value = t.name;
  document.getElementById('teacher-edit-id').value = id;
  openModal('modal-teacher');
}

function saveTeacherAction() {
  const name   = document.getElementById('teacher-name-input').value.trim();
  const editId = document.getElementById('teacher-edit-id').value;
  if (!name) { showToast('Nama pengajar tidak boleh kosong.', 'error'); return; }

  if (editId) {
    const res = updateTeacher(editId, name);
    if (res.error) { showToast(res.error, 'error'); return; }
    showToast('✅ Data pengajar diperbarui!', 'success');
  } else {
    const res = addTeacher(name);
    if (res.error) { showToast(res.error, 'error'); return; }
    showToast('✅ Pengajar baru ditambahkan!', 'success');
  }
  closeModal('modal-teacher');
  refreshPengajarTable();
  refreshMuridSelects();
}

function deleteTeacherAction(id) {
  const t = getTeacherById(id);
  showConfirm(`Yakin hapus pengajar "${t.name}" beserta semua datanya?`, () => {
    deleteTeacher(id);
    showToast('🗑️ Pengajar dihapus.', 'info');
    refreshPengajarTable();
    refreshMuridSelects();
  });
}

/* ════════════════════
   KELOLA MURID
════════════════════ */
function initMurid() { /* loaded on navTo */ }

function refreshMuridSelects() {
  const sel     = document.getElementById('murid-teacher-sel');
  const current = sel.value;
  sel.innerHTML = '<option value="">— Pilih pengajar —</option>' +
    getTeachers().map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  if (current) { sel.value = current; loadMuridSection(); }
}

function loadMuridSection() {
  const teacherId = document.getElementById('murid-teacher-sel').value;
  const section   = document.getElementById('murid-section');
  if (!teacherId) { section.classList.add('hidden'); return; }

  const t = getTeacherById(teacherId);
  section.classList.remove('hidden');
  document.getElementById('murid-teacher-title').textContent = `Murid — ${t.name}`;
  document.getElementById('murid-count-badge').textContent = `${t.students.length} murid`;
  renderMuridTable(t);
}

function renderMuridTable(t) {
  const tbody = document.getElementById('murid-tbody');
  if (!t.students.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="icon">🎓</div>Belum ada murid. Tambahkan murid di atas.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = t.students.map((s, i) => {
    const name     = studentName(s);
    const tipe     = typeof s === 'object' ? (s.tipe || 'Reguler') : 'Reguler';
    const kelas    = typeof s === 'object' ? (s.kelas || '—') : '—';
    const pelajaran = typeof s === 'object' && s.pelajaran?.length
      ? s.pelajaran.map(p => `<span class="murid-pelajaran-badge">${p}</span>`).join(' ')
      : '<span style="color:var(--text3);font-size:.78rem;">—</span>';
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${name}</strong></td>
        <td><span class="badge ${tipe === 'Private' ? 'badge-violet' : 'badge-cyan'}">${tipe}</span></td>
        <td><span class="murid-info-badge">${kelas}</span></td>
        <td style="max-width:280px;">${pelajaran}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="openEditStudentModal('${t.id}', '${name.replace(/'/g, "\\'")}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="removeStudentAction('${t.id}', '${name.replace(/'/g, "\\'")}')">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function addStudentAction() {
  const teacherId = document.getElementById('murid-teacher-sel').value;
  const name      = document.getElementById('new-student-name').value.trim();
  const tipe      = document.getElementById('new-student-tipe').value;
  const kelas     = document.getElementById('new-student-kelas').value.trim();
  const pelajaranRaw = document.getElementById('new-student-pelajaran').value.trim();
  const pelajaran = pelajaranRaw ? pelajaranRaw.split(',').map(p => p.trim()).filter(Boolean) : [];

  if (!name) { showToast('Nama murid tidak boleh kosong.', 'error'); return; }

  const res = addStudent(teacherId, { name, tipe, kelas, pelajaran });
  if (res.error) { showToast(res.error, 'error'); return; }

  document.getElementById('new-student-name').value = '';
  document.getElementById('new-student-kelas').value = '';
  document.getElementById('new-student-pelajaran').value = '';
  showToast(`✅ Murid "${name}" ditambahkan!`, 'success');
  loadMuridSection();
}

function openEditStudentModal(teacherId, name) {
  const t = getTeacherById(teacherId);
  const s = t.students.find(st => studentName(st) === name);
  if (!s) return;
  document.getElementById('edit-student-name').value    = studentName(s);
  document.getElementById('edit-student-tipe').value    = typeof s === 'object' ? (s.tipe || 'Reguler') : 'Reguler';
  document.getElementById('edit-student-kelas').value   = typeof s === 'object' ? (s.kelas || '') : '';
  document.getElementById('edit-student-pelajaran').value = typeof s === 'object' && s.pelajaran ? s.pelajaran.join(', ') : '';
  document.getElementById('edit-student-old-name').value = studentName(s);
  document.getElementById('edit-student-teacher-id').value = teacherId;
  openModal('modal-student');
}

function saveStudentEditAction() {
  const teacherId  = document.getElementById('edit-student-teacher-id').value;
  const oldName    = document.getElementById('edit-student-old-name').value;
  const newName    = document.getElementById('edit-student-name').value.trim();
  const tipe       = document.getElementById('edit-student-tipe').value;
  const kelas      = document.getElementById('edit-student-kelas').value.trim();
  const pelajaranRaw = document.getElementById('edit-student-pelajaran').value.trim();
  const pelajaran  = pelajaranRaw ? pelajaranRaw.split(',').map(p => p.trim()).filter(Boolean) : [];

  if (!newName) { showToast('Nama murid tidak boleh kosong.', 'error'); return; }

  const res = updateStudent(teacherId, oldName, { name: newName, tipe, kelas, pelajaran });
  if (res.error) { showToast(res.error, 'error'); return; }

  showToast('✅ Data murid diperbarui!', 'success');
  closeModal('modal-student');
  loadMuridSection();
}

function removeStudentAction(teacherId, name) {
  showConfirm(`Hapus murid "${name}" dari daftar?`, () => {
    removeStudent(teacherId, name);
    showToast(`🗑️ Murid "${name}" dihapus.`, 'info');
    loadMuridSection();
  });
}

/* ════════════════════
   KELOLA AKUN
════════════════════ */
function initAkun() { /* loaded on navTo */ }

function refreshAkunTable() {
  const users    = getUsers();
  const teachers = getTeachers();
  const tbody    = document.getElementById('akun-tbody');
  tbody.innerHTML = users.map((u, i) => {
    const t = u.teacherId ? teachers.find(t => t.id === u.teacherId) : null;
    const roleBadge = u.role === 'admin'
      ? `<span class="badge badge-pink" style="background:rgba(244,114,182,.12);color:var(--pink);border-color:rgba(244,114,182,.25);">Admin</span>`
      : `<span class="badge badge-violet">Pengajar</span>`;
    const isAdmin = u.username === 'admin';
    return `
      <tr>
        <td>${i + 1}</td>
        <td><code style="font-size:.82rem;color:var(--cyan);">${u.username}</code></td>
        <td>${u.displayName}</td>
        <td>${roleBadge}</td>
        <td>${t ? t.name : '—'}</td>
        <td>
          <div class="user-row-actions">
            <button class="btn btn-secondary btn-sm" onclick="openEditUserModal('${u.username}')">✏️ Edit</button>
            ${!isAdmin ? `<button class="btn btn-danger btn-sm" onclick="deleteUserAction('${u.username}')">🗑️</button>` : ''}
          </div>
        </td>
      </tr>`;
  }).join('');
}

function buildTeacherOptions(selectedId) {
  const teachers = getTeachers();
  return '<option value="">— Tidak ada —</option>' +
    teachers.map(t => `<option value="${t.id}" ${t.id === selectedId ? 'selected' : ''}>${t.name}</option>`).join('');
}

function toggleTeacherSelect() {
  const role = document.getElementById('user-role-input').value;
  document.getElementById('user-teacher-group').style.display = role === 'admin' ? 'none' : '';
}

function openAddUserModal() {
  document.getElementById('modal-user-title').textContent = 'Tambah Akun';
  document.getElementById('user-username-input').value = '';
  document.getElementById('user-username-input').disabled = false;
  document.getElementById('user-password-input').value = '';
  document.getElementById('user-display-input').value = '';
  document.getElementById('user-role-input').value = 'user';
  document.getElementById('user-teacher-input').innerHTML = buildTeacherOptions('');
  document.getElementById('user-edit-username').value = '';
  document.getElementById('user-teacher-group').style.display = '';
  openModal('modal-user');
}

function openEditUserModal(username) {
  const users = getUsers();
  const u = users.find(u => u.username === username);
  document.getElementById('modal-user-title').textContent = 'Edit Akun';
  document.getElementById('user-username-input').value = u.username;
  document.getElementById('user-username-input').disabled = true;
  document.getElementById('user-password-input').value = u.password;
  document.getElementById('user-display-input').value = u.displayName;
  document.getElementById('user-role-input').value = u.role;
  document.getElementById('user-teacher-input').innerHTML = buildTeacherOptions(u.teacherId);
  document.getElementById('user-edit-username').value = u.username;
  document.getElementById('user-teacher-group').style.display = u.role === 'admin' ? 'none' : '';
  openModal('modal-user');
}

function saveUserAction() {
  const editUsername = document.getElementById('user-edit-username').value;
  const username     = document.getElementById('user-username-input').value.trim();
  const password     = document.getElementById('user-password-input').value.trim();
  const displayName  = document.getElementById('user-display-input').value.trim();
  const role         = document.getElementById('user-role-input').value;
  const teacherId    = role === 'user' ? document.getElementById('user-teacher-input').value : null;

  if (!username || !password || !displayName) { showToast('Semua field wajib diisi!', 'error'); return; }
  if (password.length < 4) { showToast('Password minimal 4 karakter.', 'error'); return; }

  if (editUsername) {
    const res = updateUser(editUsername, { password, displayName, role, teacherId: teacherId || null });
    if (res.error) { showToast(res.error, 'error'); return; }
    showToast('✅ Akun berhasil diperbarui!', 'success');
  } else {
    const res = addUser(username, password, role, teacherId || null, displayName);
    if (res.error) { showToast(res.error, 'error'); return; }
    showToast('✅ Akun baru dibuat!', 'success');
  }

  document.getElementById('user-username-input').disabled = false;
  closeModal('modal-user');
  refreshAkunTable();
}

function deleteUserAction(username) {
  showConfirm(`Hapus akun "${username}"?`, () => {
    deleteUser(username);
    showToast('🗑️ Akun dihapus.', 'info');
    refreshAkunTable();
  });
}

/* ════════════════════
   PEMBAYARAN PENGAJAR (GAJI)
════════════════════ */
function initGaji() {
  const now = new Date();
  const mSel = document.getElementById('gaji-month');
  const ySel = document.getElementById('gaji-year');

  MONTHS.forEach((m, i) => {
    const o = document.createElement('option');
    o.value = i + 1; o.textContent = m;
    if (i === now.getMonth()) o.selected = true;
    mSel.appendChild(o);
  });

  for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) {
    const o = document.createElement('option'); o.value = y; o.textContent = y;
    ySel.appendChild(o);
  }
}

function getTarifData() {
  return JSON.parse(localStorage.getItem('absensi_tarif') || '{}');
}

function saveTarifData(data) {
  localStorage.setItem('absensi_tarif', JSON.stringify(data));
}

function formatRupiah(angka) {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

function loadGaji() {
  const y = parseInt(document.getElementById('gaji-year').value);
  const m = parseInt(document.getElementById('gaji-month').value);
  
  const defGuru = parseInt(document.getElementById('gaji-def-guru').value) || 0;
  const defTransport = parseInt(document.getElementById('gaji-def-transport').value) || 0;
  const defReguler = parseInt(document.getElementById('gaji-def-reguler').value) || 0;
  const defPrivate = parseInt(document.getElementById('gaji-def-private').value) || 0;
  
  const tbody = document.getElementById('gaji-tbody');
  
  const tarifData = getTarifData();
  const report = getAllTeachersMonthlyReport(y, m);

  if (report.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Tidak ada data.</td></tr>';
    return;
  }

  tbody.innerHTML = report.map(rt => {
    // Determine the rates for this specific teacher
    const tTarif = tarifData[rt.teacher.id] || {};
    const rateGuru = tTarif.guru !== undefined ? tTarif.guru : defGuru;
    const rateTransport = tTarif.transport !== undefined ? tTarif.transport : defTransport;
    const rateReguler = tTarif.reguler !== undefined ? tTarif.reguler : defReguler;
    const ratePrivate = tTarif.private !== undefined ? tTarif.private : defPrivate;

    // Calculate regular vs private attendees
    let regulerCount = 0;
    let privateCount = 0;
    rt.records.forEach(rec => {
      if (!rec.submitted) return;
      rec.present.forEach(studentNameObj => {
        // Find this student in teacher's student list to check type
        // Note: rec.present might just be string names
        const sNameStr = typeof studentNameObj === 'string' ? studentNameObj : studentNameObj.name;
        const sData = rt.teacher.students.find(s => {
          const n = typeof s === 'string' ? s : s.name;
          return n === sNameStr;
        });
        const tipe = (sData && typeof sData === 'object' && sData.tipe) ? sData.tipe : 'Reguler';
        if (tipe === 'Private') privateCount++;
        else regulerCount++;
      });
    });

    const valGuru = rt.daysSubmitted * rateGuru;
    const valTransport = rt.daysSubmitted * rateTransport;
    const valReguler = regulerCount * rateReguler;
    const valPrivate = privateCount * ratePrivate;
    const totalGaji = valGuru + valTransport + valReguler + valPrivate;

    // JSON stringify the breakdown to pass to print function
    const breakdown = encodeURIComponent(JSON.stringify({
      daysReq: rt.daysSubmitted, rateGuru, valGuru,
      rateTransport, valTransport,
      regulerCount, rateReguler, valReguler,
      privateCount, ratePrivate, valPrivate,
      totalGaji
    }));

    return `
      <tr class="gaji-row" data-tid="${rt.teacher.id}">
        <td style="font-weight:600;">${rt.teacher.name}</td>
        <td>
          ${rt.daysSubmitted} Hari<br>
          <span style="font-size:.7rem;color:var(--text3);">Guru: ${formatRupiah(valGuru)}<br>Transport: ${formatRupiah(valTransport)}</span>
        </td>
        <td>
          <span class="badge badge-cyan" style="font-size:.65rem;padding:2px 4px;">R</span> ${regulerCount} &nbsp; 
          <span class="badge badge-violet" style="font-size:.65rem;padding:2px 4px;">P</span> ${privateCount}
        </td>
        <td>
          <span style="font-size:.75rem;color:var(--text2);">Reg: ${formatRupiah(valReguler)}<br>Priv: ${formatRupiah(valPrivate)}</span>
        </td>
        <td style="font-weight:800;color:var(--green);">${formatRupiah(totalGaji)}</td>
        <td class="no-print">
          <button class="btn btn-secondary btn-sm" style="margin-bottom:4px;width:100px;" onclick="customTarifPrompt('${rt.teacher.id}')">⚙️ Atur Tarif</button><br>
          <button class="btn btn-primary btn-sm" style="width:100px;" onclick="cetakSlipGaji('${rt.teacher.id}', '${rt.teacher.name}', '${breakdown}')">🖨️ Cetak</button>
        </td>
      </tr>
    `;
  }).join('');
}

function customTarifPrompt(teacherId) {
  const data = getTarifData();
  const tTarif = data[teacherId] || {};
  
  const g = prompt("Tarif Fee Guru per Hari Mengajar (Ketik angka, kosongkan untuk kembali ke awal):", tTarif.guru !== undefined ? tTarif.guru : '');
  if (g === null) return; 
  
  const t = prompt("Tarif Transport per Hari Mengajar:", tTarif.transport !== undefined ? tTarif.transport : '');
  if (t === null) return;
  
  const r = prompt("Tarif Murid (Reguler):", tTarif.reguler !== undefined ? tTarif.reguler : '');
  if (r === null) return;

  const p = prompt("Tarif Murid (Private):", tTarif.private !== undefined ? tTarif.private : '');
  if (p === null) return;

  if (g === '' && t === '' && r === '' && p === '') {
    delete data[teacherId];
  } else {
    data[teacherId] = {
      guru: g !== '' ? parseInt(g) : undefined,
      transport: t !== '' ? parseInt(t) : undefined,
      reguler: r !== '' ? parseInt(r) : undefined,
      private: p !== '' ? parseInt(p) : undefined,
    };
  }
  
  saveTarifData(data);
  loadGaji();
  showToast('Tarif khusus disimpan.', 'success');
}

function updateTarifKaryawan(teacherId, val) {
  // Deprecated, use customTarifPrompt instead.
}

function cetakSlipGaji(tId, tName, breakdownEncoded) {
  const m = parseInt(document.getElementById('gaji-month').value);
  const y = parseInt(document.getElementById('gaji-year').value);
  
  const b = JSON.parse(decodeURIComponent(breakdownEncoded));

  document.getElementById('gaji-print-meta').innerHTML = `
    <div style="margin-top:10px;text-align:left;font-size:.9rem;">
      <table style="width:100%;border:none;margin-bottom:15px;">
        <tr><td style="width:120px;border:none !important;padding:2px 0;"><strong>Nama Pengajar</strong></td><td style="border:none !important;padding:2px 0;">: ${tName}</td></tr>
        <tr><td style="border:none !important;padding:2px 0;"><strong>Periode</strong></td><td style="border:none !important;padding:2px 0;">: ${MONTHS[m-1]} ${y}</td></tr>
      </table>
    </div>
  `;

  const tbody = document.getElementById('gaji-tbody');
  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="padding:0;">
        <table style="width:100%;border-collapse:collapse;margin:10px 0;">
          <tr style="background:var(--bg2);">
            <th style="padding:8px;border:1px solid var(--border);text-align:left;">Keterangan</th>
            <th style="padding:8px;border:1px solid var(--border);text-align:right;">Volume</th>
            <th style="padding:8px;border:1px solid var(--border);text-align:right;">Tarif</th>
            <th style="padding:8px;border:1px solid var(--border);text-align:right;">Jumlah</th>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid var(--border);">Kehadiran Guru</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;">${b.daysReq} Hari</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;">${formatRupiah(b.rateGuru)}</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;">${formatRupiah(b.valGuru)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid var(--border);">Uang Transport</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;">${b.daysReq} Hari</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;">${formatRupiah(b.rateTransport)}</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;">${formatRupiah(b.valTransport)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid var(--border);">Murid Reguler</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;">${b.regulerCount} Anak</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;">${formatRupiah(b.rateReguler)}</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;">${formatRupiah(b.valReguler)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid var(--border);">Murid Private</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;">${b.privateCount} Anak</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;">${formatRupiah(b.ratePrivate)}</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;">${formatRupiah(b.valPrivate)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding:8px;border:1px solid var(--border);text-align:right;font-weight:700;">TOTAL PENDAPATAN</td>
            <td style="padding:8px;border:1px solid var(--border);text-align:right;font-weight:800;color:var(--green);font-size:1.1rem;">${formatRupiah(b.totalGaji)}</td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  const styleId = 'dynamic-gaji-print-style';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    @media print {
      body * { visibility: hidden; }
      #page-gaji, #page-gaji * { visibility: visible; }
      #page-gaji { position: absolute; left: 0; top: 0; width: 100%; }
      #gaji-table thead { display: none !important; }
      #gaji-print-header { display: block !important; margin-bottom: 20px; }
      .filter-bar, .no-print { display: none !important; }
    }
  `;

  window.print();

  setTimeout(() => {
    if(styleEl) styleEl.textContent = '';
    loadGaji();
  }, 500);
}
