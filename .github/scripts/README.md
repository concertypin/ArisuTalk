# Automated Issue and PR Labeling

This directory contains scripts and workflows for automatically labeling issues and pull requests using LLM analysis.

## How it works

1. **GitHub Action Trigger**: When a new issue or PR is created, the `auto-label.yml` workflow is triggered
2. **Content Analysis**: The script sends the issue/PR title and description to an OpenAI-compatible LLM API
3. **Label Suggestion**: The LLM analyzes the content and suggests appropriate labels based on predefined categories
4. **Automatic Application**: Suggested labels are automatically applied to the issue/PR

## Available Labels

### Component Labels (c:)
- `c:frontend` - Frontend-related issues/PRs
- `c:backend` - Backend-related issues/PRs  
- `c:meta` - CI/CD, documentation, or other non-code changes

### Type Labels (t:)
- `t:bug` - Something doesn't work correctly
- `t:enhancement` - Improving existing functionality
- `t:new feature` - Adding new functionality
- `t:documentation` - User guides and documentation

## Setup Requirements

### GitHub Secrets

The automation requires these repository secrets to be configured:

1. **`OPENAI_API_KEY`** (required): Your OpenAI API key or compatible service API key
2. **`OPENAI_API_URL`** (optional): API endpoint URL. Defaults to `https://api.openai.com/v1` if not set

### Setting up secrets

1. Go to your repository's Settings > Secrets and variables > Actions
2. Add the required secrets:
   - `OPENAI_API_KEY`: Your API key for the LLM service
   - `OPENAI_API_URL`: (Optional) Custom API endpoint if not using OpenAI directly

## Supported LLM Services

The script works with any OpenAI-compatible API including:
- OpenAI GPT models
- Azure OpenAI
- Local models (via LlamaFile, Ollama, etc.)
- Other compatible services

## Manual Testing

You can test the labeling script locally:

```bash
cd .github/scripts
npm install

export GITHUB_TOKEN="your_github_token"
export OPENAI_API_KEY="your_api_key"

node auto-label.js \
  --type="issue" \
  --number=123 \
  --title="Bug: App crashes on startup" \
  --body="The application crashes immediately when opened..." \
  --repo="owner/repo"
```

## Customization

To modify the available labels or their descriptions, edit the `LABEL_DEFINITIONS` object in `auto-label.js`.

## Troubleshooting

- Check GitHub Actions logs if labeling fails
- Ensure API keys are correctly set in repository secrets
- Verify that the API endpoint is accessible from GitHub Actions runners
- The script gracefully handles API failures and won't break the workflow