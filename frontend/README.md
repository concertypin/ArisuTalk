# ArisuTalk Frontend

This is the frontend component of the ArisuTalk AI chat application, built with modern JavaScript and featuring a modular, responsive architecture with comprehensive internationalization support.

## Architecture Overview

### Modular Settings System

The application features a completely restructured settings system with device-specific UI components:

- **[DesktopSettingsUI.js](./src/components/DesktopSettingsUI.js)** - Desktop interface with centered layout and tab navigation
- **[MobileSettingsModal.js](./src/components/MobileSettingsModal.js)** - Mobile-optimized modal interface
- **[SettingsRouter.js](./src/components/SettingsRouter.js)** - Automatic device detection and UI routing

### Settings Panels

The settings are organized into five modular panels in `src/components/settings/panels/`:

- **[APISettingsPanel.js](./src/components/settings/panels/APISettingsPanel.js)** - API provider configuration
- **[AppearanceSettingsPanel.js](./src/components/settings/panels/AppearanceSettingsPanel.js)** - Theme, language, and display settings
- **[CharacterDefaultsPanel.js](./src/components/settings/panels/CharacterDefaultsPanel.js)** - Default character configurations
- **[DataManagementPanel.js](./src/components/settings/panels/DataManagementPanel.js)** - Data import/export and management
- **[AdvancedSettingsPanel.js](./src/components/settings/panels/AdvancedSettingsPanel.js)** - Advanced configuration options

### Internationalization (i18n) System

**Complete i18n Integration**: All hardcoded strings have been replaced with translation functions:

- **Language Files**: `src/language/ko.js` and `src/language/en.js` with 100+ translation keys
- **Real-time Switching**: Language changes apply immediately without page refresh
- **Comprehensive Coverage**: API files, UI components, modals, and system messages are fully internationalized

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

## Key Features

### Responsive Design

- **Device Detection**: Automatic detection of desktop vs mobile devices
- **Adaptive UI**: Different interfaces optimized for each device type
- **Consistent Experience**: Unified functionality across all devices

### State Management

- **Centralized State**: All application state managed through index.js
- **Real-time Updates**: Instant UI updates when settings change
- **Data Persistence**: Automatic saving of user preferences and data

### Security

- **Encrypted Storage**: API keys and sensitive data are encrypted
- **Master Password**: Optional master password protection
- **Secure Communication**: All API communications are secured

## Development Guidelines

### Code Standards

- **JSDoc Documentation**: Use JSDoc for all functions and components
- **Element IDs**: Create `id` attributes for elements (useful for plugins)
- **File Size Limit**: Keep files under 300 lines when possible
- **Async Functions**: Always include `async` in function declarations
- **HTML Separation**: Avoid HTML strings in JS files
- **Component Modularity**: Maintain clear separation of concerns

### Internationalization Guidelines

- **Translation Functions**: Use `t()` function for all user-facing text
- **Language Keys**: Add new translation keys to both `ko.js` and `en.js`
- **Context Clarity**: Use descriptive keys that indicate context
- **Consistency**: Maintain consistent terminology across translations

### Event Handling

- **Data Attributes**: Use `data-listener-added` to prevent duplicate listeners
- **DOM Ready**: Ensure DOM elements exist before adding event listeners
- **Cleanup**: Remove event listeners when components are destroyed

## Development Setup

### Prerequisites

- Node.js (>20)
- pnpm (10.14.0+)

### Installation

```bash
cd frontend
pnpm install
```

### Development Server

```bash
pnpm dev
```

The development server will start at `http://localhost:5173` with hot reload enabled.

### Build for Production

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

## Recent Major Changes (August 2025)

### UI Architecture Restructure

- Replaced monolithic `SettingsModal.js` with modular panel system
- Added device-specific UI components for desktop and mobile
- Implemented automatic device detection and routing
- Enhanced responsive design and user experience

### Internationalization Integration

- Migrated all hardcoded strings to translation system
- Added comprehensive Korean and English language support
- Implemented real-time language switching
- Enhanced API error messages with internationalization

### Component Improvements

- Enhanced CSS styling with improved responsive design
- Better event listener management and DOM updates
- Improved state management for settings panels
- Added input value preservation during re-renders

## Contributing

When contributing to the frontend:

1. Follow the established code standards and guidelines
2. Add JSDoc documentation for new functions
3. Include translation keys for any user-facing text
4. Test on both desktop and mobile interfaces
5. Ensure proper event listener cleanup

### License

This project follows Apache License 2.0. For commits created before the fork, CC BY-NC 4.0 license applies. See ../LICENSE.md and NOTICE files for details.
