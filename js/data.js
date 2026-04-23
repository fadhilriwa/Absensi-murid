// ============================================================
//  DATA.JS — Absensi Sanggar  |  localStorage persistence
//  Students now have: name, kelas, pelajaran[]
// ============================================================

const DB_KEYS = {
    TEACHERS: 'absensi_teachers',
    ATTENDANCE: 'absensi_attendance',
    TEACHER_ATTENDANCE: 'absensi_teacher_attendance',
    USERS: 'absensi_users',
    SESSION: 'absensi_session',
};

// ── Default seed data ─────────────────────────────────────────
// Students stored as objects: { name, kelas, pelajaran }
const DEFAULT_TEACHERS = [
    {
        id: 'miss-sari',
        name: 'Miss Sari',
        students: [
            { name: 'Alya', kelas: 'Kelas A', pelajaran: ['Tari Klasik', 'Piano'] },
            { name: 'Bintang', kelas: 'Kelas A', pelajaran: ['Tari Klasik'] },
            { name: 'Citra', kelas: 'Kelas B', pelajaran: ['Vokal', 'Piano'] },
            { name: 'Dinda', kelas: 'Kelas B', pelajaran: ['Tari Modern'] },
            { name: 'Eka', kelas: 'Kelas A', pelajaran: ['Piano'] },
        ],
    },
    {
        id: 'miss-rina',
        name: 'Miss Rina',
        students: [
            { name: 'Farah', kelas: 'Kelas A', pelajaran: ['Tari Saman'] },
            { name: 'Gilang', kelas: 'Kelas C', pelajaran: ['Gitar', 'Vokal'] },
            { name: 'Hana', kelas: 'Kelas B', pelajaran: ['Tari Saman'] },
            { name: 'Ilham', kelas: 'Kelas C', pelajaran: ['Gitar'] },
            { name: 'Jasmine', kelas: 'Kelas A', pelajaran: ['Vokal'] },
        ],
    },
    {
        id: 'miss-dewi',
        name: 'Miss Dewi',
        students: [
            { name: 'Kevin', kelas: 'Kelas B', pelajaran: ['Melukis'] },
            { name: 'Luna', kelas: 'Kelas A', pelajaran: ['Melukis', 'Kerajinan'] },
            { name: 'Maya', kelas: 'Kelas B', pelajaran: ['Kerajinan'] },
            { name: 'Nadia', kelas: 'Kelas C', pelajaran: ['Melukis'] },
            { name: 'Oscar', kelas: 'Kelas C', pelajaran: ['Kerajinan', 'Gambar'] },
        ],
    },
    {
        id: 'miss-ayu',
        name: 'Miss Ayu',
        students: [
            { name: 'Putri', kelas: 'Kelas A', pelajaran: ['Angklung'] },
            { name: 'Qira', kelas: 'Kelas B', pelajaran: ['Angklung', 'Vokal'] },
            { name: 'Rafi', kelas: 'Kelas C', pelajaran: ['Angklung'] },
            { name: 'Salsa', kelas: 'Kelas A', pelajaran: ['Vokal'] },
            { name: 'Tari', kelas: 'Kelas B', pelajaran: ['Tari Modern', 'Angklung'] },
        ],
    },
];

const DEFAULT_USERS = [
    { username: 'admin', password: 'admin123', role: 'admin', teacherId: null, displayName: 'Administrator' },
    { username: 'miss.sari', password: 'sari123', role: 'user', teacherId: 'miss-sari', displayName: 'Miss Sari' },
    { username: 'miss.rina', password: 'rina123', role: 'user', teacherId: 'miss-rina', displayName: 'Miss Rina' },
    { username: 'miss.dewi', password: 'dewi123', role: 'user', teacherId: 'miss-dewi', displayName: 'Miss Dewi' },
    { username: 'miss.ayu', password: 'ayu123', role: 'user', teacherId: 'miss-ayu', displayName: 'Miss Ayu' },
    { username: 'miss.astrit', password: 'astrit123', role: 'user', teacherId: 'miss-astrit', displayName: 'Miss Astrit' },
];

// ── Init (run once) ───────────────────────────────────────────
function initData() {
    if (!localStorage.getItem(DB_KEYS.TEACHERS)) {
        localStorage.setItem(DB_KEYS.TEACHERS, JSON.stringify(DEFAULT_TEACHERS));
    }
    if (!localStorage.getItem(DB_KEYS.USERS)) {
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(DB_KEYS.ATTENDANCE)) {
        localStorage.setItem(DB_KEYS.ATTENDANCE, JSON.stringify({}));
    }
    if (!localStorage.getItem(DB_KEYS.TEACHER_ATTENDANCE)) {
        localStorage.setItem(DB_KEYS.TEACHER_ATTENDANCE, JSON.stringify({}));
    }
    // Migrate old string-based students to object format
    migrateStudents();
}

