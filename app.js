// ===== DEMO DATA (LocalStorage based - replace with Firebase) =====
let user = JSON.parse(localStorage.getItem('cashmora_user')) || null;

// ===== INIT =====
window.onload = () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    if (user) startApp();
    else document.getElementById('authScreen').classList.remove('hidden');
  }, 1500);
  buildStreakGrid();
};

// ===== AUTH =====
function switchAuth(type) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('loginForm').classList.toggle('hidden', type !== 'login');
  document.getElementById('signupForm').classList.toggle('hidden', type !== 'signup');
}

document.getElementById('signupForm').onsubmit = (e) => {
  e.preventDefault();
  const refer = document.getElementById('signupRefer').value.trim();
  user = {
    name: document.getElementById('signupName').value,
    email: document.getElementById('signupEmail').value,
    phone: document.getElementById('signupPhone').value,
    points: refer ? 100 : 0,
    puzzlesSolved: 0,
    monthPuzzles: 0,
    streak: 0,
    lastCheckin: null,
    referCode: 'CASH' + Math.floor(1000 + Math.random() * 9000),
    referCount: 0,
    referEarn: 0,
    history: []
  };
  if (refer) toast('Referral applied! +100 pts 🎉');
  saveUser();
  startApp();
};

document.getElementById('loginForm').onsubmit = (e) => {
  e.preventDefault();
  if (!user) {
    user = demoUser(document.getElementById('loginEmail').value);
    saveUser();
  }
  startApp();
};

function googleLogin() {
  if (!user) { user = demoUser('googleuser@gmail.com'); saveUser(); }
  toast('Logged in with Google 🔵');
  startApp();
}

function demoUser(email) {
  return {
    name: 'Demo User', email, phone: '+91 9876543210',
    points: 250, puzzlesSolved: 3, monthPuzzles: 3, streak: 2,
    lastCheckin: null, referCode: 'CASH' + Math.floor(1000+Math.random()*9000),
    referCount: 1, referEarn: 100, history: []
  };
}

function startApp() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('bottomNav').classList.remove('hidden');
  refreshUI();
}

function logout() {
  localStorage.removeItem('cashmora_user');
  user = null;
  location.reload();
}

// ===== UI REFRESH =====
function refreshUI() {
  if (!user) return;
  const lvl = getLevel(user.points);
  document.getElementById('topPoints').textContent = user.points;
  document.getElementById('userName').textContent = user.name.split(' ')[0];
  document.getElementById('userLevel').textContent = lvl;
  document.getElementById('statPoints').textContent = user.points;
  document.getElementById('statPuzzles').textContent = user.puzzlesSolved;
  document.getElementById('statStreak').textContent = user.streak;
  document.getElementById('monthCount').textContent = user.monthPuzzles;
  document.getElementById('referCode').textContent = user.referCode;
  document.getElementById('referCount').textContent = user.referCount;
  document.getElementById('referEarn').textContent = user.referEarn;
  document.getElementById('redeemPoints').textContent = user.points;
  document.getElementById('profName').textContent = user.name;
  document.getElementById('profEmail').textContent = user.email;
  document.getElementById('profPhone').textContent = user.phone;
  document.getElementById('profPoints').textContent = user.points;
  document.getElementById('profRefer').textContent = user.referCode;
  document.getElementById('avatar').textContent = user.name[0].toUpperCase();
  buildStreakGrid();
  renderHistory();
}

function getLevel(p) {
  if (p >= 10000) return '💎 Diamond Level';
  if (p >= 5000) return '🥇 Gold Level';
  if (p >= 1000) return '🥈 Silver Level';
  return '🥉 Bronze Level';
}

// ===== NAVIGATION =====
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');
  window.scrollTo(0, 0);
}

// ===== CHECK-IN =====
function buildStreakGrid() {
  const grid = document.getElementById('streakGrid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 1; i <= 7; i++) {
    const d = document.createElement('div');
    d.className = 'streak-day' + (user && user.streak >= i ? ' done' : '');
    d.textContent = 'D' + i;
    grid.appendChild(d);
  }
}

function dailyCheckin() {
  const today = new Date().toDateString();
  if (user.lastCheckin === today) return toast('Already checked in today! ✅');
  user.streak = (user.streak >= 7 ? 0 : user.streak) + 1;
  let pts = 20;
  if (user.streak === 7) { pts += 100; toast('🔥 7-Day Streak Bonus! +120 pts'); }
  else toast('Checked in! +20 pts ✅');
  user.points += pts;
  user.lastCheckin = today;
  saveUser(); refreshUI();
}

// ===== PUZZLE =====
function solvePuzzle(level, pts) {
  // Simple demo puzzle
  const a = Math.floor(Math.random()*10)+1, b = Math.floor(Math.random()*10)+1;
  const ans = prompt(`Solve to earn ${pts} pts:\n${a} + ${b} = ?`);
  if (ans === null) return;
  if (parseInt(ans) === a + b) {
    user.points += pts;
    user.puzzlesSolved++;
    user.monthPuzzles++;
    if (user.monthPuzzles === 12) { user.points += 500; toast('🎉 Monthly Challenge done! +500 bonus'); }
    else toast(`Correct! +${pts} pts 🎉`);
    saveUser(); refreshUI();
  } else {
    toast('Wrong answer! Try again ❌');
  }
}

// ===== REFER =====
function copyRefer() {
  navigator.clipboard.writeText(user.referCode);
  toast('Referral code copied! 📋');
}
function shareRefer() {
  if (navigator.share) {
    navigator.share({ title:'Cashmora', text:`Join Cashmora & earn rewards! Use my code: ${user.referCode}` });
  } else {
    copyRefer();
  }
}

// ===== REWARDS =====
function redeem(cost, item) {
  if (user.points < cost) return toast('Not enough points! ❌');
  user.points -= cost;
  user.history.unshift({ item, cost, date: new Date().toLocaleDateString() });
  saveUser(); refreshUI();
  toast(`Redeemed ${item}! 🏆`);
}

function renderHistory() {
  const box = document.getElementById('redeemHistory');
  if (!user.history.length) { box.innerHTML = '<p class="empty">No history yet</p>'; return; }
  box.innerHTML = user.history.map(h =>
    `<div class="history-item"><span>${h.item}</span><small>-${h.cost} pts • ${h.date}</small></div>`
  ).join('');
}

// ===== THEME =====
function toggleTheme() {
  const html = document.documentElement;
  const dark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', dark ? 'light' : 'dark');
  document.querySelector('.theme-toggle').textContent = dark ? '🌙' : '☀️';
  localStorage.setItem('cashmora_theme', dark ? 'light' : 'dark');
}
if (localStorage.getItem('cashmora_theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

// ===== HELPERS =====
function saveUser() { localStorage.setItem('cashmora_user', JSON.stringify(user)); }
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
