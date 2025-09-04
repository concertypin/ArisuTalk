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

- Language Files: `src/language/ko.ts` and `src/language/en.ts` with 100+ translation keys
- Real-time Switching: Language changes apply immediately without page refresh
- Comprehensive Coverage: API files, UI components, modals, and system messages are fully internationalized

### Component Hierarchy

The frontend follows a **component-based architecture** with clear separation of concerns:

```
Application Root (index.js)
├── UI Manager (ui.js)
├── State Manager (index.js)
├── Settings Router (SettingsRouter.js)
│   ├── Desktop Settings (DesktopSettingsUI.js)
│   │   ├── API Settings Panel
│   │   ├── Appearance Settings Panel
│   │   ├── Character Defaults Panel
│   │   ├── Data Management Panel
│   │   └── Advanced Settings Panel
│   └── Mobile Settings (MobileSettingsModal.js)
├── Main Chat (MainChat.js)
├── Group Chat (GroupChat.js)
├── Sidebar (Sidebar.js)
└── Modal System
    ├── Character Modal
    ├── Prompt Modal
    ├── Debug Logs Modal
    ├── Master Password Modal
    └── Confirmation Modal
```