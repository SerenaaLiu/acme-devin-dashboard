import { Signal } from './types'

const REPO_URL = `https://github.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}`

export function buildAutoFixPrompt(signal: Signal): string {
  const sourceContext = signal.source === 'github-issue'
    ? `GitHub Issue #${signal.issueNumber}: "${signal.title}"\n\nDescription:\n${signal.description}`
    : signal.source === 'tech-debt'
    ? `Tech Debt Signal: "${signal.title}"\n\nDetails:\n${signal.description}\nPrimary file: ${signal.file}`
    : `Documentation Drift: "${signal.title}"\n\nDetails:\n${signal.description}\nFile: ${signal.file}`

  const issueRef = signal.issueNumber ? `#${signal.issueNumber}` : signal.title

  return `You are an autonomous engineer. Analyze the following signal, implement the fix, and open a Pull Request.

Repository: ${REPO_URL}

${sourceContext}

Your task:
1. Read the relevant files to understand the full scope of the change
2. Assess confidence (high/medium/low) and form an action plan
3. If confidence is high or medium: implement the fix and open a PR
4. If confidence is low: stop and explain what additional information is needed

Requirements:
- Make only the changes necessary to resolve this specific signal
- Write clean, minimal code — no unnecessary changes
- Open a Pull Request with:
  - Title: "fix: ${signal.title} [Devin]"
  - Body must include:
    - Summary of what changed and why
    - Confidence rating and reasoning
    - Review checklist for the human
    - Reference: Resolves ${issueRef}
- Do not modify files unrelated to this signal`
}

// Keep legacy exports for backward compatibility
export function buildScopePrompt(signal: Signal): string {
  return buildAutoFixPrompt(signal)
}
