# ArisuTalk
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/concertypin/ArisuTalk)

This project is an AI chat frontend application forked from `github.com/dkfk5326/ArisuTalk`. ArisuTalk provides a modern, responsive AI chat interface with comprehensive internationalization support and modular architecture.

## Key Features

### Core Functionality

- **Bot Management**: Create and manage various AI bots with customizable personas
- **Multi-Chat Rooms**: Operate multiple chat rooms simultaneously with group chat support
- **Multi-Provider AI Integration**: Supports multiple AI providers including:
  - Google Gemini API
  - OpenAI ChatGPT
  - Claude (Anthropic)
  - Grok (xAI)
  - OpenRouter
  - Custom OpenAI-compatible APIs
- **Persona System**: Assign diverse personas to bots for richer conversation experiences

### User Interface & Experience

- **Responsive Design**: Optimized for both desktop and mobile devices
- **Modular Settings Architecture**: Clean, organized settings with dedicated panels:
  - API Configuration
  - Appearance Customization
  - Character Defaults
  - Data Management
  - Advanced Settings
- **Device-Specific UI**: Automatic detection and routing between desktop and mobile interfaces
- **Real-time Language Switching**: Seamless language changes without page refresh

### Internationalization (i18n)

- **Multi-Language Support**: Full Korean and English language support
- **Comprehensive Translation**: All UI elements, messages, and prompts are internationalized
- **Dynamic Language Switching**: Change language instantly from settings
- **Extensible i18n System**: Easy to add new languages

### Technical Features

- **PWA Support**: Progressive Web App capabilities with offline functionality
- **Secure Storage**: Encrypted storage for sensitive data like API keys
- **Debug Logging**: Comprehensive logging system for troubleshooting
- **Data Export/Import**: Backup and restore functionality for all user data

## Quick Start

### Prerequisites

- Node.js (>20)
- pnpm (10.14.0+)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/concertypin/ArisuTalk
cd ArisuTalk

# Install dependencies
pnpm install

# Start frontend development server
pnpm dev:fe

# Start backend (optional)
pnpm dev:be
```

The application will be available at `http://localhost:5173`

## Documentation

For detailed information about specific aspects of the project:

- **[Frontend README](./frontend/README.md)** - Frontend development guide and component documentation
- **[Backend README](./backend/README.md)** - Backend setup and API documentation
- **[Architecture Guide](./ARCHITECTURE.md)** - System architecture and component organization
- **[Internationalization Guide](./I18N.md)** - Multi-language support and translation system

## Recent Major Updates

### v2.0 - UI Restructure & Internationalization

- Complete UI architecture overhaul with modular design
- Comprehensive internationalization system implementation
- Desktop and mobile-specific UI components
- Enhanced settings management with dedicated panels
- Real-time language switching capability
- Improved responsive design and user experience

## License

This project follows Apache License 2.0. For commits created before the fork, CC BY-NC 4.0 license applies. See [LICENSE.md](./LICENSE.md) for details.