// ── Migration: old format students[] was string[], now object[] ──
function migrateStudents() {
    const teachers = getTeachers();
    let changed = false;
    teachers.forEach(t => {
        if (t.students && t.students.length > 0 && typeof t.students[0] === 'string') {
            t.students = t.students.map(name => ({ name, kelas: '', pelajaran: [] }));
            changed = true;
        }
    });
    if (changed) saveTeachers(teachers);
}

// ── Helper: get student name (supports both string & object) ──
function studentName(s) {
    return typeof s === 'string' ? s : s.name;
}

// ── Teachers CRUD ──────────────────────────────────────────────
function getTeachers() {
    return JSON.parse(localStorage.getItem(DB_KEYS.TEACHERS) || '[]');
}

function getTeacherById(id) {
    return getTeachers().find(t => t.id === id) || null;
}

function saveTeachers(teachers) {
    localStorage.setItem(DB_KEYS.TEACHERS, JSON.stringify(teachers));
}

function addTeacher(name) {
    const teachers = getTeachers();
    const id = 'miss-' + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (teachers.find(t => t.id === id)) return { error: 'Pengajar dengan nama ini sudah ada.' };
    const teacher = { id, name, students: [] };
    teachers.push(teacher);
    saveTeachers(teachers);
    return { success: true, teacher };
}

function updateTeacher(id, newName) {
    const teachers = getTeachers();
    const idx = teachers.findIndex(t => t.id === id);
    if (idx === -1) return { error: 'Pengajar tidak ditemukan.' };
    teachers[idx].name = newName;
    saveTeachers(teachers);
    return { success: true };
}

function deleteTeacher(id) {
    let teachers = getTeachers();
    teachers = teachers.filter(t => t.id !== id);
    saveTeachers(teachers);
    let users = getUsers();
    users = users.filter(u => u.teacherId !== id);
    saveUsers(users);
    return { success: true };
}

// ── Students CRUD ──────────────────────────────────────────────
function addStudent(teacherId, studentObj) {
    // studentObj = { name, kelas, pelajaran[] }
    const teachers = getTeachers();
    const t = teachers.find(t => t.id === teacherId);
    if (!t) return { error: 'Pengajar tidak ditemukan.' };
    const exists = t.students.find(s => studentName(s).toLowerCase() === studentObj.name.toLowerCase());
    if (exists) return { error: 'Murid sudah ada di daftar.' };
    t.students.push(studentObj);
    saveTeachers(teachers);
    return { success: true };
}

function updateStudent(teacherId, oldName, updatedObj) {
    const teachers = getTeachers();
    const t = teachers.find(t => t.id === teacherId);
    if (!t) return { error: 'Pengajar tidak ditemukan.' };
    const idx = t.students.findIndex(s => studentName(s) === oldName);
    if (idx === -1) return { error: 'Murid tidak ditemukan.' };
    t.students[idx] = updatedObj;
    saveTeachers(teachers);
    return { success: true };
}

function removeStudent(teacherId, name) {
    const teachers = getTeachers();
    const t = teachers.find(t => t.id === teacherId);
    if (!t) return { error: 'Pengajar tidak ditemukan.' };
    t.students = t.students.filter(s => studentName(s) !== name);
    saveTeachers(teachers);
    return { success: true };
}

// ── Users / Auth ───────────────────────────────────────────────
function getUsers() {
    return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
}

function saveUsers(users) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
}

function addUser(username, password, role, teacherId, displayName) {
    const users = getUsers();
    if (users.find(u => u.username === username)) return { error: 'Username sudah dipakai.' };
    users.push({ username, password, role, teacherId, displayName });
    saveUsers(users);
    return { success: true };
}

function updateUser(username, updates) {
    const users = getUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx === -1) return { error: 'User tidak ditemukan.' };
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
    return { success: true };
}

function deleteUser(username) {
    let users = getUsers();
    users = users.filter(u => u.username !== username);
    saveUsers(users);
    return { success: true };
}

function login(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return null;
    const session = { username: user.username, role: user.role, teacherId: user.teacherId, displayName: user.displayName };
    sessionStorage.setItem(DB_KEYS.SESSION, JSON.stringify(session));
    return session;
}

function logout() {
    sessionStorage.removeItem(DB_KEYS.SESSION);
}

