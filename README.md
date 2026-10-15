# 🎲 Gura 3D Rolling Dice | Black & Gold Edition

An ultra-smooth, lightweight, and mobile-optimized 3D rolling dice component built with **React**, **Tailwind CSS**, and **pure CSS 3D transforms** (`preserve-3d`). Styled in Gura's signature luxury dark obsidian and metallic warm gold aesthetic.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-amber-500)

---

## ✨ Features

- **⚡ Solid 60FPS Performance**: Pure hardware-accelerated CSS 3D transforms (`preserve-3d`, `perspective: 900px`). Zero heavy 3D engine bundles (No Three.js overhead, ~0ms load lag).
- **👑 Gura Black & Gold Aesthetic**:
  - Deep luxury dark canvas (`#09090b`) with a radial gold ambient highlight.
  - Premium matte obsidian dice body (`#141418` to `#1b1b22`) with soft rounded corners (`rounded-2xl`) and delicate gold corner inlays.
  - Authentic metallic gold pips (`#EAB308` / `#D4AF37`) with specular sheen and warm aura.
  - Radiant gold primary roll button with tactile micro-interactions (`active:scale-95`).
- **🎯 Authentic 3×3 Pip Grid**: Exact casino-standard pip placement for faces 1 through 6 with opposite faces summing to 7 (1 opposite 6, 2 opposite 5, 3 opposite 4).
- **🔄 Glitch-Free Spin Accumulator**: Prevents awkward reverse unspins between rolls by continuously accumulating multi-axis rotations ($1080^\circ$–$1800^\circ$) before landing on the target face.
- **📱 Mobile-First UX & Haptics**: Full viewport wrapper (`min-h-[100dvh]`), comfortable touch targets, and tactile haptic vibration triggers (`navigator.vibrate([30, 40, 30])`).
- **🔊 Synthesized Web Audio**: Built-in procedural sound generator (physical dice tumble & settle impact) with zero external MP3/audio asset downloads.
- **🎉 Celebratory Effects**: Dynamic floor shadow physics that reacts to dice elevation, plus golden confetti bursts on critical rolls (face 6).
- **⌨️ Keyboard Controls**: Roll with the <kbd>Spacebar</kbd> or click/tap anywhere on the dice stage.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/fitsumgenene7-cell/Gura-dice.git
cd Gura-dice
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build
```bash
npm run build
npm run preview
```

---

## 📦 Using the Component in Your Project

The component is completely self-contained in `src/components/DiceRoller.tsx`. You can drop it directly into any React project using Tailwind CSS.

```tsx
import { DiceRoller } from './components/DiceRoller';

export default function MyGame() {
  const handleRollComplete = (value: number) => {
    console.log(`Rolled a ${value}!`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <DiceRoller 
        initialValue={1}
        enableSound={true}
        onRollComplete={handleRollComplete}
      />
    </div>
  );
}
```

### Component Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `initialValue` | `number` (1–6) | `1` | Initial face displayed on mount |
| `onRollComplete` | `(value: number) => void` | `undefined` | Callback fired when the roll animation settles |
| `enableSound` | `boolean` | `true` | Enables or disables the procedural Web Audio sound effect |
| `className` | `string` | `""` | Optional additional CSS classes for the outer wrapper |

---

## 🌐 Deploy to Vercel

This repository is pre-configured and 100% deploy-ready for [Vercel](https://vercel.com):

1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import `Gura-dice`.
3. Vercel automatically detects the Vite framework and applies the settings in `vercel.json`.
4. Click **Deploy**!

Alternatively, deploy via the Vercel CLI:
```bash
npx vercel
```

---

## 📄 License

MIT License © 2026 Gura Dice
