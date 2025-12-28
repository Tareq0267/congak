/***********************
 * Mental Math v1.3 (fixed charts + modal behavior)
 * - Dashboard is the home screen
 * - Session setup is a modal popup
 * - Fix: modal hide works reliably
 * - Fix: ECharts updates correctly after sessions (init once + resize after show)
 * - IndexedDB: daily merged stats + meta for badges
 *
 * v1.4 additions:
 * - New mode: buzzer (Buzzer Beater) -> fixed 5 minutes for now
 * - Keeps Duolingo-style feedback animations (green glow / red shake)
 ************************/

/* --------------------- Utils --------------------- */
function todayISO() {
  // Uses local date (not UTC) to avoid “saved to tomorrow/yesterday” issues
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function msToSec(ms) {
  return Math.round(ms / 100) / 10; // 0.1s
}

function lastNDatesISO(n) {
  const out = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    const yyyy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    out.push(`${yyyy}-${mm}-${dd}`);
  }
  return out;
}

/* --------------------- IndexedDB --------------------- */
const DB_NAME = "mathDB";
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("stats")) {
        db.createObjectStore("stats", { keyPath: "date" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStore(storeName, mode = "readonly") {
  const db = await openDB();
  return db.transaction(storeName, mode).objectStore(storeName);
}

async function getDailyStat(date) {
  const store = await getStore("stats");
  return new Promise((resolve) => {
    const req = store.get(date);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

async function putDailyStat(stat) {
  const store = await getStore("stats", "readwrite");
  return new Promise((resolve) => {
    const req = store.put(stat);
    req.onsuccess = () => resolve(true);
    req.onerror = () => resolve(false);
  });
}

async function getAllStats() {
  const store = await getStore("stats");
  return new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

async function getMeta(key, fallback = null) {
  const store = await getStore("meta");
  return new Promise((resolve) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.value ?? fallback);
    req.onerror = () => resolve(fallback);
  });
}

async function setMeta(key, value) {
  const store = await getStore("meta", "readwrite");
  return new Promise((resolve) => {
    const req = store.put({ key, value });
    req.onsuccess = () => resolve(true);
    req.onerror = () => resolve(false);
  });
}

/* --------------------- Badges --------------------- */
const BADGES = [
  { id: "first_session", name: "First Session", desc: "Finish your first session.", check: (ctx) => ctx.lifetimeSessions >= 1 },
  { id: "50_questions", name: "50 Questions", desc: "Answer 50 questions total.", check: (ctx) => ctx.lifetimeTotal >= 50 },
  { id: "200_questions", name: "200 Questions", desc: "Answer 200 questions total.", check: (ctx) => ctx.lifetimeTotal >= 200 },
  { id: "90_accuracy_day", name: "90% Day", desc: "Hit 90%+ accuracy in a day (min 20 questions).", check: (ctx) => ctx.todayTotal >= 20 && ctx.todayAccuracy >= 0.9 },
  { id: "fast_day", name: "Fast Hands", desc: "Average under 1.8s today (min 20 questions).", check: (ctx) => ctx.todayTotal >= 20 && ctx.todayAvgMs > 0 && ctx.todayAvgMs < 1800 },
  { id: "streak_3", name: "3-Day Streak", desc: "Practice 3 days in a row.", check: (ctx) => ctx.streak >= 3 },
  { id: "streak_7", name: "7-Day Streak", desc: "Practice 7 days in a row.", check: (ctx) => ctx.streak >= 7 },
];

async function getUnlockedBadgeIds() {
  return (await getMeta("badges_unlocked", [])) || [];
}

async function unlockBadgesIfNeeded(context) {
  const unlocked = new Set(await getUnlockedBadgeIds());
  let changed = false;

  for (const b of BADGES) {
    if (!unlocked.has(b.id) && b.check(context)) {
      unlocked.add(b.id);
      changed = true;
    }
  }

  if (changed) {
    await setMeta("badges_unlocked", Array.from(unlocked));
  }

  return Array.from(unlocked);
}

function renderBadgeList(unlockedIds) {
  const el = document.getElementById("badge-list");
  if (!el) return;

  el.innerHTML = "";
  const unlockedSet = new Set(unlockedIds);

  for (const b of BADGES) {
    const div = document.createElement("div");
    const ok = unlockedSet.has(b.id);
    div.className = "badge" + (ok ? "" : " locked");
    div.title = b.desc;
    div.textContent = ok ? `🏅 ${b.name}` : `🔒 ${b.name}`;
    el.appendChild(div);
  }
}

/* --------------------- Difficulty model --------------------- */
function rangesForDifficulty(diff) {
  if (diff === "easy") return { add: [1, 20], sub: [1, 20], mul: [1, 10], div: [1, 10] };
  if (diff === "hard") return { add: [10, 200], sub: [10, 200], mul: [2, 20], div: [2, 20] };
  return { add: [5, 99], sub: [5, 99], mul: [2, 12], div: [2, 12] }; // medium
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function genQuestion(ops, difficulty) {
  const map = rangesForDifficulty(difficulty);
  const op = ops[randInt(0, ops.length - 1)];

  let a, b, answer;

  if (op === "+") {
    a = randInt(map.add[0], map.add[1]);
    b = randInt(map.add[0], map.add[1]);
    answer = a + b;
  } else if (op === "-") {
    a = randInt(map.sub[0], map.sub[1]);
    b = randInt(map.sub[0], map.sub[1]);
    if (difficulty !== "hard" && b > a) [a, b] = [b, a];
    answer = a - b;
  } else if (op === "*") {
    a = randInt(map.mul[0], map.mul[1]);
    b = randInt(map.mul[0], map.mul[1]);
    answer = a * b;
  } else if (op === "/") {
    // integer only
    b = randInt(map.div[0], map.div[1]);
    const q = randInt(map.div[0], map.div[1]);
    a = b * q;
    answer = q;
  }

  return { a, b, op, text: `${a} ${op} ${b}`, answer };
}

/* --------------------- DOM refs --------------------- */
const dashSec = document.getElementById("dashboard");
const gameSec = document.getElementById("game");

/* Setup modal */
const modal = document.getElementById("setup-modal");
const openSetupBtn = document.getElementById("open-setup");
const closeSetupBtn = document.getElementById("close-setup");
const backdrop = document.getElementById("setup-backdrop");

/* Game UI */
const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answer");
const feedbackEl = document.getElementById("feedback");

const modePill = document.getElementById("mode-pill");
const progressPill = document.getElementById("progress-pill");
const timerPill = document.getElementById("timer-pill");

const numpad = document.getElementById("numpad");

// Card element for Duolingo-ish feedback animations
const gameCard = document.querySelector("#game .card.big");
if (gameCard) gameCard.classList.add("card-feedback");

function playFeedbackAnimation(isCorrect) {
  if (!gameCard) return;

  // Restart animation reliably
  gameCard.classList.remove("card-correct", "card-wrong");
  // Force reflow so animation can retrigger even on rapid answers
  void gameCard.offsetWidth;

  if (isCorrect) {
    gameCard.classList.add("card-correct");
    // optional haptic
    if (navigator.vibrate) navigator.vibrate(10);
  } else {
    gameCard.classList.add("card-wrong");
    if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
  }

  // Clean up after animation
  setTimeout(() => {
    gameCard.classList.remove("card-correct", "card-wrong");
  }, 500);
}

/* --------------------- Modal controls --------------------- */
function openSetup() {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeSetup() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

openSetupBtn?.addEventListener("click", openSetup);
closeSetupBtn?.addEventListener("click", closeSetup);
backdrop?.addEventListener("click", closeSetup);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSetup();
});

/* --------------------- Sections --------------------- */
let chartAcc = null;
let chartAtt = null;
let chartSpd = null;
let chartBad = null;

function ensureCharts() {
  const elAcc = document.getElementById("chart-accuracy");
  const elAtt = document.getElementById("chart-attempts");
  const elSpd = document.getElementById("chart-speed");
  const elBad = document.getElementById("chart-badges");

  if (!chartAcc) chartAcc = echarts.init(elAcc);
  if (!chartAtt) chartAtt = echarts.init(elAtt);
  if (!chartSpd) chartSpd = echarts.init(elSpd);
  if (!chartBad) chartBad = echarts.init(elBad);
}

function resizeChartsSoon() {
  requestAnimationFrame(() => {
    chartAcc?.resize();
    chartAtt?.resize();
    chartSpd?.resize();
    chartBad?.resize();
  });
}

window.addEventListener("resize", () => {
  chartAcc?.resize();
  chartAtt?.resize();
  chartSpd?.resize();
  chartBad?.resize();
});

async function showDashboard() {
  dashSec.classList.remove("hidden");
  gameSec.classList.add("hidden");
  ensureCharts();
  await renderChartsAndSummary();
  resizeChartsSoon();
}

function showGame() {
  dashSec.classList.add("hidden");
  gameSec.classList.remove("hidden");
}

/* --------------------- Game state --------------------- */
let session = null;
let currentQ = null;
let buffer = "0";
let qStartMs = 0;

let countdownInterval = null;
let countdownRemaining = 0;

/* --------------------- Answer buffer + numpad --------------------- */
function setBuffer(next) {
  buffer = next;
  answerEl.textContent = buffer;
}

function appendDigit(d) {
  if (buffer === "0") buffer = d;
  else buffer += d;

  if (buffer.length > 6) buffer = buffer.slice(0, 6);
  setBuffer(buffer);
}

function backspace() {
  if (buffer.length <= 1) setBuffer("0");
  else setBuffer(buffer.slice(0, -1));
}

function clearBuffer() {
  setBuffer("0");
}

function toggleSign() {
  if (buffer === "0") return;
  setBuffer(buffer.startsWith("-") ? buffer.slice(1) : "-" + buffer);
}

function createNumpad() {
  numpad.innerHTML = "";

  const keys = [
    "7","8","9","⌫",
    "4","5","6","C",
    "1","2","3","±",
    "0","0","↵","↵"
  ];

  keys.forEach((k, idx) => {
    if (idx === 13) return; // skip duplicate 0
    if (idx === 15) return; // skip duplicate enter

    const btn = document.createElement("button");
    btn.textContent = k;

    if (idx === 12) btn.classList.add("wide"); // wide 0
    if (idx === 14) btn.classList.add("wide"); // wide enter

    btn.addEventListener("click", () => {
      if (!session) return;
      if (/^\d$/.test(k)) appendDigit(k);
      else if (k === "⌫") backspace();
      else if (k === "C") clearBuffer();
      else if (k === "±") toggleSign();
      else if (k === "↵") submitAnswer();
    });

    numpad.appendChild(btn);
  });
}
createNumpad();

/* keyboard */
document.addEventListener("keydown", (e) => {
  if (!session) return;
  if (e.key >= "0" && e.key <= "9") appendDigit(e.key);
  else if (e.key === "Backspace") backspace();
  else if (e.key === "Enter") submitAnswer();
  else if (e.key === "Escape") clearBuffer();
  else if (e.key === "-") toggleSign();
});

/* --------------------- Session flow --------------------- */
function updatePills() {
  if (!session) return;

  // Show slightly nicer labels, but keep original values
  const modeLabel = session.mode === "buzzer" ? "buzzer (5:00)" : session.mode;
  modePill.textContent = `Mode: ${modeLabel} • ${session.difficulty}`;

  if (session.mode === "kumon") {
    progressPill.textContent = `Progress: ${session.total}/20`;
  } else if (session.mode === "buzzer") {
    progressPill.textContent = `Solved: ${session.total}`;
  } else {
    progressPill.textContent = `Answered: ${session.total}`;
  }

  timerPill.textContent = (session.timerSec > 0)
    ? `Time: ${countdownRemaining}s`
    : `Time: ∞`;
}

function stopCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = null;
}

function startCountdownIfNeeded() {
  stopCountdown();
  if (!session || session.timerSec <= 0) return;

  countdownRemaining = session.timerSec;
  updatePills();

  countdownInterval = setInterval(() => {
    countdownRemaining -= 1;
    if (countdownRemaining <= 0) {
      countdownRemaining = 0;
      updatePills();

      // buzzer ends automatically at 0
      if (session?.mode === "buzzer") {
        endSession("⏱️ Buzzer Beater finished!");
      } else {
        endSession("⏱️ Time's up!");
      }
      return;
    }
    updatePills();
  }, 1000);
}

function nextQuestion() {
  currentQ = genQuestion(session.ops, session.difficulty);
  questionEl.textContent = currentQ.text;
  feedbackEl.textContent = "";
  clearBuffer();
  qStartMs = performance.now();
  updatePills();
}

function submitAnswer() {
  if (!session || !currentQ) return;

  const elapsed = performance.now() - qStartMs;
  const userAnswer = Number(buffer);
  const isCorrect = userAnswer === currentQ.answer;
  playFeedbackAnimation(isCorrect);

  session.total += 1;
  if (isCorrect) session.correct += 1;
  session.totalTimeMs += elapsed;

  const opStat = session.perOp[currentQ.op];
  opStat.total += 1;
  if (isCorrect) opStat.correct += 1;
  opStat.timeMs += elapsed;

  feedbackEl.textContent = isCorrect ? "✅ Correct" : `❌ ${currentQ.answer}`;

  if (session.mode === "kumon" && session.total >= 20) {
    endSession("🎉 Kumon done!");
    return;
  }

  // buzzer: continue until countdown ends
  setTimeout(nextQuestion, 180);
}

function computeStreakWithDate(allStats, endingDateISO) {
  const map = new Map(allStats.map(d => [d.date, d]));
  let streak = 0;

  let cursor = new Date(endingDateISO + "T00:00:00");
  cursor.setHours(0,0,0,0);

  for (;;) {
    const yyyy = cursor.getFullYear();
    const mm = String(cursor.getMonth() + 1).padStart(2, "0");
    const dd = String(cursor.getDate()).padStart(2, "0");
    const iso = `${yyyy}-${mm}-${dd}`;

    const d = map.get(iso);
    if (iso === endingDateISO) streak += 1;
    else {
      if (!d || !d.total || d.total <= 0) break;
      streak += 1;
    }

    cursor.setDate(cursor.getDate() - 1);
    if (streak > 3650) break;
  }
  return streak;
}

async function endSession(reason = "Session ended") {
  stopCountdown();

  if (!session || session.total === 0) {
    session = null;
    await showDashboard();
    return;
  }

  const date = todayISO();
  const sessionAccuracy = session.correct / session.total;
  const sessionAvgMs = session.totalTimeMs / session.total;

  const existing = await getDailyStat(date);
  const base = existing || {
    date,
    total: 0,
    correct: 0,
    totalTimeMs: 0,
    sessions: 0,
    perOp: {
      "+": { total: 0, correct: 0, timeMs: 0 },
      "-": { total: 0, correct: 0, timeMs: 0 },
      "*": { total: 0, correct: 0, timeMs: 0 },
      "/": { total: 0, correct: 0, timeMs: 0 },
    },
    modeCount: { kumon: 0, endless: 0, buzzer: 0 },
    badgesEarned: 0,
  };

  base.total += session.total;
  base.correct += session.correct;
  base.totalTimeMs += session.totalTimeMs;
  base.sessions += 1;
  base.modeCount[session.mode] = (base.modeCount[session.mode] || 0) + 1;

  for (const op of Object.keys(base.perOp)) {
    base.perOp[op].total += session.perOp[op].total;
    base.perOp[op].correct += session.perOp[op].correct;
    base.perOp[op].timeMs += session.perOp[op].timeMs;
  }

  base.accuracy = base.total > 0 ? base.correct / base.total : 0;
  base.avgTimeMs = base.total > 0 ? base.totalTimeMs / base.total : 0;

  const all = await getAllStats();
  const lifetimeTotal = all.reduce((s, d) => s + (d.total || 0), 0) + session.total;
  const lifetimeCorrect = all.reduce((s, d) => s + (d.correct || 0), 0) + session.correct;
  const lifetimeSessions = all.reduce((s, d) => s + (d.sessions || 0), 0) + 1;

  const streak = computeStreakWithDate(all, date);

  const unlockedBefore = new Set(await getUnlockedBadgeIds());
  const unlockedAfter = await unlockBadgesIfNeeded({
    lifetimeTotal,
    lifetimeCorrect,
    lifetimeSessions,
    todayTotal: base.total,
    todayAccuracy: base.accuracy,
    todayAvgMs: base.avgTimeMs,
    streak,
  });

  const newlyEarned = unlockedAfter.filter(id => !unlockedBefore.has(id)).length;
  base.badgesEarned = (base.badgesEarned || 0) + newlyEarned;

  await putDailyStat(base);

  // reset session + show dashboard (and update charts after dashboard is visible)
  session = null;
  await showDashboard();
  renderBadgeList(unlockedAfter);

  alert(
    `${reason}\n\n` +
    `Session: ${Math.round(sessionAccuracy * 100)}% • Avg ${msToSec(sessionAvgMs)}s\n` +
    `Saved to ${date}${newlyEarned ? `\nNew badges: ${newlyEarned}` : ""}`
  );
}

/* --------------------- Start session from modal --------------------- */
document.getElementById("start")?.addEventListener("click", async () => {
  // Only look inside the modal for checked ops
  const ops = [...document.querySelectorAll('#setup-modal input[type="checkbox"]:checked')].map(c => c.value);
  if (!ops.length) return alert("Select at least one operation.");

  const mode = document.getElementById("mode").value;

  // buzzer beater: fixed 5 minutes for now
  const userTimer = clamp(Number(document.getElementById("timer").value || 0), 0, 3600);
  const effectiveTimer = (mode === "buzzer") ? 60 : userTimer;

  session = {
    mode,
    timerSec: effectiveTimer,
    difficulty: document.getElementById("difficulty").value,
    ops,
    total: 0,
    correct: 0,
    totalTimeMs: 0,
    perOp: {
      "+": { total: 0, correct: 0, timeMs: 0 },
      "-": { total: 0, correct: 0, timeMs: 0 },
      "*": { total: 0, correct: 0, timeMs: 0 },
      "/": { total: 0, correct: 0, timeMs: 0 },
    },
  };

  // Close modal BEFORE showing game
  closeSetup();
  showGame();
  startCountdownIfNeeded();
  nextQuestion();
});

document.getElementById("end")?.addEventListener("click", () => {
  endSession("🛑 Ended");
});

/* --------------------- Charts --------------------- */
async function renderChartsAndSummary() {
  const all = await getAllStats();
  const map = new Map(all.map(d => [d.date, d]));

  const dates = lastNDatesISO(7);
  const accuracy = [];
  const attempts = [];
  const avgTime = [];
  const badgeEarned = [];

  for (const dt of dates) {
    const d = map.get(dt);
    const tot = d?.total || 0;
    const cor = d?.correct || 0;
    const acc = tot > 0 ? cor / tot : 0;

    accuracy.push(Number((acc * 100).toFixed(1)));
    attempts.push(tot);
    avgTime.push(d?.avgTimeMs ? Math.round(d.avgTimeMs) : 0);
    badgeEarned.push(d?.badgesEarned || 0);
  }

  ensureCharts();

  chartAcc.setOption({
    title: { text: "Accuracy (last 7 days)" },
    xAxis: { type: "category", data: dates },
    yAxis: { type: "value", min: 0, max: 100 },
    tooltip: { trigger: "axis" },
    series: [{ type: "line", data: accuracy, smooth: true }],
  }, true);

  chartAtt.setOption({
    title: { text: "Attempts (last 7 days)" },
    xAxis: { type: "category", data: dates },
    yAxis: { type: "value", min: 0 },
    tooltip: { trigger: "axis" },
    series: [{ type: "bar", data: attempts }],
  }, true);

  chartSpd.setOption({
    title: { text: "Avg Time (ms, last 7 days)" },
    xAxis: { type: "category", data: dates },
    yAxis: { type: "value", min: 0 },
    tooltip: { trigger: "axis" },
    series: [{ type: "line", data: avgTime, smooth: true }],
  }, true);

  chartBad.setOption({
    title: { text: "Badges Earned (last 7 days)" },
    xAxis: { type: "category", data: dates },
    yAxis: { type: "value", minInterval: 1, min: 0 },
    tooltip: { trigger: "axis" },
    series: [{ type: "bar", data: badgeEarned }],
  }, true);

  const sum = document.getElementById("summary");
  const total7 = attempts.reduce((a, b) => a + b, 0);
  const correct7 = dates.reduce((s, dt) => s + (map.get(dt)?.correct || 0), 0);
  const acc7 = total7 > 0 ? (correct7 / total7) : 0;

  const avgMsNonZero = dates.map(dt => map.get(dt)?.avgTimeMs || 0).filter(x => x > 0);
  const avgMs7 = avgMsNonZero.length ? avgMsNonZero.reduce((a, b) => a + b, 0) / avgMsNonZero.length : 0;

  const badges7 = badgeEarned.reduce((a, b) => a + b, 0);

  sum.textContent =
    `Attempts: ${total7} • Accuracy: ${Math.round(acc7 * 100)}% • Avg time: ${avgMs7 ? msToSec(avgMs7) : "—"}s • Badges earned: ${badges7}`;

  resizeChartsSoon();
}

/* --------------------- Init --------------------- */
(async function init() {
  await openDB();

  // Home screen is dashboard
  await showDashboard();

  const unlocked = await getUnlockedBadgeIds();
  renderBadgeList(unlocked);

  // Open setup on first ever visit
  const stats = await getAllStats();
  if (!stats.length) openSetup();
})();
