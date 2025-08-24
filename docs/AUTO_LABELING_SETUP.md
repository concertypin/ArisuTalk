# Automated Issue and PR Labeling Setup Guide

This guide explains how to set up automated labeling for issues and pull requests using Large Language Model (LLM) analysis.

## Overview

The automated labeling system:
- Triggers when new issues or PRs are created
- Analyzes the title and description using an LLM
- Automatically applies appropriate labels based on content analysis
- Supports any OpenAI-compatible API

## Quick Setup

### 1. Repository Secrets Configuration

Add these secrets in your repository settings (Settings > Secrets and variables > Actions):

**Required:**
- `OPENAI_API_KEY`: Your LLM service API key

**Optional:**
- `OPENAI_API_URL`: Custom API endpoint (defaults to OpenAI)

### 2. Supported Services

The system works with any OpenAI-compatible API:
- **OpenAI**: Use default settings
- **Azure OpenAI**: Set `OPENAI_API_URL` to your Azure endpoint
- **Local models**: Use services like Ollama or LlamaFile with local URLs
- **Other providers**: Any service with OpenAI-compatible `/chat/completions` endpoint

### 3. Label Categories

The system recognizes these label categories:

**Component Labels (c:prefix):**
- `c:frontend` - Frontend-related changes
- `c:backend` - Backend-related changes  
- `c:meta` - CI/CD, documentation, repository management

**Type Labels (t:prefix):**
- `t:bug` - Bug reports and fixes
- `t:enhancement` - Improvements to existing features
- `t:new feature` - New functionality requests
- `t:documentation` - Documentation updates

## Files Created

- `.github/workflows/auto-label.yml` - GitHub Action workflow
- `.github/scripts/auto-label.js` - Main labeling script
- `.github/scripts/package.json` - Node.js dependencies
- `.github/scripts/README.md` - Detailed technical documentation

## Testing

After setup, create a test issue to verify the automation works. Check the Actions tab for execution logs if labels aren't applied.

## Customization

To modify available labels, edit the `LABEL_DEFINITIONS` object in `.github/scripts/auto-label.js`.

## Security Notes

- API keys are securely stored as GitHub secrets
- The script runs in GitHub Actions environment with minimal permissions
- Failed API calls won't break the workflow - they'll just skip labeling