function getSession() {
    const raw = sessionStorage.getItem(DB_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
}

function requireAuth(requiredRole) {
    const session = getSession();
    if (!session) { window.location.href = 'index.html'; return null; }
    if (requiredRole && session.role !== requiredRole && session.role !== 'admin') {
        window.location.href = session.role === 'admin' ? 'admin.html' : 'user.html';
        return null;
    }
    return session;
}

// ── Attendance ─────────────────────────────────────────────────
function getAttendance() {
    return JSON.parse(localStorage.getItem(DB_KEYS.ATTENDANCE) || '{}');
}

function saveAttendance(data) {
    localStorage.setItem(DB_KEYS.ATTENDANCE, JSON.stringify(data));
}

function getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getAttendanceForDate(teacherId, dateKey) {
    const all = getAttendance();
    return all[dateKey]?.[teacherId] || null;
}

function saveAttendanceForDate(teacherId, dateKey, presentStudents) {
    const all = getAttendance();
    if (!all[dateKey]) all[dateKey] = {};
    all[dateKey][teacherId] = { submitted: true, present: presentStudents, savedAt: new Date().toISOString() };
    saveAttendance(all);
}

function getMonthlyReport(teacherId, year, month) {
    const all = getAttendance();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const result = [];
    Object.keys(all)
        .filter(k => k.startsWith(prefix))
        .sort()
        .forEach(dateKey => {
            const rec = all[dateKey]?.[teacherId];
            result.push({ date: dateKey, submitted: !!rec, present: rec?.present || [], count: rec?.present?.length || 0 });
        });
    return result;
}

function getAllTeachersMonthlyReport(year, month) {
    const teachers = getTeachers();
    return teachers.map(t => {
        const records = getMonthlyReport(t.id, year, month);
        const totalPresent = records.reduce((sum, r) => sum + r.count, 0);
        const daysSubmitted = records.filter(r => r.submitted).length;
        return { teacher: t, records, totalPresent, daysSubmitted };
    });
}

// ── Teacher Attendance ─────────────────────────────────────────
// Structure: { "2026-04-22": { "miss-sari": { status: "hadir", savedAt: "..." }, ... }, ... }
// status: "hadir" | "izin" | "sakit" | "alpha"
function getTeacherAttendance() {
    return JSON.parse(localStorage.getItem(DB_KEYS.TEACHER_ATTENDANCE) || '{}');
}

function saveTeacherAttendance(data) {
    localStorage.setItem(DB_KEYS.TEACHER_ATTENDANCE, JSON.stringify(data));
}

function getTeacherAttendanceForDate(teacherId, dateKey) {
    const all = getTeacherAttendance();
    return all[dateKey]?.[teacherId] || null;
}

function saveTeacherAttendanceForDate(teacherId, dateKey, status) {
    const all = getTeacherAttendance();
    if (!all[dateKey]) all[dateKey] = {};
    all[dateKey][teacherId] = { status, savedAt: new Date().toISOString() };
    saveTeacherAttendance(all);
}

function getTeacherMonthlyPresence(teacherId, year, month) {
    const all = getTeacherAttendance();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const result = [];
    Object.keys(all)
        .filter(k => k.startsWith(prefix))
        .sort()
        .forEach(dateKey => {
            const rec = all[dateKey]?.[teacherId];
            result.push({
                date: dateKey,
                status: rec?.status || null,
                savedAt: rec?.savedAt || null
            });
        });
    return result;
}

function getAllTeachersPresenceForDate(dateKey) {
    const all = getTeacherAttendance();
    return all[dateKey] || {};
}

// ── GPS Config ─────────────────────────────────────────────────
const GPS_CONFIG_KEY = 'absensi_gps_config';
const GPS_LOG_KEY = 'absensi_gps_log';

function getGPSConfig() {
    const raw = localStorage.getItem(GPS_CONFIG_KEY);
    if (!raw) {
        // Default: GPS disabled
        return {
            enabled: false,
            lat: -6.200000,   // Default: Jakarta
            lng: 106.816666,
            radius: 100,       // meters
            locationName: 'Sanggar',
        };
    }
    return JSON.parse(raw);
}

function saveGPSConfig(config) {
    localStorage.setItem(GPS_CONFIG_KEY, JSON.stringify(config));
}

function getGPSLogs() {
    return JSON.parse(localStorage.getItem(GPS_LOG_KEY) || '[]');
}

function saveGPSLog(entry) {
    // entry: { teacherId, teacherName, date, time, lat, lng, distance, status, isMocked, method, userAgent }
    const logs = getGPSLogs();
    logs.unshift(entry); // newest first
    // Keep max 500 entries
    if (logs.length > 500) logs.length = 500;
    localStorage.setItem(GPS_LOG_KEY, JSON.stringify(logs));
}

function clearGPSLogs() {
    localStorage.setItem(GPS_LOG_KEY, JSON.stringify([]));
}

// ── Init on load ───────────────────────────────────────────────
initData();
