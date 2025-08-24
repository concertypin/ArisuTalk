#!/usr/bin/env node

const { Octokit } = require('@octokit/rest');
const fetch = require('node-fetch');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Define available labels with descriptions
const LABEL_DEFINITIONS = {
  // Component labels
  'c:frontend': 'This issue/PR is for frontend.',
  'c:backend': 'This issue/PR is for backend.',
  'c:meta': 'This issue/PR is not for front or backend, like CI/CD or documents.',
  
  // Type labels
  't:bug': 'This type of issue/PR is about something doesn\'t work.',
  't:enhancement': 'This type of issue/PR is about modifying existing feature.',
  't:new feature': 'Issue or PR to make a new feature.',
  't:documentation': 'This type of issue/PR is about something to give user how-to-guide.'
};

async function callLLM(content, apiKey, apiUrl) {
  const labels = Object.entries(LABEL_DEFINITIONS)
    .map(([label, description]) => `- ${label}: ${description}`)
    .join('\n');

  const prompt = `You are a GitHub repository assistant that helps categorize issues and pull requests by assigning appropriate labels.

Available labels and their descriptions:
${labels}

Please analyze the following issue/PR content and suggest the most appropriate labels. 
You can suggest multiple labels if they apply.
Return only the label names, one per line, without any other text or formatting.

Content to analyze:
Title: ${content.title}
Body: ${content.body || 'No description provided'}`;

  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const suggestedLabels = data.choices[0].message.content
      .trim()
      .split('\n')
      .map(label => label.trim())
      .filter(label => label && LABEL_DEFINITIONS.hasOwnProperty(label));

    return suggestedLabels;
  } catch (error) {
    console.error('Error calling LLM API:', error);
    return []; // Return empty array on error to avoid breaking the workflow
  }
}

async function applyLabels(octokit, owner, repo, number, type, labels) {
  if (labels.length === 0) {
    console.log('No labels suggested by LLM');
    return;
  }

  try {
    const endpoint = type === 'issue' ? 'issues' : 'pulls';
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: number,
      labels
    });
    
    console.log(`Successfully applied labels: ${labels.join(', ')}`);
  } catch (error) {
    console.error('Error applying labels:', error);
  }
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('type', {
      description: 'Type of item (issue or pull_request)',
      type: 'string',
      demandOption: true
    })
    .option('number', {
      description: 'Issue or PR number',
      type: 'number',
      demandOption: true
    })
    .option('title', {
      description: 'Issue or PR title',
      type: 'string',
      demandOption: true
    })
    .option('body', {
      description: 'Issue or PR body',
      type: 'string',
      default: ''
    })
    .option('repo', {
      description: 'Repository name (owner/repo)',
      type: 'string',
      demandOption: true
    })
    .help()
    .argv;

  // Validate environment variables
  const githubToken = process.env.GITHUB_TOKEN;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiApiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';

  if (!githubToken) {
    console.error('GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  if (!openaiApiKey) {
    console.error('OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  // Parse repository owner and name
  const [owner, repoName] = argv.repo.split('/');
  
  console.log(`Processing ${argv.type} #${argv.number} in ${owner}/${repoName}`);
  console.log(`Title: ${argv.title}`);

  // Initialize Octokit
  const octokit = new Octokit({
    auth: githubToken
  });

  // Call LLM to get suggested labels
  const suggestedLabels = await callLLM({
    title: argv.title,
    body: argv.body
  }, openaiApiKey, openaiApiUrl);

  console.log('Suggested labels:', suggestedLabels);

  // Apply labels to issue/PR
  await applyLabels(octokit, owner, repoName, argv.number, argv.type, suggestedLabels);
}

// Execute main function
main().catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});