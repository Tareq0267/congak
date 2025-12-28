# 📱 Pocket Kumon / Pocket Al-Khwarizmi

**Pocket Kumon** (a.k.a. **Pocket Al-Khwarizmi**) is a mobile-first mental math trainer inspired by **Kumon** and modern learning apps like **Duolingo**.

It focuses on **speed, accuracy, and consistency**, with offline support, daily statistics, and a lightweight reward system — all running entirely in the browser.

---

## ✨ Features

### 🧮 Practice Modes
- **Kumon Mode**
  - 20 questions per session
  - Optional countdown timer
- **Endless Mode**
  - Unlimited questions
  - Stop anytime

### ➕➖✖️➗ Math Engine
- Addition, subtraction, multiplication, division
- Integer-only division (no decimals)
- Difficulty levels:
  - Easy
  - Medium
  - Hard

### ⚡ Instant Feedback (Duolingo-style)
- Green glow for correct answers
- Red glow + shake for wrong answers
- Immediate correction shown

### 📊 Dashboard (ECharts)
- Accuracy over the last 7 days
- Attempts per day
- Average response time
- Badges earned per day
- Rolling 7-day summary

### 🏅 Badge System
- First session
- Question milestones (50 / 200)
- High-accuracy days
- Speed milestones
- Practice streaks (3-day / 7-day)

### 📱 Mobile-First UX
- Touch-optimized numpad
- Multi-digit input with backspace, clear, sign toggle
- Works offline
- Can be added to home screen (PWA-like)

---

## 🗂 Tech Stack

- **HTML / CSS / Vanilla JavaScript**
- **IndexedDB** (offline database)
- **Apache ECharts** (charts & graphs)
- No backend required
- No login required

> Designed to be easily migrated to **React** or wrapped as a **native mobile app** (Capacitor / Cordova).

---

## 🧠 Data Storage

All data is stored locally using **IndexedDB**:

- **Database name:** `mathDB`
- **Object stores:**
  - `stats` → daily aggregated performance data
  - `meta` → app metadata (badges, settings)

Your data never leaves your device.

---

## ▶️ Running the App

### Option 1: Open directly
1. Download the project files
2. Keep all files in the same folder
3. Open `index.html` in Chrome or Firefox

### Option 2: Local server (recommended)
```bash
python -m http.server
Then open:

arduino
Copy code
http://localhost:8000
📈 How Accuracy Is Calculated
text
Copy code
accuracy = correct_answers / total_answers
Daily stats are merged, so multiple sessions in the same day count toward the same daily summary.

🎯 Project Philosophy
Simple > flashy

Offline-first

Habit-forming

Minimal friction

Data-driven improvement

Inspired by:

Kumon methodology

Al-Khwarizmi (foundations of algebra)

Modern learning UX (Duolingo-style feedback)

🚀 Roadmap Ideas
Per-operation analytics (+ / − / × / ÷)

Adaptive difficulty

Session results screen (instead of alerts)

Cloud sync (Supabase / Firebase)

Android app packaging (Capacitor)

iOS support

React migration

📜 License
Personal project / educational use.

Feel free to fork, modify, and experiment.

Train your brain.
One problem at a time. 🧠✨

yaml
Copy code
