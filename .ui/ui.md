# 🧊 UI & Design — Liquid Glass Interface

Pocket Kumon / Pocket Al-Khwarizmi uses a **liquid glass, frosted gradient UI** inspired by modern operating systems like **iOS, macOS, and visionOS**.

The goal is not decoration — it’s **clarity, focus, and calm repetition**.

This UI is designed to feel:
- Premium but quiet
- Soft but readable
- Playful without distraction
- Comfortable for daily use

---

## ✨ Design Philosophy

### “Material, not boxes”
The interface avoids flat, boxed layouts.  
Instead, it uses **layered translucent surfaces** that behave like real materials.

- No hard separators
- No harsh outlines
- No visual noise

Every surface feels like it belongs to the same environment.

---

## 🧊 Glassmorphism (Done Right)

This project intentionally avoids “cheap glassmorphism”.

### What we use
- Subtle translucency (`rgba(255,255,255,.06)`)
- Low-opacity borders for edge refraction
- Controlled backdrop blur **only where it adds depth**

```css
background: rgba(255,255,255,.06);
border: 1px solid rgba(255,255,255,.12);
backdrop-filter: blur(10px);
````

### What we avoid

* Heavy blur everywhere
* Neon glows
* Over-saturated gradients
* Multiple competing shadows

The result feels **frosted**, not foggy.

---

## 🌈 Liquid Gradient Background

Instead of flat or linear gradients, the UI uses **large radial gradients** to simulate light sources.

```css
radial-gradient(900px 600px at 15% 10%, rgba(92,124,250,.28), transparent 60%)
radial-gradient(900px 600px at 85% 25%, rgba(34,211,238,.18), transparent 60%)
```

### Why radial gradients?

* Light feels directional
* Color breathes through glass surfaces
* The UI feels alive, not painted

This is what gives the interface its **“liquid” quality**.

---

## 🧬 Depth & Layering System

The UI follows a clear depth hierarchy:

1. **Background layer**
   Soft, infinite gradient field

2. **Glass cards**
   Semi-transparent surfaces that float above the background

3. **Modal layer**
   Blurred backdrop + elevated card for focus

This creates separation **without visual aggression**.

---

## ⚡ Motion & Feedback

Motion is used **only where it reinforces learning**.

### Duolingo-inspired feedback

* ✅ Correct → green glow + gentle pulse
* ❌ Wrong → red glow + shake

```css
.card-correct { animation: correctPulse 420ms ease-out; }
.card-wrong   { animation: wrongShake 420ms ease-out; }
```

This provides:

* Immediate confirmation
* Emotional reinforcement
* Zero cognitive overhead

No progress is hidden behind animations.

---

## 🎯 Calm Productivity

The interface is optimized for **daily repetition**.

* Dark mode by default (low eye strain)
* Muted color palette
* High contrast only where necessary
* No flashing, no timers screaming for attention

The app should feel like:

> “I can open this every day without getting tired.”

---

## 📱 Mobile-First Discipline

Design constraints:

* Single-column layout
* Max width: **520px**
* Touch-first components
* Large tap targets
* Safe-area padding for modern phones

The UI scales naturally from:

* Android Chrome
* iOS Safari
* Home screen install (PWA-like)

---

## 🧠 Why This Matters

Mental math is about **focus**, not stimulation.

This UI is designed to:

* Stay out of the way
* Reduce friction
* Build habit through comfort
* Feel trustworthy and intentional

The interface should never be the reason you stop practicing.

---

## ✨ Style Keywords

If you’re describing this UI:

* Liquid glass
* Frosted gradient
* VisionOS-inspired
* Calm dark mode
* Glassmorphism (restrained)
* Material-driven UI

---

**Good UI doesn’t shout.
It invites you back. 🧠🧊**

