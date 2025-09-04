# Backend AGENTS.md

This file provides guidance for AI coding agents working on the backend of this project.

## Build and Test Commands

- **Run the application**: `cd backend && ./gradlew run`
- **Run tests**: `cd backend && ./gradlew test`
- **Build the application**: `cd backend && ./gradlew build`
- **Check code style**: `cd backend && ./gradlew ktlintCheck`
- **Format code**: `cd backend && ./gradlew ktlintFormat`

## Backend Development Guidelines

### Code Style
- Follow the style of the existing codebase.
- Maintain consistency in indentation, variable names, and function names.
- Use KDoc for documentation.

### Developer's Guide
- Make code stateless to reduce trouble with containers, auto-scaling, etc.
- Put all dependencies into the `gradle/libs.versions.toml` version catalog.

## Testing Instructions

- Write or run tests to ensure your changes work well without breaking existing functionality.
- For the backend, use JUnit 5 for unit tests. You can run tests using `cd backend && ./gradlew test`.
