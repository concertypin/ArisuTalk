# Backend AGENTS.md

This file provides guidance for AI coding agents working on the backend of this project.

## Build and Test Commands

- **Run the application**: `pnpm run dev` (from the `backend` directory) or `pnpm run dev:be`
- **Run tests**: Currently no tests.
- **Build the application**: `pnpm run build` (from the `backend` directory) or `pnpm run build:be`
- **Format code**: `pnpm run format` (from the `backend` directory) or `pnpm run format:be`

## Backend Development Guidelines

### Code Style

- Follow the style of the existing codebase.
- Maintain consistency in indentation, variable names, and function names.
- Use JSDoc for documentation.

### Developer's Guide

- Make code stateless to reduce trouble with containers, auto-scaling, etc.

## Testing Instructions

- Write or run tests to ensure your changes work well without breaking existing functionality.
