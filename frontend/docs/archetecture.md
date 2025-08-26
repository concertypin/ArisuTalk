## Architecture Overview


### Modular Settings System

The application features a completely restructured settings system with device-specific UI components:

- [DesktopSettingsUI.js](./src/components/DesktopSettingsUI.js) - Desktop interface with centered layout and tab navigation
- [MobileSettingsModal.js](./src/components/MobileSettingsModal.js) - Mobile-optimized modal interface
- [SettingsRouter.js](./src/components/SettingsRouter.js) - Automatic device detection and UI routing

### Settings Panels

The settings are organized into five modular panels in `src/components/settings/panels/`:

- [APISettingsPanel.js](./src/components/settings/panels/APISettingsPanel.js) - API provider configuration
- [AppearanceSettingsPanel.js](./src/components/settings/panels/AppearanceSettingsPanel.js) - Theme, language, and display settings
- [CharacterDefaultsPanel.js](./src/components/settings/panels/CharacterDefaultsPanel.js) - Default character configurations
- [DataManagementPanel.js](./src/components/settings/panels/DataManagementPanel.js) - Data import/export and management
- [AdvancedSettingsPanel.js](./src/components/settings/panels/AdvancedSettingsPanel.js) - Advanced configuration options

### Internationalization (i18n) System

Complete i18n Integration: All hardcoded strings have been replaced with translation functions:

- Language Files: `src/language/ko.js` and `src/language/en.js` with 100+ translation keys
- Real-time Switching: Language changes apply immediately without page refresh
- Comprehensive Coverage: API files, UI components, modals, and system messages are fully internationalized

### Component Structure

```
src/
├── api/                     # API integrations
│   ├── apiManager.js        # API management and routing
│   ├── claude.js           # Anthropic Claude integration
│   ├── customopenai.js     # Custom OpenAI-compatible APIs
│   ├── gemini.js           # Google Gemini integration
│   ├── grok.js             # xAI Grok integration
│   ├── openai.js           # OpenAI ChatGPT integration
│   ├── openrouter.js       # OpenRouter integration
│   ├── promptBuilder.js    # Prompt construction utilities
│   └── prompts.js          # Prompt templates
├── components/              # UI components
│   ├── settings/panels/    # Modular settings panels
│   ├── Avatar.js           # User avatar component
│   ├── CharacterModal.js   # Character creation/editing modal
│   ├── ConfirmationModal.js# Confirmation dialogs
│   ├── DebugLogsModal.js   # Debug logging interface
│   ├── DesktopSettingsUI.js# Desktop settings interface
│   ├── GroupChat.js        # Group chat functionality
│   ├── MainChat.js         # Main chat interface
│   ├── MasterPasswordModal.js # Security modal
│   ├── MobileSettingsModal.js # Mobile settings interface
│   ├── PromptModal.js      # Prompt management modal
│   ├── SettingsRouter.js   # Device-specific UI routing
│   └── Sidebar.js          # Navigation sidebar
├── constants/               # Application constants
│   └── providers.js        # AI provider configurations
├── handlers/                # Event handlers
│   ├── groupChatHandlers.js# Group chat event handling
│   ├── mainChatHandlers.js # Main chat event handling
│   ├── modalHandlers.js    # Modal event handling
│   └── sidebarHandlers.js  # Sidebar event handling
├── language/                # Internationalization
│   ├── en.js               # English translations
│   └── ko.js               # Korean translations
├── utils/                   # Utility functions
│   ├── crypto.js           # Cryptographic utilities
│   └── secureStorage.js    # Secure data storage
├── defaults.js              # Default configurations
├── i18n.js                  # Internationalization core
├── index.js                 # Application entry point
├── storage.js               # Data persistence
├── ui.js                    # UI rendering utilities
└── utils.js                 # General utilities
```