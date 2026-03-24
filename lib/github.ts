const GITHUB_TOKEN = process.env.GITHUB_TOKEN!
const REPO_OWNER = process.env.GITHUB_REPO_OWNER!
const REPO_NAME = process.env.GITHUB_REPO_NAME!
const BASE = 'https://api.github.com'

const headers = {
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

export interface GitHubIssue {
  number: number
  title: string
  body: string
  html_url: string
  labels: { name: string; color: string }[]
  created_at: string
  state: string
}

export async function getOpenIssues(): Promise<GitHubIssue[]> {
  const res = await fetch(
    `${BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=open&per_page=20`,
    { headers }
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  const issues = await res.json()
  return issues.filter((i: any) => !i.pull_request)
}

export async function getIssue(number: number): Promise<GitHubIssue> {
  const res = await fetch(
    `${BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${number}`,
    { headers }
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

export async function createDevinScanIssue(signal: {
  title: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  plan: string[]
  file?: string
  source: string
}): Promise<GitHubIssue> {
  const confidenceEmoji = signal.confidence === 'high' ? '🟢' : signal.confidence === 'medium' ? '🟡' : '🔴'
  const sourceLabel = signal.source === 'tech-debt' ? 'Tech debt' : signal.source === 'doc-drift' ? 'Doc drift' : 'Auto-detected'

  const body = `## Devin Scan Report

> This issue was automatically filed by Devin after scanning the \`${REPO_NAME}\` repository.

**Signal type:** ${sourceLabel}  
**Confidence:** ${confidenceEmoji} ${signal.confidence.charAt(0).toUpperCase() + signal.confidence.slice(1)}  
**Reasoning:** ${signal.reasoning}

${signal.file ? `**Primary file:** \`${signal.file}\`` : ''}

## Action plan

${signal.plan.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## Fix with Devin

This signal has been added to the [Devin Autopilot dashboard](${process.env.NEXT_PUBLIC_APP_URL || 'https://acme-devin-dashboard.vercel.app'}) and can be resolved autonomously.

Click **Fix with Devin** in the dashboard to have Devin implement the fix and open a PR — no engineer time required.

---
*Filed automatically by [Devin Autopilot](https://devin.ai) · ${new Date().toISOString().split('T')[0]}*`

  const labels = ['devin-scan', signal.source]

  // Try to create labels if they don't exist
  for (const label of labels) {
    await fetch(`${BASE}/repos/${REPO_OWNER}/${REPO_NAME}/labels`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: label,
        color: label === 'devin-scan' ? '0052cc' : label === 'tech-debt' ? 'e4e669' : '0075ca'
      })
    }).catch(() => {}) // ignore if already exists
  }

  const res = await fetch(
    `${BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: signal.title,
        body,
        labels,
      })
    }
  )
  if (!res.ok) throw new Error(`GitHub issue creation failed: ${res.status}`)
  return res.json()
}
