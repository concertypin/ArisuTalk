# ArisuTalk Frontend 🎨

This is the frontend for ArisuTalk, built with **Svelte 5** and lots of love! ✨

## 🌸 Project Kei

This frontend is currently being rebuilt as part of **Project Kei**! 🚀 We're using modern tools and a clean architecture to provide the best possible roleplay experience.

## 🛠️ Tech Stack

- **Framework:** Svelte 5 (Runes)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + DaisyUI
- **Icons:** `@lucide/svelte`
- **Storage:** Dexie.js (IndexedDB)
- **Workers:** Comlink

## 🚀 Development

### Prerequisites

- Node.js (>=22.18.0 <23.0.0 || >=23.6.0), which supports type stripping without flag.
- pnpm (10.14.0+)

### Setup

```bash
pnpm install
```

### Run Dev Server

```bash
pnpm run dev
```

The server will start at `http://localhost:5173` 🚀

### Testing

We take testing seriously! 🧪

- **Unit Tests:** `pnpm run test`
- **Browser Tests:** `pnpm run test:browser`
- **Coverage:** `pnpm run test:coverage`

### Linting & Formatting

```bash
pnpm run lint
pnpm run format
```

## 📂 Structure

- `src/components`: UI components 🧩
- `src/features`: Feature-based logic (character, chat, persona) 🌟
- `src/lib`: Shared utilities, adapters, and stores 🛠️
- `worker/`: Web workers for heavy tasks 👷‍♀️

---

Happy coding! 🎀
