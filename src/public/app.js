const scene = document.getElementById('scene');
const markersWrap = document.getElementById('markers');
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');

let startTime = null;
let timerInterval = null;
let gameActive = false;

// TIMER
function startTimer() {
  startTime = Date.now();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    timerEl.textContent = formatTime(elapsed);
  }, 500);
}
function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// NOTIFICATION
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// MARKER
function createMarker(x, y) {
  const marker = document.createElement('div');
  marker.className = 'marker';
  marker.style.left = `${x}px`;
  marker.style.top = `${y}px`;
  markersWrap.appendChild(marker);
}

// IMAGE CLICK HANDLER
scene.addEventListener('click', async (e) => {
  if (!gameActive) return showToast('Click “Start Game” first!', 'warn');

  const rect = scene.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const imageWidth = rect.width;
  const imageHeight = rect.height;

  const res = await fetch('/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ x, y, imageWidth, imageHeight, characterId: 'waldo' }),
  });
  const data = await res.json();

  if (data.correct) {
    createMarker(data.center.x, data.center.y);
    stopTimer();
    gameActive = false;
    showToast(`🎉 You found Waldo in ${timerEl.textContent}!`, 'success');
  } else {
    showToast('❌ That’s not Waldo! Try again.', 'warn');
  }
});

// BUTTONS
startBtn.addEventListener('click', async () => {
  await fetch('/api/reset', { method: 'POST' });
  markersWrap.innerHTML = '';
  startTimer();
  gameActive = true;
  showToast('🕹️ Game started! Find Waldo!', 'info');
});

resetBtn.addEventListener('click', async () => {
  await fetch('/api/reset', { method: 'POST' });
  markersWrap.innerHTML = '';
  timerEl.textContent = '00:00';
  gameActive = false;
  stopTimer();
  showToast('🔄 Game reset.', 'info');
});
