import { Signal, ScopeResult } from './types'

const REPO_URL = `https://github.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}`

export function buildScopePrompt(signal: Signal): string {
  const sourceContext = signal.source === 'github-issue'
    ? `GitHub Issue #${signal.issueNumber}: "${signal.title}"\n\nDescription:\n${signal.description}`
    : signal.source === 'tech-debt'
    ? `Tech Debt Signal: "${signal.title}"\n\nDetails:\n${signal.description}\nPrimary file: ${signal.file}`
    : `Documentation Drift: "${signal.title}"\n\nDetails:\n${signal.description}\nFile: ${signal.file}`

  return `You are performing a SCOPING ANALYSIS ONLY. Do NOT make any code changes, do NOT open any PRs.

Repository: ${REPO_URL}

${sourceContext}

Your task:
1. Read the relevant files in the repository to understand the scope of work
2. Return a JSON object with exactly this structure:

{
  "confidence": "high" | "medium" | "low",
  "reasoning": "one sentence explaining your confidence rating",
  "plan": ["step 1", "step 2", "step 3"],
  "files_to_change": ["path/to/file1.py", "path/to/file2.py"]
}

Confidence guide:
- high: clear, self-contained change, low risk of side effects
- medium: moderate complexity or some uncertainty about downstream impact  
- low: significant unknowns, cross-cutting concern, or high risk

Return ONLY the JSON object. No preamble, no markdown, no explanation outside the JSON.`
}

export function buildExecutePrompt(signal: Signal, scopeResult: ScopeResult): string {
  const issueRef = signal.issueNumber ? `GitHub Issue #${signal.issueNumber}` : signal.title

  return `Implement the following fix in the repository: ${REPO_URL}

Task: ${signal.title}
${signal.issueNumber ? `Issue: #${signal.issueNumber}` : ''}

Action plan (from scoping analysis):
${scopeResult.plan.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Files to change:
${scopeResult.files_to_change.map(f => `- ${f}`).join('\n')}

Requirements:
- Implement only what is described in the action plan above
- Write clean, minimal code — no unnecessary changes
- After making changes, open a Pull Request with:
  - Title: "fix: ${signal.title} [Devin]"
  - Body: "Resolves ${issueRef}\n\nChanges made:\n${scopeResult.plan.map(s => `- ${s}`).join('\n')}"
- Do not make changes to files not listed above unless absolutely necessary`
}
