# Frontend Architecture

## Overview

The ArisuTalk frontend is a modern web application built with **Svelte 5**. It embraces a reactive, component-based architecture, designed for modularity and extensibility. The ongoing migration from a legacy vanilla JavaScript structure to Svelte 5 is a core aspect of current development.

## Core Concepts

-   **Svelte 5:** We leverage modern Svelte features, including **runes**, for fine-grained reactivity and state management. This allows for a more declarative and efficient component logic.
-   **Component-Based Structure:** The entire UI is decomposed into reusable Svelte components, located in `src/lib/components`. This promotes separation of concerns and maintainability.
-   **Global Stores:** Shared application state (e.g., chat sessions, character data, user settings) is managed through Svelte stores in `src/lib/stores`. These stores provide a single source of truth and allow for seamless reactivity across the application.
-   **Services:** Business logic that is not directly tied to a specific UI component is abstracted into services within `src/lib/services`. Examples include `chatService.ts` for managing chat interactions and `openChatService.ts` for handling the logic of dynamic open chats.
-   **Legacy Code:** Some older vanilla JS code still exists (e.g., `MainChat.js`, `groupChatHandlers.js`). A key architectural goal is to progressively refactor this logic into Svelte components and stores.

## Chat Types

The application supports several distinct chat modes:

-   **Main Chat:** A standard one-on-one chat with a single AI character.
-   **Group Chat:** A chat with a manually selected, fixed group of AI characters.
-   **Open Chat:** A dynamic group chat where AI characters can autonomously join or leave the conversation. This is driven by the flow of the dialogue and each character's internal "mood," creating a more natural and unpredictable chat experience.

## Directory Structure

The following is a detailed breakdown of the `frontend` directory, highlighting key files and their purposes.

```
/frontend
├── src/
│   ├── lib/
│   │   ├── App.svelte            # Root component of the Svelte application.
│   │   │
│   │   ├── api/                  # Modules for interacting with various AI provider APIs.
│   │   │   ├── openai.js
│   │   │   ├── gemini.js
│   │   │   └── ...
│   │   │
│   │   ├── components/           # Reusable Svelte UI components.
│   │   │   ├── Sidebar.svelte      # Main navigation sidebar.
│   │   │   ├── MainChat.svelte     # The main chat interface.
│   │   │   ├── Message.svelte      # Individual chat message component.
│   │   │   ├── modals/             # Modal dialogs for various functions.
│   │   │   │   ├── character/      # Modals for character creation and settings.
│   │   │   │   │   └── CharacterModal.svelte
│   │   │   │   ├── chat/           # Modals for creating different chat types.
│   │   │   │   │   ├── CreateOpenChatModal.svelte
│   │   │   │   │   └── CreateGroupChatModal.svelte
│   │   │   │   └── settings/       # Modals for application settings.
│   │   │   │       └── DesktopSettingsUI.svelte
│   │   │   └── ...
│   │   │
│   │   ├── services/             # Business logic and data handling services.
│   │   │   ├── chatService.ts      # Core logic for chat functionalities.
│   │   │   ├── openChatService.ts  # Logic specific to Open Chat dynamics.
│   │   │   ├── dataService.ts      # Handles data import/export and storage.
│   │   │   └── ...
│   │   │
│   │   ├── stores/               # Global Svelte stores for state management.
│   │   │   ├── chat.ts             # Store for chat rooms and messages.
│   │   │   ├── character.ts        # Store for AI character data.
│   │   │   ├── settings.ts         # Store for user and application settings.
│   │   │   ├── ui.ts               # Store for UI state (e.g., modal visibility).
│   │   │   └── ...
│   │   │
│   │   └── utils/                # Utility functions (crypto, storage, etc.).
│   │       ├── secureStorage.js
│   │       └── ...
│   │
│   ├── language/               # Internationalization (i18n) files.
│   │   ├── en.ts
│   │   └── ko.ts
│   │
│   ├── prompts/                # Manages and builds prompts for AI models.
│   │   └── promptManager.ts
│   │
│   ├── main.ts                 # Main entry point for the application.
│   └── app.css                 # Global CSS styles.
│
├── static/                     # Static assets like icons and manifest.
│   └── manifest.webmanifest
│
├── package.json                # Project dependencies and scripts.
├── svelte.config.js            # Svelte compiler configuration.
└── vite.config.ts              # Vite build tool configuration.
```

## Internationalization (i18n)

The application is fully internationalized.

-   **Translation Keys:** All user-facing strings are replaced with keys that are resolved by the `t()` function from our i18n module.
-   **Language Files:** Translations are maintained in `src/language/en.ts` and `src/language/ko.ts`.
-   **Real-time Switching:** The language can be changed in the settings, and the UI updates instantly without a page reload, thanks to Svelte's reactivity.