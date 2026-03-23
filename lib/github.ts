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
