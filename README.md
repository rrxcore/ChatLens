# 🔍 ChatLens

> **Developed by ~rrxcore**  
> A high-performance, ultra-private WhatsApp Chat Reader & Analyzer designed for seamless reading and exploring conversations of any size.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frrxcore%2FChatLens)

---

## ⚡ Highlights & Features

- 🔒 **100% Client-Side Privacy**: Zero servers, zero analytics, zero data uploads. Your chat logs never leave your device or browser memory.
- 🚀 **100,000+ Messages at 60 FPS**: Engineered with TanStack Virtualizer and lazy burst computation for zero-lag scrolling on massive multi-year exports.
- ✨ **Samsung One UI 5.0 Emojis**: High-fidelity Samsung emoji styling with local fallbacks.
- 📖 **Dual Reading Experience**:
  - **Chat Mode**: Native bubble experience with smart grouping and interactive timestamp controls.
  - **Novel / Reader Mode**: Virtualized prose style format ideal for focused long-form reading.
- 📊 **Deep Chat Analytics & Filters**:
  - Participant statistics & message breakdown.
  - Custom calendar date range filtering.
  - Sub-millisecond instant search with highlighted query matches.
- 🎨 **Modern iOS / Glassmorphism Aesthetic**: Responsive layout with dark/light themes, sleek glow accents, and responsive layout.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Virtualization**: [@tanstack/react-virtual](https://tanstack.com/virtual/latest)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linting & Testing**: [Oxlint](https://oxc.rs/) & [Vitest](https://vitest.dev/)

---

## 🚀 Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/rrxcore/ChatLens.git
cd ChatLens

# Install dependencies
npm install

# Start local dev server
npm run dev

# Run test suite
npm test
```

---

## 🌐 Deploy to Vercel (1-Click)

1. Open [vercel.com/new](https://vercel.com/new).
2. Select your repository: `rrxcore/ChatLens`.
3. Click **Deploy**. Vercel will automatically build and assign a free global HTTPS domain (e.g. `https://chatlens.vercel.app`).
